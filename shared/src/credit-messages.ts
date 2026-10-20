/** Credit status descriptors let each UI choose its display language. */
export const creditMessages = {
  creditChecking: 'Checking...',
  creditKeyRequired: 'Key required',
  creditSetupKey: 'Set up an AI API key in Chrome Settings.',
  creditConnected: 'Connected [{type}]',
  creditLocalStatus: 'Local LLM ({status})',
  creditLocalOffline: 'Offline — ensure local runner is running',
  creditNoKey: 'No API key configured',
  creditBalanceLeft: '{balance} left ({used} used / {total} total)',
  creditInvalidKey: 'Invalid API key',
  creditAuthFailed: 'Authentication failed',
  creditActive: '{provider} (Active)',
  creditNetworkError: '{provider} (Network error)',
  creditAvailable: '{balance} available',
  creditDirect: '{provider} (Pay-as-you-go / Direct)',
};
export type CreditMessageKey = keyof typeof creditMessages;
export type CreditMessageParams = Record<string, string | number>;
export function creditMessage(key: CreditMessageKey, params: CreditMessageParams = {}) {
  return {
    statusKey: key,
    statusParams: params,
    statusText: creditMessages[key].replace(/\{(\w+)\}/g, (match, name) => String(params[name] ?? match)),
  };
}
