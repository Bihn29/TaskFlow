'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listService } from '../../services/list.service';
import { taskService } from '../../services/task.service';
import { List } from '../../types/list';
import { Task } from '../../types/task';
import KanbanColumn from './KanbanColumn';
import TaskDetailModal from '../task/TaskDetailModal';
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, Loader2 } from 'lucide-react';

interface KanbanBoardProps {
  boardId: string;
}

export default function KanbanBoard({ boardId }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [isAddingList, setIsAddingList] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: lists, isLoading: isListsLoading } = useQuery<List[]>({
    queryKey: ['lists', boardId],
    queryFn: () => listService.getListsByBoard(boardId),
  });

  const { data: tasks, isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', boardId],
    queryFn: () => taskService.getTasksByBoard(boardId),
  });

  const createListMutation = useMutation({
    mutationFn: () => listService.createList(boardId, listTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', boardId] });
      setIsAddingList(false);
      setListTitle('');
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, sourceListId, targetListId, position }: any) =>
      taskService.moveTask(taskId, sourceListId, targetListId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listTitle.trim()) return;
    createListMutation.mutate();
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    if (taskId === overId) return;

    const draggedTask = tasks?.find((t) => t.id === taskId);
    if (!draggedTask) return;

    let targetListId = '';
    let newPosition = 0;

    const overTask = tasks?.find((t) => t.id === overId);
    const overList = lists?.find((l) => l.id === overId);

    if (overTask) {
      targetListId = overTask.listId;
      const targetColumnTasks = tasks
        ?.filter((t) => t.listId === targetListId && t.id !== taskId)
        .sort((a, b) => a.position - b.position) || [];

      const overIndex = targetColumnTasks.findIndex((t) => t.id === overId);
      newPosition = overIndex >= 0 ? overIndex : 0;
    } else if (overList) {
      targetListId = overList.id;
      const targetColumnTasks = tasks?.filter((t) => t.listId === targetListId && t.id !== taskId) || [];
      newPosition = targetColumnTasks.length;
    } else {
      return;
    }

    const sourceListId = draggedTask.listId;

    moveTaskMutation.mutate({
      taskId,
      sourceListId,
      targetListId,
      position: newPosition,
    });
  };

  const isLoading = isListsLoading || isTasksLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin text-indigo-500" />
          <span className="text-sm text-neutral-400">Loading Kanban board...</span>
        </div>
      </div>
    );
  }

  const sortedLists = lists ? [...lists].sort((a, b) => a.position - b.position) : [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-start gap-6 pb-6 px-8 min-h-0 pt-4">
          {sortedLists.map((list) => {
            const listTasks = tasks
              ? tasks
                  .filter((t) => t.listId === list.id)
                  .sort((a, b) => a.position - b.position)
              : [];
            return (
              <KanbanColumn
                key={list.id}
                list={list}
                tasks={listTasks}
                onCardClick={(taskId) => setSelectedTaskId(taskId)}
              />
            );
          })}

          <div className="w-72 shrink-0">
            {isAddingList ? (
              <form onSubmit={handleCreateList} className="glass-panel p-4 rounded-2xl border border-white/5 space-y-3 bg-[#0b0f19]/40">
                <input
                  type="text"
                  required
                  placeholder="Nhập tên danh sách..."
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  className="w-full bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none placeholder-neutral-600 animate-fade-in"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="px-3 py-1.5 rounded-lg border border-white/5 text-neutral-400 hover:bg-white/5 text-xs font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createListMutation.isPending || !listTitle.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                  >
                    {createListMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Thêm danh sách'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-full py-4 border border-dashed border-white/10 hover:border-indigo-500/30 bg-white/[0.01] hover:bg-indigo-600/[0.02] text-neutral-400 hover:text-indigo-400 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Thêm danh sách mới
              </button>
            )}
          </div>
        </div>
      </DndContext>

      <TaskDetailModal
        taskId={selectedTaskId}
        boardId={boardId}
        open={!!selectedTaskId}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
      />
    </div>
  );
}
