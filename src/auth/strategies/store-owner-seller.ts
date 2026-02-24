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
                throw new ForbiddenException('Store slug is required in route params');
            }

            if (user.storeSlug !== storeSlugFromRoute) {
                throw new ForbiddenException('You can only access your own store dashboard');
            }

            return true;
        }

        throw new ForbiddenException('Access denied');
    }
}