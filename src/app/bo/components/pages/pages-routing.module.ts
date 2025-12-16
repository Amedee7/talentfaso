import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {RoleGuard} from "../roles.guard";

const routes: Routes = [
    // Tableau de bord par défaut (selon le rôle)
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },

    // Tableau de bord intelligent (redirige selon le rôle)
    {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardModule),
        canActivate: [RoleGuard]
    },

    // Pages CRUD (exemple)
    {
        path: 'crud',
        loadChildren: () => import('./crud/crud.module').then(m => m.CrudModule),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'RECRUITER'] } // Seulement admin et recruteur
    },

    // Gestion des utilisateurs (admin seulement)
    {
        path: 'users-management',
        loadChildren: () => import('./users-management/users-management.module').then(m => m.UsersManagementModule),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
    },

    // Gestion des competences (admin seulement)
    {
        path: 'skill-types-management',
        loadChildren: () => import('./skill-types-management/skill-types-management.module').then(m => m.SkillTypesManagementModule),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
    },

    // Gestion des role (admin seulement)
    {
        path: 'roles-management',
        loadChildren: () => import('./roles-management/roles-management.module').then(m => m.RolesManagementModule),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
    },

    // Autres pages
    { path: 'timeline', loadChildren: () => import('./timeline/timelinedemo.module').then(m => m.TimelineDemoModule) },
    { path: 'empty', loadChildren: () => import('./empty/emptydemo.module').then(m => m.EmptyDemoModule) }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PagesRoutingModule { }
