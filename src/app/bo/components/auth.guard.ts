import { Injectable } from '@angular/core';
import {
    Router,
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { ApisAuthService } from "../service/apis-auth.service";

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(
        private authService: ApisAuthService,
        private router: Router
    ) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        // console.log('AuthGuard: Vérification de l\'authentification pour', state.url);

        // Vérifier si l'utilisateur est authentifié
        if (this.authService.isAuthenticated()) {
            console.log('AuthGuard: Utilisateur authentifié, accès autorisé');
            return true;
        }

        console.log('AuthGuard: Utilisateur non authentifié, redirection vers login');

        // Rediriger vers la page de login avec l'URL de retour
        return this.router.createUrlTree(['/auth/login'], {
            queryParams: {
                returnUrl: state.url,
                reason: 'not_authenticated'
            }
        });
    }
}
