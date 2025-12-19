import { Component, OnInit } from '@angular/core';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ApisNotificationService} from "../../../service/apis-notification.service";
import {ApisAuthService} from "../../../service/apis-auth.service";
import {NotificationStats, NotificationType, Notification} from "../../../@core/notification.model";

@Component({
    selector: 'app-notifications-management',
    templateUrl: './notifications-management.component.html',
    styleUrls: ['./notifications-management.component.scss'],
    providers: [ConfirmationService, MessageService]
})
export class NotificationsManagementComponent implements OnInit {
    notifications: Notification[] = [];
    filteredNotifications: Notification[] = [];
    stats: NotificationStats | null = null;
    loading = true;

    // Filtres
    filterUnread = false;
    selectedTypes: NotificationType[] = [];

    // Pagination
    currentPage = 0;
    pageSize = 20;
    totalNotifications = 0;

    // Types disponibles pour le filtre
    notificationTypes = [
        { label: 'Correspondances emploi', value: NotificationType.JOB_MATCH },
        { label: 'Statut candidature', value: NotificationType.APPLICATION_STATUS },
        { label: 'Nouvelles offres', value: NotificationType.NEW_OFFER },
        { label: 'Offres expirantes', value: NotificationType.OFFER_EXPIRING },
        { label: 'Nouveaux candidats', value: NotificationType.NEW_CANDIDATE },
        { label: 'Invitations entretien', value: NotificationType.INTERVIEW_INVITE },
        { label: 'Messages', value: NotificationType.MESSAGE },
        { label: 'Rappels', value: NotificationType.REMINDER },
        { label: 'Alertes système', value: NotificationType.SYSTEM_ALERT }
    ];

    private user: any;

    constructor(
        private notificationService: ApisNotificationService,
        private authService: ApisAuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
    ) {
        this.user = this.authService.getCurrentUser();
    }

    ngOnInit(): void {
        this.loadStats();
        this.loadNotifications();
    }

    loadStats(): void {
        this.notificationService.getStats().subscribe({
            next: (stats) => {
                this.stats = stats;
            },
            error: (error) => {
                console.error('Erreur lors du chargement des statistiques:', error);
            }
        });
    }

    loadNotifications(): void {
        this.loading = true;

        this.notificationService.getNotifications(
            this.currentPage,
            this.pageSize,
            // !this.filterUnread,
            // this.selectedTypes.length > 0 ? this.selectedTypes : undefined
        ).subscribe({
            next: (notifications) => {
                this.notifications = notifications;
                this.filteredNotifications = [...notifications];
                this.totalNotifications = notifications.length;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erreur lors du chargement des notifications:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les notifications',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }

    markAsRead(notification: Notification): void {
        if (notification.isRead) return;

        this.notificationService.markAsRead([notification.id!]).subscribe({
            next: () => {
                notification.isRead = true;
                notification.readAt = new Date().toISOString();
                this.loadStats();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Notification marquée comme lue',
                    life: 2000
                });
            },
            error: (error) => {
                console.error('Erreur:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de marquer la notification comme lue',
                    life: 3000
                });
            }
        });
    }

    markAllAsRead(): void {
        this.notificationService.markAsRead().subscribe({
            next: () => {
                this.notifications.forEach(n => {
                    n.isRead = true;
                    n.readAt = new Date().toISOString();
                });
                this.loadStats();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Toutes les notifications ont été marquées comme lues',
                    life: 3000
                });
            },
            error: (error) => {
                console.error('Erreur:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de marquer toutes les notifications comme lues',
                    life: 3000
                });
            }
        });
    }

    deleteNotification(notification: Notification): void {
        if (!notification.id) return;

        this.notificationService.deleteNotification(notification.id).subscribe({
            next: () => {
                this.notifications = this.notifications.filter(n => n.id !== notification.id);
                this.filteredNotifications = this.filteredNotifications.filter(n => n.id !== notification.id);
                this.loadStats();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Notification supprimée',
                    life: 2000
                });
            },
            error: (error) => {
                console.error('Erreur:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de supprimer la notification',
                    life: 3000
                });
            }
        });
    }

    deleteAllRead(): void {
        this.notificationService.deleteReadNotifications().subscribe({
            next: () => {
                this.notifications = this.notifications.filter(n => !n.isRead);
                this.filteredNotifications = this.filteredNotifications.filter(n => !n.isRead);
                this.loadStats();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Notifications lues supprimées',
                    life: 3000
                });
            },
            error: (error) => {
                console.error('Erreur:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de supprimer les notifications lues',
                    life: 3000
                });
            }
        });
    }

    applyFilters(): void {
        this.currentPage = 0;
        this.loadNotifications();
    }

    resetFilters(): void {
        this.filterUnread = false;
        this.selectedTypes = [];
        this.applyFilters();
    }

    onPageChange(event: any): void {
        this.currentPage = event.first / event.rows;
        this.pageSize = event.rows;
        this.loadNotifications();
    }

    getNotificationIcon(type: NotificationType): string {
        const icons: Record<NotificationType, string> = {
            [NotificationType.JOB_MATCH]: 'pi pi-briefcase text-blue-500',
            [NotificationType.APPLICATION_STATUS]: 'pi pi-file-edit text-green-500',
            [NotificationType.NEW_OFFER]: 'pi pi-plus-circle text-purple-500',
            [NotificationType.OFFER_EXPIRING]: 'pi pi-clock text-orange-500',
            [NotificationType.SYSTEM_ALERT]: 'pi pi-exclamation-circle text-red-500',
            [NotificationType.MESSAGE]: 'pi pi-comments text-teal-500',
            [NotificationType.NEW_CANDIDATE]: 'pi pi-user-plus text-pink-500',
            [NotificationType.INTERVIEW_INVITE]: 'pi pi-calendar text-indigo-500',
            [NotificationType.REMINDER]: 'pi pi-bell text-yellow-500'
        };
        return icons[type] || 'pi pi-info-circle text-gray-500';
    }

    getNotificationTypeLabel(type: NotificationType): string {
        const labels: Record<NotificationType, string> = {
            [NotificationType.JOB_MATCH]: 'Correspondance emploi',
            [NotificationType.APPLICATION_STATUS]: 'Statut candidature',
            [NotificationType.NEW_OFFER]: 'Nouvelle offre',
            [NotificationType.OFFER_EXPIRING]: 'Offre expirante',
            [NotificationType.SYSTEM_ALERT]: 'Alerte système',
            [NotificationType.MESSAGE]: 'Message',
            [NotificationType.NEW_CANDIDATE]: 'Nouveau candidat',
            [NotificationType.INTERVIEW_INVITE]: 'Invitation entretien',
            [NotificationType.REMINDER]: 'Rappel'
        };
        return labels[type] || 'Notification';
    }
}
