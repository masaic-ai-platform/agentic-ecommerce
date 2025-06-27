
import { useState } from 'react';
import { Send } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';

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

    // Simulate assistant response with streaming
    simulateAssistantResponse(input.trim());
    
    setInput('');
  };

  const simulateAssistantResponse = (userInput: string) => {
    const { addMessage, updateLastMessage, setStreaming, setPhase, currentPhase } = useChatStore.getState();
    
    setStreaming(true);
    
    // Add initial streaming message
    addMessage({
      role: 'assistant',
      content: '',
      streaming: true,
    });

    // Simulate different responses based on phase and input
    let response = '';
    
    if (currentPhase === 'search') {
      response = `I found some great products for "${userInput}"! Here's what I recommend:\n\n**Premium Wireless Headphones** - $299\n- Noise cancellation technology\n- 30-hour battery life\n- Premium build quality\n\nhttps://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400\n\nWould you like to see how these look in your space?`;
    } else if (currentPhase === 'select') {
      response = `Perfect! Let me show you how the **Premium Wireless Headphones** would look in your environment:\n\nhttps://images.unsplash.com/photo-1484704849700-f032a568e944?w=500\n\nThey look great! Ready to proceed with payment? \n\n[**Pay Now - $299**](https://checkout.razorpay.com/demo) 💳`;
      setPhase('pay');
    } else if (currentPhase === 'pay') {
      if (userInput.startsWith('pay_')) {
        response = `🎉 **Payment Successful!**\n\nThank you for your purchase!\n\n**Order Summary:**\n- Premium Wireless Headphones: $299\n- Transaction ID: ${userInput}\n- Estimated delivery: 2-3 business days\n\nYou'll receive a confirmation email shortly. Enjoy your new headphones!`;
        setPhase('confirm');
      } else {
        response = `Please complete your payment and paste the payment ID (starting with "pay_") here to confirm your order.`;
      }
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
        
        // Auto-advance phase for demo
        if (currentPhase === 'search' && !response.includes('payment')) {
          setTimeout(() => setPhase('select'), 1000);
        }
      }
    }, 30);
  };

  return (
    <div className="border-t border-gray-800 bg-black/90 backdrop-blur-sm p-4">
      <div className="max-w-4xl mx-auto">
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
