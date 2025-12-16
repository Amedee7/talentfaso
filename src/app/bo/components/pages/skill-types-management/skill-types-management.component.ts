import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {ApisSkillTypeService, SkillType, PaginatedResponse} from "../../../service/apis-skill-type.service";
import { TableLazyLoadEvent } from 'primeng/table';


@Component({
    selector: 'app-skill-types-management',
    templateUrl: './skill-types-management.component.html',
    styleUrls: ['./skill-types-management.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class SkillTypesManagementComponent implements OnInit {

    @ViewChild('dt') dt: Table | undefined;

    skillTypes: SkillType[] = [];
    selectedSkillTypes: SkillType[] = [];
    loading: boolean = true;
    showOnlyActive: boolean = false;

    // Propriétés de pagination
    totalRecords: number = 0;
    rowsPerPage: number = 10;
    currentPage: number = 0;
    sortField: string = 'name';
    sortOrder: number = 1; // 1 = asc, -1 = desc

    skillTypeDialog: boolean = false;
    deleteSkillTypeDialog: boolean = false;
    deleteSkillTypesDialog: boolean = false;
    skillType: SkillType = {};
    submitted: boolean = false;
    isEditMode: boolean = false;
    currentTogglingId: number | null = null;

    skillTypeForm!: FormGroup;

    // Options de tri
    sortOptions = [
        { label: 'Nom (A-Z)', value: 'name,asc' },
        { label: 'Nom (Z-A)', value: 'name,desc' },
        { label: 'Date création (récent)', value: 'createdAt,desc' },
        { label: 'Date création (ancien)', value: 'createdAt,asc' },
        { label: 'Statut (actif d\'abord)', value: 'isActive,desc' },
        { label: 'Statut (inactif d\'abord)', value: 'isActive,asc' }
    ];
    selectedSort: string = 'name,asc';

    availableIcons = [
        { label: 'Code', value: 'pi pi-code', icon: 'pi pi-code' },
        { label: 'Design', value: 'pi pi-palette', icon: 'pi pi-palette' },
        { label: 'Database', value: 'pi pi-database', icon: 'pi pi-database' },
        { label: 'Cloud', value: 'pi pi-cloud', icon: 'pi pi-cloud' },
        { label: 'Mobile', value: 'pi pi-mobile', icon: 'pi pi-mobile' },
        { label: 'Desktop', value: 'pi pi-desktop', icon: 'pi pi-desktop' },
        { label: 'Network', value: 'pi pi-wifi', icon: 'pi pi-wifi' },
        { label: 'Security', value: 'pi pi-shield', icon: 'pi pi-shield' },
        { label: 'Analytics', value: 'pi pi-chart-line', icon: 'pi pi-chart-line' },
        { label: 'AI', value: 'pi pi-brain', icon: 'pi pi-brain' },
        { label: 'Web', value: 'pi pi-globe', icon: 'pi pi-globe' },
        { label: 'Server', value: 'pi pi-server', icon: 'pi pi-server' }
    ];

    constructor(
        private skillTypeService: ApisSkillTypeService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.initForm();
        this.loadSkillTypes();
    }

    initForm() {
        this.skillTypeForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            description: ['', [Validators.maxLength(500)]],
            iconUrl: [''],
            isActive: [true]
        });
    }

    // Getters pour le formulaire
    get f() { return this.skillTypeForm.controls; }

    // Charger les types de compétences avec pagination
    loadSkillTypes(event?: TableLazyLoadEvent) {
        this.loading = true;

        // Déterminer la page et la taille
        let page = this.currentPage;
        let size = this.rowsPerPage;
        let sort = [this.selectedSort];

        // Si event est fourni (depuis le tableau PrimeNG)
        if (event) {
            page = event.first! / event.rows!;
            size = event.rows!;

            // Gérer le tri
            if (event.sortField) {
                const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
                sort = [`${event.sortField},${sortOrder}`];
            }
        }

        // Appel API avec pagination
        const apiCall = this.showOnlyActive
            ? this.skillTypeService.getActiveSkillTypes(page, size, sort)
            : this.skillTypeService.getAllSkillTypes(page, size, sort);

        apiCall.subscribe({
            next: (response: any) => {
                // Vérifier le format de la réponse
                if (response && response.content && Array.isArray(response.content)) {
                    // Format paginé
                    this.skillTypes = response.content;
                    this.totalRecords = response.totalElements;
                    this.currentPage = response.number;
                } else if (Array.isArray(response)) {
                    // Format tableau simple
                    this.skillTypes = response;
                    this.totalRecords = response.length;
                    this.currentPage = 0;
                } else {
                    // Format inattendu
                    console.warn('Format de réponse inattendu:', response);
                    this.skillTypes = [];
                    this.totalRecords = 0;
                    this.currentPage = 0;
                }

                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur lors du chargement des types de compétences:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec du chargement des types de compétences',
                    life: 3000
                });
                this.loading = false;
                this.skillTypes = [];
                this.totalRecords = 0;
            }
        });
    }

    // Chargement paresseux (lazy load) pour le tableau
    onLazyLoad(event: TableLazyLoadEvent) {
        this.loadSkillTypes(event);
    }

    // Changement de tri
    onSortChange() {
        this.currentPage = 0; // Revenir à la première page
        this.loadSkillTypes();
    }

    toggleShowActive() {
        this.showOnlyActive = !this.showOnlyActive;
        this.currentPage = 0; // Revenir à la première page
        this.loadSkillTypes();
    }

    openNew() {
        this.isEditMode = false;
        this.skillType = {};
        this.submitted = false;
        this.skillTypeForm.reset({ isActive: true });
        this.skillTypeDialog = true;
    }

    editSkillType(skillType: SkillType) {
        this.isEditMode = true;
        this.skillType = { ...skillType };

        this.skillTypeForm.patchValue({
            name: skillType.name,
            description: skillType.description,
            iconUrl: skillType.iconUrl,
            isActive: skillType.isActive ?? true
        });

        this.skillTypeDialog = true;
    }

    saveSkillType() {
        this.submitted = true;

        if (this.skillTypeForm.invalid) {
            return;
        }

        const formData = this.skillTypeForm.value;
        const skillTypeData: SkillType = {
            name: formData.name,
            description: formData.description,
            iconUrl: formData.iconUrl,
            isActive: formData.isActive
        };

        if (this.isEditMode && this.skillType.id) {
            this.updateSkillType(this.skillType.id, skillTypeData);
        } else {
            this.createSkillType(skillTypeData);
        }
    }

    createSkillType(skillType: SkillType) {
        this.loading = true;
        this.skillTypeService.createSkillType(skillType).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Type de compétence créé avec succès',
                    life: 3000
                });
                this.skillTypeDialog = false;
                this.loadSkillTypes(); // Recharger avec la pagination actuelle
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur lors de la création:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec de la création du type de compétence',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }

    updateSkillType(id: number, skillType: SkillType) {
        this.loading = true;
        this.skillTypeService.updateSkillType(id, skillType).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Type de compétence mis à jour avec succès',
                    life: 3000
                });
                this.skillTypeDialog = false;
                this.loadSkillTypes(); // Recharger avec la pagination actuelle
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur lors de la mise à jour:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec de la mise à jour du type de compétence',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }

    toggleStatus(skillType: SkillType) {
        if (!skillType.id) return;

        const newStatus = !skillType.isActive;
        const action = newStatus ? 'activé' : 'désactivé';

        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir ${newStatus ? 'activer' : 'désactiver'} "${skillType.name}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, appliquer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-success',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.executeToggleStatus(skillType.id!, newStatus, action);
            }
        });
    }

    private executeToggleStatus(id: number, newStatus: boolean, action: string): void {
        this.currentTogglingId = id;

        this.skillTypeService.toggleSkillTypeStatus(id, newStatus).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: `Type de compétence ${action} avec succès`,
                    life: 3000
                });
                this.currentTogglingId = null;
                this.loadSkillTypes(); // Recharger avec la pagination actuelle
            },
            error: (error) => {
                console.error('Erreur lors du changement de statut:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: `Échec du ${action === 'activé' ? 'désactivation' : 'activation'}`,
                    life: 3000
                });
                this.currentTogglingId = null;
            }
        });
    }

    deleteSelectedSkillTypes() {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer les ${this.selectedSkillTypes.length} types de compétences sélectionnés ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, Supprimer tous',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.deleteMultipleSkillTypes();
            }
        });
    }

    deleteSkillType(skillType: SkillType) {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer "${skillType.name}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                if (skillType.id) {
                    this.deleteSingleSkillType(skillType.id);
                }
            }
        });
    }

    deleteSingleSkillType(id: number) {
        this.loading = true;
        this.skillTypeService.deleteSkillType(id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Type de compétence supprimé avec succès',
                    life: 3000
                });
                this.loadSkillTypes(); // Recharger avec la pagination actuelle
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur lors de la suppression:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec de la suppression du type de compétence',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }

    deleteMultipleSkillTypes() {
        this.loading = true;
        const deletePromises = this.selectedSkillTypes
            .filter(st => st.id)
            .map(st => this.skillTypeService.deleteSkillType(st.id!).toPromise());

        Promise.all(deletePromises).then(() => {
            this.messageService.add({
                severity: 'success',
                summary: 'Succès',
                detail: `${this.selectedSkillTypes.length} types de compétences supprimés`,
                life: 3000
            });
            this.selectedSkillTypes = [];
            this.loadSkillTypes(); // Recharger avec la pagination actuelle
            this.loading = false;
        }).catch((error) => {
            console.error('Erreur lors de la suppression multiple:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Échec de la suppression de certains types de compétences',
                life: 3000
            });
            this.loading = false;
        });
    }

    hideDialog() {
        this.skillTypeDialog = false;
        this.submitted = false;
        this.skillTypeForm.reset({ isActive: true });
    }

    onGlobalFilter(event: Event) {
        if (this.dt) {
            this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
        }
    }

    getStatusBadgeClass(isActive: boolean | undefined): string {
        return isActive ? 'badge-active' : 'badge-inactive';
    }

    getStatusLabel(isActive: boolean | undefined): string {
        return isActive ? 'Actif' : 'Inactif';
    }

    getIconLabel(iconUrl: string): string {
        if (!iconUrl) return '';
        const icon = this.availableIcons.find(i => i.value === iconUrl);
        return icon ? icon.label : iconUrl;
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

    // Réinitialiser la pagination
    resetPagination() {
        this.currentPage = 0;
        this.selectedSort = 'name,asc';
        if (this.dt) {
            this.dt.sortField = 'name';
            this.dt.sortOrder = 1;
            this.dt.reset();
        }
    }

    getTotalPages(): number {
        if (this.totalRecords <= 0 || this.rowsPerPage <= 0) {
            return 1;
        }
        return Math.ceil(this.totalRecords / this.rowsPerPage);
    }
}
