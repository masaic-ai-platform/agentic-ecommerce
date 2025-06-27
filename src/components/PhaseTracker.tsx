
import { RefreshCw } from 'lucide-react';
import { useChatStore, type Phase } from '@/stores/chatStore';

const phases: { key: Phase; label: string }[] = [
  { key: 'search', label: 'Search' },
  { key: 'select', label: 'Select' },
  { key: 'pay', label: 'Pay' },
  { key: 'confirm', label: 'Confirm' },
];

export const PhaseTracker = () => {
  const { currentPhase, startOver } = useChatStore();

  const getPhaseStatus = (phaseKey: Phase) => {
    const currentIndex = phases.findIndex(p => p.key === currentPhase);
    const phaseIndex = phases.findIndex(p => p.key === phaseKey);
    
    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <header className="bg-black/90 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-semibold text-gold">SnowballShop</h1>
          
          <div className="flex items-center space-x-4">
            {phases.map((phase, index) => {
              const status = getPhaseStatus(phase.key);
              return (
                <div key={phase.key} className="flex items-center space-x-2">
                  <div className={`phase-dot ${
                    status === 'active' ? 'phase-dot-active' :
                    status === 'completed' ? 'phase-dot-completed' :
                    'phase-dot-upcoming'
                  }`} />
                  <span className={`text-sm font-medium ${
                    status === 'active' ? 'text-gold' :
                    status === 'completed' ? 'text-gold/80' :
                    'text-gray-500'
                  }`}>
                    {phase.label}
                  </span>
                  {index < phases.length - 1 && (
                    <span className="text-gray-600 mx-2">▸</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={startOver}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-gold transition-colors rounded-lg hover:bg-gray-900/50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Start Over</span>
        </button>
      </div>
    </header>
  );
};
