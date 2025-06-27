import { X } from 'lucide-react';

interface CodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeDrawer = ({ isOpen, onClose }: CodeDrawerProps) => {
  // Simplified Python syntax highlighter
  const highlightPythonCode = (code: string): string => {
    let highlighted = code;
    
    // Apply highlighting step by step to avoid conflicts
    
    // 1. Strings first (most specific)
    highlighted = highlighted.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<SPAN_STRING>"$1"</SPAN_STRING>');
    highlighted = highlighted.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '<SPAN_STRING>\'$1\'</SPAN_STRING>');
    
    // 2. Comments
    highlighted = highlighted.replace(/#.*$/gm, '<SPAN_COMMENT>$&</SPAN_COMMENT>');
    
    // 3. Numbers
    highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<SPAN_NUMBER>$&</SPAN_NUMBER>');
    
    // 4. Keywords
    const keywords = ['import', 'from', 'def', 'class', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'with', 'as', 'return', 'yield', 'break', 'continue', 'pass', 'lambda', 'and', 'or', 'not', 'in', 'is'];
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<SPAN_KEYWORD>${keyword}</SPAN_KEYWORD>`);
    });
    
    // 5. Constants
    highlighted = highlighted.replace(/\bTrue\b/g, '<SPAN_CONSTANT>True</SPAN_CONSTANT>');
    highlighted = highlighted.replace(/\bFalse\b/g, '<SPAN_CONSTANT>False</SPAN_CONSTANT>');
    highlighted = highlighted.replace(/\bNone\b/g, '<SPAN_CONSTANT>None</SPAN_CONSTANT>');
    
    // 6. Function calls
    highlighted = highlighted.replace(/(\w+)(?=\()/g, '<SPAN_FUNCTION>$1</SPAN_FUNCTION>');
    
    // 7. Variable assignments
    highlighted = highlighted.replace(/(\w+)(?=\s*=)/g, '<SPAN_VARIABLE>$1</SPAN_VARIABLE>');
    
    // Convert temporary tags to proper styled spans
    highlighted = highlighted.replace(/<SPAN_STRING>/g, '<span class="text-orange-400">');
    highlighted = highlighted.replace(/<\/SPAN_STRING>/g, '</span>');
    highlighted = highlighted.replace(/<SPAN_COMMENT>/g, '<span class="text-green-400 italic">');
    highlighted = highlighted.replace(/<\/SPAN_COMMENT>/g, '</span>');
    highlighted = highlighted.replace(/<SPAN_NUMBER>/g, '<span class="text-green-300">');
    highlighted = highlighted.replace(/<\/SPAN_NUMBER>/g, '</span>');
    highlighted = highlighted.replace(/<SPAN_KEYWORD>/g, '<span class="text-purple-400 font-medium">');
    highlighted = highlighted.replace(/<\/SPAN_KEYWORD>/g, '</span>');
    highlighted = highlighted.replace(/<SPAN_CONSTANT>/g, '<span class="text-blue-400 font-medium">');
    highlighted = highlighted.replace(/<\/SPAN_CONSTANT>/g, '</span>');
    highlighted = highlighted.replace(/<SPAN_FUNCTION>/g, '<span class="text-yellow-300">');
    highlighted = highlighted.replace(/<\/SPAN_FUNCTION>/g, '</span>');
    highlighted = highlighted.replace(/<SPAN_VARIABLE>/g, '<span class="text-blue-300">');
    highlighted = highlighted.replace(/<\/SPAN_VARIABLE>/g, '</span>');
    
    return highlighted;
  };

  const codeBlocks = [
    {
      title: "1. Search Product",
      code: `openai.api_key = "API_KEY"
openai.api_base = "http://localhost:8081/v1"

payload = {
    "model": "togetherai@meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    "tools": [
        {
            "type": "mcp",
            "server_label": "shopify",
            "server_url": "https://axzx8j-61.myshopify.com/api/mcp",
            "allowed_tools": ["search_shop_catalog"]
        }
    ],
    "instructions": (
        "Use search_shop_catalog to search the product and then bring complete details "
        "of the product including all available images. Do not mention names of tools in the response"
    ),
    "input": "Find me HP printer",
    "stream": True,
    "store": True
}

response = openai.request(
    method="post",
    path="responses",       
    json=payload,
    stream=True
)`
    },
    {
      title: "2. Scene Generation", 
      code: `openai.api_key = "API_KEY"
openai.api_base = "http://localhost:8081/v1"

payload = {
    "model": "openai@gpt-4.1-mini",
    "tools": [
        {
            "type": "mcp",
            "server_label": "img_mcp",
            "server_url": "http://localhost:8086/mcp",
            "allowed_tools": [
                "image_to_base64",
                "img_scene_generator"
            ]
        }
    ],
    "instructions": (
        "Use tool image_to_base64 to generate base64encoded String from provided URL of image "
        "and then use tool img_scene_generator to generate the image for the scene with input prompt "
        "and encodedFilePath returned by the tool image_to_base64. If the image is generated then return "
        "the completedStage=select else not_achieved."
    ),
    "input": (
        "How it will look like on my study table. Create new image of described situation using tools "
        "and object available here https://cdn.shopify.com/s/files/1/0948/4369/9488/files/printer-front.avif?v=1750994570"
    ),
    "stream": True,
    "store": True,
    "text": {
        "format": {
            "type": "json_schema",
            "name": "response_schema",
            "schema": {
                "type": "object",
                "properties": {
                    "situationDescription": {
                        "type": "string",
                        "description": "description of situation for which image created."
                    },
                    "image_url": {
                        "type": "string",
                        "description": "url of the image"
                    },
                    "completedStage": {
                        "type": "string",
                        "description": "the stage completed, should be the same as provided in the system instructions"
                    }
                },
                "required": [
                    "situationDescription",
                    "image_url",
                    "completedStage"
                ],
                "additionalProperties": False
            }
        }
    }
}

response_iter = openai.request(
    method="post",
    path="responses",     
    json=payload,
    stream=True       
)`
    },
    {
      title: "3. Payment Confirmation",
      code: `openai.api_key = "API_KEY"
openai.api_base = "http://localhost:8081/v1"

payload = {
    "model": "claude@claude-sonnet-4-20250514",
    "tools": [
        {
            "type": "mcp",
            "server_label": "razorpay",
            "server_url": "https://mcp.razorpay.com/sse",
            "allowed_tools": [
                "fetch_payment",
                "fetch_order"
            ],
            "headers": {
                "Authorization": "Bearer API_KEY"
            }
        }
    ],
    "instructions": (
        "Use fetch_payment tool by passing payment id provided by the user, "
        "get the order id from payment details response then fetch order details "
        "using fetch_order tool and return order details in markdown format"
    ),
    "input": "payment id pay_Qm89v8wPTFOgGz",
    "store": True,
    "stream": True
}

response_iter = openai.request(
    method="post",
    path="responses", 
    json=payload,
    stream=True  
)`
    }
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
          onClick={onClose}
        />
      )}
      
      {/* Drawer - Always render but translate based on isOpen */}
      <div className={`fixed top-0 right-0 h-screen w-1/2 bg-black shadow-xl z-[70] transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col border-l border-gray-800 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-black flex-shrink-0">
          <div className="flex items-center space-x-3">
            <img 
              src="/Masaic-Logo.png" 
              alt="Masaic Logo" 
              className="w-24 h-12"
            />
            <div>
              <h2 className="text-lg font-semibold text-gold">Masaic Agents Platform</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">E-commerce Journey Code</h3>
            
            <div className="space-y-6">
              {codeBlocks.map((block, index) => (
                <div key={index} className="bg-gray-900 rounded-lg border border-gray-800">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <h4 className="text-gold font-semibold">{block.title}</h4>
                  </div>
                  <div className="bg-[#1e1e1e] border-t border-gray-800">
                    {/* Editor Header */}
                                          <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-gray-800">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-gray-400 ml-3">main.py</span>
                      </div>
                      <span className="text-xs text-gray-400">Python</span>
                    </div>
                    
                    {/* Code Content */}
                    <div className="relative">
                      <div className="flex">
                        {/* Line Numbers */}
                        <div className="bg-[#1e1e1e] border-r border-gray-800 px-3 py-4 text-xs text-gray-500 font-mono select-none">
                          {block.code.split('\n').map((_, index) => (
                            <div key={index} className="leading-6 text-right">
                              {index + 1}
                            </div>
                          ))}
                        </div>
                        
                        {/* Code */}
                        <div className="flex-1 overflow-x-auto">
                          <pre className="p-4 text-sm font-mono leading-6 text-gray-300 bg-[#1e1e1e] hover:bg-[#1e1e1e] focus:outline-none">
                            <code 
                              className="language-python whitespace-pre"
                              dangerouslySetInnerHTML={{ 
                                __html: highlightPythonCode(block.code)
                              }}
                            />
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 