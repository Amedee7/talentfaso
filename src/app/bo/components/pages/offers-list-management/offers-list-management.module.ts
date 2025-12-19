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
import {OffersListManagementComponent} from "./offers-list-management.component";
import {OffersListManagementRoutingModule} from "./offers-list-management-routing.module";
import {MultiSelectModule} from "primeng/multiselect";
import {InputNumberModule} from "primeng/inputnumber";
import {OfferDetailComponent} from "./offer-detail/offer-detail.component";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {OfferEditComponent} from "./offer-edit/offer-edit.component";
import {CalendarModule} from "primeng/calendar";
import {EditorModule} from "primeng/editor";

@NgModule({
    declarations: [
        OffersListManagementComponent,
        OfferDetailComponent,
        OfferEditComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        OffersListManagementRoutingModule,

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
    exports: [OffersListManagementComponent]
})
export class OffersListManagementModule { }
