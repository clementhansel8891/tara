import { Global, Module } from '@nestjs/common';
import { I18nService } from './i18n.service';

/**
 * I18nModule
 * Global module providing internationalization support across the TARA system.
 * Marked as @Global so all modules can inject I18nService without importing this module.
 *
 * Implements Requirements:
 * - 16.1: Indonesian (Bahasa Indonesia) as primary language
 * - 16.2: English as secondary language
 * - 16.4: Translate agent-generated messages per employee language preference
 * - 16.5: Consistent terminology across agents per language
 */
@Global()
@Module({
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}
