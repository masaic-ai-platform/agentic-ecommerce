
import { type Message } from '@/stores/chatStore';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  // Simple markdown rendering function
  const renderMarkdown = (content: string) => {
    // Handle bold text
    let rendered = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text
    rendered = rendered.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle images (auto-preview for png, jpg, jpeg, avif)
    rendered = rendered.replace(
      /(https?:\/\/[^\s]+\.(png|jpg|jpeg|avif))/gi,
      '<img src="$1" alt="Product image" class="rounded-lg max-w-full h-auto my-2" />'
    );
    
    // Handle links
    rendered = rendered.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-gold hover:text-gold-dim underline">$1</a>'
    );
    
    // Handle line breaks
    rendered = rendered.replace(/\n/g, '<br />');
    
    return rendered;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div className={
        isUser 
          ? 'message-bubble-user font-medium' 
          : 'message-bubble-assistant'
      }>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div 
            dangerouslySetInnerHTML={{ 
              __html: renderMarkdown(message.content) 
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
