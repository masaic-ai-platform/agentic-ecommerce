import { useProgressStore } from '@/stores/progressStore';
import { Loader2, CheckCircle, Circle } from 'lucide-react';

export const ProgressBar = () => {
  const { stages } = useProgressStore();

  const formatStageName = (name: string) => {
    if (name === 'Planning') return 'Planning';
    
    // Convert tool names to readable format
    // e.g., "shopify_search_shop_catalog" -> "Shopify Catalog Search"
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace('Shopify', 'Shopify');
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-gold" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-gold animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (stages.length === 0) {
    return (
      <div className="w-full h-full bg-gray-900/50 border-l border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gold mb-4">Agent Progress</h3>
        <div className="text-gray-400 text-sm">
          No active processes
        </div>
      </div>
    );
  }

      return (
      <div className="w-full h-full bg-gray-900/50 border-l border-gray-700 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gold mb-4">Agent Progress</h3>
      
      <div className="space-y-1 relative">
        {stages.map((stage, index) => (
          <div key={stage.id} className="relative">
            <div className="flex items-start space-x-3 py-2">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5 relative z-10">
                {getStageIcon(stage.status)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${
                    stage.status === 'completed' ? 'text-gold' : 
                    stage.status === 'in_progress' ? 'text-white' : 
                    'text-gray-400'
                  }`}>
                    {formatStageName(stage.name)}
                  </h4>
                  
                  <span className="text-xs text-gray-500">
                    {stage.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    })}
                  </span>
                </div>
                
                <div className={`text-xs mt-1 ${
                  stage.status === 'completed' ? 'text-green-400' : 
                  stage.status === 'in_progress' ? 'text-blue-400' : 
                  'text-gray-500'
                }`}>
                  {stage.status === 'completed' ? 'Completed' : 
                   stage.status === 'in_progress' ? 'Processing...' : 
                   'Pending'}
                </div>
              </div>
            </div>
            
            {/* Connector line */}
            {index < stages.length - 1 && (
              <div className="absolute left-2.5 top-8 w-px h-6 bg-gray-600 z-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 