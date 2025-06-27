
import { PhaseTracker } from '@/components/PhaseTracker';
import { ChatArea } from '@/components/ChatArea';
import { ChatInput } from '@/components/ChatInput';

const Index = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <PhaseTracker />
      <ChatArea />
      <ChatInput />
    </div>
  );
};

export default Index;
