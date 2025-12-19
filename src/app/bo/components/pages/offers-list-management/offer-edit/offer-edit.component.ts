import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApisOfferService, JobOffer } from '../../../../service/apis-offer.service';
import { ApisAuthService } from '../../../../service/apis-auth.service';

@Component({
    selector: 'app-offer-edit',
    templateUrl: './offer-edit.component.html',
    styleUrls: ['./offer-edit.component.scss'],
    providers: [MessageService]
})
export class OfferEditComponent implements OnInit, OnDestroy {

    offer: JobOffer | null = null;
    loading: boolean = true;
    saving: boolean = false;
    offerId!: number;
    isEditMode: boolean = false;

    // Formulaire
    offerForm!: FormGroup;

    // Options pour les dropdowns
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

    educationLevels = [
        { label: 'Aucun', value: 'NONE' },
        { label: 'BAC', value: 'HIGH_SCHOOL' },
        { label: 'BAC+2', value: 'ASSOCIATE' },
        { label: 'BAC+3', value: 'BACHELOR' },
        { label: 'BAC+5', value: 'MASTER' },
        { label: 'Doctorat', value: 'DOCTORATE' }
    ];

    currencies = [
        { label: 'FCFA', value: 'FCFA' },
        { label: 'EUR (€)', value: 'EUR' },
        { label: 'USD ($)', value: 'USD' }
    ];

    minDeadlineDate: Date = new Date();

    private routeSubscription!: Subscription;
    private user: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private fb: FormBuilder,
        private offerService: ApisOfferService,
        private authService: ApisAuthService,
        private messageService: MessageService
    ) {
        this.user = this.authService.getCurrentUser();
        this.initForm();
        this.minDeadlineDate.setDate(this.minDeadlineDate.getDate() + 1);
    }

    ngOnInit(): void {
        this.loadOffer();
    }

    ngOnDestroy(): void {
        if (this.routeSubscription) {
            this.routeSubscription.unsubscribe();
        }
    }

    private initForm(): void {
        this.offerForm = this.fb.group({
            // Informations de base
            title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
            companyName: ['', [Validators.required, Validators.maxLength(100)]],

            // Localisation
            city: ['', [Validators.required]],
            country: ['France', [Validators.required]],

            // Description - CORRECTION: Supprimer minLength pour les champs existants
            description: ['', [Validators.required]],
            requirements: ['', [Validators.required]], // CORRECTION: Supprimer minLength
            skillsRequired: ['', [Validators.required]],

            // Type et statut
            jobType: ['FULL_TIME', [Validators.required]],
            status: ['DRAFT', [Validators.required]],

            // Salaire
            salaryMin: [null, [Validators.required, Validators.min(0)]],
            salaryMax: [null],
            salaryCurrency: ['FCFA', [Validators.required]],

            // Expérience et éducation
            experienceRequired: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
            educationLevel: ['NONE'],

            // Dates
            startDate: [null],
            applicationDeadline: [null, [Validators.required]],

            // Options
            remoteAllowed: [false],
            isFeatured: [false],
            isUrgent: [false]
        }, { validators: this.salaryValidator });
    }


    private salaryValidator(group: AbstractControl): { [key: string]: boolean } | null {
        const formGroup = group as FormGroup;
        const salaryMin = formGroup.get('salaryMin')?.value;
        const salaryMax = formGroup.get('salaryMax')?.value;

        if (salaryMin !== null && salaryMax !== null && salaryMax > 0 && salaryMax < salaryMin) {
            return { salaryRangeInvalid: true };
        }
        return null;
    }

    private loadOffer(): void {
        this.routeSubscription = this.route.params.subscribe(params => {
            this.offerId = +params['id'];
            this.isEditMode = !!this.offerId;

            if (this.isEditMode) {
                this.loading = true;

                this.offerService.getOfferById(this.offerId).subscribe({
                    next: (offer) => {
                        this.offer = offer;
                        this.populateForm(offer);
                        this.loading = false;

                        // IMPORTANT: Marquer le formulaire comme untouched après le chargement
                        setTimeout(() => {
                            this.offerForm.markAsPristine();
                        }, 0);
                    },
                    error: (error) => {
                        console.error('Erreur lors du chargement de l\'offre:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Impossible de charger l\'offre',
                            life: 3000
                        });
                        this.loading = false;
                        this.router.navigate(['/offers']);
                    }
                });
            } else {
                // Mode création
                this.loading = false;
                this.offer = null;

                // Pour le mode création, on peut marquer tous les champs comme touched
                // pour afficher les erreurs immédiatement
                setTimeout(() => {
                    Object.keys(this.offerForm.controls).forEach(key => {
                        const control = this.offerForm.get(key);
                        if (control && Validators.required(control) !== null) {
                            control.markAsTouched();
                        }
                    });
                }, 100);
            }
        });
    }

    private populateForm(offer: JobOffer): void {
        // Convertir les dates string en objets Date
        let deadline: Date | null = null;
        let startDate: Date | null = null;

        if (offer.applicationDeadline) {
            deadline = this.parseDateString(offer.applicationDeadline);
        }

        if (offer.startDate) {
            startDate = this.parseDateString(offer.startDate);
        }

        let currency = offer.salaryCurrency || 'FCFA';
        const currencyExists = this.currencies.some(c => c.value === currency);
        if (!currencyExists) {
            currency = 'FCFA';
        }

        this.offerForm.patchValue({
            title: offer.title,
            companyName: offer.companyName,
            city: offer.city,
            country: offer.country,
            description: offer.description,
            requirements: offer.requirements,
            skillsRequired: offer.skillsRequired,
            jobType: offer.jobType,
            status: offer.status,
            salaryMin: offer.salaryMin,
            salaryMax: offer.salaryMax || null,
            salaryCurrency: currency,
            experienceRequired: offer.experienceRequired,
            educationLevel: offer.educationLevel || 'NONE',
            startDate: startDate,
            applicationDeadline: deadline,
            remoteAllowed: offer.remoteAllowed || false,
            isFeatured: offer.isFeatured || false,
            isUrgent: offer.isUrgent || false
        }, { emitEvent: false });

        // Réinitialiser l'état du formulaire après le patchValue
        setTimeout(() => {
            this.offerForm.markAsPristine();
            this.offerForm.markAsUntouched();
        }, 0);
    }

    // Méthode pour parser les dates string en objets Date
    private parseDateString(dateString: string): Date | null {
        if (!dateString) return null;

        try {
            // Essayer de parser la date
            const date = new Date(dateString);

            // Vérifier si la date est valide
            if (isNaN(date.getTime())) {
                console.warn('Date invalide:', dateString);
                return null;
            }

            return date;
        } catch (error) {
            console.error('Erreur lors du parsing de la date:', error);
            return null;
        }
    }

    onSubmit(): void {
        // Marquer tous les champs comme touched pour déclencher la validation
        this.markAllAsTouched();

        if (this.offerForm.invalid) {
            console.log('Formulaire invalide:', this.offerForm.errors);
            Object.keys(this.offerForm.controls).forEach(key => {
                const control = this.offerForm.get(key);
                if (control?.invalid) {
                    console.log(`${key}:`, control.errors);
                }
            });
            return;
        }

        this.saving = true;
        const formData = this.prepareFormData();

        if (this.isEditMode) {
            this.updateOffer(formData);
        } else {
            this.createOffer(formData);
        }
    }

    private markAllAsTouched(): void {
        Object.keys(this.offerForm.controls).forEach(key => {
            const control = this.offerForm.get(key);
            control?.markAsTouched();
        });
    }

    private prepareFormData(): Partial<JobOffer> {
        const formValue = this.offerForm.value;

        // Formater les dates au format ISO string
        const deadline = this.formatDateForApi(formValue.applicationDeadline);
        const startDate = this.formatDateForApi(formValue.startDate);

        // Gérer le salaire maximum
        const salaryMax = formValue.salaryMax || formValue.salaryMin;

        return {
            title: formValue.title,
            companyName: formValue.companyName,
            description: formValue.description,
            requirements: formValue.requirements,
            skillsRequired: formValue.skillsRequired,
            jobType: formValue.jobType,
            status: formValue.status,
            city: formValue.city,
            country: formValue.country,
            salaryMin: formValue.salaryMin,
            salaryMax: salaryMax,
            salaryCurrency: formValue.salaryCurrency,
            experienceRequired: formValue.experienceRequired,
            educationLevel: formValue.educationLevel,
            applicationDeadline: deadline,
            startDate: startDate,
            remoteAllowed: formValue.remoteAllowed,
            isFeatured: formValue.isFeatured,
            isUrgent: formValue.isUrgent,
            recruiterId: this.user?.id,
        };
    }

    // Méthode pour formater les dates pour l'API (format ISO sans timezone)
    private formatDateForApi(date: Date | null): string | null {
        if (!date) return null;

        try {
            // Créer une date en UTC pour éviter les problèmes de timezone
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Erreur lors du formatage de la date:', error);
            return null;
        }
    }

    private createOffer(formData: Partial<JobOffer>): void {
        this.offerService.createOffer(formData).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Offre créée avec succès',
                    life: 3000
                });
                this.router.navigate(['/offers', response.id]);
            },
            error: (error) => {
                console.error('Erreur lors de la création:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec de la création de l\'offre',
                    life: 3000
                });
                this.saving = false;
            }
        });
    }

    private updateOffer(formData: Partial<JobOffer>): void {
        this.offerService.updateOffer(this.offerId, formData).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Offre mise à jour avec succès',
                    life: 3000
                });
                this.router.navigate(['/offers', this.offerId]);
            },
            error: (error) => {
                console.error('Erreur lors de la mise à jour:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec de la mise à jour de l\'offre',
                    life: 3000
                });
                this.saving = false;
            }
        });
    }

    onCancel(): void {
        if (this.isEditMode) {
            this.location.back();
        } else {
            this.router.navigate(['/offers']);
        }
    }

    saveAsDraft(): void {
        this.markAllAsTouched();

        if (this.offerForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Formulaire invalide',
                detail: 'Veuillez remplir les champs obligatoires',
                life: 3000
            });
            return;
        }

        this.saving = true;
        const formData = this.prepareFormData();
        formData.status = 'DRAFT';

        this.offerService.createOffer(formData).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Brouillon enregistré avec succès',
                    life: 3000
                });
                this.router.navigate(['/offres', response.id]);
            },
            error: (error) => {
                console.error('Erreur lors de la sauvegarde:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec de la sauvegarde du brouillon',
                    life: 3000
                });
                this.saving = false;
            }
        });
    }


    // Getters pour le template
    get title() { return this.offerForm.get('title'); }
    get companyName() { return this.offerForm.get('companyName'); }
    get description() { return this.offerForm.get('description'); }
    get requirements() { return this.offerForm.get('requirements'); }
    get skillsRequired() { return this.offerForm.get('skillsRequired'); }
    get city() { return this.offerForm.get('city'); }
    get salaryMin() { return this.offerForm.get('salaryMin'); }
    get salaryMax() { return this.offerForm.get('salaryMax'); }
    get applicationDeadline() { return this.offerForm.get('applicationDeadline'); }
    get todayDate(): Date { return new Date(); }


    // Méthode pour compter les champs invalides
    getInvalidFieldCount(): number {
        let count = 0;
        Object.keys(this.offerForm.controls).forEach(key => {
            const control = this.offerForm.get(key);
            if (control?.invalid) {
                count++;
            }
        });
        return count;
    }

}
