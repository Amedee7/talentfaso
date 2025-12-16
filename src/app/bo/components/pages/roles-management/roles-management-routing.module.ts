import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {RolesManagementComponent} from "./roles-management.component";

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: RolesManagementComponent }
    ])],
    exports: [RouterModule]
})
export class RolesManagementRoutingModule { }
