import { Injectable } from '@angular/core';
import {
    Router,
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import {ApisAuthService} from "../service/apis-auth.service";

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {

    constructor(
        private authService: ApisAuthService,
        private router: Router
    ) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        // 1. Vérifier l'authentification
        if (!this.authService.isAuthenticated()) {
            return this.router.createUrlTree(['/auth/login'], {
                queryParams: { returnUrl: state.url }
            });
        }

        // 2. Vérifier les rôles requis
        const currentUser = this.authService.getCurrentUser();
        const requiredRoles = route.data['roles'] as Array<string>;

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        if (!currentUser || !requiredRoles.includes(currentUser.role)) {
            // Rediriger vers une page d'accès non autorisé
            return this.router.createUrlTree(['/access-denied']);
        }

        return true;
    }
}
