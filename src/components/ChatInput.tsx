import { useState } from 'react';
import { Send } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { searchAPIService } from '@/services/apiService';

export const ChatInput = () => {
  const [input, setInput] = useState('');
  const { addMessage, isStreaming } = useChatStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    // Add user message
    addMessage({
      role: 'user',
      content: input.trim(),
    });

    // Call search API for search phase, keep mock for other phases
    handleAssistantResponse(input.trim());
    
    setInput('');
  };

  const handleAssistantResponse = (userInput: string) => {
    const { 
      addMessage, 
      updateLastMessage, 
      setStreaming, 
      setPhase, 
      setPreviousResponseId,
      setCurrentImageUrl,
      currentPhase, 
      previousResponseId,
      currentImageUrl
    } = useChatStore.getState();
    
    setStreaming(true);
    
    // Add initial streaming message
    addMessage({
      role: 'assistant',
      content: '',
      streaming: true,
    });

    if (currentPhase === 'search') {
      // Use real API for search phase
      searchAPIService.searchProducts(
        userInput,
        previousResponseId,
        // onDelta - stream content updates
        (content) => {
          updateLastMessage(content);
        },
        // onComplete - handle successful response
        (response, responseId) => {
          updateLastMessage(response.details);
          setStreaming(false);
          
          // Store response ID for future requests
          if (responseId) {
            setPreviousResponseId(responseId);
          }
          
          // Store image URL for select phase
          if (response.image_url) {
            setCurrentImageUrl(response.image_url);
          }
          
          // Only advance to next phase if search completed successfully
          if (response.completedStage === 'search') {
            setTimeout(() => setPhase('select'), 1000);
          }
          // If stage not completed, stay in search phase for user to try again
        },
        // onError - handle errors
        (error) => {
          updateLastMessage(`❌ ${error}\n\nPlease try again with a different search term.`);
          setStreaming(false);
          // Stay in search phase for retry
        }
      );
    } else if (currentPhase === 'select') {
      // Use real API for select phase with hardcoded image URL
      const hardcodedImageUrl = "https://cdn.shopify.com/s/files/1/0948/4369/9488/files/printer-front.avif?v=1750994570";

      // Show loading message during processing
      updateLastMessage('🎨 Generating scene visualization...');

      searchAPIService.selectProduct(
        userInput,
        previousResponseId,
        hardcodedImageUrl,
        // onComplete - handle successful response
        (response, responseId) => {
          // Display situation description and handle the generated image
          let content = response.situationDescription;
          
          // Check if the image URL is a file:// URL (which browsers can't display)
          if (response.image_url && response.image_url.startsWith('file://')) {
            // Convert file:// URL to HTTP URL served by the image server
            // Extract the filename from the file path
            const filename = response.image_url.split('/').pop();
            const httpImageUrl = `http://localhost:8086/generated_img/${filename}`;
            
            // Use HTTP URL that browsers can display
            content += `\n\n![Generated Scene](${httpImageUrl})`;
          } else if (response.image_url) {
            // For HTTP/HTTPS URLs, render as normal
            content += `\n\n![Generated Scene](${response.image_url})`;
          }
          
          updateLastMessage(content);
          setStreaming(false);
          
          // Store response ID for future requests
          if (responseId) {
            setPreviousResponseId(responseId);
          }
          
          // Only advance to next phase if select completed successfully
          if (response.completedStage === 'select') {
            setTimeout(() => {
              setPhase('pay');
              
              // Automatically show payment CTA after phase transition
              setTimeout(() => {
                addMessage({
                  role: 'assistant',
                  content: `🛒 **Ready to Purchase!**\n\nYour scene visualization looks perfect! Ready to complete your purchase?\n\n**💳 Payment Options**\n\n[🔗 **Pay Now with Razorpay**](https://razorpay.me/@snowballagents?amount=EPec5evqGoRk2C8icWNJlQ%3D%3D)\n\n*Click the link above to complete your payment securely. The link will open in a new tab.*\n\nAfter payment, paste your transaction ID here to confirm your order.`,
                  streaming: false,
                });
              }, 500);
            }, 1000);
          }
          // If stage not completed, stay in select phase for user to try again
        },
        // onError - handle errors
        (error) => {
          updateLastMessage(`❌ ${error}\n\nPlease try again with a different description.`);
          setStreaming(false);
          // Stay in select phase for retry
        }
      );
    } else if (currentPhase === 'pay') {
      // Only handle transaction ID confirmation in pay phase
      // (Payment CTA is now shown automatically when entering pay phase)
      if (userInput.toLowerCase().includes('pay') || userInput.toLowerCase().includes('transaction') || userInput.length > 10) {
        // Use real API for payment confirmation
        // Note: streaming message is already added in handleSubmit
        searchAPIService.confirmPayment(
          userInput,
          // onDelta - stream content updates
          (content) => {
            console.log('Pay phase delta update:', content);
            updateLastMessage(content);
          },
          // onComplete - handle successful response
          (response) => {
            console.log('Pay phase complete:', response);
            updateLastMessage(response.orderDetails);
            setStreaming(false);
            
            // Move to confirm phase after successful payment confirmation
            if (response.completedStage === 'confirm') {
              setTimeout(() => setPhase('confirm'), 1000);
            }
          },
          // onError - handle errors
          (error) => {
            console.log('Pay phase error:', error);
            updateLastMessage(`❌ ${error}\n\nPlease check your payment ID and try again.`);
            setStreaming(false);
            // Stay in pay phase for retry
          }
        );
        return; // Exit early to avoid the mock response
      } else {
        // Use mock functionality for waiting for payment ID
        simulateOtherPhases(userInput);
      }
    } else {
      // Keep existing mock functionality for other phases (confirm)
      simulateOtherPhases(userInput);
    }
  };

  const simulateOtherPhases = (userInput: string) => {
    const { updateLastMessage, setStreaming, setPhase, currentPhase } = useChatStore.getState();
    
    let response = '';
    
    if (currentPhase === 'pay') {
      response = `Please provide your transaction ID after completing the payment. I'm waiting for your payment confirmation.`;
    } else {
      response = `Thank you for shopping with SnowballShop! Is there anything else I can help you find today?`;
    }

    // Simulate streaming by adding characters gradually
    let index = 0;
    const streamInterval = setInterval(() => {
      if (index <= response.length) {
        updateLastMessage(response.slice(0, index));
        index++;
      } else {
        clearInterval(streamInterval);
        setStreaming(false);
      }
    }, 30);
  };

  return (
    <div className="border-t border-gray-800 bg-black/95 backdrop-blur-sm p-4">
      <div className="w-full px-2">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message and hit Enter..."
            disabled={isStreaming}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-chat px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="bg-gradient-gold text-black px-4 py-3 rounded-chat hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};