import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import {ApisOfferService, JobOffer, JobOfferResponse, OfferFilters} from "../../../../service/apis-offer.service";
import {ApisAuthService} from "../../../../service/apis-auth.service";

@Component({
    selector: 'app-offer-detail',
    templateUrl: './offer-detail.component.html',
    styleUrls: ['./offer-detail.component.scss'],
    providers: [MessageService, ConfirmationService],
})
export class OfferDetailComponent implements OnInit, OnDestroy {

    offer: JobOffer | null = null;
    loading: boolean = true;
    notFound: boolean = false;
    isRecruiterView: boolean = false;
    canApply: boolean = false;
    hasApplied: boolean = false;

    // Suggestions d'offres similaires
    similarOffers: JobOffer[] = [];

    private routeSubscription!: Subscription;
    private offerId!: number;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private offerService: ApisOfferService,
        private authService: ApisAuthService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.checkUserRole();
        this.loadOffer();
    }

    ngOnDestroy(): void {
        if (this.routeSubscription) {
            this.routeSubscription.unsubscribe();
        }
    }

    private checkUserRole(): void {
        const user = this.authService.getCurrentUser();
        this.isRecruiterView = user?.role === 'RECRUITER';
        this.canApply = user?.role === 'JOB_SEEKER';
    }

    private loadOffer(): void {
        this.routeSubscription = this.route.params.subscribe(params => {
            this.offerId = +params['id'];



            this.loading = true;
            this.notFound = false;

            // Charger les détails de l'offre
            this.offerService.getOfferById(this.offerId).subscribe({
                next: (offer) => {
                    this.handleOfferLoaded(offer);
                },
                error: (error) => {
                    this.handleOfferError(error);
                }
            });
        });
    }

    private handleOfferLoaded(offer: JobOffer): void {
        this.offer = offer;
        this.loading = false;

        // Vérifier si l'utilisateur a déjà postulé
        this.checkApplicationStatus();

        // Charger les offres similaires (si l'offre est publiée)
        if (offer.status === 'PUBLISHED') {
            this.loadSimilarOffers();
        }
    }

    private handleOfferError(error: any): void {
        this.loading = false;

        if (error.status === 404) {
            this.notFound = true;
            this.messageService.add({
                severity: 'error',
                summary: 'Offre non trouvée',
                detail: 'Cette offre n\'existe pas ou a été supprimée',
                life: 5000
            });
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Impossible de charger les détails de l\'offre',
                life: 3000
            });
            console.error('Erreur lors du chargement de l\'offre:', error);
        }
    }

    private incrementViews(): void {
        if (this.offerId && !this.isRecruiterView) {
            this.offerService.incrementViews(this.offerId).subscribe({
                error: (error) => console.error('Erreur lors de l\'incrémentation des vues:', error)
            });
        }
    }

    private checkApplicationStatus(): void {
        // À implémenter avec votre service de candidatures
        // Exemple: this.applicationService.hasApplied(this.offerId).subscribe(...)
        this.hasApplied = false; // Temporaire
    }

    private loadSimilarOffers(): void {
        // Charger des offres similaires basées sur les compétences ou le poste
        if (this.offer?.skillsRequired) {
            const skills = this.offer.skillsRequired.split(/[\n,;]/).map(s => s.trim());

            // Filtrer par compétences similaires (implémentation simplifiée)
            this.offerService.getOffers(0, 5, {
                skills: skills.slice(0, 3), // Prendre les 3 premières compétences
                status: ['PUBLISHED']
            }).subscribe({
                next: (response) => {
                    // Exclure l'offre actuelle des suggestions
                    this.similarOffers = response.content.filter(offer =>
                        offer.id !== this.offer?.id
                    ).slice(0, 4); // Limiter à 4 offres
                },
                error: (error) => {
                    console.error('Erreur lors du chargement des offres similaires:', error);
                }
            });
        }
    }

    // Méthodes utilitaires
    getSkillsArray(): string[] {
        if (!this.offer?.skillsRequired) return [];

        return this.offer.skillsRequired
            .split(/[\n,;]/)
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0);
    }

    getRequirementsArray(): string[] {
        if (!this.offer?.requirements) return [];

        return this.offer.requirements
            .split('\n')
            .map(req => req.trim())
            .filter(req => req.length > 0);
    }

    getSalaryRange(): string {
        if (!this.offer) return 'Non spécifié';

        if (this.offer.salaryMin === 0 && this.offer.salaryMax === 0) {
            return 'Non spécifié';
        }

        if (this.offer.salaryMin === this.offer.salaryMax) {
            return `${this.offer.salaryMin.toLocaleString('fr-FR')} ${this.offer.salaryCurrency}`;
        }

        return `${this.offer.salaryMin.toLocaleString('fr-FR')} - ${this.offer.salaryMax.toLocaleString('fr-FR')} ${this.offer.salaryCurrency}`;
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return 'Non spécifié';

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

    getJobTypeLabel(type: string): string {
        const labels: { [key: string]: string } = {
            'FULL_TIME': 'Temps plein',
            'PART_TIME': 'Temps partiel',
            'CONTRACT': 'Contrat',
            'INTERNSHIP': 'Stage',
            'TEMPORARY': 'Temporaire',
            'REMOTE': 'À distance'
        };
        return labels[type] || type;
    }

    getStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            'DRAFT': 'Brouillon',
            'PUBLISHED': 'Publiée',
            'CLOSED': 'Fermée',
            'ARCHIVED': 'Archivée',
            'EXPIRED': 'Expirée'
        };
        return labels[status] || status;
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

    // Actions
    applyToOffer(): void {
        if (!this.offer || !this.canApply || this.hasApplied) return;

        // Rediriger vers le formulaire de candidature
        this.router.navigate(['/applications/apply', this.offer.id]);

        // Ou ouvrir un modal de candidature
        // this.showApplicationModal = true;
    }

    editOffer(): void {
        if (!this.offer) return;

        // Option 1: Navigation directe (recommandée)
        // this.router.navigate(['/offer-edit', this.offer.id]);

        // Option 2: Avec le module actuel
        this.router.navigate(['edit'], { relativeTo: this.route });
    }

    toggleOfferStatus(): void {
        if (!this.offer) return;

        const newStatus = this.offer.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
        const action = newStatus === 'PUBLISHED' ? 'publier' : 'fermer';

        this.offerService.updateOfferStatus(this.offer.id!, newStatus).subscribe({
            next: (response) => {
                this.offer!.status = newStatus;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: `Offre ${action} avec succès`,
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

    toggleUrgentFlag(): void {
        if (!this.offer) return;

        this.offerService.updateOfferFlags(this.offer.id!, {
            isUrgent: !this.offer.isUrgent
        }).subscribe({
            next: (response) => {
                this.offer!.isUrgent = !this.offer!.isUrgent;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: `Offre marquée comme ${this.offer!.isUrgent ? 'urgente' : 'non urgente'}`,
                    life: 3000
                });
            },
            error: (error) => {
                console.error('Erreur lors de la modification:', error);
            }
        });
    }

    toggleFeaturedFlag(): void {
        if (!this.offer) return;

        this.offerService.updateOfferFlags(this.offer.id!, {
            isFeatured: !this.offer.isFeatured
        }).subscribe({
            next: (response) => {
                this.offer!.isFeatured = !this.offer!.isFeatured;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: `Offre ${this.offer!.isFeatured ? 'mise en avant' : 'retirée de la mise en avant'}`,
                    life: 3000
                });
            },
            error: (error) => {
                console.error('Erreur lors de la modification:', error);
            }
        });
    }

    deleteOffer(): void {
        if (!this.offer) return;

        // this.confirmationService.confirm({
        //   message: `Êtes-vous sûr de vouloir supprimer l'offre "${this.offer.title}" ?`,
        //   header: 'Confirmation',
        //   icon: 'pi pi-exclamation-triangle',
        //   accept: () => {
        //     this.offerService.deleteOffer(this.offer!.id!).subscribe({
        //       next: () => {
        //         this.messageService.add({
        //           severity: 'success',
        //           summary: 'Succès',
        //           detail: 'Offre supprimée avec succès',
        //           life: 3000
        //         });
        //         this.router.navigate(['/offers']);
        //       },
        //       error: (error) => {
        //         console.error('Erreur lors de la suppression:', error);
        //         this.messageService.add({
        //           severity: 'error',
        //           summary: 'Erreur',
        //           detail: 'Échec de la suppression de l\'offre',
        //           life: 3000
        //         });
        //       }
        //     });
        //   }
        // });
    }

    goBack(): void {
        this.location.back();
    }

    shareOffer(): void {
        if (!this.offer) return;

        const url = window.location.href;
        const title = `Offre: ${this.offer.title} - ${this.offer.companyName}`;

        // Partage via Web Share API si disponible
        if (navigator.share) {
            navigator.share({
                title: title,
                text: this.offer.description,
                url: url
            }).catch(error => console.log('Erreur de partage:', error));
        } else {
            // Fallback : copie dans le presse-papier
            navigator.clipboard.writeText(url).then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Lien copié',
                    detail: 'Le lien a été copié dans le presse-papier',
                    life: 3000
                });
            });
        }
    }

    printOffer(): void {
        window.print();
    }

    isOfferExpired(): boolean {
        if (!this.offer?.applicationDeadline) return false;

        const deadline = new Date(this.offer.applicationDeadline);
        const today = new Date();
        return deadline < today;
    }

    getTimeRemaining(): string {
        if (!this.offer?.applicationDeadline) return '';

        const deadline = new Date(this.offer.applicationDeadline);
        const today = new Date();

        if (deadline < today) return 'Offre expirée';

        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Clôture aujourd\'hui';
        if (diffDays === 1) return 'Clôture demain';
        if (diffDays < 7) return `Clôture dans ${diffDays} jour(s)`;
        if (diffDays < 30) return `Clôture dans ${Math.floor(diffDays / 7)} semaine(s)`;

        return `Clôture dans ${Math.floor(diffDays / 30)} mois`;
    }
}
