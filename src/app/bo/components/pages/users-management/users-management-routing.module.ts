import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {UsersManagementComponent} from "./users-management.component";

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: UsersManagementComponent }
    ])],
    exports: [RouterModule]
})
export class UsersManagementRoutingModule { }
