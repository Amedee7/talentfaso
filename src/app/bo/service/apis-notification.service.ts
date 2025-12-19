import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Notification,
    NotificationStats,
    CreateNotificationDto,
    MarkAsReadDto,
    NotificationType
} from '../@core/notification.model';

@Injectable({
    providedIn: 'root'
})
export class ApisNotificationService {
    private apiUrl = `${environment.apiUrl}/api/v1/mobile/notifications`;

    constructor(private http: HttpClient) {}

    // GET: Récupérer toutes les notifications de l'utilisateur
    getNotifications(
        page: number = 0,
        size: number = 20,
        // includeRead: boolean = true,
        // types?: NotificationType[]
    ): Observable<Notification[]> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
            // .set('includeRead', includeRead.toString());

        // if (types && types.length > 0) {
        //     types.forEach(type => {
        //         params = params.append('type', type);
        //     });
        // }

        return this.http.get<Notification[]>(this.apiUrl, { params });
    }

    // POST: Créer une nouvelle notification
    createNotification(notification: CreateNotificationDto): Observable<Notification> {
        return this.http.post<Notification>(this.apiUrl, notification);
    }

    // GET: Marquer les notifications comme lues
    markAsRead(notificationIds?: number[]): Observable<void> {
        const body: MarkAsReadDto = { notificationIds };
        return this.http.post<void>(`${this.apiUrl}/read`, body);
    }

    // GET: Récupérer les statistiques des notifications
    getStats(): Observable<NotificationStats> {
        return this.http.get<NotificationStats>(`${this.apiUrl}/stats`);
    }

    // DELETE: Supprimer une notification
    deleteNotification(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // DELETE: Supprimer toutes les notifications lues
    deleteReadNotifications(): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/read`);
    }

    // Méthodes utilitaires pour créer des notifications typées
    createJobMatchNotification(userId: number, offerId: number, title: string, message: string): Observable<Notification> {
        return this.createNotification({
            userId,
            title,
            message,
            type: NotificationType.JOB_MATCH,
            referenceId: offerId,
            referenceType: 'OFFER',
            actionUrl: `/offers/${offerId}`
        });
    }

    createApplicationStatusNotification(userId: number, applicationId: number, status: string): Observable<Notification> {
        return this.createNotification({
            userId,
            title: 'Mise à jour de candidature',
            message: `Votre candidature a été ${status.toLowerCase()}`,
            type: NotificationType.APPLICATION_STATUS,
            referenceId: applicationId,
            referenceType: 'APPLICATION',
            actionUrl: `/applications/${applicationId}`
        });
    }

    createNewOfferNotification(userId: number, offerId: number, companyName: string): Observable<Notification> {
        return this.createNotification({
            userId,
            title: 'Nouvelle offre correspondante',
            message: `${companyName} a publié une nouvelle offre qui correspond à votre profil`,
            type: NotificationType.NEW_OFFER,
            referenceId: offerId,
            referenceType: 'OFFER',
            actionUrl: `/offers/${offerId}`
        });
    }

    createNewCandidateNotification(recruiterId: number, applicationId: number, candidateName: string): Observable<Notification> {
        return this.createNotification({
            userId: recruiterId,
            title: 'Nouveau candidat',
            message: `${candidateName} a postulé à votre offre`,
            type: NotificationType.NEW_CANDIDATE,
            referenceId: applicationId,
            referenceType: 'APPLICATION',
            actionUrl: `/applications/${applicationId}`
        });
    }
}
