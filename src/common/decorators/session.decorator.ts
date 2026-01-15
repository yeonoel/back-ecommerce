import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionHelper } from '../helpers/session.helper';

/**
 * Extraire le session_id depuis les cookies
 * Génère un nouveau session_id si absent
 */
export const SessionId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    console.log('Cookies:', request.cookies);
    console.log('SessiI',request);
    const response = ctx.switchToHttp().getResponse();
    let sessionId = SessionHelper.getSessionIdFromCookies(request.cookies);
    console.log('SessionId:', sessionId);
    if (!sessionId || !SessionHelper.isValidSessionId(sessionId)) {
      sessionId = SessionHelper.generateSessionId();
      // Stocker dans un cookie (30 jours)
      response.cookie('cart_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    return sessionId;
  },
);