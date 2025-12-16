import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import {UsersManagementComponent} from "./users-management.component";
import {UsersManagementRoutingModule} from "./users-management-routing.module";
import {TableModule} from "primeng/table";
import {ToastModule} from "primeng/toast";
import {ToolbarModule} from "primeng/toolbar";
import {FileUploadModule} from "primeng/fileupload";
import {RippleModule} from "primeng/ripple";
import {DropdownModule} from "primeng/dropdown";
import {DialogModule} from "primeng/dialog";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {InputMaskModule} from "primeng/inputmask";
import {InputNumberModule} from "primeng/inputnumber";
import {InputTextareaModule} from "primeng/inputtextarea";
import {TabViewModule} from "primeng/tabview";
import {TooltipModule} from "primeng/tooltip";
import {ProgressSpinnerModule} from "primeng/progressspinner";

@NgModule({
    imports: [
        CommonModule,
        UsersManagementRoutingModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        FormsModule,
        PasswordModule,
        TableModule,
        ToastModule,
        ToolbarModule,
        FileUploadModule,
        RippleModule,
        DropdownModule,
        ReactiveFormsModule,
        DialogModule,
        ConfirmDialogModule,
        InputMaskModule,
        InputNumberModule,
        InputTextareaModule,
        TabViewModule,
        TooltipModule,
        ProgressSpinnerModule
    ],
    declarations: [UsersManagementComponent],
})
export class UsersManagementModule { }
