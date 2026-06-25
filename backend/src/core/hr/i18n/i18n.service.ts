import { Injectable } from '@nestjs/common';
import * as idTranslations from './id.json';
import * as enTranslations from './en.json';

/**
 * Supported language codes for the TARA system.
 * - 'id': Indonesian (Bahasa Indonesia) - primary language
 * - 'en': English - secondary language
 */
export type SupportedLanguage = 'id' | 'en';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['id', 'en'];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'id';

type TranslationData = Record<string, any>;

/**
 * I18nService
 * Provides internationalization/localization support for TARA HR System.
 * Translates agent-generated messages (notifications, reports) based on
 * the employee's language_preference field.
 *
 * Implements Requirements:
 * - 16.1: Support Indonesian (Bahasa Indonesia) as the primary UI language
 * - 16.2: Support English as an optional secondary language
 * - 16.7: Store language preference per Employee account
 */
@Injectable()
export class I18nService {
  private readonly translations: Record<SupportedLanguage, TranslationData>;

  constructor() {
    this.translations = {
      id: idTranslations as TranslationData,
      en: enTranslations as TranslationData,
    };
  }

  /**
   * Translate a key with optional interpolation parameters.
   *
   * @param key - Dot-notation key, e.g. 'attendance.clock_in_confirmation'
   * @param lang - Language code ('id' or 'en'). Defaults to 'id'.
   * @param params - Key-value pairs for template interpolation, e.g. { employeeName: 'John' }
   * @returns The translated string with interpolated values, or the key itself if not found.
   */
  translate(key: string, lang?: string | null, params?: Record<string, string | number>): string {
    const language = this.resolveLanguage(lang);
    const translationData = this.translations[language];
    const value = this.getNestedValue(translationData, key);

    if (value === undefined || value === null || typeof value !== 'string') {
      // Fallback: try the default language if different
      if (language !== DEFAULT_LANGUAGE) {
        const fallbackValue = this.getNestedValue(this.translations[DEFAULT_LANGUAGE], key);
        if (fallbackValue && typeof fallbackValue === 'string') {
          return this.interpolate(fallbackValue, params);
        }
      }
      // Return the key itself as last resort
      return key;
    }

    return this.interpolate(value, params);
  }

  /**
   * Shorthand alias for translate().
   */
  t(key: string, lang?: string | null, params?: Record<string, string | number>): string {
    return this.translate(key, lang, params);
  }

  /**
   * Check if a given language code is supported.
   */
  isSupported(lang: string | null | undefined): boolean {
    return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
  }

  /**
   * Get all supported languages.
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...SUPPORTED_LANGUAGES];
  }

  /**
   * Get all translation keys for a given language (useful for validation/debugging).
   */
  getTranslationKeys(lang?: string | null): string[] {
    const language = this.resolveLanguage(lang);
    return this.flattenKeys(this.translations[language]);
  }

  /**
   * Resolve a language string to a valid SupportedLanguage.
   * Falls back to DEFAULT_LANGUAGE ('id') for invalid or missing values.
   */
  private resolveLanguage(lang: string | null | undefined): SupportedLanguage {
    if (lang && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
      return lang as SupportedLanguage;
    }
    return DEFAULT_LANGUAGE;
  }

  /**
   * Retrieve a nested value from a translation object using dot notation.
   * e.g. getNestedValue(obj, 'attendance.clock_in_confirmation')
   */
  private getNestedValue(obj: TranslationData, key: string): any {
    const parts = key.split('.');
    let current: any = obj;

    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Interpolate template variables in a string.
   * Replaces {{variableName}} with the corresponding value from params.
   */
  private interpolate(template: string, params?: Record<string, string | number>): string {
    if (!params) {
      return template;
    }

    return template.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      const value = params[paramKey];
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  /**
   * Flatten a nested object into dot-notation keys.
   */
  private flattenKeys(obj: TranslationData, prefix = ''): string[] {
    const keys: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.flattenKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }

    return keys;
  }
}
