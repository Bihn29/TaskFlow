'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '../../services/workspace.service';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Plus, Briefcase, ChevronRight, X, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: workspaces, isLoading, isError, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getWorkspaces,
  });

  const createMutation = useMutation({
    mutationFn: () => workspaceService.createWorkspace(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setCreateError(null);
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo workspace.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-sans tracking-tight">Workspaces</h1>
            <p className="text-neutral-400 text-sm mt-1">Quản lý các không gian làm việc của nhóm bạn</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all duration-200 rounded-xl font-medium text-white shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-5 h-5" />
            Tạo Workspace
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-2xl glass-panel animate-pulse p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-6 bg-white/10 rounded w-2/3" />
                  <div className="h-4 bg-white/10 rounded w-5/6" />
                </div>
                <div className="h-4 bg-white/10 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            Lỗi tải dữ liệu: {(error as any)?.message || 'Vui lòng kiểm tra lại kết nối.'}
          </div>
        ) : !workspaces || workspaces.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto mt-12 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Chưa có Workspace nào</h3>
              <p className="text-neutral-400 text-sm mt-2 px-4 leading-relaxed">
                Workspace giúp bạn tổ chức các dự án Kanban, phân quyền thành viên và tương tác realtime. Hãy tạo không gian làm việc đầu tiên ngay bây giờ!
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all duration-200 rounded-xl font-medium border border-white/5"
            >
              <Plus className="w-5 h-5" />
              Bắt đầu tạo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-44 card-shadow-hover relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-all duration-300" />
                
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold group-hover:scale-105 transition-transform duration-300">
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors duration-200 line-clamp-1">{ws.name}</h3>
                  </div>
                  <p className="text-neutral-400 text-sm line-clamp-2 leading-relaxed">{ws.description || 'Không có mô tả.'}</p>
                </div>
                
                <div className="flex items-center justify-between mt-4 text-xs text-neutral-500 font-medium">
                  <span>{ws.members?.length || 1} thành viên</span>
                  <span className="flex items-center gap-1 text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                    Truy cập <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

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

              <h2 className="text-xl font-bold text-white mb-2 font-sans tracking-tight">Tạo Workspace mới</h2>
              <p className="text-neutral-400 text-xs mb-6">Tạo một không gian cộng tác làm việc hiệu quả cho nhóm của bạn.</p>

              {createError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Tên Workspace *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Team Công Nghệ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-2xl py-3 px-4 text-white focus:outline-none transition-all duration-200 placeholder-neutral-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Mô tả</label>
                  <textarea
                    placeholder="Mô tả mục tiêu của không gian làm việc này..."
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
                    disabled={createMutation.isPending || !name.trim()}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
                  >
                    {createMutation.isPending ? (
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
      </div>
    </DashboardLayout>
  );
}
