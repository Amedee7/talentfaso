import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableLazyLoadEvent } from 'primeng/table';
import { CustomerService, User, PaginatedResponse, ProfileCompleteness} from "../../../service/customer.service";
import { Observable } from 'rxjs';

type UserTabType = 'ALL' | 'RECRUITER' | 'JOB_SEEKER';

@Component({
    selector: 'app-users-management',
    templateUrl: './users-management.component.html',
    styleUrls: ['./users-management.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class UsersManagementComponent implements OnInit {

    @ViewChild('dt') dt: Table | undefined;

    allUsers: User[] = [];
    filteredUsers: User[] = [];
    selectedUsers: User[] = [];
    loading: boolean = true;
    activeTab: UserTabType = 'ALL';
    activeTabIndex: number = 0;

    // Propriétés de pagination
    totalRecords: number = 0;
    rowsPerPage: number = 10;
    currentPage: number = 0;
    selectedSort: string = 'fullName,asc';
    accountTypes: any[] = [];

    userDialog: boolean = false;
    deleteUserDialog: boolean = false;
    deleteUsersDialog: boolean = false;
    user: Partial<User> = {};
    submitted: boolean = false;
    isEditMode: boolean = false;
    currentTogglingId: number | null = null;

    userForm!: FormGroup;

// Pour la complétude du profil
    completenessDialog: boolean = false;
    completenessLoading: boolean = false;
    profileCompleteness: ProfileCompleteness | null = null;
    selectedUserForCompleteness: User | null = null;
    private userCompletenessCache = new Map<number, ProfileCompleteness>();


    // Options de tri
    sortOptions = [
        { label: 'Nom (A-Z)', value: 'fullName,asc' },
        { label: 'Nom (Z-A)', value: 'fullName,desc' },
        { label: 'Date création (récent)', value: 'createdAt,desc' },
        { label: 'Date création (ancien)', value: 'createdAt,asc' },
        { label: 'Email (A-Z)', value: 'email,asc' },
        { label: 'Email (Z-A)', value: 'email,desc' },
        { label: 'Rôle', value: 'role,asc' }
    ];

    // Onglets disponibles
    tabs = [
        { label: 'Tous les utilisateurs', value: 'ALL', count: 0 },
        { label: 'Recruteurs', value: 'RECRUITER', count: 0 },
        { label: 'Candidats', value: 'JOB_SEEKER', count: 0 }
    ];

    // Industries pour les recruteurs
    industries = [
        { label: 'Technologie', value: 'TECHNOLOGY' },
        { label: 'Finance', value: 'FINANCE' },
        { label: 'Santé', value: 'HEALTHCARE' },
        { label: 'Éducation', value: 'EDUCATION' },
        { label: 'Commerce', value: 'RETAIL' },
        { label: 'Manufacture', value: 'MANUFACTURING' },
        { label: 'Autre', value: 'OTHER' }
    ];

    // Taille d'entreprise
    companySizes = [
        { label: '1-10 employés', value: '1-10' },
        { label: '11-50 employés', value: '11-50' },
        { label: '51-200 employés', value: '51-200' },
        { label: '201-500 employés', value: '201-500' },
        { label: '501-1000 employés', value: '501-1000' },
        { label: '1000+ employés', value: '1000+' }
    ];

    // Années d'expérience
    experienceYears = [
        { label: '0-1 an', value: 1 },
        { label: '2-3 ans', value: 3 },
        { label: '4-5 ans', value: 5 },
        { label: '6-10 ans', value: 10 },
        { label: '10+ ans', value: 15 }
    ];

    // Rôles pour le formulaire
    roles = [
        { label: 'Recruteur', value: 'RECRUITER' },
        { label: 'Candidat', value: 'JOB_SEEKER' },
        { label: 'Administrateur', value: 'ADMIN' }
    ];

    constructor(
        private usersService: CustomerService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.initForm();
        this.loadUsers(); // Charger les données initiales

        this.accountTypes = [
            { label: 'Job Seeker', value: 'JOB_SEEKER' },
            { label: 'Recruiter', value: 'RECRUITER' },
            { label: 'Admin', value: 'ADMIN' },
        ];
    }

    initForm() {
        this.userForm = this.fb.group({
            fullName: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],

            password: ['', [
                Validators.minLength(6),
                Validators.maxLength(20)
            ]],
            confirmPassword: [''],

            phoneNumber: ['', [
                Validators.required,
                Validators.pattern(/^\(226\)\s\d{2}-\d{2}-\d{2}-\d{2}$/)
            ]],
            role: ['RECRUITER', Validators.required],
            active: [true],
            currentTitle: [''],
            city: [''],
            skills: [''],
            yearsOfExperience: [0],
            companyName: [''],
            companyWebsite: [''],
            position: [''],
            industry: [''],
            companyCity: [''],
            companySize: [''],
            businessRegistrationNumber: ['']
        });
    }

    // Validateur pour vérifier que les mots de passe correspondent
    passwordMatchValidator(formGroup: FormGroup) {
        const password = formGroup.get('password')?.value;
        const confirmPassword = formGroup.get('confirmPassword')?.value;

        if (password !== confirmPassword) {
            formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
        } else {
            formGroup.get('confirmPassword')?.setErrors(null);
        }

        return null;
    }

    formatPhoneNumber(phone: string): string {
        if (!phone) return '';

        // Enlever les parenthèses, espaces et tirets
        return phone.replace(/[\(\)\s-]/g, '');
    }

    get f() { return this.userForm.controls; }

    // Charger les utilisateurs avec pagination
    loadUsers(event?: TableLazyLoadEvent) {
        this.loading = true;

        let page = event ? event.first! / event.rows! : 0;
        let size = event ? event.rows! : this.rowsPerPage;
        let sort = [this.selectedSort];

        if (event && event.sortField) {
            const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
            sort = [`${event.sortField},${sortOrder}`];
            this.selectedSort = sort[0];
        }

        let apiCall: Observable<PaginatedResponse<User>>;

        switch (this.activeTab) {
            case 'ALL':
                apiCall = this.usersService.getAllUsers(page, size, sort);
                break;
            case 'RECRUITER':
                apiCall = this.usersService.getRecruiters(page, size, sort);
                break;
            case 'JOB_SEEKER':
                apiCall = this.usersService.getJobSeekers(page, size, sort);
                break;
            default:
                apiCall = this.usersService.getAllUsers(page, size, sort);
        }

        apiCall.subscribe({
            next: (response: PaginatedResponse<User>) => {
                this.handleApiResponse(response);
            },
            error: (error) => {
                this.handleApiError(error);
            }
        });
    }

    private handleApiResponse(response: PaginatedResponse<User>) {

        // Vérifier si la réponse contient des données
        if (response && response.content) {
            this.filteredUsers = response.content;
            this.totalRecords = response.totalElements || 0;
            this.currentPage = response.number || 0;

            // Si c'est le tab ALL, mettre à jour allUsers
            if (this.activeTab === 'ALL') {
                this.allUsers = response.content;
            }

            // Mettre à jour les compteurs des onglets
            this.updateTabCounts();
        } else {
            console.warn('Réponse API invalide:', response);
            this.filteredUsers = [];
            this.totalRecords = 0;
        }

        this.loading = false;
    }

    private handleApiError(error: any) {
        console.error(`Erreur lors du chargement des ${this.activeTab}:`, error);
        this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: `Échec du chargement des ${this.getPageTitle().toLowerCase()}`,
            life: 3000
        });
        this.loading = false;
        this.filteredUsers = [];
        this.totalRecords = 0;
    }

    // Mettre à jour les compteurs des onglets
    updateTabCounts(): void {
        // Pour le tab ALL, compter les rôles dans allUsers
        if (this.activeTab === 'ALL') {
            const recruiterCount = this.allUsers.filter(u => u.role === 'RECRUITER').length;
            const jobSeekerCount = this.allUsers.filter(u => u.role === 'JOB_SEEKER').length;

            this.tabs[0].count = this.allUsers.length;
            this.tabs[1].count = recruiterCount;
            this.tabs[2].count = jobSeekerCount;
        }
        // Pour les autres tabs, utiliser totalRecords
        else if (this.activeTab === 'RECRUITER') {
            this.tabs[1].count = this.totalRecords;
        } else if (this.activeTab === 'JOB_SEEKER') {
            this.tabs[2].count = this.totalRecords;
        }
    }

    // Changer d'onglet
    onTabChange(event: any): void {
        const tabIndex = event.index;
        const tab = this.tabs[tabIndex];

        this.activeTab = tab.value as UserTabType;
        this.activeTabIndex = tabIndex;
        this.currentPage = 0;
        this.selectedSort = 'fullName,asc';
        this.selectedUsers = [];

        // Recharger les données pour le nouvel onglet
        this.loadUsers();
    }

    // Rafraîchir les données
    refreshData(): void {
        this.loadUsers();
    }

    // Ouvrir la boîte de dialogue pour créer un nouvel utilisateur
    openNew(): void {
        this.user = {};
        this.submitted = false;
        this.isEditMode = false;
        this.userForm.reset({
            role: 'RECRUITER',
            active: true,
            yearsOfExperience: 0
        });
        this.userDialog = true;
    }

    // Éditer un utilisateur
    editUser(user: User): void {
        if (!user.id) return;

        this.user = { ...user };
        this.isEditMode = true;
        this.submitted = false;

        // Préparer les données selon le rôle
        if (user.role === 'RECRUITER') {
            this.userForm.patchValue({
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber || '',
                role: user.role,
                active: user.active !== undefined ? user.active : true,
                companyName: user.companyName || '',
                companyWebsite: user.companyWebsite || '',
                position: user.position || '',
                industry: user.industry || '',
                companyCity: user.companyCity || '',
                companySize: user.companySize || '',
                businessRegistrationNumber: user.businessRegistrationNumber || ''
            });
        } else if (user.role === 'JOB_SEEKER') {
            this.userForm.patchValue({
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber || '',
                role: user.role,
                active: user.active !== undefined ? user.active : true,
                currentTitle: user.currentTitle || '',
                city: user.city || '',
                skills: user.skills || '',
                yearsOfExperience: user.yearsOfExperience || 0
            });
        }

        this.userDialog = true;
    }

// Sauvegarder l'utilisateur
    saveUser(): void {
        this.submitted = true;

        if (this.userForm.invalid) {
            return;
        }

        const formData = this.userForm.value;

        // Formater le numéro de téléphone
        const formattedPhone = this.formatPhoneNumber(formData.phoneNumber);

        // Déterminer accountType à partir du rôle
        const accountType = formData.role as 'RECRUITER' | 'JOB_SEEKER' | 'ADMIN';

        // Préparer les données selon le mode (création vs édition)
        let userData: any;

        if (this.isEditMode) {
            // Pour l'édition
            userData = {
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formattedPhone,
                role: formData.role,
                active: formData.active,
                // Inclure les champs spécifiques au rôle
                ...this.getRoleSpecificData(formData)
            };

            // Nettoyer les champs undefined/null
            userData = this.cleanData(userData);
        } else {
            // Pour la création - respecter le format de l'API
            userData = {
                accountType: accountType, // <-- CORRECTION ICI
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formattedPhone,
                password: formData.password,
                // Le champ 'role' n'est peut-être pas nécessaire pour la création
                // si accountType fait le même travail
                ...this.getRoleSpecificData(formData, accountType)
            };
        }

        this.loading = true;

        if (this.isEditMode && this.user.id) {
            this.usersService.updateUser(this.user.id, userData).subscribe({
                next: (response) => {
                    this.handleSaveSuccess('Utilisateur mis à jour avec succès');
                },
                error: (error) => {
                    this.handleSaveError('Échec de la mise à jour de l\'utilisateur', error);
                }
            });
        } else {
            // Création d'un nouvel utilisateur
            this.usersService.register(userData).subscribe({
                next: (response) => {
                    this.handleSaveSuccess('Utilisateur créé avec succès');
                },
                error: (error) => {
                    this.handleSaveError('Échec de la création de l\'utilisateur', error);
                }
            });
        }
    }

    // Dans votre composant UsersManagementComponent, ajoutez cette méthode :
    private handleSaveError(defaultMessage: string, error: any): void {
        console.error('Erreur lors de la sauvegarde:', error);

        let errorMessage = defaultMessage;

        // Extraire le message d'erreur de la réponse API
        if (error.error) {
            const apiError = error.error;

            // Si l'API retourne un message détaillé
            if (apiError.message) {
                errorMessage = apiError.message;
            }

            // Si l'API retourne des détails de validation
            if (apiError.details) {
                const details = apiError.details;
                const detailMessages = Object.entries(details)
                    .map(([field, message]) => `${field}: ${message}`)
                    .join(', ');

                if (detailMessages) {
                    errorMessage += ` - ${detailMessages}`;
                }
            }

            // Si c'est une erreur 400 avec un message simple
            if (error.status === 400 && typeof apiError === 'string') {
                errorMessage = apiError;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMessage,
            life: 5000 // Augmenter la durée pour lire les détails
        });

        this.loading = false;
    }

// Et aussi la méthode handleSaveSuccess :
    private handleSaveSuccess(message: string): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: message,
            life: 3000
        });

        this.userDialog = false;
        this.refreshData();
        this.loading = false;
    }

    // Nettoyer les données (enlever les champs undefined)
    private cleanData(data: any): any {
        const cleaned: any = {};
        for (const key in data) {
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                cleaned[key] = data[key];
            }
        }
        return cleaned;
    }

// Obtenir les données spécifiques au rôle
    private getRoleSpecificData(formData: any, accountType?: string): any {
        const role = accountType || formData.role;

        if (role === 'JOB_SEEKER') {
            return {
                currentTitle: formData.currentTitle || '',
                city: formData.city || '',
                skills: formData.skills || '',
                yearsOfExperience: formData.yearsOfExperience || 0
            };
        } else if (role === 'RECRUITER') {
            return {
                companyName: formData.companyName || '',
                companyWebsite: formData.companyWebsite || '',
                position: formData.position || '',
                industry: formData.industry || '',
                companyCity: formData.companyCity || '',
                companySize: formData.companySize || '',
                businessRegistrationNumber: formData.businessRegistrationNumber || ''
            };
        }
        return {};
    }

    // Cacher la boîte de dialogue
    hideDialog(): void {
        this.userDialog = false;
        this.submitted = false;
    }

    // Supprimer un utilisateur
    deleteUser(user: User): void {
        if (!user.id) return;

        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer "${user.fullName}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.usersService.deleteUser(user.id!).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Utilisateur supprimé avec succès',
                            life: 3000
                        });
                        this.refreshData();
                    },
                    error: (error) => {
                        console.error('Erreur lors de la suppression:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Échec de la suppression de l\'utilisateur',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    // Activer/Désactiver un utilisateur
    toggleStatus(user: User) {
        if (!user.id) return;

        const newStatus = !user.active;
        const action = newStatus ? 'activer' : 'désactiver';
        const actionPast = newStatus ? 'activé' : 'désactivé';

        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir ${action} "${user.fullName}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, appliquer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-success',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.executeToggleStatus(user.id!, newStatus, actionPast, user);
            },
            reject: () => {
                this.currentTogglingId = null;
            }
        });
    }

    private executeToggleStatus(id: number, newStatus: boolean, action: string, user: User): void {
        this.currentTogglingId = id;

        this.usersService.toggleUserStatus(id, newStatus).subscribe({
            next: (response) => {
                // Mettre à jour l'utilisateur localement immédiatement
                user.active = newStatus;

                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: `Utilisateur ${action} avec succès`,
                    life: 3000
                });

                this.currentTogglingId = null;

                // Optionnel: Recharger les données
                // this.refreshData();
            },
            error: (error) => {
                console.error('Erreur lors du changement de statut:', error);

                let errorMessage = `Échec de la ${action === 'activé' ? 'désactivation' : 'activation'}`;
                if (error.error && error.error.message) {
                    errorMessage = error.error.message;
                } else if (error.status === 404) {
                    errorMessage = 'Utilisateur non trouvé';
                } else if (error.status === 403) {
                    errorMessage = 'Permission refusée';
                }

                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: errorMessage,
                    life: 3000
                });

                this.currentTogglingId = null;
            }
        });
    }


    // Supprimer les utilisateurs sélectionnés
    deleteSelectedUsers(): void {
        if (!this.selectedUsers.length) return;

        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer ${this.selectedUsers.length} utilisateur(s) ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, Supprimer tout',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                // Supprimer chaque utilisateur sélectionné
                const deleteObservables = this.selectedUsers
                    .filter(user => user.id)
                    .map(user => this.usersService.deleteUser(user.id!));

                // Implémenter la suppression multiple si nécessaire
                console.log('Supprimer les utilisateurs sélectionnés:', this.selectedUsers);

                // Réinitialiser la sélection
                this.selectedUsers = [];
            }
        });
    }

    // Méthodes utilitaires
    getRoleLabel(role: string | undefined): string {
        switch(role) {
            case 'RECRUITER': return 'Recruteur';
            case 'JOB_SEEKER': return 'Candidat';
            case 'ADMIN': return 'Administrateur';
            default: return role || '';
        }
    }

    getRoleBadgeClass(role: string | undefined): string {
        switch(role) {
            case 'RECRUITER': return 'badge-recruiter';
            case 'JOB_SEEKER': return 'badge-job_seeker';
            case 'ADMIN': return 'badge-admin';
            default: return 'badge-inactive';
        }
    }

    getStatusBadgeClass(active: boolean | undefined): string {
        return active ? 'badge-active' : 'badge-inactive';
    }

    getStatusLabel(active: boolean | undefined): string {
        return active ? 'Actif' : 'Inactif';
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

    getTotalPages(): number {
        if (!this.totalRecords || this.totalRecords <= 0 || !this.rowsPerPage || this.rowsPerPage <= 0) {
            return 1;
        }
        return Math.ceil(this.totalRecords / this.rowsPerPage);
    }

    onLazyLoad(event: TableLazyLoadEvent) {
        this.loadUsers(event);
    }

    onGlobalFilter(event: Event) {
        if (this.dt) {
            this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
        }
    }

    // Obtenir le titre de la page selon l'onglet
    getPageTitle(): string {
        switch (this.activeTab) {
            case 'ALL': return 'Tous les utilisateurs';
            case 'RECRUITER': return 'Recruteurs';
            case 'JOB_SEEKER': return 'Candidats';
            default: return 'Gestion des utilisateurs';
        }
    }

    // Pour le template, utiliser filteredUsers
    get users(): User[] {
        return this.filteredUsers;
    }

    // Méthode pour afficher la complétude du profil
    showProfileCompleteness(user: User): void {
        if (!user.id) return;

        this.selectedUserForCompleteness = user;
        this.completenessLoading = true;
        this.completenessDialog = true;

        this.usersService.getProfileCompleteness(user.id).subscribe({
            next: (response) => {
                this.profileCompleteness = response;
                this.completenessLoading = false;
            },
            error: (error) => {
                console.error('Erreur lors du chargement de la complétude:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger le taux de complétude',
                    life: 3000
                });
                this.completenessLoading = false;
                this.completenessDialog = false;
            }
        });
    }

    // Méthode pour obtenir l'icône selon le champ
    getFieldIcon(field: string): string {
        const iconMap: { [key: string]: string } = {
            'Email': 'pi pi-envelope',
            'Nom complet': 'pi pi-user',
            'Photo de profil': 'pi pi-image',
            'Numéro de téléphone': 'pi pi-phone',
            'Titre actuel': 'pi pi-briefcase',
            'Ville': 'pi pi-map-marker',
            'Adresse': 'pi pi-home',
            'Compétences': 'pi pi-code',
            'Biographie': 'pi pi-file-edit',
            'CV': 'pi pi-file-pdf',
            'Années d\'expérience': 'pi pi-calendar',
            'Niveau d\'éducation': 'pi pi-graduation-cap',
            'Portfolio': 'pi pi-folder-open',
            'Site web': 'pi pi-globe',
            'Entreprise': 'pi pi-building',
            'Poste': 'pi pi-id-card',
            'Secteur d\'activité': 'pi pi-chart-bar',
            'Taille de l\'entreprise': 'pi pi-users',
            'Date de naissance': 'pi pi-calendar',
            'Pays': 'pi pi-flag',
            'Salaire attendu': 'pi pi-money-bill',
            'Types d\'emploi préférés': 'pi pi-heart',
            'Lieux préférés': 'pi pi-map'
        };

        return iconMap[field] || 'pi pi-circle';
    }

    getUserCompletenessPercentage(user: User): number {
        if (!user.id) return 0;
        return this.userCompletenessCache.get(user.id)?.completenessPercentage || 0;
    }

    // Mettez à jour la méthode getCompletenessLabel
    getCompletenessLabel(percentage: number): string {
        if (percentage >= 90) return 'Profil excellent';
        if (percentage >= 70) return 'Profil complet';
        if (percentage >= 50) return 'Profil acceptable';
        if (percentage >= 30) return 'Profil à compléter';
        return 'Profil très incomplet';
    }

// Mettez à jour la méthode getCompletenessClass
    getCompletenessClass(percentage: number): string {
        if (percentage >= 80) return 'completeness-excellent';
        if (percentage >= 60) return 'completeness-good';
        if (percentage >= 40) return 'completeness-average';
        if (percentage >= 20) return 'completeness-poor';
        return 'completeness-very-poor';
    }
}
