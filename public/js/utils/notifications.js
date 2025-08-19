// Module de gestion des notifications TransCargo

class NotificationManager {
    constructor() {
        this.notifications = [];
    }

    // Afficher une notification
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Icônes par défaut si TransCargoUtils n'est pas disponible
        const getIcon = (type) => {
            const icons = {
                success: 'check-circle',
                error: 'exclamation-circle', 
                warning: 'exclamation-triangle',
                info: 'info-circle'
            };
            return icons[type] || 'info-circle';
        };
        
        const iconName = (window.TransCargoUtils && window.TransCargoUtils.getNotificationIcon) 
            ? TransCargoUtils.getNotificationIcon(type) 
            : getIcon(type);
            
        notification.innerHTML = `
            <i class="fas fa-${iconName}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: this.getBackgroundColor(type),
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: '1001',
            maxWidth: '400px',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        this.notifications.push(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.classList.add('show');
        }, 10);
        
        // Auto-suppression
        setTimeout(() => this.remove(notification), duration);
        
        // Bouton de fermeture
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(notification);
        });

        return notification;
    }

    // Supprimer une notification
    remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }

    // Couleurs de fond selon le type
    getBackgroundColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    // Supprimer toutes les notifications
    clearAll() {
        this.notifications.forEach(notification => this.remove(notification));
    }
}

// Instance globale
const notificationManager = new NotificationManager();

// Fonction globale pour compatibilité
function showNotification(message, type = 'info') {
    return notificationManager.show(message, type);
}

// Export pour utilisation globale
window.NotificationManager = NotificationManager;
window.showNotification = showNotification;