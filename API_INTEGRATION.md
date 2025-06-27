# Search Phase API Integration

## 🎯 Implementation Summary

The search phase API integration has been successfully implemented with the following features:

### ✅ **Completed Features**

1. **Real API Integration** - Replaced mock search functionality with actual API calls
2. **Server-Sent Events (SSE)** - Implemented streaming response handling
3. **Error Handling** - Graceful error handling with user-friendly messages
4. **Environment Configuration** - Proper .env setup with VITE_ prefixes
5. **State Management** - Added `previousResponseId` tracking for subsequent requests
6. **Phase Management** - Stays in search phase until `completedStage: "search"` is received

### 🔧 **Technical Implementation**

#### **API Service (`src/services/apiService.ts`)**
- `SearchAPIService` class with streaming support
- Handles Server-Sent Events parsing
- Processes `response.output_text.delta` and `response.output_text.done` events
- Extracts JSON from final response text

#### **Updated Components**
- **ChatInput**: Integrated real API for search phase, keeps mock for other phases
- **ChatStore**: Added `previousResponseId` state management
- **Environment**: Added TypeScript definitions for environment variables

#### **API Request Structure**
```json
{
  "model": "openai@gpt-4o",
  "tools": [
    {
      "type": "mcp",
      "server_label": "shopify",
      "server_url": "https://axzx8j-61.myshopify.com/api/mcp",
      "allowed_tools": ["search_shop_catalog", "get_product_details"]
    }
  ],
  "instructions": "Use search_shop_catalog to search the product...",
  "input": "user_input_here",
  "stream": true,
  "store": true,
  "previous_response_id": "optional_previous_id",
  "text": { /* JSON schema for response format */ }
}
```

### 🔄 **Search Phase Flow**

1. **User Input** → User types search query (e.g., "Find me HP printer")
2. **API Call** → Real API request to `http://localhost:8081/v1/responses`
3. **Streaming** → Response streams in real-time via SSE
4. **Processing** → Parse `delta` events for streaming, `done` event for completion
5. **Display** → Show product details with images and markdown formatting
6. **Validation** → Check `completedStage: "search"` for success
7. **Phase Transition** → Move to "Select" phase OR stay in "Search" for retry

### 🌐 **Environment Variables**

Add to `.env` file in project root:
```bash
VITE_API_URL=http://localhost:8081/v1/responses
VITE_API_KEY=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
```

### 🧪 **Testing Instructions**

1. **Start Backend Server** - Ensure `http://localhost:8081/v1/responses` is running
2. **Start Frontend** - `npm run dev` (running on http://localhost:8080)
3. **Test Search** - Type "Find me HP printer" or any product query
4. **Verify Streaming** - Watch response stream in real-time
5. **Check Error Handling** - Test with invalid requests
6. **Test Retry** - If search doesn't complete, stay in search phase

### 🔍 **Expected Response Format**
```json
{
  "details": "### [HP DeskJet Color Inkjet Printer]...",
  "image_url": "https://cdn.shopify.com/s/files/1/0948/4369/9488/files/printer-front.avif",
  "completedStage": "search"
}
```

### ⚠️ **Error Scenarios**
- **API Failure** → Shows error message, stays in search phase
- **Invalid Response** → Shows parse error, stays in search phase  
- **Incomplete Stage** → If `completedStage !== "search"`, stays in search phase
- **Network Issues** → Shows connection error, user can retry

### 🚀 **Next Steps**
- Test with actual backend server
- Implement similar integration for other phases (Select, Pay, Confirm)
- Add authentication if required
- Enhance error handling with specific error codes 