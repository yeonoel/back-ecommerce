import { v4 as uuidv4 } from 'uuid';

export class SessionHelper {
  /**
   * Générer un session ID unique
   */
  static generateSessionId(): string {
    return `guest_${uuidv4()}`;
  }

  /**
   * Extraire le session ID depuis les cookies
   */
  static getSessionIdFromCookies(cookies: any): string | null {
    return cookies?.cart_session_id || null;
  }

  /**
   * Valider le format du session ID
   */
  static isValidSessionId(sessionId: string): boolean {
    return sessionId?.startsWith('guest_') && sessionId.length > 10;
  }
}