import { useTranslation } from 'react-i18next';
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const translationCache = new Map<string, string>();

/**
 * Hook for automatic translation of dynamic content.
 * Uses IKNov AI via edge function for real-time translation.
 * Caches results to avoid repeated API calls.
 */
export const useAutoTranslate = () => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language || 'fr';
  const pendingRef = useRef<Map<string, Promise<string>>>(new Map());

  /**
   * Translate dynamic text using AI backend.
   */
  const translateText = useCallback(async (text: string, targetLang?: string): Promise<string> => {
    const lang = targetLang || currentLang;
    if (lang === 'fr') return text; // French is the source language
    if (!text || text.trim().length < 3) return text;

    const cacheKey = `${lang}:${text.slice(0, 100)}`;
    
    // Check cache
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // Deduplicate in-flight requests
    if (pendingRef.current.has(cacheKey)) {
      return pendingRef.current.get(cacheKey)!;
    }

    const promise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('translate-content', {
          body: { text, targetLang: lang },
        });

        if (error || !data?.translatedText) {
          console.warn('Translation failed, returning original:', error);
          return text;
        }

        const result = data.translatedText;
        translationCache.set(cacheKey, result);
        return result;
      } catch (err) {
        console.warn('Translation error:', err);
        return text;
      } finally {
        pendingRef.current.delete(cacheKey);
      }
    })();

    pendingRef.current.set(cacheKey, promise);
    return promise;
  }, [currentLang]);

  /**
   * Get the appropriate content field based on current language.
   */
  const getLocalizedContent = useCallback((content: Record<string, string> | string): string => {
    if (typeof content === 'string') return content;
    return content[currentLang] || content['fr'] || Object.values(content)[0] || '';
  }, [currentLang]);

  /**
   * Format date according to current locale
   */
  const formatDate = useCallback((date: string | Date): string => {
    const d = new Date(date);
    const localeMap: Record<string, string> = {
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES',
    };
    return d.toLocaleDateString(localeMap[currentLang] || 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [currentLang]);

  return {
    currentLang,
    translateText,
    getLocalizedContent,
    formatDate,
    t,
    needsTranslation: currentLang !== 'fr',
  };
};
