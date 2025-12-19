export interface Notification {
    id?: number;
    userId: number;
    title: string;
    message: string;
    type: NotificationType;
    referenceId?: number; // ID de l'offre, candidature, etc.
    referenceType?: string; // 'OFFER', 'APPLICATION', 'USER', etc.
    imageUrl?: string;
    actionUrl?: string;
    isRead: boolean;
    createdAt?: string;
    readAt?: string;
}

export enum NotificationType {
    JOB_MATCH = 'JOB_MATCH',
    APPLICATION_STATUS = 'APPLICATION_STATUS',
    NEW_OFFER = 'NEW_OFFER',
    OFFER_EXPIRING = 'OFFER_EXPIRING',
    SYSTEM_ALERT = 'SYSTEM_ALERT',
    MESSAGE = 'MESSAGE',
    NEW_CANDIDATE = 'NEW_CANDIDATE',
    INTERVIEW_INVITE = 'INTERVIEW_INVITE',
    REMINDER = 'REMINDER'
}

export interface NotificationStats {
    totalNotifications: number;
    unreadCount: number;
    readCount: number;
    hasUnread: boolean;
}

export interface CreateNotificationDto {
    userId: number;
    title: string;
    message: string;
    type: NotificationType;
    referenceId?: number;
    referenceType?: string;
    imageUrl?: string;
    actionUrl?: string;
}

export interface MarkAsReadDto {
    notificationIds?: number[]; // Si vide, marque toutes comme lues
}
