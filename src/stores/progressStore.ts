import { create } from 'zustand';

export interface ProgressStage {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  timestamp: Date;
}

interface ProgressState {
  stages: ProgressStage[];
  addStage: (name: string) => void;
  updateStageStatus: (name: string, status: 'pending' | 'in_progress' | 'completed') => void;
  clearStages: () => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  stages: [],
  
  addStage: (name: string) => {
    set((state) => {
      // Check if stage already exists
      const existingStage = state.stages.find(stage => stage.name === name);
      if (existingStage) {
        return state;
      }
      
      const newStage: ProgressStage = {
        id: crypto.randomUUID(),
        name,
        status: 'pending',
        timestamp: new Date(),
      };
      
      return {
        stages: [...state.stages, newStage],
      };
    });
  },
  
  updateStageStatus: (name: string, status: 'pending' | 'in_progress' | 'completed') => {
    set((state) => ({
      stages: state.stages.map(stage =>
        stage.name === name
          ? { ...stage, status, timestamp: new Date() }
          : stage
      ),
    }));
  },
  
  clearStages: () => {
    set({ stages: [] });
  },
})); 