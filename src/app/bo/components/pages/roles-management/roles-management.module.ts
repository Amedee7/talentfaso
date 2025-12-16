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
import { SelectButtonModule } from 'primeng/selectbutton';
import {RolesManagementComponent} from "./roles-management.component";
import {RolesManagementRoutingModule} from "./roles-management-routing.module";
import {TabViewModule} from "primeng/tabview";

@NgModule({
    declarations: [RolesManagementComponent],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RolesManagementRoutingModule,
        TableModule,
        ToolbarModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        DialogModule,
        InputTextModule,
        InputTextareaModule,
        DropdownModule,
        CheckboxModule,
        ConfirmDialogModule,
        TooltipModule,
        SelectButtonModule,
        FormsModule,
        TabViewModule
    ],
    exports: [RolesManagementComponent]
})
export class RolesManagementModule { }
