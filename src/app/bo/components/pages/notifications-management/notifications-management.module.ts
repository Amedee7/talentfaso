import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import {TabViewModule} from "primeng/tabview";
import {MultiSelectModule} from "primeng/multiselect";
import {InputNumberModule} from "primeng/inputnumber";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {CalendarModule} from "primeng/calendar";
import {EditorModule} from "primeng/editor";
import {NotificationsManagementRoutingModule} from "./notifications-management-routing.module";
import {NotificationsManagementComponent} from "./notifications-management.component";

@NgModule({
    declarations: [
        NotificationsManagementComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NotificationsManagementRoutingModule,

        // PrimeNG
        TableModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        ConfirmDialogModule,
        ToastModule,
        ToolbarModule,
        DropdownModule,
        MultiSelectModule,
        InputNumberModule,
        CheckboxModule,
        TabViewModule,
        TooltipModule,
        InputTextareaModule,
        RippleModule,
        ProgressSpinnerModule,
        CalendarModule,
        EditorModule,
    ],
    exports: [NotificationsManagementComponent],
})
export class NotificationsManagementModule { }
