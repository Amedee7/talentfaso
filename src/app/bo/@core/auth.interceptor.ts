import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import {ApisAuthService} from "../service/apis-auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    private isRefreshing = false;
    private refreshTokenSubject = new BehaviorSubject<any>(null);

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
                // Gérer les erreurs 401 (non autorisé)
                if (error.status === 401) {
                    // Tentative de rafraîchissement du token (si implémenté)
                    // return this.handle401Error(request, next);

                    // Sinon, déconnecter l'utilisateur
                    this.authService.logout();
                    this.router.navigate(['/auth/login'], {
                        queryParams: {
                            returnUrl: this.router.routerState.snapshot.url,
                            sessionExpired: true
                        }
                    });
                }

                // Gérer les erreurs 403 (accès refusé)
                if (error.status === 403) {
                    this.router.navigate(['/access-denied']);
                }

                return throwError(() => error);
            })
        );
    }

    private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        });
    }

    // Méthode optionnelle pour rafraîchir le token
    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            // Appeler votre API de rafraîchissement de token si disponible
            // return this.authService.refreshToken().pipe(
            //   switchMap((token: any) => {
            //     this.isRefreshing = false;
            //     this.refreshTokenSubject.next(token.access_token);
            //     return next.handle(this.addToken(request, token.access_token));
            //   }),
            //   catchError((err) => {
            //     this.isRefreshing = false;
            //     this.authService.logout();
            //     return throwError(() => err);
            //   })
            // );
        }

        return this.refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => next.handle(this.addToken(request, token)))
        );
    }
}
