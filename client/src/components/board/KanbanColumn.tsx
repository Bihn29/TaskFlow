'use client';

import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { List } from '../../types/list';
import { Task } from '../../types/task';
import TaskCard from './TaskCard';
import { Plus, Trash2, Check, X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listService } from '../../services/list.service';
import { taskService } from '../../services/task.service';

interface KanbanColumnProps {
  list: List;
  tasks: Task[];
  onCardClick?: (taskId: string) => void;
}

export default function KanbanColumn({ list, tasks, onCardClick }: KanbanColumnProps) {
  const queryClient = useQueryClient();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(list.title);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: list.id, disabled: true });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renameMutation = useMutation({
    mutationFn: () => listService.updateList(list.id, newTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', list.boardId] });
      setIsRenaming(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => listService.deleteList(list.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', list.boardId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', list.boardId] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: () => taskService.createTask(list.id, taskTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', list.boardId] });
      setIsAddingTask(false);
      setTaskTitle('');
    },
  });

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    renameMutation.mutate();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    createTaskMutation.mutate();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 bg-[#0b0f19]/80 border border-white/5 rounded-2xl flex flex-col max-h-[80vh] shrink-0 overflow-hidden glass-panel"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between gap-3 shrink-0">
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-2 w-full">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-lg py-1 px-2.5 text-sm text-white focus:outline-none w-full"
            />
            <button type="submit" className="p-1 text-indigo-400">
              <Check className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setIsRenaming(false)} className="p-1 text-neutral-400">
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <>
            <h3
              onClick={() => setIsRenaming(true)}
              className="font-bold text-sm text-white cursor-pointer hover:bg-white/5 py-1 px-2 -ml-2 rounded-lg transition-all duration-200 truncate flex-1"
            >
              {list.title}
            </h3>
            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn xóa cột này cùng toàn bộ các tasks bên trong không?')) {
                  deleteMutation.mutate();
                }
              }}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onCardClick={onCardClick} />
          ))}
        </SortableContext>
      </div>

      <div className="p-3 border-t border-white/5 shrink-0">
        {isAddingTask ? (
          <form onSubmit={handleCreateTask} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Nhập tiêu đề thẻ..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none placeholder-neutral-600"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-3 py-1.5 rounded-lg border border-white/5 text-neutral-400 hover:bg-white/5 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={createTaskMutation.isPending || !taskTitle.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                {createTaskMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Thêm thẻ'
                )}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-white/5 hover:border-indigo-500/30 text-neutral-400 hover:text-indigo-400 rounded-xl text-xs font-medium transition-all duration-200 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Thêm thẻ mới
          </button>
        )}
      </div>
    </div>
  );
}
