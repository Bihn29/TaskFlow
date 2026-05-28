'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types/task';
import { Calendar, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../../services/task.service';

interface TaskCardProps {
  task: Task;
  onCardClick?: (taskId: string) => void;
}

export default function TaskCard({ task, onCardClick }: TaskCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState(task.priority);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      taskService.updateTask(task.id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.boardId] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => taskService.deleteTask(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.boardId] });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    updateMutation.mutate();
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      default:
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  };

  if (isEditing) {
    return (
      <div className="glass-panel p-4 rounded-xl border border-indigo-500/30 space-y-3 bg-[#0f172a]">
        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="text"
            required
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none"
          />
          <textarea
            placeholder="Mô tả công việc..."
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="w-full bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none resize-none"
          />
          <div className="flex justify-between items-center gap-3">
            <select
              value={editPriority}
              onChange={(e: any) => setEditPriority(e.target.value)}
              className="bg-[#090d16] border border-white/8 rounded-lg py-1.5 px-2 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg border border-white/5 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending || !editTitle.trim()}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="glass-panel p-4 rounded-xl border border-white/5 bg-[#111827]/40 shadow-md card-shadow-hover flex flex-col justify-between select-none relative group min-h-[90px]"
    >
      <div
        {...attributes}
        {...listeners}
        onClick={() => onCardClick?.(task.id)}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
      />

      <div className="relative z-10 pointer-events-none">
        <div className="flex justify-between items-start gap-2 mb-2 pointer-events-auto">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/5"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h4 className="font-semibold text-sm text-white leading-snug line-clamp-2 pr-1">{task.title}</h4>
        {task.description && (
          <p className="text-neutral-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>
        )}
      </div>

      {task.dueDate && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-indigo-400 mt-4 relative z-10">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      )}
    </div>
  );
}
