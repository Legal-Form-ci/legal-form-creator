import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    openKkiapayWidget: (config: KkiapayConfig) => void;
    addKkiapayListener: (event: string, callback: (data: any) => void) => void;
    removeKkiapayListener: (event: string, callback: (data: any) => void) => void;
    addSuccessListener: (callback: (data: KkiapaySuccessResponse) => void) => void;
    addWidgetInitListener: (callback: () => void) => void;
    addKkiapayFailedListener: (callback: (data: any) => void) => void;
    addKkiapayCloseListener: (callback: () => void) => void;
    addFailedListener: (callback: (data: any) => void) => void;
  }
}

export interface KkiapayConfig {
  amount: number;
  key: string;
  sandbox?: boolean;
  callback?: string;
  theme?: string;
  name?: string;
  email?: string;
  phone?: string;
  partnerId?: string;
  paymentmethod?: 'momo' | 'card';
  data?: Record<string, any>;
  reason?: string;
}

export interface KkiapaySuccessResponse {
  transactionId: string;
  amount?: number;
  phone?: string;
}

interface UseKkiapayOptions {
  onSuccess?: (response: KkiapaySuccessResponse) => void;
  onFailed?: (error: any) => void;
  onClose?: () => void;
}

export const useKkiapay = (options: UseKkiapayOptions = {}) => {
  const { onSuccess, onFailed, onClose } = options;
  const [isReady, setIsReady] = useState(false);
  const listenersAttached = useRef(false);
  const callbacksRef = useRef({ onSuccess, onFailed, onClose });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onSuccess, onFailed, onClose };
  }, [onSuccess, onFailed, onClose]);

  // Load KkiaPay script
  useEffect(() => {
    const existingScript = document.querySelector('script[src="https://cdn.kkiapay.me/k.js"]');
    
    if (existingScript) {
      // Script already exists, check if SDK is ready
      const checkReady = () => {
        if (typeof window.openKkiapayWidget === 'function') {
          setIsReady(true);
        }
      };
      checkReady();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.kkiapay.me/k.js';
    script.async = true;
    
    script.onload = () => {
      console.log('KkiaPay SDK loaded successfully');
      // Wait a bit for the SDK to fully initialize
      setTimeout(() => {
        if (typeof window.openKkiapayWidget === 'function') {
          setIsReady(true);
        }
      }, 500);
    };
    
    script.onerror = () => {
      console.error('Failed to load KkiaPay SDK');
    };
    
    document.body.appendChild(script);
  }, []);

  // Attach event listeners once SDK is ready
  useEffect(() => {
    if (!isReady || listenersAttached.current) return;

    const handleSuccess = (response: KkiapaySuccessResponse) => {
      console.log('KkiaPay payment success:', response);
      callbacksRef.current.onSuccess?.(response);
    };

    const handleFailed = (error: any) => {
      console.error('KkiaPay payment failed:', error);
      callbacksRef.current.onFailed?.(error);
    };

    const handleClose = () => {
      console.log('KkiaPay widget closed');
      callbacksRef.current.onClose?.();
    };

    try {
      if (typeof window.addSuccessListener === 'function') {
        window.addSuccessListener(handleSuccess);
        listenersAttached.current = true;
        console.log('KkiaPay success listener attached');
      }
      if (typeof window.addFailedListener === 'function') {
        window.addFailedListener(handleFailed);
      } else if (typeof window.addKkiapayFailedListener === 'function') {
        window.addKkiapayFailedListener(handleFailed);
      }
      if (typeof window.addKkiapayCloseListener === 'function') {
        window.addKkiapayCloseListener(handleClose);
      }
    } catch (error) {
      console.error('Error attaching KkiaPay listeners:', error);
    }
  }, [isReady]);

  const openPayment = useCallback((config: Omit<KkiapayConfig, 'key'>) => {
    // Public API key from KKIAPAY dashboard - Legal Form production key
    const kkiapayPublicKey = 'pk_3b175a70f8a3856ad670ecdd7a3f81b6ffc8b7ff439fbe3268b0a50f996bb6bd';
    
    if (typeof window.openKkiapayWidget !== 'function') {
      console.error('KkiaPay SDK not loaded yet');
      return false;
    }

    const fullConfig: KkiapayConfig = {
      ...config,
      key: kkiapayPublicKey,
      sandbox: false, // Production mode for real payments
      theme: '#007c7a', // Brand color
      reason: config.reason || `Paiement Legal Form`,
    };

    console.log('Opening KkiaPay widget with config:', fullConfig);
    
    try {
      window.openKkiapayWidget(fullConfig);
      return true;
    } catch (error) {
      console.error('Error opening KkiaPay widget:', error);
      return false;
    }
  }, []);

  return {
    openPayment,
    isReady,
  };
};

export default useKkiapay;
