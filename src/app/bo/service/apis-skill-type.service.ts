import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SkillType {
    id?: number;
    name?: string;
    description?: string;
    iconUrl?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
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

@Injectable({
    providedIn: 'root'
})
export class ApisSkillTypeService {
    private apiUrl = `${environment.apiUrl}/api/v1/admin/skill-types`;

    constructor(private http: HttpClient) {}

    // GET: Récupérer tous les types de compétences
    getAllSkillTypes(
        page: number = 0,
        size: number = 10,
        sort: string[] = ['name,asc']
    ): Observable<PaginatedResponse<SkillType>> {

        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        // Ajouter les paramètres de tri
        sort.forEach(sortParam => {
            params = params.append('sort', sortParam);
        });

        return this.http.get<PaginatedResponse<SkillType>>(this.apiUrl, { params });
    }


    // GET: Récupérer les types de compétences actifs
    getActiveSkillTypes(
        page: number = 0,
        size: number = 10,
        sort: string[] = ['name,asc']
    ): Observable<PaginatedResponse<SkillType>> {

        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        sort.forEach(sortParam => {
            params = params.append('sort', sortParam);
        });

        return this.http.get<PaginatedResponse<SkillType>>(`${this.apiUrl}/active`, { params });
    }

    // POST: Créer un nouveau type de compétence
    createSkillType(skillType: SkillType): Observable<SkillType> {
        return this.http.post<SkillType>(this.apiUrl, skillType);
    }

    // PUT: Mettre à jour un type de compétence
    updateSkillType(id: number, skillType: SkillType): Observable<SkillType> {
        return this.http.put<SkillType>(`${this.apiUrl}/${id}`, skillType);
    }

    // DELETE: Supprimer un type de compétence
    deleteSkillType(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // PUT: Activer/Désactiver un type de compétence
    toggleSkillTypeStatus(id: number, isActive: boolean): Observable<SkillType> {
        const params = new HttpParams().set('isActive', isActive.toString());

        return this.http.put<SkillType>(
            `${this.apiUrl}/${id}/toggle-status`,
            {},
            { params }
        );
    }

    // GET: Récupérer un type de compétence par ID
    getSkillTypeById(id: number): Observable<SkillType> {
        return this.http.get<SkillType>(`${this.apiUrl}/${id}`);
    }
}
