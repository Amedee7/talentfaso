import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, map, timeout} from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
    id?: number;
    email: string;
    phoneNumber?: string;
    fullName: string;
    accountType: 'RECRUITER' | 'JOB_SEEKER' | 'ADMIN';
    role: 'RECRUITER' | 'JOB_SEEKER' | 'ADMIN';
    active?: boolean;
    profilePictureUrl?: string;
    fcmToken?: string;
    createdAt?: string;
    updatedAt?: string;
    verificationStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED';

    // Champs pour les recruteurs
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
    businessRegistrationNumber?: string;
    verificationDocumentUrl?: string;
    jobsPosted?: number;
    activeJobs?: number;
    totalHires?: number;
    rating?: number;
    reviewsCount?: number;
    isPremium?: boolean;
    isVerifiedEmployer?: boolean;

    // Champs pour les candidats
    dateOfBirth?: string;
    address?: string;
    city?: string;
    country?: string;
    currentTitle?: string;
    yearsOfExperience?: number;
    educationLevel?: string;
    skills?: string;
    bio?: string;
    resumeUrl?: string;
    portfolioUrl?: string;
    certificationUrls?: string[];
    preferredJobTypes?: string;
    preferredLocations?: string;
    expectedSalaryMin?: number;
    expectedSalaryMax?: number;
    availableImmediately?: boolean;
    noticePeriodDays?: number;
    applicationsCount?: number;
    interviewsCount?: number;
    profileVisible?: boolean;
    openToOpportunities?: boolean;
    preferredSkillTypes?: any[];
    remoteWorkAllowed?: boolean;
    preferredIndustries?: string;
    minExperienceRequired?: number;
    minEducationLevel?: string;
    searchRadiusKm?: number;
    hasCompletedSearchCriteria?: boolean;
}

interface RegisterPayload {
    accountType: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface ProfileCompleteness {
    completenessPercentage: number;
    missingFields: string[];
    completedFields: string[];
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private readonly apiUrl = environment.apiUrl;
    private readonly apiUrl2 = `${this.apiUrl}/api/v1/admin/auth/users`;

    private readonly apiTimeout = 10000;


    constructor(private http: HttpClient) {}

    // GET: Récupérer tous les utilisateurs
    getUsers(
        role?: 'RECRUITER' | 'JOB_SEEKER' | 'ADMIN',
        page: number = 0,
        size: number = 10,
        sort: string[] = ['fullName,asc']
    ): Observable<PaginatedResponse<User>> {

        let url = this.apiUrl2;

        // Déterminer l'URL selon le rôle
        if (role === 'RECRUITER') {
            url = `${this.apiUrl2}/recruiters`;
        } else if (role === 'JOB_SEEKER') {
            url = `${this.apiUrl2}/job-seekers`;
        }

        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        // Gérer les paramètres de tri
        sort.forEach(sortParam => {
            params = params.append('sort', sortParam);
        });

        // L'API retourne directement un tableau d'utilisateurs
        return this.http.get<User[]>(url, { params }).pipe(
            map(users => this.createPaginatedResponse(users, page, size))
        );
    }

    // Méthodes d'aide pour compatibilité
    getAllUsers(
        page: number = 0,
        size: number = 10,
        sort: string[] = ['fullName,asc']
    ): Observable<PaginatedResponse<User>> {
        return this.getUsers(undefined, page, size, sort);
    }

    // GET: Récupérer tous les recruteurs
    getRecruiters(
        page: number = 0,
        size: number = 10,
        sort: string[] = ['fullName,asc']
    ): Observable<PaginatedResponse<User>> {
        return this.getUsers('RECRUITER', page, size, sort);
    }

    // GET: Récupérer tous les candidats
    getJobSeekers(
        page: number = 0,
        size: number = 10,
        sort: string[] = ['fullName,asc']
    ): Observable<PaginatedResponse<User>> {
        return this.getUsers('JOB_SEEKER', page, size, sort);
    }

    // GET: Récupérer un utilisateur par ID
    getUserById(id: number): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/api/v1/admin/auth/users/${id}`);
    }

    // PUT: Mettre à jour un utilisateur
    register(payload: RegisterPayload): Observable<any> {
        const url = `${this.apiUrl}/api/v1/admin/auth/register`;
        return this.http.post(url, payload).pipe(
            timeout(this.apiTimeout),
            catchError(this.handleError)
        );
    }

    // PUT: Mettre à jour un utilisateur
    updateUser(id: number, user: User): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/api/v1/admin/auth/users/${id}`, user);
    }

    // PUT: Activer/Désactiver un utilisateur
    toggleUserStatus(id: number, isActive: boolean): Observable<User> {
        const params = new HttpParams().set('active', isActive.toString());
        return this.http.put<User>(`${this.apiUrl}/${id}/api/v1/admin/auth/users/activate`, null, { params });
    }

    // DELETE: Supprimer un utilisateur
    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/api/v1/admin/auth/users/${id}`);
    }

// GET: Récupérer le taux de complétude d'un profil
    getProfileCompleteness(id: number): Observable<ProfileCompleteness> {
        return this.http.get<ProfileCompleteness>(`${this.apiUrl}/api/v1/admin/auth/users/${id}/completeness`);
    }

    // Méthode pour créer une réponse paginée à partir d'un tableau
    private createPaginatedResponse(users: User[], page: number, size: number): PaginatedResponse<User> {
        // Vérifier si users est un tableau
        if (!Array.isArray(users)) {
            console.warn('La réponse de l\'API n\'est pas un tableau:', users);
            users = [];
        }

        const totalElements = users.length;
        const totalPages = Math.ceil(totalElements / size);

        // Pagination côté client
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const content = users.slice(startIndex, endIndex);

        return {
            content: content,
            totalElements: totalElements,
            totalPages: totalPages,
            size: size,
            number: page,
            first: page === 0,
            last: page >= totalPages - 1,
            empty: content.length === 0
        };
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
