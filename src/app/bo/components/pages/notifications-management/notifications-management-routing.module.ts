import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {NotificationsManagementComponent} from "./notifications-management.component";

@NgModule({
    imports: [RouterModule.forChild([
        {
            path: '',
            component: NotificationsManagementComponent,
        }
    ])],
    exports: [RouterModule]
})
export class NotificationsManagementRoutingModule { }
