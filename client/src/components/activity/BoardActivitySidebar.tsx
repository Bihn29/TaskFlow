'use client';

import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityLogService } from '../../services/activity-log.service';
import { X, History, User, Move, Plus, Trash2, Edit2, UserCheck, UserMinus, ShieldAlert } from 'lucide-react';
import { ActivityLog } from '../../types/activity-log';

interface BoardActivitySidebarProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BoardActivitySidebar({ boardId, isOpen, onClose }: BoardActivitySidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Fetch Board Activity Logs
  const { data: logs = [], isLoading, isError } = useQuery<ActivityLog[]>({
    queryKey: ['activity-logs', 'board', boardId],
    queryFn: () => activityLogService.getBoardActivityLogs(boardId),
    enabled: isOpen && !!boardId,
  });

  // Close sidebar on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'TASK_CREATED':
      case 'LIST_CREATED':
      case 'BOARD_CREATED':
        return <Plus className="w-3.5 h-3.5 text-emerald-400" />;
      case 'TASK_UPDATED':
      case 'LIST_UPDATED':
      case 'BOARD_UPDATED':
      case 'COMMENT_UPDATED':
        return <Edit2 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'TASK_DELETED':
      case 'LIST_DELETED':
      case 'BOARD_DELETED':
      case 'COMMENT_DELETED':
        return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      case 'TASK_MOVED':
        return <Move className="w-3.5 h-3.5 text-purple-400" />;
      case 'TASK_ASSIGNED':
      case 'MEMBER_ADDED':
        return <UserCheck className="w-3.5 h-3.5 text-cyan-400" />;
      case 'TASK_UNASSIGNED':
      case 'MEMBER_REMOVED':
        return <UserMinus className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <History className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex pl-10 sm:pl-16">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#020617]/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Sidebar Panel */}
      <div
        ref={sidebarRef}
        className="w-screen max-w-md transform bg-[#0b0f19]/95 backdrop-blur-2xl border-l border-white/8 shadow-2xl transition-all duration-300 ease-in-out flex flex-col h-full animate-slide-left relative"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Lịch sử hoạt động</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin text-indigo-500 mb-2" />
              <span className="text-xs">Đang tải lịch sử hoạt động...</span>
            </div>
          ) : isError ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 justify-center">
              <ShieldAlert className="w-4 h-4" />
              <span>Không thể tải lịch sử hoạt động</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-xs text-neutral-500">
              Chưa ghi nhận hoạt động nào trên bảng này.
            </div>
          ) : (
            <div className="relative border-l-2 border-white/5 pl-4 ml-2.5 space-y-6">
              {logs.map((log) => {
                const actorName = log.userId?.name || 'Một thành viên';
                return (
                  <div key={log.id} className="relative space-y-1.5">
                    {/* Node Dot / Icon Badge */}
                    <div className="absolute -left-[30px] top-0 w-6 h-6 rounded-full bg-[#090d16] border border-white/8 flex items-center justify-center shadow-lg shadow-[#020617]/50">
                      {getActionIcon(log.action)}
                    </div>

                    {/* Timeline Log Content */}
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                        <span className="font-bold text-white pr-1.5">{actorName}</span>
                        {log.message || log.action.toLowerCase().replace('_', ' ')}
                      </p>
                      <span className="text-[10px] text-neutral-500 font-medium block pt-1">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
