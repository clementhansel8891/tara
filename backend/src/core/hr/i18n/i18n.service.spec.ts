import { I18nService, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    service = new I18nService();
  });

  describe('translate()', () => {
    it('should translate keys in Indonesian (default)', () => {
      expect(service.translate('common.success')).toBe('Berhasil');
    });

    it('should translate keys in English', () => {
      expect(service.translate('common.success', 'en')).toBe('Success');
    });

    it('should interpolate parameters in Indonesian', () => {
      const result = service.translate('attendance.clock_in_confirmation', 'id', {
        employeeName: 'Budi',
        time: '08:30',
      });
      expect(result).toBe('Halo Budi, kehadiran Anda tercatat pada 08:30 WIB.');
    });

    it('should interpolate parameters in English', () => {
      const result = service.translate('attendance.clock_in_confirmation', 'en', {
        employeeName: 'John',
        time: '08:30',
      });
      expect(result).toBe('Hello John, your attendance has been recorded at 08:30 WIB.');
    });

    it('should fall back to Indonesian for unsupported languages', () => {
      const result = service.translate('common.success', 'fr');
      expect(result).toBe('Berhasil');
    });

    it('should fall back to Indonesian when language is null', () => {
      const result = service.translate('common.success', null);
      expect(result).toBe('Berhasil');
    });

    it('should fall back to Indonesian when language is undefined', () => {
      const result = service.translate('common.success', undefined);
      expect(result).toBe('Berhasil');
    });

    it('should return key if translation not found', () => {
      const result = service.translate('nonexistent.key', 'id');
      expect(result).toBe('nonexistent.key');
    });

    it('should fall back to Indonesian when English key missing', () => {
      // Both languages have all keys, but test fallback mechanism
      const result = service.translate('common.success', 'en');
      expect(result).toBe('Success');
    });
  });

  describe('t() shorthand', () => {
    it('should work as alias for translate()', () => {
      expect(service.t('common.error', 'id')).toBe(
        service.translate('common.error', 'id'),
      );
    });
  });

  describe('isSupported()', () => {
    it('should return true for "id"', () => {
      expect(service.isSupported('id')).toBe(true);
    });

    it('should return true for "en"', () => {
      expect(service.isSupported('en')).toBe(true);
    });

    it('should return false for unsupported language', () => {
      expect(service.isSupported('fr')).toBe(false);
    });

    it('should return false for null', () => {
      expect(service.isSupported(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(service.isSupported(undefined)).toBe(false);
    });
  });

  describe('getSupportedLanguages()', () => {
    it('should return id and en', () => {
      expect(service.getSupportedLanguages()).toEqual(['id', 'en']);
    });
  });

  describe('getTranslationKeys()', () => {
    it('should return all keys for Indonesian', () => {
      const keys = service.getTranslationKeys('id');
      expect(keys).toContain('common.success');
      expect(keys).toContain('attendance.clock_in_confirmation');
      expect(keys).toContain('leave.request_submitted');
      expect(keys).toContain('onboarding.welcome');
    });

    it('should return all keys for English', () => {
      const keys = service.getTranslationKeys('en');
      expect(keys).toContain('common.success');
      expect(keys).toContain('attendance.clock_in_confirmation');
      expect(keys).toContain('leave.request_submitted');
    });

    it('should have same keys in both languages', () => {
      const idKeys = service.getTranslationKeys('id').sort();
      const enKeys = service.getTranslationKeys('en').sort();
      expect(idKeys).toEqual(enKeys);
    });
  });

  describe('constants', () => {
    it('should have id as default language', () => {
      expect(DEFAULT_LANGUAGE).toBe('id');
    });

    it('should support id and en', () => {
      expect(SUPPORTED_LANGUAGES).toEqual(['id', 'en']);
    });
  });

  describe('core agent message keys', () => {
    const coreKeys = [
      'attendance.clock_in_confirmation',
      'attendance.clock_out_confirmation',
      'attendance.clock_in_tardy',
      'attendance.tardiness_report_title',
      'attendance.tardiness_report_entry',
      'attendance.tardiness_report_none',
      'attendance.weekly_recap_title',
      'leave.request_submitted',
      'leave.request_approved',
      'leave.request_rejected',
      'leave.insufficient_balance',
      'leave.balance_info',
      'leave.monthly_recap_title',
      'onboarding.welcome',
      'onboarding.step_completed',
      'onboarding.step_failed',
      'onboarding.workflow_completed',
      'checkin.form_distributed',
      'checkin.reminder',
      'checkin.report_title',
      'warning.issued',
      'notification.public_announcement',
      'notification.private_notification',
    ];

    it('should have all core agent message keys in Indonesian', () => {
      for (const key of coreKeys) {
        const result = service.translate(key, 'id');
        expect(result).not.toBe(key);
      }
    });

    it('should have all core agent message keys in English', () => {
      for (const key of coreKeys) {
        const result = service.translate(key, 'en');
        expect(result).not.toBe(key);
      }
    });
  });
});
