'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { toast } from '@/components/ui/use-toast';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const notificationTypes = {
  NEW_ENROLLMENT: {
    title: 'New Enrollment',
    description: (data) => `${data.studentName} enrolled in ${data.courseName}`,
    variant: 'default',
  },
  COURSE_COMPLETION: {
    title: 'Course Completed',
    description: (data) => `${data.studentName} completed ${data.courseName}`,
    variant: 'success',
  },
  PAYMENT_RECEIVED: {
    title: 'Payment Received',
    description: (data) => `Payment of ${new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(data.amount)} received for ${data.courseName}`,
    variant: 'success',
  },
  NEW_REVIEW: {
    title: 'New Review',
    description: (data) => `${data.studentName} left a ${data.rating}★ review for ${data.courseName}`,
    variant: 'info',
  },
  SYSTEM_ALERT: {
    title: 'System Alert',
    description: (data) => data.message,
    variant: 'warning',
  },
};

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    // Subscribe to real-time events
    const unsubscribe = subscribe('NOTIFICATION', (data) => {
      const notification = {
        id: Date.now(),
        type: data.type,
        data: data.data,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast notification
      const notificationType = notificationTypes[data.type] || {
        title: 'Notification',
        description: (d) => JSON.stringify(d),
        variant: 'default',
      };
      
      toast({
        title: notificationType.title,
        description: notificationType.description(data.data),
        variant: notificationType.variant,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({
        ...notif,
        read: true,
      }))
    );
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (unreadCount > 0) {
            markAllAsRead();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-medium">Notifications</h3>
            <div className="flex space-x-2">
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline"
                disabled={notifications.length === 0}
              >
                Mark all as read
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-red-500 hover:underline"
                disabled={notifications.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>

          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => {
                  const notificationType = notificationTypes[notification.type] || {
                    title: 'Notification',
                    description: (d) => JSON.stringify(d),
                    variant: 'default',
                  };

                  return (
                    <li
                      key={notification.id}
                      className={`relative px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        !notification.read ? 'bg-blue-50 dark:bg-gray-800' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">
                              {notificationType.title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {notificationType.description(notification.data)}
                          </p>
                          {!notification.read && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotifications(notifications.filter((n) => n.id !== notification.id));
                          }}
                          className="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
