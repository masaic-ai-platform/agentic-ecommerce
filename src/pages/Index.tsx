
import { PhaseTracker } from '@/components/PhaseTracker';
import { ChatArea } from '@/components/ChatArea';
import { ChatInput } from '@/components/ChatInput';
import { ProgressBar } from '@/components/ProgressBar';

const Index = () => {
  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <PhaseTracker />
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area - 2/3 width */}
        <div className="flex-1 flex flex-col" style={{ width: '66.666667%' }}>
          <ChatArea />
          <ChatInput />
        </div>
        
        {/* Progress Bar - 1/3 width */}
        <div className="flex-shrink-0" style={{ width: '33.333333%' }}>
          <ProgressBar />
        </div>
      </div>
    </div>
  );
};

export default Index;
