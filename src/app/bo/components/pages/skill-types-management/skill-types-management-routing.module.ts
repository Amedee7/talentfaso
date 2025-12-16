import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {SkillTypesManagementComponent} from "./skill-types-management.component";

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: SkillTypesManagementComponent }
    ])],
    exports: [RouterModule]
})
export class SkillTypesManagementRoutingModule { }
