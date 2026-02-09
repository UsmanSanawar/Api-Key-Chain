import { useState } from 'react';
import { detectProvider } from '../utils/detection';
import type { ProviderType } from '../types';

export function useKeyInput() {
  const [apiKey, setApiKey] = useState('');
  const [detectedProvider, setDetectedProvider] = useState<ProviderType | null>(null);

  const handleKeyChange = (value: string) => {
    setApiKey(value);
    const provider = detectProvider(value);
    setDetectedProvider(provider);
  };

  const reset = () => {
    setApiKey('');
    setDetectedProvider(null);
  };

  return {
    apiKey,
    detectedProvider,
    handleKeyChange,
    reset,
  };
}
