import { useState, useCallback } from 'react';

export interface MinimalAppState {
  user: {
    id: string;
    email: string;
    plan: string;
  } | null;
  upload: {
    status: 'idle' | 'uploading' | 'complete' | 'error';
    progress: number;
    file: File | null;
    error: string | null;
  };
  currentProject: {
    id: string;
    name: string;
    type: 'nano' | 'ad';
  } | null;
}

const initialState: MinimalAppState = {
  user: null,
  upload: {
    status: 'idle',
    progress: 0,
    file: null,
    error: null,
  },
  currentProject: null,
};

export function useMinimalAppState() {
  const [state, setState] = useState<MinimalAppState>(initialState);

  const setUser = useCallback((user: MinimalAppState['user']) => {
    setState(prev => ({ ...prev, user }));
  }, []);

  const setUploadStatus = useCallback((status: MinimalAppState['upload']['status']) => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, status }
    }));
  }, []);

  const setUploadProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, progress }
    }));
  }, []);

  const setUploadFile = useCallback((file: File | null) => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, file }
    }));
  }, []);

  const setUploadError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, error }
    }));
  }, []);

  const setCurrentProject = useCallback((project: MinimalAppState['currentProject']) => {
    setState(prev => ({ ...prev, currentProject: project }));
  }, []);

  const resetUpload = useCallback(() => {
    setState(prev => ({
      ...prev,
      upload: initialState.upload
    }));
  }, []);

  return {
    state,
    actions: {
      setUser,
      setUploadStatus,
      setUploadProgress,
      setUploadFile,
      setUploadError,
      setCurrentProject,
      resetUpload,
    }
  };
}