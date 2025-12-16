import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { SkillTypesManagementComponent } from './skill-types-management.component';
import { SkillTypesManagementRoutingModule } from './skill-types-management-routing.module';
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

@NgModule({
    declarations: [SkillTypesManagementComponent],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        SkillTypesManagementRoutingModule,
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
        FormsModule
    ],
    exports: [SkillTypesManagementComponent]
})
export class SkillTypesManagementModule { }
