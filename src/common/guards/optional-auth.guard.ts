import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard qui permet l'accès aux invités ET aux connectés
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Si pas de token ou token invalide, continuer quand même (invité)
    // Ne pas throw d'erreur comme le fait JwtAuthGuard
    return user || null;
  }
}