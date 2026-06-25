import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/i18n.service';

/**
 * DTO for updating an employee's language preference.
 *
 * Task 29.3: Implement language preference settings
 * Requirement 16.6: Allow Employees to change their language preference in profile settings
 */
export class UpdateLanguagePreferenceDto {
  /**
   * The desired language code. Must be one of the supported languages ('id' or 'en').
   */
  @IsString()
  @IsNotEmpty({ message: 'language is required' })
  @IsIn(SUPPORTED_LANGUAGES, {
    message: `language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
  })
  language: SupportedLanguage;
}
