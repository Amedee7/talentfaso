import { NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppLayoutModule } from './layout/app.layout.module';
import { NotfoundComponent } from './bo/components/notfound/notfound.component';
import { ProductService } from './bo/service/product.service';
import { CountryService } from './bo/service/country.service';
import { CustomerService } from './bo/service/customer.service';
import { EventService } from './bo/service/event.service';
import { IconService } from './bo/service/icon.service';
import { NodeService } from './bo/service/node.service';
import { PhotoService } from './bo/service/photo.service';
import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {AuthInterceptor} from "./bo/@core/auth.interceptor";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";

@NgModule({
    declarations: [AppComponent, NotfoundComponent],
    imports: [AppRoutingModule, AppLayoutModule, ButtonModule, RippleModule],
    providers: [
        { provide: LocationStrategy, useClass: PathLocationStrategy },
        CountryService, CustomerService, EventService, IconService, NodeService,
        PhotoService, ProductService,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        }
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
