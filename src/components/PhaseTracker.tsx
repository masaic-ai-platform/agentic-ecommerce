import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useChatStore, type Phase } from '@/stores/chatStore';
import { CodeDrawer } from './CodeDrawer';

const phases: { key: Phase; label: string }[] = [
  { key: 'search', label: 'Search' },
  { key: 'select', label: 'Select' },
  { key: 'pay', label: 'Pay' },
  { key: 'confirm', label: 'Confirm' },
];

export const PhaseTracker = () => {
  const { currentPhase, startOver, setPhase } = useChatStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const getPhaseStatus = (phaseKey: Phase) => {
    const currentIndex = phases.findIndex(p => p.key === currentPhase);
    const phaseIndex = phases.findIndex(p => p.key === phaseKey);
    
    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  const handlePhaseClick = (phaseKey: Phase) => {
    setPhase(phaseKey);
  };

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800 px-6 py-4 relative">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-semibold text-gold">SnowballShop</h1>
          
          <div className="flex items-center space-x-4">
            {phases.map((phase, index) => {
              const status = getPhaseStatus(phase.key);
              return (
                <div key={phase.key} className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePhaseClick(phase.key)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-900/50 group"
                  >
                    <div className={`phase-dot transition-all duration-200 ${
                      status === 'active' ? 'phase-dot-active' :
                      status === 'completed' ? 'phase-dot-completed' :
                      'phase-dot-upcoming'
                    } group-hover:scale-110`} />
                    <span className={`text-sm font-medium transition-colors duration-200 ${
                      status === 'active' ? 'text-gold' :
                      status === 'completed' ? 'text-gold/80' :
                      'text-gray-500'
                    } group-hover:text-gold`}>
                      {phase.label}
                    </span>
                  </button>
                  {index < phases.length - 1 && (
                    <span className="text-gray-600 mx-2">▸</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={startOver}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-gold transition-colors rounded-lg hover:bg-gray-900/50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
        </div>
      </div>
      
      {/* Logo in top right corner */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="absolute top-4 right-4 hover:opacity-80 transition-opacity z-10"
        title="View API Code"
      >
        <img 
          src="/Masaic-Logo.png" 
          alt="Masaic Logo" 
          className="w-24 h-12"
        />
      </button>
      
      <CodeDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </header>
  );
};
