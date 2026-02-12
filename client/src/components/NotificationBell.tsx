import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type NotificationType = 'all' | 'storage_warning' | 'credits_low' | 'subscription_resumed' | 'info';

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<NotificationType>('all');
  
  const { data: allNotifications = [] } = trpc.notifications.getNotifications.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const notifications = filter === 'all' 
    ? allNotifications 
    : allNotifications.filter((n: any) => n.type === filter);
  
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });

  const handleNotificationClick = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-2 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="flex gap-1 px-2 py-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs h-7"
          >
            All
          </Button>
          <Button
            variant={filter === 'storage_warning' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('storage_warning')}
            className="text-xs h-7"
          >
            Storage
          </Button>
          <Button
            variant={filter === 'credits_low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('credits_low')}
            className="text-xs h-7"
          >
            Credits
          </Button>
          <Button
            variant={filter === 'subscription_resumed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('subscription_resumed')}
            className="text-xs h-7"
          >
            Subscription
          </Button>
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.isRead ? 'bg-accent/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 ml-2 mt-1" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
