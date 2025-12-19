import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface JobOffer {
    id?: number;
    recruiterId: number;
    recruiterName: string;
    companyName: string;
    title: string;
    description: string;
    requirements: string;
    jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'TEMPORARY' | 'REMOTE';
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED' | 'EXPIRED';
    location: string;
    city: string;
    country: string;
    salaryMin: number;
    salaryMax: number;
    salaryCurrency: string;
    experienceRequired: number;
    educationLevel: string;
    skillsRequired: string;
    applicationDeadline: string;
    startDate: string;
    remoteAllowed: boolean;
    viewsCount: number;
    applicationsCount: number;
    isFeatured: boolean;
    isUrgent: boolean;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;

    // Champs optionnels pour l'UI
    recruiterLogoUrl?: string;
    companyLogoUrl?: string;
    benefits?: string[];
}

export interface JobOfferResponse {
    content: JobOffer[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface OfferFilters {
    jobType?: string[];
    status?: string[];
    location?: string;
    city?: string;
    country?: string;
    minSalary?: number;
    maxSalary?: number;
    experienceMin?: number;
    experienceMax?: number;
    remoteAllowed?: boolean;
    isFeatured?: boolean;
    isUrgent?: boolean;
    searchTerm?: string;
    skills?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class ApisOfferService {
    private apiUrl = `${environment.apiUrl}/api/v1/mobile/offers`;

    constructor(private http: HttpClient) {}

    // GET: Récupérer toutes les offres avec pagination et filtres
    getOffers(
        page: number = 0,
        size: number = 10,
        filters?: OfferFilters,
        sort: string[] = ['createdAt,desc']
    ): Observable<JobOfferResponse> {

        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        // Ajouter les paramètres de tri
        sort.forEach(sortParam => {
            params = params.append('sort', sortParam);
        });

        // Ajouter les filtres
        if (filters) {
            if (filters.jobType && filters.jobType.length > 0) {
                filters.jobType.forEach(type => {
                    params = params.append('jobType', type);
                });
            }

            if (filters.status && filters.status.length > 0) {
                filters.status.forEach(status => {
                    params = params.append('status', status);
                });
            }

            if (filters.location) {
                params = params.set('location', filters.location);
            }

            if (filters.city) {
                params = params.set('city', filters.city);
            }

            if (filters.country) {
                params = params.set('country', filters.country);
            }

            if (filters.minSalary !== undefined) {
                params = params.set('minSalary', filters.minSalary.toString());
            }

            if (filters.maxSalary !== undefined) {
                params = params.set('maxSalary', filters.maxSalary.toString());
            }

            if (filters.experienceMin !== undefined) {
                params = params.set('experienceMin', filters.experienceMin.toString());
            }

            if (filters.experienceMax !== undefined) {
                params = params.set('experienceMax', filters.experienceMax.toString());
            }

            if (filters.remoteAllowed !== undefined) {
                params = params.set('remoteAllowed', filters.remoteAllowed.toString());
            }

            if (filters.isFeatured !== undefined) {
                params = params.set('isFeatured', filters.isFeatured.toString());
            }

            if (filters.isUrgent !== undefined) {
                params = params.set('isUrgent', filters.isUrgent.toString());
            }

            if (filters.searchTerm) {
                params = params.set('search', filters.searchTerm);
            }

            if (filters.skills && filters.skills.length > 0) {
                filters.skills.forEach(skill => {
                    params = params.append('skills', skill);
                });
            }
        }

        return this.http.get<JobOfferResponse>(this.apiUrl, { params });
    }

    // GET: Récupérer une offre par ID
    getOfferById(id: number): Observable<JobOffer> {
        return this.http.get<JobOffer>(`${this.apiUrl}/${id}`);
    }

    // GET: Récupérer les offres recommandées
    getRecommendedOffers(
        page: number = 0,
        size: number = 10
    ): Observable<JobOfferResponse> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<JobOfferResponse>(`${this.apiUrl}/recommended`, { params });
    }

    // GET: Récupérer mes offres (pour recruteurs)
    getMyOffers(
        page: number = 0,
        size: number = 10,
        filters?: OfferFilters
    ): Observable<JobOfferResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        // Ajouter les filtres si fournis
        if (filters?.status && filters.status.length > 0) {
            filters.status.forEach(status => {
                params = params.append('status', status);
            });
        }

        return this.http.get<JobOfferResponse>(`${this.apiUrl}/my-offers`, { params });
    }

    // POST: Créer une nouvelle offre
    createOffer(offer: Partial<JobOffer>): Observable<JobOffer> {
        return this.http.post<JobOffer>(this.apiUrl, offer);
    }

    // PUT: Mettre à jour une offre
    updateOffer(id: number, offer: Partial<JobOffer>): Observable<JobOffer> {
        return this.http.put<JobOffer>(`${this.apiUrl}/${id}`, offer);
    }

    // PATCH: Changer le statut d'une offre
    updateOfferStatus(id: number, status: string): Observable<JobOffer> {
        return this.http.patch<JobOffer>(`${this.apiUrl}/${id}/status`, { status });
    }

    // PATCH: Marquer comme urgent/featured
    updateOfferFlags(id: number, updates: { isUrgent?: boolean; isFeatured?: boolean }): Observable<JobOffer> {
        return this.http.patch<JobOffer>(`${this.apiUrl}/${id}/flags`, updates);
    }

    // DELETE: Supprimer une offre
    deleteOffer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // POST: Augmenter le compteur de vues
    incrementViews(id: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/view`, {});
    }

    // GET: Statistiques des offres
    getOfferStatistics(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/statistics`);
    }

}
