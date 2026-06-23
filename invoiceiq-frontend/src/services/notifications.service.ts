import api from '../lib/axios'

export const notificationsService = {
  getAll: (unreadOnly = false) =>
    api.get('/api/notifications', { params: { unreadOnly } }).then(r => r.data),

  markRead: (notificationIds: string[]) =>
    api.post('/api/notifications/mark-read', { notificationIds }).then(r => r.data),
}