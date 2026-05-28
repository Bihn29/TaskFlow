'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { boardService } from '../../../services/board.service';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import KanbanBoard from '../../../components/board/KanbanBoard';
import { useBoardSocket } from '../../../hooks/useBoardSocket';
import NotificationDropdown from '../../../components/notification/NotificationDropdown';
import BoardActivitySidebar from '../../../components/activity/BoardActivitySidebar';
import { ArrowLeft, Loader2, KanbanSquare, History } from 'lucide-react';

interface BoardDetailPageProps {
  params: Promise<{ boardId: string }>;
}

export default function BoardDetailPage({ params }: BoardDetailPageProps) {
  const { boardId } = use(params);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  // Connect to board realtime socket and get status
  const { status } = useBoardSocket(boardId);

  const { data: board, isLoading, isError, error } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardService.getBoardById(boardId),
  });

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col min-h-0 bg-[#090d16]">
        <div className="p-8 pb-4 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5">
          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-24" />
                <div className="h-7 bg-white/10 rounded w-48" />
              </div>
            ) : board ? (
              <>
                <Link
                  href={`/workspaces/${board.workspaceId}`}
                  className="flex items-center gap-2 text-neutral-400 hover:text-white transition-all text-xs mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Workspace
                </Link>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2.5">
                    <KanbanSquare className="w-6 h-6 text-indigo-400" />
                    <h1 className="text-2xl font-bold text-white font-sans tracking-tight">{board.name}</h1>
                  </div>

                  {/* Glassmorphic connection status badge */}
                  <div className="flex items-center">
                    {status === 'connected' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)] select-none">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Connected
                      </span>
                    )}
                    {status === 'connecting' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/5 text-yellow-400 border border-yellow-500/10 select-none">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
                        </span>
                        Connecting...
                      </span>
                    )}
                    {status === 'disconnected' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/5 text-red-400 border border-red-500/10 select-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Right Header Panel */}
          {board && (
            <div className="flex items-center gap-3.5 self-end md:self-auto">
              {/* Notification Bell Dropdown */}
              <NotificationDropdown />

              {/* Board Activity Log Toggle */}
              <button
                onClick={() => setIsActivityOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-all duration-200 active:scale-95"
              >
                <History className="w-4 h-4 text-indigo-400" />
                <span>Hoạt động</span>
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-400">
            Lỗi tải dữ liệu Board: {(error as any)?.message || 'Vui lòng kiểm tra lại.'}
          </div>
        ) : (
          <KanbanBoard boardId={boardId} />
        )}
      </div>

      {/* Board Timeline History Slideover Drawer */}
      <BoardActivitySidebar
        boardId={boardId}
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />
    </DashboardLayout>
  );
}
