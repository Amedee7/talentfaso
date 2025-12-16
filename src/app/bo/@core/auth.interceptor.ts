import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApisAuthService } from "../service/apis-auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private authService: ApisAuthService,
        private router: Router
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.authService.getToken();

        // Cloner la requête et ajouter le token
        if (token) {
            request = this.addToken(request, token);
        }

        // Gérer la réponse
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Ne pas intercepter les erreurs des endpoints d'authentification
                if (request.url.includes('/auth/')) {
                    return throwError(() => error);
                }

                // Gérer les erreurs 401 (non autorisé)
                if (error.status === 401) {
                    console.log('Interceptor: Erreur 401 détectée, déconnexion...');

                    // Déconnecter l'utilisateur
                    this.authService.logout();

                    // Rediriger vers le login avec l'URL actuelle
                    const currentUrl = this.router.routerState.snapshot.url;

                    // Éviter de rediriger vers le login si on y est déjà
                    if (!currentUrl.includes('/auth/login')) {
                        this.router.navigate(['/auth/login'], {
                            queryParams: {
                                returnUrl: currentUrl,
                                sessionExpired: true
                            },
                            replaceUrl: true
                        });
                    }
                }

                // Gérer les erreurs 403 (accès refusé)
                if (error.status === 403) {
                    console.log('Interceptor: Erreur 403 détectée, accès refusé');

                    // Rediriger vers la page d'accès refusé
                    this.router.navigate(['/access-denied'], {
                        queryParams: {
                            returnUrl: this.router.routerState.snapshot.url
                        }
                    });
                }

                return throwError(() => error);
            })
        );
    }

    private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }
}
