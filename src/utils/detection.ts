import type { ProviderType } from '../types';
import { PROVIDERS_DETECT_ORDER } from '../../shared/providers';

export function detectProvider(key: string): ProviderType | null {
  for (const provider of PROVIDERS_DETECT_ORDER) {
    if (provider.detectPattern && provider.detectPattern.test(key)) {
      return provider.id;
    }
  }
  return null;
}

export function getKeyPrefix(key: string, length: number = 6): string {
  return key.substring(0, length) + '...';
}
