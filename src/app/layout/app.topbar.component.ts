import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { TieredMenu } from 'primeng/tieredmenu';
import { LayoutService } from "./service/app.layout.service";
import { ApisAuthService } from "../bo/service/apis-auth.service";
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html'
})
export class AppTopBarComponent implements OnInit, OnDestroy {

    items!: MenuItem[];
    isLoading: boolean = false;

    @ViewChild('menubutton') menuButton!: ElementRef;
    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
    @ViewChild('topbarmenu') menu!: ElementRef;
    @ViewChild('userMenu') userMenu!: TieredMenu;
    @ViewChild('userMenuTrigger') userMenuTrigger!: ElementRef;

    userMenuItems: MenuItem[];
    private userSubscription!: Subscription;

    constructor(
        private authService: ApisAuthService,
        public layoutService: LayoutService
    ) {
        this.userMenuItems = this.getDefaultMenuItems();
    }

    ngOnInit() {
        // S'abonner aux changements d'utilisateur
        this.userSubscription = this.authService.currentUser$.subscribe(user => {
            this.updateUserMenu();
        });
    }

    // AJOUTER CETTE MÉTHODE - Elle est appelée dans le template
    getAvatarColor(role: string | undefined): string {
        if (!role) return '#607D8B'; // Couleur par défaut (gris)

        const roleColors: { [key: string]: string } = {
            'RECRUITER': '#2196F3',     // Bleu
            'JOB_SEEKER': '#4CAF50',    // Vert
            'ADMIN': '#9C27B0',         // Violet
            'EMPLOYER': '#FF9800'       // Orange
        };

        return roleColors[role] || '#607D8B'; // Retourne gris si rôle non trouvé
    }

    // Méthode pour obtenir l'URL de la photo de profil
    getProfilePictureUrl(user: any): string {
        if (!user) return '';

        // Utiliser la méthode du service
        return this.authService.getFullFileUrl(user.profilePictureUrl);
    }

    // Méthode pour obtenir le libellé du rôle
    getRoleLabel(role: string | undefined): string {
        if (!role) return 'Utilisateur';

        const roleLabels: { [key: string]: string } = {
            'RECRUITER': 'Recruteur',
            'JOB_SEEKER': 'Candidat',
            'ADMIN': 'Administrateur',
            'EMPLOYER': 'Employeur'
        };
        return roleLabels[role] || role;
    }

    // Méthode pour obtenir la couleur du badge selon le rôle
    getRoleBadgeClass(role: string | undefined): string {
        if (!role) return 'bg-gray-100 text-gray-800';

        const roleClasses: { [key: string]: string } = {
            'RECRUITER': 'bg-blue-100 text-blue-800',
            'JOB_SEEKER': 'bg-green-100 text-green-800',
            'ADMIN': 'bg-purple-100 text-purple-800',
            'EMPLOYER': 'bg-orange-100 text-orange-800'
        };
        return roleClasses[role] || 'bg-gray-100 text-gray-800';
    }

    // Mettre à jour le menu en fonction de l'utilisateur
    updateUserMenu(): void {
        const user = this.currentUser;

        if (!user) {
            this.userMenuItems = this.getDefaultMenuItems();
            return;
        }

        // Menu de base
        const baseMenu: MenuItem[] = [
            {
                label: 'Mon Profil',
                icon: 'pi pi-user',
                routerLink: ['/profile']
            }
        ];

        // Menu selon le rôle
        let roleSpecificMenu: MenuItem[] = [];

        // switch (user.role) {
        //     case 'RECRUITER':
        //         roleSpecificMenu = [
        //             {
        //                 label: 'Espace Recruteur',
        //                 icon: 'pi pi-briefcase',
        //                 items: [
        //                     {
        //                         label: 'Tableau de bord',
        //                         icon: 'pi pi-chart-bar',
        //                         routerLink: ['/recruiter/dashboard']
        //                     },
        //                     {
        //                         label: 'Mes offres d\'emploi',
        //                         icon: 'pi pi-list',
        //                         routerLink: ['/recruiter/jobs']
        //                     },
        //                     {
        //                         label: 'Candidatures',
        //                         icon: 'pi pi-users',
        //                         routerLink: ['/recruiter/applications']
        //                     },
        //                     {
        //                         label: 'Statistiques',
        //                         icon: 'pi pi-chart-line',
        //                         routerLink: ['/recruiter/analytics']
        //                     }
        //                 ]
        //             }
        //         ];
        //         break;
        //
        //     // case 'JOB_SEEKER':
        //     //     roleSpecificMenu = [
        //     //         {
        //     //             label: 'Espace Candidat',
        //     //             icon: 'pi pi-user',
        //     //             items: [
        //     //                 {
        //     //                     label: 'Tableau de bord',
        //     //                     icon: 'pi pi-chart-bar',
        //     //                     routerLink: ['/candidate/dashboard']
        //     //                 },
        //     //                 {
        //     //                     label: 'Mes candidatures',
        //     //                     icon: 'pi pi-send',
        //     //                     routerLink: ['/candidate/applications']
        //     //                 },
        //     //                 {
        //     //                     label: 'Mon CV',
        //     //                     icon: 'pi pi-file',
        //     //                     routerLink: ['/candidate/resume']
        //     //                 },
        //     //                 {
        //     //                     label: 'Alertes emploi',
        //     //                     icon: 'pi pi-bell',
        //     //                     routerLink: ['/candidate/alerts']
        //     //                 }
        //     //             ]
        //     //         }
        //     //     ];
        //     //     break;
        //     //
        //     // case 'ADMIN':
        //     //     roleSpecificMenu = [
        //     //         {
        //     //             label: 'Administration',
        //     //             icon: 'pi pi-shield',
        //     //             items: [
        //     //                 {
        //     //                     label: 'Tableau de bord admin',
        //     //                     icon: 'pi pi-chart-bar',
        //     //                     routerLink: ['/admin/dashboard']
        //     //                 },
        //     //                 {
        //     //                     label: 'Gestion utilisateurs',
        //     //                     icon: 'pi pi-users',
        //     //                     routerLink: ['/admin/users']
        //     //                 },
        //     //                 {
        //     //                     label: 'Modération',
        //     //                     icon: 'pi pi-flag',
        //     //                     routerLink: ['/admin/moderation']
        //     //                 },
        //     //                 {
        //     //                     label: 'Paramètres système',
        //     //                     icon: 'pi pi-cog',
        //     //                     routerLink: ['/admin/settings']
        //     //                 }
        //     //             ]
        //     //         }
        //     //     ];
        //     //     break;
        // }

        // Menu commun
        const commonMenu: MenuItem[] = [
            {
                separator: true
            },
            {
                label: 'Paramètres',
                icon: 'pi pi-cog',
                routerLink: ['/settings']
            },
            {
                separator: true
            },
            {
                label: 'Déconnexion',
                icon: 'pi pi-sign-out',
                command: () => this.logout()
            }
        ];

        // Combiner tous les menus
        this.userMenuItems = [...baseMenu, ...roleSpecificMenu, ...commonMenu];
    }

    // Menu par défaut (quand pas d'utilisateur connecté)
    private getDefaultMenuItems(): MenuItem[] {
        return [
            {
                label: 'Connexion',
                icon: 'pi pi-sign-in',
                routerLink: ['/auth/login']
            },
            {
                label: 'Inscription',
                icon: 'pi pi-user-plus',
                routerLink: ['/auth/register']
            }
        ];
    }

    toggleUserMenu(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }

        if (this.userMenu) {
            this.userMenu.toggle({
                currentTarget: this.userMenuTrigger.nativeElement
            });
        }
    }

    get currentUser() {
        return this.authService.getCurrentUser();
    }

    isAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    logout(): void {
        this.authService.logout();
        if (this.userMenu) {
            this.userMenu.hide();
        }
    }

    ngOnDestroy() {
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }

    getUserInitials(fullName?: string): string {
        if (!fullName) return 'U';

        return fullName
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
}
