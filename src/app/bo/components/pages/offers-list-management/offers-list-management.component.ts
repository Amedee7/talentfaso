import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { MessageService, ConfirmationService } from 'primeng/api';
import {ApisOfferService, JobOffer, OfferFilters, JobOfferResponse} from "../../../service/apis-offer.service";
import {ApisAuthService} from "../../../service/apis-auth.service";
import {Observable} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: 'app-offers-list-management',
    templateUrl: './offers-list-management.component.html',
    styleUrls: ['./offers-list-management.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class OffersListManagementComponent implements OnInit {

    @ViewChild('dt') dt: Table | undefined;

    offers: JobOffer[] = [];
    selectedOffers: JobOffer[] = [];
    loading: boolean = true;

    // Pagination
    totalRecords: number = 0;
    rowsPerPage: number = 10;
    currentPage: number = 0;

    // Filtres
    filters: OfferFilters = {};
    showFilters: boolean = false;

    // Options de filtres
    jobTypes = [
        { label: 'Temps plein', value: 'FULL_TIME' },
        { label: 'Temps partiel', value: 'PART_TIME' },
        { label: 'Contrat', value: 'CONTRACT' },
        { label: 'Stage', value: 'INTERNSHIP' },
        { label: 'Temporaire', value: 'TEMPORARY' },
        { label: 'À distance', value: 'FREELANCE' }
    ];

    statusOptions = [
        { label: 'Brouillon', value: 'DRAFT' },
        { label: 'En attente', value: 'PENDING' },
        { label: 'Publié', value: 'PUBLISHED' },
        { label: 'Fermé', value: 'CLOSED' },
        { label: 'Annulé', value: 'CANCELLED' }
    ];

    experienceLevels = [
        { label: 'Débutant (0-2 ans)', value: 2 },
        { label: 'Intermédiaire (3-5 ans)', value: 5 },
        { label: 'Confirmé (6-10 ans)', value: 10 },
        { label: 'Expert (10+ ans)', value: 15 }
    ];

    // Tri
    sortOptions = [
        { label: 'Date (récent)', value: 'createdAt,desc' },
        { label: 'Date (ancien)', value: 'createdAt,asc' },
        { label: 'Salaire (haut)', value: 'salaryMax,desc' },
        { label: 'Salaire (bas)', value: 'salaryMin,asc' },
        { label: 'Urgent', value: 'isUrgent,desc' },
        { label: 'Vues', value: 'viewsCount,desc' }
    ];

    selectedSort: string = 'createdAt,desc';

    // Mode d'affichage
    isRecruiterView: boolean = false;

    constructor(
        private offerService: ApisOfferService,
        private authService: ApisAuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private route: ActivatedRoute,

    ) { }

    ngOnInit() {
        this.checkUserRole();
        this.loadOffers();
    }

    private checkUserRole(): void {
        const user = this.authService.getCurrentUser();
        // ADMIN et RECRUITER peuvent voir l'interface recruteur
        this.isRecruiterView = ['ADMIN', 'RECRUITER'].includes(user?.role);
    }

    // Vérifier si l'utilisateur est ADMIN
    isAdmin(): boolean {
        const user = this.authService.getCurrentUser();
        return user?.role === 'ADMIN';
    }

// Vérifier si l'utilisateur est RECRUITER
    isRecruiter(): boolean {
        const user = this.authService.getCurrentUser();
        return user?.role === 'RECRUITER';
    }

// Vérifier si l'utilisateur est le propriétaire de l'offre
    isOfferOwner(offer: JobOffer): boolean {
        const user = this.authService.getCurrentUser();

        if (user?.role === 'ADMIN') {
            return true; // ADMIN peut tout faire
        }

        return offer.recruiterId === user?.id;
    }


    loadOffers(event?: any): void {
        this.loading = true;

        let page = this.currentPage;
        let size = this.rowsPerPage;

        if (event) {
            page = event.first / event.rows;
            size = event.rows;
        }

        const sort = [this.selectedSort];

        let apiCall: Observable<JobOfferResponse>;

        if (this.isRecruiterView) {
            const user = this.authService.getCurrentUser();

            if (user?.role === 'ADMIN') {
                // ADMIN voit toutes les offres (sans filtre)
                apiCall = this.offerService.getOffers(page, size, {
                    ...this.filters
                }, sort);
            } else {
                // RECRUITER voit seulement ses offres
                apiCall = this.offerService.getMyOffers(page, size, this.filters);
            }
        } else {
            // Job seekers voient seulement les offres publiées
            apiCall = this.offerService.getOffers(page, size, {
                ...this.filters,
                status: ['PUBLISHED'] // Filtrer seulement les publiées
            }, sort);
        }

        apiCall.subscribe({
            next: (response) => {
                this.offers = response.content || [];
                this.totalRecords = response.totalElements || 0;
                this.currentPage = response.number || 0;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur lors du chargement des offres:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec du chargement des offres',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }


    // Appliquer les filtres
    applyFilters(): void {
        this.currentPage = 0;
        this.loadOffers();
        this.showFilters = false;
    }

    // Réinitialiser les filtres
    resetFilters(): void {
        this.filters = {};
        this.currentPage = 0;
        this.loadOffers();
    }

    // Méthodes utilitaires
    getJobTypeLabel(type: string): string {
        const jobType = this.jobTypes.find(t => t.value === type);
        return jobType?.label || type;
    }

    getStatusLabel(status: string): string {
        const statusOpt = this.statusOptions.find(s => s.value === status);
        return statusOpt?.label || status;
    }

    getStatusBadgeClass(status: string): string {
        switch(status) {
            case 'DRAFT': return 'badge-info';
            case 'PUBLISHED': return 'badge-success';
            case 'CLOSED': return 'badge-warning';
            case 'ARCHIVED': return 'badge-secondary';
            case 'EXPIRED': return 'badge-danger';
            default: return 'badge-light';
        }
    }

    getSalaryRange(offer: JobOffer): string {
        if (offer.salaryMin === 0 && offer.salaryMax === 0) {
            return 'Non spécifié';
        }

        if (offer.salaryMin === offer.salaryMax) {
            return `${offer.salaryMin.toLocaleString('fr-FR')} ${offer.salaryCurrency}`;
        }

        return `${offer.salaryMin.toLocaleString('fr-FR')} - ${offer.salaryMax.toLocaleString('fr-FR')} ${offer.salaryCurrency}`;
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

    viewOffer(offer: JobOffer): void {
        if (offer.id) {
            // Navigation relative à la route actuelle
            // this.router.navigate([offer.id], { relativeTo: this.route });

            // utiliser la route relative :
            this.router.navigate(['/offers-list-management', offer.id]);
        }
    }

    editOffer(offer: JobOffer): void {
        if (offer.id) {
            // Navigation absolue vers la page d'édition
            this.router.navigate(['/offers-list-management', offer.id, 'edit']);
        }
    }

    deleteOffer(offer: JobOffer): void {
        if (!offer.id) return;

        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer l'offre "${offer.title}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.offerService.deleteOffer(offer.id!).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Offre supprimée avec succès',
                            life: 3000
                        });
                        this.loadOffers();
                    },
                    error: (error) => {
                        console.error('Erreur lors de la suppression:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Échec de la suppression de l\'offre',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    toggleOfferStatus(offer: JobOffer): void {
        if (!offer.id) return;

        const newStatus = offer.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
        const action = newStatus === 'PUBLISHED' ? 'publier' : 'fermer';

        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir ${action} l'offre "${offer.title}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.offerService.updateOfferStatus(offer.id!, newStatus).subscribe({
                    next: (response) => {
                        offer.status = newStatus;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `Offre ${action === 'publier' ? 'publiée' : 'fermée'} avec succès`,
                            life: 3000
                        });
                    },
                    error: (error) => {
                        console.error('Erreur lors du changement de statut:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: `Échec de la ${action} de l'offre`,
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    toggleUrgentFlag(offer: JobOffer): void {
        if (!offer.id) return;

        this.offerService.updateOfferFlags(offer.id!, {
            isUrgent: !offer.isUrgent
        }).subscribe({
            next: (response) => {
                offer.isUrgent = !offer.isUrgent;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: `Offre marquée comme ${offer.isUrgent ? 'urgente' : 'non urgente'}`,
                    life: 3000
                });
            },
            error: (error) => {
                console.error('Erreur lors de la modification:', error);
            }
        });
    }

    toggleFeaturedFlag(offer: JobOffer): void {
        if (!offer.id) return;

        this.offerService.updateOfferFlags(offer.id!, {
            isFeatured: !offer.isFeatured
        }).subscribe({
            next: (response) => {
                offer.isFeatured = !offer.isFeatured;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: `Offre ${offer.isFeatured ? 'mise en avant' : 'retirée de la mise en avant'}`,
                    life: 3000
                });
            },
            error: (error) => {
                console.error('Erreur lors de la modification:', error);
            }
        });
    }

    // Pagination et tri
    onLazyLoad(event: any): void {
        this.loadOffers(event);
    }

    onSortChange(): void {
        this.currentPage = 0;
        this.loadOffers();
    }

    onGlobalFilter(event: Event): void {
        if (this.dt) {
            this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
        }
    }


// Méthode pour convertir les compétences en tableau
    getSkillsArray(offer: JobOffer): string[] {
        if (!offer.skillsRequired) return [];

        // Gérer différents formats de séparation
        return offer.skillsRequired
            .split(/[\n,;]/) // Séparer par retour à la ligne, virgule ou point-virgule
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0)
            .slice(0, 3); // Limiter à 3 compétences pour l'affichage
    }

// Méthode pour exporter en CSV
    exportToCSV(): void {
        if (this.dt) {
            this.dt.exportCSV();
            this.messageService.add({
                severity: 'success',
                summary: 'Export réussi',
                detail: 'Les données ont été exportées en CSV',
                life: 3000
            });
        }
    }

// Méthode pour formater la date avec heure
    formatDateTime(dateString: string | undefined): string {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

// Méthode pour vérifier si l'offre est nouvelle (moins de 7 jours)
    isNewOffer(offer: JobOffer): boolean {
        if (!offer.createdAt) return false;

        const createdDate = new Date(offer.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= 7;
    }

// Méthode pour obtenir le temps restant avant clôture
    getTimeRemaining(offer: JobOffer): string {
        if (!offer.applicationDeadline) return '';

        const deadline = new Date(offer.applicationDeadline);
        const today = new Date();

        if (deadline < today) return 'Expiré';

        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Aujourd\'hui';
        if (diffDays === 1) return 'Demain';
        if (diffDays < 7) return `${diffDays} jours`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} semaines`;

        return `${Math.floor(diffDays / 30)} mois`;
    }


// Méthodes de statistiques
    getTotalViews(): number {
        return this.offers.reduce((total, offer) => total + (offer.viewsCount || 0), 0);
    }

    getTotalApplications(): number {
        return this.offers.reduce((total, offer) => total + (offer.applicationsCount || 0), 0);
    }

    getPublishedCount(): number {
        return this.offers.filter(offer => offer.status === 'PUBLISHED').length;
    }

    getFeaturedCount(): number {
        return this.offers.filter(offer => offer.isFeatured).length;
    }

// Méthode pour vérifier si une offre est expirée
    isOfferExpired(offer: JobOffer): boolean {
        if (!offer.applicationDeadline) return false;

        const deadline = new Date(offer.applicationDeadline);
        const today = new Date();
        return deadline < today;
    }
}
