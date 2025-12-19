import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import {catchError, timeout, tap, map} from 'rxjs/operators';
import { Router } from '@angular/router';

interface LoginPayload {
    email: string;
    password: string;
}

export interface User {
    id: number;
    email: string;
    phoneNumber?: string;
    fullName: string;
    role: 'RECRUITER' | 'JOB_SEEKER' | 'ADMIN';
    isFirstLogin?: boolean;
    active: boolean;
    profilePictureUrl?: string;
    createdAt: string;
    updatedAt: string;
    companyName?: string;
    companyWebsite?: string;
    companyLogoUrl?: string;
    companyDescription?: string;
    companySize?: string;
    industry?: string;
    companyAddress?: string;
    companyCity?: string;
    companyCountry?: string;
    position?: string;
    department?: string;
    verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
    businessRegistrationNumber?: string;
    verificationDocumentUrl?: string;
    jobsPosted?: number;
    activeJobs?: number;
    totalHires?: number;
    rating?: number;
    reviewsCount?: number;
    isPremium?: boolean;
    isVerifiedEmployer?: boolean;

    // Pour les job seekers
    currentTitle?: string;
    city?: string;
    skills?: string;
    yearsOfExperience?: number;

}

interface LoginResponse {
    token: string;
    type: string;
    id: number;
    email: string;
    fullName: string;
    role: string;
    isFirstLogin: boolean;
    message?: string;
    success?: boolean;
}

interface AuthResponse {
    token: string;
    user: User;
    message?: string;
}



@Injectable({
    providedIn: 'root'
})
export class ApisAuthService {

    private readonly apiUrl = environment.apiUrl;
    private readonly apiTimeout = 10000;
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'user_data';

    private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    // --- Gestion du Token ---

    getToken(): string | null {
        try {
            const token = localStorage.getItem(this.TOKEN_KEY);

            // Valider le token (format basique)
            if (token && token.trim().length > 0) {
                // Optionnel: vérifier le format JWT
                const parts = token.split('.');
                if (parts.length !== 3) {
                    console.warn('Format de token JWT invalide');
                    // Nettoyer le token invalide
                    this.removeToken();
                    return null;
                }
                return token;
            }
            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération du token:', error);
            return null;
        }
    }

    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    removeToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    // --- Gestion de l'utilisateur ---
    setUser(user: User): void {
        try {
            // Validation rigoureuse
            if (!user || typeof user !== 'object') {
                throw new Error('Données utilisateur invalides: objet vide');
            }

            // Vérifier les propriétés minimales requises
            const requiredProps = ['id', 'email', 'fullName', 'role'];
            const missingProps = requiredProps.filter(prop => {
                const value = user[prop as keyof User];
                return value === undefined || value === null || value === '';
            });

            if (missingProps.length > 0) {
                console.error('Propriétés manquantes:', missingProps, 'dans:', user);
                throw new Error(`Données utilisateur incomplètes: ${missingProps.join(', ')}`);
            }

            // Ajouter des valeurs par défaut si nécessaire
            const safeUser: User = {
                ...user,
                active: user.active ?? true,
                verificationStatus: user.verificationStatus || 'PENDING',
                createdAt: user.createdAt || new Date().toISOString(),
                updatedAt: user.updatedAt || new Date().toISOString()
            };

            const userStr = JSON.stringify(safeUser);
            localStorage.setItem(this.USER_KEY, userStr);
            this.currentUserSubject.next(safeUser);

            // console.log('Utilisateur stocké avec succès:', safeUser.email);

        } catch (error) {
            console.error('Erreur lors du stockage des données utilisateur:', error);
            // Ne pas stocker de données corrompues
            this.removeUser();
            throw error;
        }
    }

    getStoredUser(): User | null {
        try {
            const userStr = localStorage.getItem(this.USER_KEY);
            if (!userStr) {
                return null;
            }

            // Valider que c'est du JSON valide
            const parsed = JSON.parse(userStr);

            // Vérifier que l'objet a les propriétés minimales
            if (!parsed || typeof parsed !== 'object') {
                this.removeUser(); // Nettoyer les données corrompues
                return null;
            }

            return parsed as User;
        } catch (error) {
            console.error('Erreur lors du parsing des données utilisateur:', error);
            // Nettoyer les données corrompues
            this.removeUser();
            return null;
        }
    }

    removeUser(): void {
        localStorage.removeItem(this.USER_KEY);
        this.currentUserSubject.next(null);
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    // --- Endpoints ADMIN ---

    getUsers(): Observable<any> {
        const url = `${this.apiUrl}/api/v1/admin/auth/users`;
        return this.http.get(url).pipe(
            timeout(this.apiTimeout),
            catchError(this.handleError)
        );
    }

    // PUT: Mettre à jour un utilisateur
    updateUser(id: number, user: User): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/${id}`, user);
    }

    // DELETE: Supprimer un utilisateur
    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // PATCH: Activer/Désactiver un utilisateur
    toggleUserStatus(id: number, isActive: boolean): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/${id}/toggle-status`, { isActive });
    }

// apis-auth.service.ts - méthode login corrigée
    login(payload: LoginPayload): Observable<AuthResponse> {
        const url = `${this.apiUrl}/api/v1/admin/auth/login`;

        return this.http.post<LoginResponse>(url, payload).pipe(
            timeout(this.apiTimeout),
            tap((apiResponse: LoginResponse) => {
                // console.log('Réponse API brute:', apiResponse);

                // Validation de la réponse
                if (!apiResponse || !apiResponse.token) {
                    throw new Error('Réponse de connexion invalide: token manquant');
                }

                // Extraire l'utilisateur de la réponse
                const user: User = this.extractUserFromResponse(apiResponse);

                if (!user || !user.email) {
                    throw new Error('Impossible d\'extraire les informations utilisateur');
                }

                // Stocker le token
                this.setToken(apiResponse.token);

                // Stocker l'utilisateur
                this.setUser(user);

                // Émettre un événement de connexion réussie
                this.emitAuthSuccess(user);
            }),
            // Mapper vers la réponse interne attendue
            map((apiResponse: LoginResponse): AuthResponse => {
                const user = this.extractUserFromResponse(apiResponse);
                return {
                    token: apiResponse.token,
                    user: user,
                    message: apiResponse.message
                };
            }),
            catchError((error: any) => {
                console.error('Erreur dans le pipe login:', error);
                return throwError(() => error);
            })
        );
    }

// Méthode pour extraire l'utilisateur de la réponse API
    private extractUserFromResponse(apiResponse: LoginResponse): User {
        return {
            id: apiResponse.id,
            email: apiResponse.email,
            fullName: apiResponse.fullName,
            role: apiResponse.role as 'RECRUITER' | 'JOB_SEEKER' | 'ADMIN',
            isFirstLogin: apiResponse.isFirstLogin,
            active: true, // Par défaut
            verificationStatus: 'VERIFIED', // Par défaut
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }


// Méthode corrigée avec validation
    private emitAuthSuccess(user: User): void {
        try {
            // Validation
            if (!user || !user.email) {
                console.error('Données utilisateur invalides dans emitAuthSuccess:', user);
                throw new Error('Données utilisateur invalides');
            }

            // console.log('Connexion réussie pour:', user.email);

            // Émettre un événement global
            document.dispatchEvent(new CustomEvent('auth:success', {
                detail: { user }
            }));

            // Notifier les observables
            this.currentUserSubject.next(user);

            // Vérifier si c'est la première connexion
            if (user.isFirstLogin) {
                // console.log('Première connexion détectée');
                // Vous pouvez rediriger vers une page de première connexion si besoin
            }

        } catch (error) {
            console.error('Erreur dans emitAuthSuccess:', error);
            // Nettoyer les données en cas d'erreur
            this.logout();
        }
    }
    // --- Logout ---

    logout(): void {
        // Optionnel: Appel API pour invalider le token côté serveur
        // this.http.post(`${this.apiUrl}/api/v1/admin/auth/logout`, {}).subscribe();

        // Nettoyer le stockage local
        this.removeToken();
        this.removeUser();

        // Rediriger vers la page de login
        this.router.navigate(['/auth/login']);
    }


    // Méthode pour obtenir l'URL complète d'un fichier
    getFullFileUrl(filePath: string | null | undefined): string {
        if (!filePath) {
            return this.getDefaultAvatarUrl();
        }

        // Vérifier si c'est déjà une URL complète
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }

        // Supprimer le slash initial s'il existe
        const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        return `${this.apiUrl}/${cleanPath}`;
    }

    // Méthode pour générer un avatar par défaut
    getDefaultAvatarUrl(name?: string): string {
        const initials = name
            ? name.split(' ')
                .map(n => n.charAt(0))
                .join('')
                .toUpperCase()
                .substring(0, 2)
            : 'U';

        // Utiliser un service d'avatar comme ui-avatars
        const colors = {
            RECRUITER: '2196F3', // Bleu
            CANDIDATE: '4CAF50', // Vert
            ADMIN: '9C27B0'      // Violet
        };

        const role = this.getCurrentUser()?.role || 'CANDIDATE';
        const color = colors[role as keyof typeof colors] || '607D8B';

        return `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=fff&size=128`;
    }

    // Getters publics
    getApiBaseUrl(): string {
        return this.apiUrl;
    }

    // --- Gestion des Erreurs ---

    private handleError(error: HttpErrorResponse): Observable<any> {
        let errorMessage = 'Une erreur inconnue est survenue!';

        // Vérifier le type d'erreur
        if (error.error instanceof ErrorEvent) {
            // Erreur côté client
            errorMessage = `Erreur: ${error.error.message}`;
        } else {
            // Erreur côté serveur
            const status = error.status;
            const statusText = error.statusText;

            // Gérer spécifiquement les erreurs courantes
            switch (status) {
                case 0:
                    errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
                    break;
                case 400:
                    errorMessage = 'Requête invalide. Veuillez vérifier vos informations.';
                    break;
                case 401:
                    errorMessage = 'Non autorisé. Vos identifiants sont incorrects ou votre session a expiré.';
                    // Déconnexion pour les erreurs 401
                    this.logout();
                    break;
                case 403:
                    errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
                    break;
                case 404:
                    errorMessage = 'Ressource non trouvée.';
                    break;
                case 422:
                    errorMessage = 'Données invalides. Veuillez vérifier les informations saisies.';
                    break;
                case 429:
                    errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
                    break;
                case 500:
                    errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
                    break;
                case 503:
                    errorMessage = 'Service temporairement indisponible. Veuillez réessayer plus tard.';
                    break;
                default:
                    // Essayer d'extraire le message d'erreur de différentes manières
                    if (error.error) {
                        // Si error.error existe et contient un message
                        if (typeof error.error === 'object' && error.error.message) {
                            errorMessage = error.error.message;
                        } else if (typeof error.error === 'string') {
                            errorMessage = error.error;
                        }
                    } else if (error.message) {
                        errorMessage = error.message;
                    } else {
                        errorMessage = `Erreur ${status}: ${statusText}`;
                    }
            }
        }

        console.error('Erreur lors de l\'appel API:', {
            message: errorMessage,
            error: error,
            url: error.url,
            status: error.status
        });

        // Retourner une erreur avec le message formaté
        return throwError(() => ({
            message: errorMessage,
            status: error.status,
            originalError: error
        }));
    }
}
