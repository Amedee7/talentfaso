// role.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Permission {
    id: string;
    name: string;
    description: string;
    category: string;
}

export interface Role {
    id?: number;
    name: string;
    displayName: string;
    description: string;
    permissions: string[];
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
    userCount?: number;

    loading?: boolean;
}

export interface RoleResponse {
    content: Role[];
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
export class ApisRoleService {
    private apiUrl = `${environment.apiUrl}/api/v1/admin/roles`;

    constructor(private http: HttpClient) {}

    // GET: Récupérer tous les rôles
    getRoles(page: number = 0, size: number = 10): Observable<RoleResponse> {
        return this.http.get<RoleResponse>(this.apiUrl, {
            params: { page: page.toString(), size: size.toString() }
        });
    }

    // GET: Récupérer un rôle par ID
    getRoleById(id: number): Observable<Role> {
        return this.http.get<Role>(`${this.apiUrl}/${id}`);
    }

    // POST: Créer un nouveau rôle
    createRole(role: Partial<Role>): Observable<Role> {
        return this.http.post<Role>(this.apiUrl, role);
    }

    // PUT: Mettre à jour un rôle
    updateRole(id: number, role: Partial<Role>): Observable<Role> {
        return this.http.put<Role>(`${this.apiUrl}/${id}`, role);
    }

    // PUT: Activer/Désactiver un rôle
    toggleRoleStatus(id: number, active: boolean): Observable<Role> {
        const url = `${this.apiUrl}/${id}/toggle-status?active=${active}`;
        return this.http.put<Role>(url, null);
    }

    // DELETE: Supprimer un rôle
    deleteRole(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // GET: Récupérer toutes les permissions disponibles
    getAvailablePermissions(): Observable<Permission[]> {
        return this.http.get<Permission[]>(`${this.apiUrl}/permissions`);
    }

    // GET: Récupérer les utilisateurs d'un rôle
    getRoleUsers(id: number, page: number = 0, size: number = 10): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}/users`, {
            params: { page: page.toString(), size: size.toString() }
        });
    }
}
