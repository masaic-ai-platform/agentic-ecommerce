import { useProgressStore } from '@/stores/progressStore';

interface SearchAPIResponse {
  details: string;
  image_url: string;
  completedStage: string;
}

interface SelectAPIResponse {
  situationDescription: string;
  image_url: string;
  completedStage: string;
}

interface PaymentConfirmationResponse {
  orderDetails: string;
  completedStage: string;
}

interface StreamDeltaEvent {
  content_index: number;
  delta: string;
  item_id: string;
  output_index: number;
  sequence_number: number;
  type: string;
  isValid: boolean;
}

interface StreamDoneEvent {
  content_index: number;
  item_id: string;
  output_index: number;
  sequence_number: number;
  text: string;
  type: string;
  isValid: boolean;
}

export class SearchAPIService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly claudeApiKey: string;
  private readonly razorPayKey: string;
  private readonly llamaApiKey: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081/v1/responses';
    this.apiKey = import.meta.env.VITE_API_KEY || '';
    this.claudeApiKey = import.meta.env.VITE_CLAUDE_API_KEY || '';
    this.razorPayKey = import.meta.env.VITE_RAZOR_PAY_KEY || '';
    this.llamaApiKey = import.meta.env.VITE_LLAMA_API_KEY || '';
    
    // Environment variables loaded successfully
  }

  async searchProducts(
    userInput: string,
    previousResponseId: string | null,
    onDelta: (content: string) => void,
    onComplete: (response: SearchAPIResponse, responseId: string | null) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Clear previous progress stages and get progress store reference
      const progressStore = useProgressStore.getState();
      progressStore.clearStages();
      
      const requestBody: any = {
        model: "togetherai@meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
        tools: [
          {
            type: "mcp",
            server_label: "shopify",
            server_url: "https://axzx8j-61.myshopify.com/api/mcp",
            allowed_tools: [
              "search_shop_catalog"
            ]
          }
        ],
        instructions: "Use search_shop_catalog to search the product and then bring complete details of the product including all available images. Do not mention names of tools in the response",
        input: userInput,
        stream: true,
        store: true
      };

      // Add previous_response_id if available
      if (previousResponseId) {
        requestBody.previous_response_id = previousResponseId;
      }

      const headers = {
        'Authorization': `Bearer ${this.llamaApiKey}`,
        'Content-Type': 'application/json',
      };

      // Making API request to search products

      // Making API request to search products

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let currentResponseId: string | null = null;
      let toolsCompleted = new Set<string>();
      let hasAddedFinalizingStage = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            // Handle direct event lines (without spaces after colon)
            if (line.startsWith('event:')) {
              const eventType = line.substring(6).trim();
              
              // Track tool progress from direct event lines
              if (eventType.includes('.in_progress') || eventType.includes('.executing')) {
                const toolMatch = eventType.match(/response\.([^\.]+)\.(?:in_progress|executing)/);
                if (toolMatch) {
                  const toolName = toolMatch[1];
                  progressStore.addStage(toolName);
                  progressStore.updateStageStatus(toolName, 'in_progress');
                }
              }
              
              if (eventType.includes('.completed') && !eventType.includes('response.completed')) {
                const toolMatch = eventType.match(/response\.([^\.]+)\.completed/);
                if (toolMatch) {
                  const toolName = toolMatch[1];
                  progressStore.updateStageStatus(toolName, 'completed');
                }
              }
              
              continue;
            }
            
            if (line.startsWith('event: response.output_text.delta')) {
              continue;
            }
            
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.substring(6));
                
                // Track progress stages based on event types
                if (eventData.type === 'response.created') {
                  progressStore.addStage('Planning');
                  progressStore.updateStageStatus('Planning', 'in_progress');
                }
                
                if (eventData.type === 'response.output_item.added') {
                  progressStore.updateStageStatus('Planning', 'completed');
                }
                
                // Track tool progress - handle both executing and in_progress events
                if (eventData.type && (eventData.type.includes('.in_progress') || eventData.type.includes('.executing'))) {
                  // Extract tool name from event type (e.g., "response.shopify_search_shop_catalog.in_progress")
                  const toolMatch = eventData.type.match(/response\.([^\.]+)\.(?:in_progress|executing)/);
                  if (toolMatch) {
                    const toolName = toolMatch[1];
                    progressStore.addStage(toolName);
                    progressStore.updateStageStatus(toolName, 'in_progress');
                  }
                }
                
                if (eventData.type && eventData.type.includes('.completed')) {
                  // Extract tool name from event type (e.g., "response.shopify_search_shop_catalog.completed")
                  const toolMatch = eventData.type.match(/response\.([^\.]+)\.completed/);
                  if (toolMatch) {
                    const toolName = toolMatch[1];
                    progressStore.updateStageStatus(toolName, 'completed');
                    toolsCompleted.add(toolName);
                  }
                }
                
                // Skip response.output_text.delta and response.in_progress as requested
                if (eventData.type === 'response.output_text.delta') {
                  // Add finalizing stage when we start receiving delta events after tools complete
                  // For search, we typically have 1 tool (shopify_search_shop_catalog)
                  if (!hasAddedFinalizingStage && toolsCompleted.size >= 1) {
                    progressStore.addStage('Finalizing Response');
                    progressStore.updateStageStatus('Finalizing Response', 'in_progress');
                    hasAddedFinalizingStage = true;
                  }
                  
                  if (eventData.delta) {
                    accumulatedContent += eventData.delta;
                    // Throttle updates to reduce flickering - only update every few characters
                    if (accumulatedContent.length % 3 === 0 || eventData.delta.includes(' ')) {
                      onDelta(accumulatedContent);
                    }
                  }
                }
                
                if (eventData.type === 'response.completed') {
                  // Add finalizing stage if it hasn't been added yet (in case no tools were executed)
                  if (!hasAddedFinalizingStage) {
                    progressStore.addStage('Finalizing Response');
                    progressStore.updateStageStatus('Finalizing Response', 'in_progress');
                    hasAddedFinalizingStage = true;
                  }
                  
                  // Mark final stage as completed
                  progressStore.updateStageStatus('Finalizing Response', 'completed');
                  
                  // Extract response ID from completed event
                  if (eventData.response && eventData.response.id) {
                    currentResponseId = eventData.response.id;
                  }
                  
                  // Final update with complete content to ensure nothing is missed
                  if (accumulatedContent) {
                    onDelta(accumulatedContent);
                  }
                  
                  // Extract image URL from the API response content
                  let extractedImageUrl = '';
                  
                  // Look for image URLs in the content (various patterns)
                  const imageUrlPatterns = [
                    // Markdown image syntax: ![alt](url)
                    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|avif|webp)(?:\?[^\s)]*)?)\)/gi,
                    // Direct URLs to image files
                    /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|avif|webp)(?:\?[^\s]*)?)/gi,
                    // URLs in "Image URL:" format
                    /Image\s+URL:\s*(https?:\/\/[^\s]+)/gi
                  ];
                  
                  for (const pattern of imageUrlPatterns) {
                    const match = pattern.exec(accumulatedContent);
                    if (match) {
                      extractedImageUrl = match[match.length - 1]; // Get the URL part
                      break;
                    }
                  }
                  
                  // Fallback: if no image found in response, use a default or leave empty
                  if (!extractedImageUrl) {
                    console.log('No image URL found in API response, using fallback');
                    extractedImageUrl = "https://cdn.shopify.com/s/files/1/0948/4369/9488/files/printer-front.avif?v=1750994570";
                  }
                  
                  const searchResponse: SearchAPIResponse = {
                    details: accumulatedContent,
                    image_url: extractedImageUrl,
                    completedStage: 'search'
                  };
                  
                  onComplete(searchResponse, currentResponseId);
                  return;
                }
              } catch (jsonError) {
                console.error('Error parsing event data:', jsonError);
                // Continue processing other events
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Search API error:', error);
      onError('Failed to search products. Please try again.');
    }
  }

  async selectProduct(
    userInput: string,
    previousResponseId: string | null,
    imageUrl: string,
    onComplete: (response: SelectAPIResponse, responseId: string | null) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Clear previous progress stages and get progress store reference
      const progressStore = useProgressStore.getState();
      progressStore.clearStages();
      const requestBody: any = {
        model: "openai@gpt-4.1-mini",
        tools: [
          {
            type: "mcp",
            server_label: "img_mcp",
            server_url: "http://localhost:8086/mcp",
            allowed_tools: [
              "image_to_base64",
              "img_scene_generator"
            ]
          }
        ],
        instructions: "Use tool image_to_base64 to generate base64encoded String from provided URL of image and then use tool img_scene_generator to generate the image for the scene with input prompt and encodedFilePath returned by the tool image_to_base64 If the image is generated then return the completedStage=select else not_achieved.",
        input: `${userInput} append image of object: ${imageUrl}`,
        stream: true,
        store: true,
        text: {
          format: {
            type: "json_schema",
            name: "response_schema",
            schema: {
              type: "object",
              properties: {
                situationDescription: {
                  type: "string",
                  description: "description of situation for which image created."
                },
                image_url: {
                  type: "string",
                  description: "url of the image"
                },
                completedStage: {
                  type: "string",
                  description: "the stage completed, should be the same as provded in the system instructions"
                }
              },
              required: [
                "situationDescription",
                "image_url",
                "completedStage"
              ],
              additionalProperties: false
            }
          }
        }
      };

      // Add previous_response_id if available
      if (previousResponseId) {
        requestBody.previous_response_id = previousResponseId;
      }

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      // Making API request for select phase
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentResponseId: string | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            // Handle direct event lines (without spaces after colon)
            if (line.startsWith('event:')) {
              const eventType = line.substring(6).trim();
              
              // Track tool progress from direct event lines
              if (eventType.includes('.in_progress') || eventType.includes('.executing')) {
                const toolMatch = eventType.match(/response\.([^\.]+)\.(?:in_progress|executing)/);
                if (toolMatch) {
                  const toolName = toolMatch[1];
                  progressStore.addStage(toolName);
                  progressStore.updateStageStatus(toolName, 'in_progress');
                }
              }
              
              if (eventType.includes('.completed') && !eventType.includes('response.completed')) {
                const toolMatch = eventType.match(/response\.([^\.]+)\.completed/);
                if (toolMatch) {
                  const toolName = toolMatch[1];
                  progressStore.updateStageStatus(toolName, 'completed');
                }
              }
              
              continue;
            }
            
            if (line.startsWith('event: response.output_text.delta')) {
              continue;
            }
            
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.substring(6));
                
                // Track progress stages based on event types
                if (eventData.type === 'response.created') {
                  progressStore.addStage('Planning');
                  progressStore.updateStageStatus('Planning', 'in_progress');
                }
                
                if (eventData.type === 'response.output_item.added') {
                  progressStore.updateStageStatus('Planning', 'completed');
                }
                
                if (eventData.type === 'response.output_text.delta') {
                  // Don't show anything during streaming for select phase
                  continue;
                }
                
                if (eventData.type === 'response.completed') {
                  // Mark final stage as completed
                  progressStore.updateStageStatus('Processing Response', 'completed');
                  
                  // Extract response ID from completed event
                  if (eventData.response && eventData.response.id) {
                    currentResponseId = eventData.response.id;
                  }
                  
                  // Complete the process with stored response data
                  const storedResponse = (window as any).selectResponseData;
                  if (storedResponse) {
                    onComplete(storedResponse, currentResponseId);
                    // Clean up
                    delete (window as any).selectResponseData;
                    return;
                  }
                }
                
                if (eventData.type === 'response.output_text.done') {
                  // Add processing stage and mark as in progress
                  progressStore.addStage('Processing Response');
                  progressStore.updateStageStatus('Processing Response', 'in_progress');
                  
                  // Store the response but don't complete yet - wait for response.completed
                  const doneEvent = eventData as StreamDoneEvent;
                  try {
                    const parsedResponse: SelectAPIResponse = JSON.parse(doneEvent.text);
                    // Store the parsed response for when we get response.completed
                    (window as any).selectResponseData = parsedResponse;
                  } catch (parseError) {
                    console.error('Error parsing select response:', parseError);
                    onError('Error parsing response data. Please try again.');
                    return;
                  }
                }
              } catch (jsonError) {
                console.error('Error parsing event data:', jsonError);
                // Continue processing other events
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Select API error:', error);
      onError('Failed to generate scene. Please try again.');
    }
  }

  async confirmPayment(
    userInput: string,
    onDelta: (content: string) => void,
    onComplete: (response: PaymentConfirmationResponse) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Clear previous progress stages and get progress store reference
      const progressStore = useProgressStore.getState();
      progressStore.clearStages();
      const requestBody: any = {
        model: "claude@claude-sonnet-4-20250514",
        tools: [
          {
            type: "mcp",
            server_label: "razorpay",
            server_url: "https://mcp.razorpay.com/sse",
            allowed_tools: [
              "fetch_payment",
              "fetch_order"
            ],
            headers: {
              Authorization: `Bearer ${this.razorPayKey}`
            }
          }
        ],
        instructions: "Use fetch_payment tool by passing payment id provided by the user, get the order id from payment details response then fetch order details using fetch_order tool return order details in readable format",
        input: userInput,
        store: true,
        stream: true
      };

      const headers = {
        'Authorization': `Bearer ${this.claudeApiKey}`,
        'Content-Type': 'application/json',
      };

      // Making API request for payment confirmation
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let toolsCompleted = new Set<string>();
      let hasAddedFinalizingStage = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            // Handle direct event lines (without spaces after colon)
            if (line.startsWith('event:')) {
              const eventType = line.substring(6).trim();
              
              // Track tool progress from direct event lines
              if (eventType.includes('.in_progress') || eventType.includes('.executing')) {
                const toolMatch = eventType.match(/response\.([^\.]+)\.(?:in_progress|executing)/);
                if (toolMatch) {
                  const toolName = toolMatch[1];
                  progressStore.addStage(toolName);
                  progressStore.updateStageStatus(toolName, 'in_progress');
                }
              }
              
              if (eventType.includes('.completed') && !eventType.includes('response.completed')) {
                const toolMatch = eventType.match(/response\.([^\.]+)\.completed/);
                if (toolMatch) {
                  const toolName = toolMatch[1];
                  progressStore.updateStageStatus(toolName, 'completed');
                  toolsCompleted.add(toolName);
                }
              }
              
              continue;
            }
            
            if (line.startsWith('event: response.output_text.delta')) {
              continue;
            }
            
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.substring(6));
                console.log('Payment API event:', eventData.type, eventData);
                
                // Track progress stages based on event types
                if (eventData.type === 'response.created') {
                  progressStore.addStage('Planning');
                  progressStore.updateStageStatus('Planning', 'in_progress');
                }
                
                if (eventData.type === 'response.output_item.added') {
                  progressStore.updateStageStatus('Planning', 'completed');
                }
                
                if (eventData.type === 'response.output_text.delta') {
                  // Add finalizing stage when we start receiving delta events after tools complete
                  // Based on your stream, we need at least 2 tools completed (razorpay_fetch_payment, razorpay_fetch_order)
                  if (!hasAddedFinalizingStage && toolsCompleted.size >= 2) {
                    progressStore.addStage('Finalizing Response');
                    progressStore.updateStageStatus('Finalizing Response', 'in_progress');
                    hasAddedFinalizingStage = true;
                  }
                  
                  if (eventData.delta) {
                    accumulatedContent += eventData.delta;
                    // Throttle updates to reduce flickering - only update every few characters
                    if (accumulatedContent.length % 3 === 0 || eventData.delta.includes(' ')) {
                      onDelta(accumulatedContent);
                    }
                  }
                }
                
                if (eventData.type === 'response.output_text.done') {
                  // Don't stop streaming here - continue until response.completed
                  // Just ensure we have the latest content
                  const doneEvent = eventData as StreamDoneEvent;
                  if (doneEvent.text) {
                    // Update accumulated content with the complete text from this segment
                    const segmentText = doneEvent.text;
                    
                    // If this is a new segment (different from what we've accumulated),
                    // append it to our accumulated content
                    if (!accumulatedContent.includes(segmentText)) {
                      accumulatedContent += segmentText;
                      onDelta(accumulatedContent);
                    }
                  }
                }
                
                if (eventData.type === 'response.completed') {
                  // Add finalizing stage if it hasn't been added yet (in case no tools were executed)
                  if (!hasAddedFinalizingStage) {
                    progressStore.addStage('Finalizing Response');
                    progressStore.updateStageStatus('Finalizing Response', 'in_progress');
                    hasAddedFinalizingStage = true;
                  }
                  
                  // Mark final stage as completed
                  progressStore.updateStageStatus('Finalizing Response', 'completed');
                  
                  // Final update with complete content to ensure nothing is missed
                  if (accumulatedContent) {
                    onDelta(accumulatedContent);
                  }
                  
                  // For payment confirmation, we use the accumulated content as order details
                  const confirmationResponse: PaymentConfirmationResponse = {
                    orderDetails: accumulatedContent,
                    completedStage: 'confirm'
                  };
                  
                  onComplete(confirmationResponse);
                  return;
                }
              } catch (jsonError) {
                console.error('Error parsing event data:', jsonError);
                // Continue processing other events
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Payment confirmation API error:', error);
      onError('Failed to confirm payment. Please try again.');
    }
  }
}

export const searchAPIService = new SearchAPIService(); 