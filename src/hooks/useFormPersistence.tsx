import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_PREFIX = "legalform_draft_";

export function useFormPersistence<T>(formKey: string, initialData: T) {
  const [data, setData] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + formKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...initialData, ...parsed.data };
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
    return initialData;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save on data change
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(
          STORAGE_KEY_PREFIX + formKey,
          JSON.stringify({
            data,
            savedAt: new Date().toISOString(),
          })
        );
        setLastSaved(new Date());
      } catch (error) {
        console.error("Error saving draft:", error);
      }
    };

    // Debounce save
    const timeout = setTimeout(save, 500);
    return () => clearTimeout(timeout);
  }, [data, formKey]);

  const updateData = useCallback((updates: Partial<T>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_PREFIX + formKey);
    setData(initialData);
  }, [formKey, initialData]);

  const hasDraft = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + formKey) !== null;
  }, [formKey]);

  const getLastStep = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + formKey + "_step");
      return stored ? parseInt(stored, 10) : 1;
    } catch {
      return 1;
    }
  }, [formKey]);

  const saveStep = useCallback((step: number) => {
    localStorage.setItem(STORAGE_KEY_PREFIX + formKey + "_step", String(step));
  }, [formKey]);

  return {
    data,
    setData,
    updateData,
    clearDraft,
    hasDraft,
    lastSaved,
    getLastStep,
    saveStep,
  };
}
