import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './bo/components/notfound/notfound.component';
import { AppLayoutComponent } from "./layout/app.layout.component";
import { AuthGuard } from "./bo/components/auth.guard";
import { LoginGuard } from "./bo/components/login.guard";

@NgModule({
    imports: [
        RouterModule.forRoot([
            // Gardez la redirection racine vers login
            {
                path: '',
                redirectTo: '/auth/login',
                pathMatch: 'full'
            },
            {
                path: '',
                component: AppLayoutComponent,
                canActivate: [AuthGuard], // Protection du layout principal
                children: [
                    {
                        path: 'dashboard',
                        loadChildren: () => import('./bo/components/dashboard/dashboard.module').then(m => m.DashboardModule)
                    },
                    {
                        path: 'users-management',  // Pas de préfixe /pages
                        loadChildren: () => import('./bo/components/pages/users-management/users-management.module').then(m => m.UsersManagementModule)
                    },
                    {
                        path: 'skill-types-management',  // Pas de préfixe /pages
                        loadChildren: () => import('./bo/components/pages/skill-types-management/skill-types-management.module').then(m => m.SkillTypesManagementModule)
                    },
                    {
                        path: 'roles-management',  // Pas de préfixe /pages
                        loadChildren: () => import('./bo/components/pages/roles-management/roles-management.module').then(m => m.RolesManagementModule)
                    }
                ]
            },
            {
                path: 'auth',
                loadChildren: () => import('./bo/components/auth/auth.module').then(m => m.AuthModule)
            },
            { path: 'notfound', component: NotfoundComponent },
            { path: 'access-denied', component: NotfoundComponent },
            { path: '**', redirectTo: '/notfound' },
        ], {
            scrollPositionRestoration: 'enabled',
            anchorScrolling: 'enabled',
            onSameUrlNavigation: 'reload'
        })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
