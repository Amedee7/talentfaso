import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import {ApisRoleService, Permission, Role} from "../../../service/apis-role.service";
import {forkJoin} from "rxjs";

@Component({
    selector: 'app-roles-management',
    templateUrl: './roles-management.component.html',
    styleUrls: ['./roles-management.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class RolesManagementComponent implements OnInit {

    @ViewChild('dt') dt: Table | undefined;

    roles: Role[] = [];
    selectedRoles: Role[] = [];
    loading: boolean = true;

    // Pagination
    totalRecords: number = 0;
    rowsPerPage: number = 10;
    currentPage: number = 0;

    // Dialogs
    roleDialog: boolean = false;
    deleteRoleDialog: boolean = false;
    deleteRolesDialog: boolean = false;
    role: Partial<Role> = {};
    submitted: boolean = false;
    isEditMode: boolean = false;

    // Form
    roleForm!: FormGroup;

    // Permissions
    allPermissions: Permission[] = [];
    groupedPermissions: { [category: string]: Permission[] } = {};
    permissionCategories: string[] = [];

    // Permission categories avec descriptions
    permissionCategoriesInfo = [
        { name: 'USERS', label: 'Gestion des utilisateurs', description: 'Permissions liées à la gestion des utilisateurs' },
        { name: 'ROLES', label: 'Gestion des rôles', description: 'Permissions liées à la gestion des rôles et permissions' },
        { name: 'JOBS', label: 'Gestion des emplois', description: 'Permissions liées à la gestion des offres d\'emploi' },
        { name: 'APPLICATIONS', label: 'Gestion des candidatures', description: 'Permissions liées aux candidatures' },
        { name: 'COMPANIES', label: 'Gestion des entreprises', description: 'Permissions liées aux entreprises recruteuses' },
        { name: 'SETTINGS', label: 'Paramètres système', description: 'Permissions liées aux paramètres généraux' },
        { name: 'REPORTS', label: 'Rapports et statistiques', description: 'Permissions liées aux rapports et analytics' },
        { name: 'CONTENT', label: 'Gestion du contenu', description: 'Permissions liées au contenu du site' }
    ];

    constructor(
        private roleService: ApisRoleService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.initForm();
        this.loadRoles();
        this.loadPermissions();
    }

    initForm() {
        this.roleForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-z_]+$/)]],
            displayName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
            active: [true],
            permissions: this.fb.array([]) // FormArray pour les permissions
        });
    }

    get f() { return this.roleForm.controls; }
    get permissionsArray(): FormArray {
        return this.roleForm.get('permissions') as FormArray;
    }

    // Charger les rôles
    loadRoles(event?: any) {
        this.loading = true;

        let page = this.currentPage;
        let size = this.rowsPerPage;

        if (event) {
            page = event.first / event.rows;
            size = event.rows;
        }

        this.roleService.getRoles(page, size).subscribe({
            next: (response) => {
                this.roles = response.content;
                this.totalRecords = response.totalElements;
                this.currentPage = response.number;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur lors du chargement des rôles:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec du chargement des rôles',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }

    // Charger les permissions disponibles
    loadPermissions() {
        this.roleService.getAvailablePermissions().subscribe({
            next: (permissions) => {
                this.allPermissions = permissions;
                this.groupPermissionsByCategory();
            },
            error: (error) => {
                console.error('Erreur lors du chargement des permissions:', error);
            }
        });
    }

    // Grouper les permissions par catégorie
    groupPermissionsByCategory() {
        this.groupedPermissions = {};

        this.allPermissions.forEach(permission => {
            if (!this.groupedPermissions[permission.category]) {
                this.groupedPermissions[permission.category] = [];
            }
            this.groupedPermissions[permission.category].push(permission);
        });

        this.permissionCategories = Object.keys(this.groupedPermissions);
    }

    // Initialiser les checkboxes de permissions
    initPermissionCheckboxes() {
        // Vider le FormArray
        while (this.permissionsArray.length !== 0) {
            this.permissionsArray.removeAt(0);
        }

        // Créer un contrôle pour chaque permission
        this.allPermissions.forEach(permission => {
            const isSelected = this.role.permissions?.includes(permission.id) || false;
            this.permissionsArray.push(new FormControl(isSelected));
        });
    }

    // Ouvrir le dialog pour créer un rôle
    openNew() {
        this.role = {};
        this.submitted = false;
        this.isEditMode = false;
        this.roleForm.reset({
            name: '',
            displayName: '',
            description: '',
            active: true
        });

        // Réinitialiser les permissions
        this.initPermissionCheckboxes();

        this.roleDialog = true;
    }

    // Éditer un rôle
    editRole(role: Role) {
        if (!role.id) return;

        this.role = { ...role };
        this.isEditMode = true;
        this.submitted = false;

        // Charger les détails complets du rôle
        this.roleService.getRoleById(role.id).subscribe({
            next: (fullRole) => {
                this.role = fullRole;

                this.roleForm.patchValue({
                    name: fullRole.name,
                    displayName: fullRole.displayName,
                    description: fullRole.description,
                    active: fullRole.active
                });

                // Initialiser les permissions
                this.initPermissionCheckboxes();

                this.roleDialog = true;
            },
            error: (error) => {
                console.error('Erreur lors du chargement du rôle:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les détails du rôle',
                    life: 3000
                });
            }
        });
    }

    // Sauvegarder un rôle
    saveRole() {
        this.submitted = true;

        if (this.roleForm.invalid) {
            return;
        }

        // Récupérer les permissions sélectionnées
        const selectedPermissions: string[] = [];
        this.permissionsArray.controls.forEach((control, index) => {
            if (control.value) {
                selectedPermissions.push(this.allPermissions[index].id);
            }
        });

        const roleData = {
            ...this.roleForm.value,
            permissions: selectedPermissions
        };

        this.loading = true;

        if (this.isEditMode && this.role.id) {
            this.roleService.updateRole(this.role.id, roleData).subscribe({
                next: (response) => {
                    this.handleSaveSuccess('Rôle mis à jour avec succès');
                },
                error: (error) => {
                    this.handleSaveError('Échec de la mise à jour du rôle', error);
                }
            });
        } else {
            this.roleService.createRole(roleData).subscribe({
                next: (response) => {
                    this.handleSaveSuccess('Rôle créé avec succès');
                },
                error: (error) => {
                    this.handleSaveError('Échec de la création du rôle', error);
                }
            });
        }
    }

    private handleSaveSuccess(message: string) {
        this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: message,
            life: 3000
        });

        this.roleDialog = false;
        this.loadRoles();
        this.loading = false;
    }

    private handleSaveError(defaultMessage: string, error: any) {
        console.error('Erreur lors de la sauvegarde:', error);

        let errorMessage = defaultMessage;
        if (error.error?.message) {
            errorMessage = error.error.message;
        }

        this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMessage,
            life: 3000
        });

        this.loading = false;
    }

    // Supprimer un rôle
    deleteRole(role: Role) {
        if (!role.id) return;

        // Vérifier si le rôle est utilisé
        if (role.userCount && role.userCount > 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: `Ce rôle est utilisé par ${role.userCount} utilisateur(s). Impossible de le supprimer.`,
                life: 4000
            });
            return;
        }

        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer le rôle "${role.displayName}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.roleService.deleteRole(role.id!).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Rôle supprimé avec succès',
                            life: 3000
                        });
                        this.loadRoles();
                    },
                    error: (error) => {
                        console.error('Erreur lors de la suppression:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Échec de la suppression du rôle',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    // Activer/Désactiver un rôle
    toggleRoleStatus(role: Role) {
        if (!role.id) return;

        const newStatus = !role.active;
        const action = newStatus ? 'activer' : 'désactiver';
        const actionPast = newStatus ? 'activé' : 'désactivé';

        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir ${action} le rôle "${role.displayName}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, appliquer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-success',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.executeToggleStatus(role.id!, newStatus, actionPast, role);
            },
            reject: () => {
            }
        });
    }

    private executeToggleStatus(id: number, newStatus: boolean, action: string, role: Role): void {
        this.loading = true;

        this.roleService.toggleRoleStatus(id, newStatus).subscribe({
            next: (response) => {
                // Mettre à jour localement immédiatement
                role.active = newStatus;

                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: `Rôle ${action} avec succès`,
                    life: 3000
                });

                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur lors du changement de statut:', error);

                let errorMessage = `Échec de la ${action === 'activé' ? 'désactivation' : 'activation'}`;
                if (error.message) {
                    errorMessage = error.message;
                }

                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: errorMessage,
                    life: 3000
                });

                this.loading = false;
            }
        });
    }

    // Méthodes utilitaires
    getRoleBadgeClass(active: boolean | undefined): string {
        return active ? 'badge-active' : 'badge-inactive';
    }

    getPermissionCount(role: Role): number {
        return role.permissions?.length || 0;
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    // Obtenir le nom de la catégorie formaté
    getCategoryLabel(category: string): string {
        const categoryInfo = this.permissionCategoriesInfo.find(c => c.name === category);
        return categoryInfo?.label || category;
    }

    getCategoryDescription(category: string): string {
        const categoryInfo = this.permissionCategoriesInfo.find(c => c.name === category);
        return categoryInfo?.description || '';
    }

    onLazyLoad(event: any) {
        this.loadRoles(event);
    }

    onGlobalFilter(event: Event) {
        if (this.dt) {
            this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
        }
    }




    // Méthodes pour gérer les permissions
    getPermissionIndex(permissionId: string): number {
        return this.allPermissions.findIndex(p => p.id === permissionId);
    }

    getPermissionName(permissionId: string): string {
        const permission = this.allPermissions.find(p => p.id === permissionId);
        return permission?.name || permissionId;
    }

    getSelectedPermissionsCount(): number {
        return this.permissionsArray.controls.filter(control => control.value).length;
    }

    getSelectedPermissionIds(): string[] {
        const selectedIds: string[] = [];
        this.permissionsArray.controls.forEach((control, index) => {
            if (control.value) {
                selectedIds.push(this.allPermissions[index].id);
            }
        });
        return selectedIds;
    }

    selectAllInCategory(category: string): void {
        const categoryPermissions = this.groupedPermissions[category] || [];
        categoryPermissions.forEach(permission => {
            const index = this.getPermissionIndex(permission.id);
            if (index >= 0) {
                this.permissionsArray.at(index).setValue(true);
            }
        });
    }

    deselectAllInCategory(category: string): void {
        const categoryPermissions = this.groupedPermissions[category] || [];
        categoryPermissions.forEach(permission => {
            const index = this.getPermissionIndex(permission.id);
            if (index >= 0) {
                this.permissionsArray.at(index).setValue(false);
            }
        });
    }

// Supprimer les rôles sélectionnés
    deleteSelectedRoles(): void {
        if (!this.selectedRoles.length) return;

        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer ${this.selectedRoles.length} rôle(s) ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, Supprimer tout',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                // Implémenter la suppression multiple
                const deleteObservables = this.selectedRoles
                    .filter(role => role.id && (!role.userCount || role.userCount === 0))
                    .map(role => this.roleService.deleteRole(role.id!));

                // Utiliser forkJoin pour supprimer en parallèle
                this.loading = true;
                forkJoin(deleteObservables).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `${deleteObservables.length} rôle(s) supprimé(s)`,
                            life: 3000
                        });
                        this.loadRoles();
                        this.selectedRoles = [];
                    },
                    error: (error) => {
                        this.handleSaveError('Erreur lors de la suppression multiple', error);
                    }
                });

                // Pour l'instant, simple log
                console.log('Rôles à supprimer:', this.selectedRoles);
                this.selectedRoles = [];
            }
        });
    }
}
