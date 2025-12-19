import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {OfferDetailComponent} from "./offer-detail/offer-detail.component";
import {OfferEditComponent} from "./offer-edit/offer-edit.component";
import {OffersListManagementComponent} from "./offers-list-management.component";

@NgModule({
    imports: [RouterModule.forChild([
        {
            path: '',
            component: OffersListManagementComponent},
        {
            path: 'create',
            component: OfferEditComponent
        },
        {
            path: ':id',
            component: OfferDetailComponent
        },
        {
            path: ':id/edit',
            component: OfferEditComponent
        }
    ])],
    exports: [RouterModule]
})
export class OffersListManagementRoutingModule { }
