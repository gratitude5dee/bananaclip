import { useState, useEffect, useCallback } from 'react';
import { ProjectState, ProjectStateSchema } from '@/lib/schemas';

const STORAGE_KEY = 'bananaStudio';

export function useProjectState() {
  const [projectState, setProjectState] = useState<ProjectState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        return ProjectStateSchema.parse(parsed);
      }
    } catch (error) {
      console.error('Failed to load project state:', error);
    }
    return ProjectStateSchema.parse({});
  });

  const saveToStorage = useCallback((state: ProjectState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save project state:', error);
    }
  }, []);

  const updateProject = useCallback((updates: Partial<ProjectState>) => {
    const newState = {
      ...projectState,
      ...updates,
      updatedAt: new Date(),
    };
    setProjectState(newState);
    saveToStorage(newState);
  }, [projectState, saveToStorage]);

  const addCharacter = useCallback((character: ProjectState['cast'][0]) => {
    updateProject({
      cast: [...projectState.cast, character],
    });
  }, [projectState.cast, updateProject]);

  const removeCharacter = useCallback((characterId: string) => {
    updateProject({
      cast: projectState.cast.filter(c => c.id !== characterId),
    });
  }, [projectState.cast, updateProject]);

  const addAsset = useCallback((assetUrl: string) => {
    updateProject({
      assets: [...projectState.assets, assetUrl],
    });
  }, [projectState.assets, updateProject]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveToStorage(projectState);
    }, 30000);

    return () => clearInterval(interval);
  }, [projectState, saveToStorage]);

  // Save on keyboard shortcut (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveToStorage(projectState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectState, saveToStorage]);

  return {
    projectState,
    updateProject,
    addCharacter,
    removeCharacter,
    addAsset,
    saveProject: () => saveToStorage(projectState),
  };
}