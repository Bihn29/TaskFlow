'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { notificationService } from '../../services/notification.service';
import { Bell, Check, CheckCheck, MessageSquare, UserPlus, ShieldAlert, Loader2 } from 'lucide-react';
import { Notification } from '../../types/notification';

export default function NotificationDropdown() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch Notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  });

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
    if (notification.boardId) {
      router.push(`/boards/${notification.boardId}`);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <UserPlus className="w-4 h-4 text-indigo-400" />;
      case 'TASK_COMMENTED':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 text-neutral-400 hover:text-white transition-all duration-200 active:scale-95"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 border-2 border-[#090d16] text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#0b0f19]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-slide-up flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">Thông báo ({unreadCount})</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase"
              >
                {markAllReadMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                  </>
                )}
              </button>
            )}
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-[350px]">
            {isLoading ? (
              <div className="p-10 flex flex-col items-center justify-center text-neutral-500">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center text-xs text-neutral-500">
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 flex gap-3 cursor-pointer transition-all duration-200 ${
                    !notification.isRead
                      ? 'bg-indigo-600/[0.04] border-l-2 border-indigo-500 hover:bg-indigo-600/[0.08]'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Icon Badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    !notification.isRead
                      ? 'bg-indigo-600/10 border-indigo-500/20'
                      : 'bg-white/[0.02] border-white/5'
                  }`}>
                    {getIcon(notification.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={`text-xs leading-normal break-words ${
                      !notification.isRead ? 'text-white font-medium' : 'text-neutral-400'
                    }`}>
                      {notification.message}
                    </p>
                    <span className="text-[9px] text-neutral-500 block font-medium">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>

                  {/* Actions / Read dot */}
                  {!notification.isRead && (
                    <div className="flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
