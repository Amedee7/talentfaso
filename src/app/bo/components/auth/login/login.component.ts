import {Component, OnInit} from '@angular/core';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { Router, ActivatedRoute } from '@angular/router';
import {ApisAuthService, User} from "../../../service/apis-auth.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ConfirmationService, MessageService} from "primeng/api";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class LoginComponent implements OnInit {

    valCheck: string[] = ['remember'];

    // Formulaire réactif
    loginForm!: FormGroup;

    // Variables d'état
    loading: boolean = false;
    showPassword: boolean = false;

    // Message d'erreur général
    generalErrorMessage: string | null = null;

    // Ajoutez cette propriété pour stocker l'URL de retour
    returnUrl: string = '/dashboard';

    constructor(
        public layoutService: LayoutService,
        private apiService: ApisAuthService,
        private router: Router,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private messageService: MessageService,
    ) {
    }


    ngOnInit() {
        this.initForm();

        // Récupérer l'URL de retour depuis les query params
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

        // console.log('URL de retour détectée:', this.returnUrl);

        // Vérifier si l'utilisateur est déjà connecté (gardez cette logique)
        if (this.apiService.isAuthenticated()) {
            // console.log('Utilisateur déjà connecté, redirection vers:', this.returnUrl);
            this.router.navigate([this.returnUrl]);
            return;
        }

        // Vérifier si la session a expiré
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('sessionExpired') === 'true') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Session expirée',
                detail: 'Votre session a expiré. Veuillez vous reconnecter.',
                life: 5000
            });
        }
    }

    initForm() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rememberMe: [false]
        });
    }

    // Getters pour accéder facilement aux contrôles du formulaire
    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }

    get rememberMe() {
        return this.loginForm.get('rememberMe');
    }

    // Méthode pour basculer la visibilité du mot de passe
    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    onLogin() {
        this.loading = true;
        this.generalErrorMessage = null;

        if (this.loginForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Veuillez corriger les erreurs du formulaire',
                life: 3000
            });
            this.loading = false;
            return;
        }

        const loginPayload = {
            email: this.email?.value.trim(),
            password: this.password?.value
        };

        // console.log('Tentative de connexion avec:', loginPayload.email);

        this.apiService.login(loginPayload).subscribe({
            next: (response) => {
                // console.log('Connexion réussie:', response);

                // La réponse est maintenant de type AuthResponse
                if (!response || !response.user) {
                    throw new Error('Réponse de connexion invalide');
                }

                const user = response.user;

                // Vérifier si c'est la première connexion
                if (user.isFirstLogin) {
                    this.handleFirstLogin(user);
                    return;
                }

                // Vérifier si le compte est actif
                if (user.active === false) {
                    this.handleInactiveAccount(user);
                    return;
                }

                // Vérifier le statut de vérification
                this.handleVerificationStatus(user);

                // Afficher un message de bienvenue personnalisé
                this.showWelcomeMessage(user);

                // Rediriger en fonction du rôle
                this.redirectBasedOnRole(user);
            },
            error: (error) => {
                this.handleLoginError(error);
            }
        });
    }

// Nouvelle méthode pour gérer la première connexion
    private handleFirstLogin(user: User): void {
        this.loading = false;

        this.messageService.add({
            severity: 'info',
            summary: 'Première connexion',
            detail: 'Veuillez changer votre mot de passe pour continuer',
            life: 5000
        });

        // Rediriger vers la page de changement de mot de passe
        setTimeout(() => {
            this.router.navigate(['/auth/first-login'], {
                queryParams: { email: user.email }
            });
        }, 1500);
    }


// Méthode pour gérer les comptes inactifs
    private handleInactiveAccount(user: User): void {
        this.loading = false;
        this.messageService.add({
            severity: 'warn',
            summary: 'Compte désactivé',
            detail: 'Votre compte a été désactivé. Contactez l\'administrateur.',
            life: 5000
        });

        // Option: Rediriger vers une page de réactivation
        // this.router.navigate(['/auth/reactivate']);
    }

// Méthode pour gérer le statut de vérification
    private handleVerificationStatus(user: User): void {
        switch (user.verificationStatus) {
            case 'PENDING':
                this.messageService.add({
                    severity: 'info',
                    summary: 'Vérification en attente',
                    detail: 'Votre compte est en cours de vérification. Vous pourrez accéder à toutes les fonctionnalités une fois vérifié.',
                    life: 6000
                });
                break;

            case 'REJECTED':
                this.messageService.add({
                    severity: 'error',
                    summary: 'Vérification rejetée',
                    detail: 'Votre compte a été rejeté. Contactez le support pour plus d\'informations.',
                    life: 6000
                });
                break;

            case 'VERIFIED':
                // Tout va bien
                break;
        }
    }

// Méthode pour afficher un message de bienvenue personnalisé
    private showWelcomeMessage(user: User): void {
        const welcomeMessage = user.role === 'RECRUITER'
            ? `Bienvenue ${user.fullName} ! Prêt à trouver les meilleurs talents ?`
            : `Bienvenue ${user.fullName} ! Prêt à trouver votre prochain emploi ?`;

        this.messageService.add({
            severity: 'success',
            summary: 'Connexion réussie',
            detail: welcomeMessage,
            life: 3000
        });
    }


    // Récupérer l'URL de retour depuis les paramètres de requête
    private getReturnUrl(): string {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('returnUrl') || '/';
    }


// Gestion améliorée des erreurs
// login.component.ts - méthode handleLoginError améliorée
    private handleLoginError(error: any): void {
        console.error('Erreur de connexion détaillée:', error);
        this.loading = false;

        let errorMessage = 'Une erreur est survenue lors de la connexion';
        let errorSummary = 'Erreur';
        let severity: 'error' | 'warn' = 'error';

        // Gérer différents types d'erreurs
        if (error.status) {
            switch (error.status) {
                case 0:
                    errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
                    errorSummary = 'Erreur réseau';
                    break;
                case 400:
                    errorMessage = 'Requête invalide. Veuillez vérifier vos informations.';
                    errorSummary = 'Erreur de validation';
                    break;
                case 401:
                case 403:
                    errorMessage = 'Email ou mot de passe incorrect';
                    errorSummary = 'Authentification échouée';
                    break;
                case 404:
                    errorMessage = 'Service de connexion non trouvé. Contactez l\'administrateur.';
                    errorSummary = 'Service indisponible';
                    break;
                case 422:
                    errorMessage = 'Données de connexion invalides.';
                    errorSummary = 'Erreur de validation';
                    break;
                case 429:
                    errorMessage = 'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.';
                    errorSummary = 'Trop de tentatives';
                    severity = 'warn';
                    break;
                case 500:
                    errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
                    errorSummary = 'Erreur serveur';
                    break;
                case 503:
                    errorMessage = 'Service temporairement indisponible. Veuillez réessayer plus tard.';
                    errorSummary = 'Service indisponible';
                    break;
                default:
                    if (error.message) {
                        errorMessage = error.message;
                    }
            }
        } else if (error.message) {
            // Utiliser le message d'erreur formaté
            errorMessage = error.message;
        }

        // Afficher l'erreur dans l'interface
        this.generalErrorMessage = errorMessage;
        this.messageService.add({
            severity: severity,
            summary: errorSummary,
            detail: errorMessage,
            life: 5000
        });

        // Réinitialiser le mot de passe pour la sécurité
        this.password?.reset();

        // Log supplémentaire pour le débogage
        console.log('Erreur de connexion traitée:', {
            summary: errorSummary,
            message: errorMessage,
            originalError: error
        });
    }

    // Naviguer vers la page d'inscription
    goToRegister() {
        this.router.navigate(['/auth/register']);
    }

    // Méthode pour réinitialiser le mot de passe (lien "Mot de passe oublié?")
    onForgotPassword() {
        if (!this.email?.value) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Email requis',
                detail: 'Veuillez entrer votre email pour réinitialiser le mot de passe',
                life: 3000
            });
            return;
        }

        // TODO: Implémenter la logique de réinitialisation de mot de passe
        this.messageService.add({
            severity: 'info',
            summary: 'Fonctionnalité à venir',
            detail: 'La réinitialisation de mot de passe sera bientôt disponible',
            life: 3000
        });
    }

// Générer un avatar par défaut avec les initiales
    private getDefaultAvatar(fullName: string): string {
        const initials = fullName
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);

        // Vous pouvez utiliser un service comme ui-avatars.com
        return `https://ui-avatars.com/api/?name=${initials}&background=2196F3&color=fff&size=128`;
    }


    // Mettez à jour la méthode redirectBasedOnRole :
    private redirectBasedOnRole(user: User): void {
        this.loading = false;

        // console.log('Redirection après connexion, returnUrl:', this.returnUrl);

        // Délai pour laisser voir le message de succès
        setTimeout(() => {
            // Vérifiez si l'URL de retour est valide et accessible pour le rôle
            let finalUrl = this.returnUrl;

            // Si l'URL de retour n'est pas valide ou inaccessible, utilisez l'URL par défaut selon le rôle
            if (!this.isUrlAccessibleForRole(this.returnUrl, user.role)) {
                finalUrl = this.getDefaultUrlForRole(user.role);
            }

            this.router.navigate([finalUrl]);
        }, 1000);
    }

    // Méthode pour vérifier si une URL est accessible pour un rôle
    private isUrlAccessibleForRole(url: string, role: string): boolean {
        // Liste des chemins par rôle
        const adminPaths = ['/dashboard', '/admin', '/users-management', '/roles-management', '/skill-types-management'];
        const recruiterPaths = ['/dashboard', '/recruiter'];
        const jobSeekerPaths = ['/dashboard', '/candidate'];

        const allowedPaths = role === 'ADMIN' ? adminPaths :
            role === 'RECRUITER' ? recruiterPaths :
                role === 'JOB_SEEKER' ? jobSeekerPaths : [];

        return allowedPaths.some(path => url.startsWith(path));
    }

    // Méthode pour obtenir l'URL par défaut selon le rôle
    private getDefaultUrlForRole(role: string): string {
        switch (role) {
            case 'ADMIN':
                return '/dashboard';
            case 'RECRUITER':
                return '/dashboard';
            case 'JOB_SEEKER':
                return '/dashboard';
            default:
                return '/dashboard';
        }
    }
}
