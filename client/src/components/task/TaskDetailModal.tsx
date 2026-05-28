'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../../services/task.service';
import { boardService } from '../../services/board.service';
import { workspaceService } from '../../services/workspace.service';
import TaskComments from './TaskComments';
import { X, Calendar, AlertCircle, UserPlus, UserMinus, Trash2, Loader2, Save, Tags } from 'lucide-react';

interface TaskDetailModalProps {
  taskId: string | null;
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskDetailModal({ taskId, boardId, open, onOpenChange }: TaskDetailModalProps) {
  const queryClient = useQueryClient();

  // Local Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Task Details
  const { data: task, isLoading: isTaskLoading, isError: isTaskError } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTaskById(taskId!),
    enabled: open && !!taskId,
  });

  // Fetch Board Details (to get workspaceId)
  const { data: board } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardService.getBoardById(boardId),
    enabled: open,
  });

  const workspaceId = board?.workspaceId?.toString() || '';

  // Fetch Workspace Details (to get members list)
  const { data: workspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceService.getWorkspaceById(workspaceId),
    enabled: !!workspaceId,
  });

  // Sync Form States with Task Data when it loads
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDueDate(`${year}-${month}-${day}`);
      } else {
        setDueDate('');
      }
      setErrorMsg(null);
    }
  }, [task]);

  // Update Task Mutation
  const updateMutation = useMutation({
    mutationFn: () =>
      taskService.updateTask(taskId!, {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      setErrorMsg(null);
      alert('Cập nhật thẻ công việc thành công!');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Không thể cập nhật thẻ.');
    },
  });

  // Delete Task Mutation
  const deleteMutation = useMutation({
    mutationFn: () => taskService.deleteTask(taskId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Bạn không có quyền xóa thẻ này.');
    },
  });

  // Assign Assignee Mutation
  const assignMutation = useMutation({
    mutationFn: (userId: string) => taskService.assignTaskMember(taskId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      setSelectedMemberId('');
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Không có quyền gán thành viên.');
    },
  });

  // Remove Assignee Mutation
  const removeAssigneeMutation = useMutation({
    mutationFn: (userId: string) => taskService.removeAssignee(taskId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Không có quyền loại bỏ thành viên.');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    updateMutation.mutate();
  };

  const handleAssign = () => {
    if (!selectedMemberId) return;
    assignMutation.mutate(selectedMemberId);
  };

  const getUserIdStr = (userObj: any) => {
    if (!userObj) return '';
    return userObj.id || userObj._id || userObj.toString();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      {/* Modal Card */}
      <div className="bg-[#0b0f19] border border-white/8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative z-10 animate-slide-up flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-6 right-6 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        {isTaskLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin text-indigo-500 mb-2" />
            <span className="text-sm text-neutral-400">Loading task details...</span>
          </div>
        ) : isTaskError || !task ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm my-10 text-center">
            Lỗi tải dữ liệu hoặc Task này không tồn tại hoặc đã bị xóa.
          </div>
        ) : (
          <div className="space-y-6">
            {/* API Errors Banner */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT SECTION (Title, Description, Comments) */}
              <div className="lg:col-span-8 space-y-6">
                <form onSubmit={handleSave} className="space-y-5">
                  {/* Editable Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Tiêu đề công việc</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 text-2xl font-bold text-white focus:outline-none py-1 transition-all"
                    />
                  </div>

                  {/* Editable Description */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Mô tả công việc</label>
                    <textarea
                      placeholder="Mô tả chi tiết các bước thực hiện công việc..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none placeholder-neutral-600 resize-none transition-all"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending || !title.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Lưu thay đổi
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Embedded Comments Component */}
                <TaskComments taskId={task.id} />
              </div>

              {/* RIGHT SECTION (Side Details Panel) */}
              <div className="lg:col-span-4 space-y-6 bg-[#0b0f19]/40 border border-white/5 p-6 rounded-2xl">
                {/* Priority */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
                    <Tags className="w-3.5 h-3.5" /> Độ ưu tiên
                  </span>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                  >
                    <option value="LOW">LOW (Thấp)</option>
                    <option value="MEDIUM">MEDIUM (Trung bình)</option>
                    <option value="HIGH">HIGH (Cao)</option>
                  </select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Hạn chót
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Assignees List */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Người thực thi
                  </span>

                  {/* Current assignees */}
                  <div className="space-y-2">
                    {task.assignees.map((assignee: any) => {
                      const id = getUserIdStr(assignee);
                      return (
                        <div key={id} className="flex items-center justify-between bg-[#090d16]/60 border border-white/5 px-3 py-2 rounded-xl text-xs">
                          <span className="text-white font-medium">{assignee.name || 'Thành viên'}</span>
                          <button
                            onClick={() => removeAssigneeMutation.mutate(id)}
                            disabled={removeAssigneeMutation.isPending}
                            className="p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {task.assignees.length === 0 && (
                      <p className="text-neutral-500 text-xs py-1">Chưa gán cho ai.</p>
                    )}
                  </div>

                  {/* Assign dropdown */}
                  {workspace?.members && (
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <select
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="flex-1 bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none overflow-hidden"
                      >
                        <option value="">-- Chọn thành viên --</option>
                        {workspace.members.map((member: any) => {
                          const mUser = member.userId;
                          const mUserId = getUserIdStr(mUser);
                          // Avoid assigning if already assigned
                          const isAssigned = task.assignees.some((a) => getUserIdStr(a) === mUserId);
                          if (isAssigned) return null;
                          return (
                            <option key={mUserId} value={mUserId}>
                              {mUser.name} ({member.role})
                            </option>
                          );
                        })}
                      </select>
                      <button
                        onClick={handleAssign}
                        disabled={assignMutation.isPending || !selectedMemberId}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold"
                      >
                        Gán
                      </button>
                    </div>
                  )}
                </div>

                {/* Task Delete Action */}
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn xóa thẻ công việc này không?')) {
                        deleteMutation.mutate();
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-600/10 hover:bg-red-500 hover:text-white border border-red-500/10 hover:border-red-500 rounded-xl text-xs font-bold text-red-400 transition-all"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" /> Xóa thẻ này
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
