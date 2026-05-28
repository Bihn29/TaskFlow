'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '../../../services/workspace.service';
import { boardService } from '../../../services/board.service';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Plus, FolderKanban, ChevronRight, X, Loader2, ArrowLeft, Users, Trash2, AlertTriangle } from 'lucide-react';

interface WorkspaceDetailPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function WorkspaceDetailPage({ params }: WorkspaceDetailPageProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { workspaceId } = use(params);

  // Create Board modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete workspace state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Current user role derived from localStorage userId vs workspace members
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Read userId from JWT stored in localStorage (decoded on client)
    // api.ts attaches the token — we just need userId for role check
    // We decode the JWT payload (base64 middle segment) to extract sub (userId)
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub || null);
      }
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  const { data: workspace, isLoading: isWorkspaceLoading, isError: isWorkspaceError } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceService.getWorkspaceById(workspaceId),
  });

  const { data: boards, isLoading: isBoardsLoading, isError: isBoardsError } = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => boardService.getBoardsByWorkspace(workspaceId),
  });

  // Determine current user's role in this workspace
  const currentUserRole = React.useMemo(() => {
    if (!workspace || !currentUserId) return null;
    const member = workspace.members.find((m) => {
      const userId = typeof m.userId === 'string' ? m.userId : (m.userId as any)?._id || (m.userId as any)?.id;
      return userId === currentUserId;
    });
    return member?.role ?? null;
  }, [workspace, currentUserId]);

  const isOwner = currentUserRole === 'OWNER';

  // Create board mutation
  const createBoardMutation = useMutation({
    mutationFn: () => boardService.createBoard(workspaceId, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setCreateError(null);
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo board.');
    },
  });

  // Delete workspace mutation
  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => workspaceService.deleteWorkspace(workspaceId),
    onSuccess: () => {
      // Invalidate workspace list so dashboard refreshes
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.removeQueries({ queryKey: ['workspace', workspaceId] });
      router.push('/dashboard');
    },
    onError: (err: any) => {
      const status = err.response?.status;
      if (status === 403) {
        setDeleteError('Chỉ OWNER mới được xóa workspace.');
      } else {
        setDeleteError(err.response?.data?.message || 'Xóa workspace thất bại. Vui lòng thử lại.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createBoardMutation.mutate();
  };

  const handleDeleteConfirm = () => {
    setDeleteError(null);
    deleteWorkspaceMutation.mutate();
  };

  const isLoading = isWorkspaceLoading || isBoardsLoading;
  const isError = isWorkspaceError || isBoardsError;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-all text-sm mb-6 w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
        </Link>

        {isLoading ? (
          <div className="space-y-8 animate-pulse flex-1">
            <div className="space-y-3">
              <div className="h-8 bg-white/10 rounded w-1/3" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
            </div>
            <hr className="border-white/5" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="h-36 rounded-2xl bg-white/5 border border-white/5" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            Lỗi tải dữ liệu workspace hoặc boards. Vui lòng thử lại.
          </div>
        ) : (
          <div className="space-y-8 flex-1 flex flex-col">
            {/* Header row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/15 flex items-center justify-center font-bold text-indigo-400 text-lg">
                    {workspace?.name.charAt(0).toUpperCase()}
                  </div>
                  <h1 className="text-3xl font-bold text-white font-sans tracking-tight">{workspace?.name}</h1>
                </div>
                <p className="text-neutral-400 text-sm max-w-2xl">{workspace?.description || 'Không có mô tả cho workspace này.'}</p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>{workspace?.members?.length || 1} thành viên tham gia</span>
                  </div>
                  {/* Show role badge */}
                  {currentUserRole && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      currentUserRole === 'OWNER'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : currentUserRole === 'ADMIN'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : 'bg-white/5 text-neutral-400 border-white/10'
                    }`}>
                      {currentUserRole}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {/* Delete workspace — OWNER only */}
                {isOwner && (
                  <button
                    onClick={() => { setDeleteError(null); setShowDeleteConfirm(true); }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 active:scale-95 transition-all duration-200 font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa workspace
                  </button>
                )}

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all duration-200 rounded-xl font-medium text-white shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="w-5 h-5" />
                  Tạo Board mới
                </button>
              </div>
            </div>

            {/* Board list */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-6 font-sans">Danh sách Boards</h2>

              {!boards || boards.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto mt-6 flex flex-col items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                    <FolderKanban className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Chưa có Board nào</h3>
                    <p className="text-neutral-400 text-sm mt-2 px-4 leading-relaxed">
                      Boards chứa các cột Kanban (Lists) và thẻ (Tasks). Hãy tạo bảng đầu tiên để bắt đầu sắp xếp công việc cho dự án của bạn!
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all duration-200 rounded-xl font-medium border border-white/5"
                  >
                    <Plus className="w-5 h-5" />
                    Tạo Board
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {boards.map((board) => (
                    <Link
                      key={board.id}
                      href={`/boards/${board.id}`}
                      className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-36 card-shadow-hover relative group overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-all duration-300" />
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors duration-200 line-clamp-1">{board.name}</h3>
                        <p className="text-neutral-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{board.description || 'Không có mô tả.'}</p>
                      </div>
                      <div className="flex justify-end mt-4 text-xs font-semibold">
                        <span className="flex items-center gap-1 text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                          Mở bảng Kanban <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== CREATE BOARD MODAL ===== */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <div className="bg-[#0b0f19] border border-white/8 rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10 animate-slide-up">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-2 font-sans tracking-tight">Tạo Board mới</h2>
              <p className="text-neutral-400 text-xs mb-6">Tạo một bảng Kanban để quản lý các đầu việc thuộc Workspace này.</p>

              {createError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Tên Board *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Sprint 1 - Core Backend"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-2xl py-3 px-4 text-white focus:outline-none transition-all duration-200 placeholder-neutral-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Mô tả</label>
                  <textarea
                    placeholder="Mô tả công việc của bảng này..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-2xl py-3 px-4 text-white focus:outline-none transition-all duration-200 placeholder-neutral-600 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-white/5 text-neutral-300 hover:bg-white/5 font-medium transition-all duration-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createBoardMutation.isPending || !name.trim()}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
                  >
                    {createBoardMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Tạo ngay'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== DELETE WORKSPACE CONFIRM DIALOG ===== */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#020617]/85 backdrop-blur-sm"
              onClick={() => !deleteWorkspaceMutation.isPending && setShowDeleteConfirm(false)}
            />

            <div className="bg-[#0b0f19] border border-red-500/20 rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10 animate-slide-up">
              {/* Icon */}
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-5">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>

              <h2 className="text-xl font-bold text-white text-center mb-2 font-sans tracking-tight">
                Xóa workspace?
              </h2>
              <p className="text-neutral-400 text-sm text-center leading-relaxed mb-2">
                Bạn có chắc muốn xóa workspace{' '}
                <span className="text-white font-semibold">&ldquo;{workspace?.name}&rdquo;</span>?
              </p>
              <p className="text-red-400/80 text-xs text-center mb-6">
                ⚠️ Hành động này không thể hoàn tác. Tất cả boards, lists và tasks trong workspace sẽ bị mất.
              </p>

              {/* Error message */}
              {deleteError && (
                <div className="p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteWorkspaceMutation.isPending}
                  className="flex-1 px-5 py-3 rounded-xl border border-white/8 text-neutral-300 hover:bg-white/5 font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteWorkspaceMutation.isPending}
                  className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                >
                  {deleteWorkspaceMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Xóa workspace
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
