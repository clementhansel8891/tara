import { Injectable } from "@nestjs/common";

@Injectable()
export class EncryptionUtil {
  /**
   * Placeholder for AES-256-GCM encryption.
   * IN PRODUCTION: Use a real encryption library and a secure key from Vault/KMS.
   */
  static encrypt(text: string): string {
    // This is a dummy base64 "encryption" for now.
    // Replace with crypto.createCipheriv in production.
    return Buffer.from(text).toString('base64');
  }

  static decrypt(encryptedText: string): string {
    // This is a dummy base64 "decryption" for now.
    return Buffer.from(encryptedText, 'base64').toString('utf-8');
  }
}
