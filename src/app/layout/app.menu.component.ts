import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from './service/app.layout.service';

@Component({
    selector: 'app-menu',
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit {

    model: any[] = [];

    constructor(public layoutService: LayoutService) { }

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }
                ]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                items: [
                    {
                        label: 'Utilisateurs',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/users-management']
                    },
                    {
                        label: 'Roles',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/roles-management']
                    },
                    {
                        label: 'Competences',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/skill-types-management']
                    },
                    {
                        label: 'Gestion des offres',
                        icon: 'pi pi-fw pi-briefcase',
                        routerLink: ['/offers-list-management']
                    },
                    {
                        label: 'Gestion des notification',
                        icon: 'pi pi-fw pi-briefcase',
                        routerLink: ['/notifications-management']
                    }
                ]
            }
        ];
    }
}
