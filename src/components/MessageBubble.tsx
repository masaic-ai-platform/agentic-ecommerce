import { type Message } from '@/stores/chatStore';
import { useMemo } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  // Robust markdown rendering with proper parsing order
  const renderedContent = useMemo(() => {
    if (isUser) return message.content;

    let content = message.content;
    
    // Step 1: Escape existing HTML to prevent conflicts
    content = content.replace(/&/g, '&amp;');
    content = content.replace(/</g, '&lt;');
    content = content.replace(/>/g, '&gt;');
    
    // Step 2: Handle standalone image URLs first (convert to markdown)
    // Handle "Image URL: https://..." pattern specifically
    content = content.replace(
      /Image URL:\s*(https?:\/\/[^\s]+\.(png|jpg|jpeg|avif|webp)(?:\?[^\s]*)?)/gim,
      '![Product Image]($1)'
    );
    
    // Handle URLs at start of lines or after newlines
    content = content.replace(
      /(^|\n)(https?:\/\/[^\s]+\.(png|jpg|jpeg|avif|webp)(?:\?[^\s]*)?)/gim,
      '$1![Product Image]($2)'
    );
    
    // Also handle URLs that appear anywhere in text (more aggressive detection)
    // But avoid URLs that are already part of markdown syntax
    content = content.replace(
      /(^|[^[\(])(https?:\/\/[^\s]+\.(png|jpg|jpeg|avif|webp)(?:\?[^\s]*)?)/gim,
      '$1![Product Image]($2)'
    );
    
    // Step 2b: Convert markdown links that look like image references to actual images
    // This handles cases where the API returns [Image Description](url) instead of ![alt](url)
    content = content.replace(
      /\[([^\]]*(?:image|photo|picture|view|front|back|side)[^\]]*)\]\((https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|avif|webp)(?:\?[^\s)]*)?)\)/gi,
      '![$1]($2)'
    );
    
    // Step 3a: Handle file:// URLs FIRST with a descriptive message
    content = content.replace(
      /!\[([^\]]*)\]\((file:\/\/[^\)]+)\)/gi,
      '<div class="my-4 p-4 bg-gray-800 border border-gray-600 rounded-lg text-center"><div class="text-gold font-semibold mb-2">🎨 Generated Scene</div><div class="text-gray-300 text-sm mb-2">A scene image has been generated and saved locally</div><div class="text-xs text-gray-500 break-all">$2</div></div>'
    );
    
    // Step 3b: Handle HTTP/HTTPS markdown image syntax ![alt](url)
    content = content.replace(
      /!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/gi,
      '<div class="my-4 text-center"><img src="$2" alt="$1" class="rounded-lg shadow-lg border border-gray-600 max-w-full h-auto mx-auto" style="max-height: 400px; object-fit: contain;" loading="lazy" /></div>'
    );
    
    // Step 4: Handle markdown links [text](url)
    content = content.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-gold hover:text-gold/80 underline font-medium transition-colors">$1</a>'
    );
    
    // Step 5: Handle markdown tables BEFORE headers and other formatting
    content = content.replace(/\n\|([^|\n]+\|[^|\n]*)\n\|(-+\|[^|\n]*)\n((?:\|[^|\n]*\n?)*)/gm, (match, headerRow, separatorRow, bodyRows) => {
      // Process header row
      const headers = headerRow.split('|').map(cell => cell.trim()).filter(cell => cell);
      const headerHtml = headers.map(header => `<th class="px-3 py-2 text-left font-semibold text-gold border-b border-gray-600">${header}</th>`).join('');
      
      // Process body rows
      const rows = bodyRows.trim().split('\n').filter(row => row.trim());
      const bodyHtml = rows.map(row => {
        const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
        const cellsHtml = cells.map(cell => `<td class="px-3 py-2 border-b border-gray-700">${cell}</td>`).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');
      
      return `<div class="my-4 overflow-x-auto"><table class="w-full bg-gray-800/50 rounded-lg border border-gray-600"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
    });
    
    // Step 6: Handle headers (must be at start of line or after line break)
    content = content.replace(/(^|\n)#### (.+?)$/gm, '$1<h4 class="text-lg font-semibold text-gold mb-2 mt-4 first:mt-0">$2</h4>');
    content = content.replace(/(^|\n)### (.+?)$/gm, '$1<h3 class="text-xl font-bold text-gold mb-3 mt-4 first:mt-0">$2</h3>');
    content = content.replace(/(^|\n)## (.+?)$/gm, '$1<h2 class="text-2xl font-bold text-gold mb-4 mt-5 first:mt-0">$2</h2>');
    content = content.replace(/(^|\n)# (.+?)$/gm, '$1<h1 class="text-3xl font-bold text-gold mb-5 mt-6 first:mt-0">$2</h1>');
    
    // Step 7: Handle bold text
    content = content.replace(/\*\*([^*\n]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    
    // Step 8: Handle italic text (avoiding conflicts with bold)
    content = content.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em class="italic text-gray-300">$1</em>');
    
    // Step 9: Handle list items
    content = content.replace(/(^|\n)- (.+?)($|\n)/gm, '$1<div class="flex items-start mb-2 mt-1"><span class="text-gold mr-2 mt-1 flex-shrink-0">•</span><span class="flex-1">$2</span></div>$3');
    content = content.replace(/(^|\n)\+ (.+?)($|\n)/gm, '$1<div class="flex items-start mb-2 mt-1"><span class="text-gold mr-2 mt-1 flex-shrink-0">+</span><span class="flex-1">$2</span></div>$3');
    content = content.replace(/(^|\n)\* (.+?)($|\n)/gm, '$1<div class="flex items-start mb-2 mt-1"><span class="text-gold mr-2 mt-1 flex-shrink-0">*</span><span class="flex-1">$2</span></div>$3');
    
    // Step 10: Handle price formatting
    content = content.replace(/(₹\s*\d+(?:\.\d+)?(?:\s*INR)?)/g, '<span class="text-gold font-semibold">$1</span>');
    content = content.replace(/(\$\s*\d+(?:\.\d+)?(?:\s*USD)?)/g, '<span class="text-gold font-semibold">$1</span>');
    
    // Step 11: Handle remaining standalone URLs (not already processed as links or images)
    content = content.replace(
      /(^|[^">])(https?:\/\/[^\s<"]+)(?![^<]*<\/a>)/gm,
      '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="text-gold hover:text-gold/80 underline break-all transition-colors">$2</a>'
    );
    
    // Step 12: Convert line breaks to proper HTML
    content = content.replace(/\n/g, '<br class="leading-relaxed" />');
    
    // Step 13: Unescape HTML entities for proper display
    content = content.replace(/&lt;/g, '<');
    content = content.replace(/&gt;/g, '>');
    content = content.replace(/&amp;/g, '&');
    
    return content;
  }, [message.content, isUser]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in w-full`}>
      <div className={
        isUser 
          ? 'message-bubble-user-large font-medium' 
          : 'message-bubble-assistant-large font-medium'
      }>
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div 
            className="prose-custom leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: renderedContent
            }} 
          />
        )}
        {message.streaming && (
          <span className="inline-block w-2 h-5 bg-gold ml-1 animate-blink">|</span>
        )}
      </div>
    </div>
  );
};
