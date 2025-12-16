import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginGuard } from '../login.guard';

@NgModule({
    imports: [RouterModule.forChild([
        {
            path: 'login',
            loadChildren: () => import('./login/login.module').then(m => m.LoginModule),
            canActivate: [LoginGuard] // Empêche l'accès au login si déjà connecté
        },
        { path: 'error', loadChildren: () => import('./error/error.module').then(m => m.ErrorModule) },
        { path: 'access', loadChildren: () => import('./access/access.module').then(m => m.AccessModule) },
        { path: '**', redirectTo: '/auth/login' }
    ])],
    exports: [RouterModule]
})
export class AuthRoutingModule { }
