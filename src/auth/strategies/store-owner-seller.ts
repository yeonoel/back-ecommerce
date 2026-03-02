import { Injectable, CanActivate, ExecutionContext, ForbiddenException, } from '@nestjs/common';
import { UserRole } from 'src/users/enum/userRole.enum';
/**
 * Guard à utiliser sur les routes du dashboard vendeur.
 * Vérifie que le seller connecté accède bien à SA boutique
 * en comparant le storeSlug du JWT avec le param de la route.
 *
 * Exemple d'utilisation :
 * @Get('dashboard/:storeSlug/orders')
 * @UseGuards(AuthGuard('jwt'), StoreOwnerGuard)
 */
@Injectable()
export class StoreOwnerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Le super admin peut tout voir
        if (user.role === UserRole.SUPER_ADMIN) return true;

        // Un seller ne peut accéder qu'à sa propre boutique
        if (user.role === UserRole.SELLER) {
            const storeSlugFromRoute = request.params.storeSlug;

            if (!storeSlugFromRoute) {
                throw new ForbiddenException('Le slug de la boutique est requis');
            }

            if (user.storeSlug !== storeSlugFromRoute) {
                throw new ForbiddenException('Vous n\'avez pas accès à cette boutique');
            }

            return true;
        }

        throw new ForbiddenException('Access refused');
    }
}