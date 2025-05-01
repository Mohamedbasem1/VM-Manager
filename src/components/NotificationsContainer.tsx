import React, { useEffect, useState } from 'react';
import { XCircle, CheckCircle, AlertCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
}

// Global notifications array and callbacks
let notifications: Notification[] = [];
let addNotificationCallback: ((notification: Notification) => void) | null = null;
let removeNotificationCallback: ((id: string) => void) | null = null;

// Utility function to add notification from anywhere in the app
export function notify(type: NotificationType, message: string, duration: number = 5000) {
  const id = Date.now().toString();
  const notification = { id, type, message, duration };
  
  if (addNotificationCallback) {
    addNotificationCallback(notification);
  } else {
    notifications.push(notification);
  }
  
  return id;
}

// Utility function to close notification from anywhere in the app
export function closeNotification(id: string) {
  if (removeNotificationCallback) {
    removeNotificationCallback(id);
  }
}

const NotificationItem: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const { id, type, message, duration = 5000 } = notification;
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);
  
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
      case 'info':
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
    }
  };
  
  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-300';
      case 'error':
        return 'text-red-800 dark:text-red-300';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-300';
      case 'info':
      default:
        return 'text-blue-800 dark:text-blue-300';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500 dark:text-green-400" />;
      case 'error':
        return <XCircle className="text-red-500 dark:text-red-400" />;
      case 'warning':
      case 'info':
      default:
        return <AlertCircle className={type === 'warning' ? 'text-yellow-500 dark:text-yellow-400' : 'text-blue-500 dark:text-blue-400'} />;
    }
  };
  
  return (
    <div className={`flex items-start p-4 mb-3 rounded-lg shadow-md border ${getBgColor()} ${getTextColor()} animate-slide-up transform transition-all duration-300`}>
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-grow mr-2">
        {message}
      </div>
      <button 
        onClick={() => onClose(id)} 
        className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 focus:outline-none"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const NotificationsContainer: React.FC = () => {
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  
  useEffect(() => {
    // Set the callbacks so other components can add/remove notifications
    addNotificationCallback = (notification: Notification) => {
      setNotificationList(prev => [...prev, notification]);
    };
    
    removeNotificationCallback = (id: string) => {
      setNotificationList(prev => prev.filter(item => item.id !== id));
    };
    
    // Add any notifications that were created before this component mounted
    if (notifications.length > 0) {
      setNotificationList(notifications);
      notifications = [];
    }
    
    return () => {
      addNotificationCallback = null;
      removeNotificationCallback = null;
    };
  }, []);
  
  const handleClose = (id: string) => {
    setNotificationList(prev => prev.filter(notification => notification.id !== id));
  };
  
  if (notificationList.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      {notificationList.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onClose={handleClose} 
        />
      ))}
    </div>
  );
};

export default NotificationsContainer;