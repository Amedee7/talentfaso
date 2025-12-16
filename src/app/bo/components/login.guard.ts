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
export class LoginGuard implements CanActivate {

    constructor(
        private authService: ApisAuthService,
        private router: Router
    ) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        // Si l'utilisateur est déjà authentifié, rediriger vers le dashboard
        if (this.authService.isAuthenticated()) {
            const returnUrl = route.queryParams['returnUrl'];
            return this.router.createUrlTree([returnUrl || '/dashboard']);
        }

        // Si non authentifié, autoriser l'accès au login
        return true;
    }
}
