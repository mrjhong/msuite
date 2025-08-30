// frontend/src/hooks/useSetup.js
import { useState, useEffect } from 'react';
import { apiCheckSetupStatus } from '../services/setupApiService';

export const useSetup = () => {
  const [setupState, setSetupState] = useState({
    loading: true,
    setupRequired: false,
    userCount: 0,
    error: null
  });

  const checkSetupStatus = async () => {
    try {
      setSetupState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await apiCheckSetupStatus();
      
      setSetupState({
        loading: false,
        setupRequired: result.setupRequired || false,
        userCount: result.userCount || 0,
        error: result.error || null
      });
    } catch (error) {
      console.error('Error checking setup status:', error);
      setSetupState({
        loading: false,
        setupRequired: true, // Asumir que necesita setup en caso de error
        userCount: 0,
        error: error.message
      });
    }
  };

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const refreshSetupStatus = () => {
    checkSetupStatus();
  };

  return {
    ...setupState,
    refreshSetupStatus
  };
};