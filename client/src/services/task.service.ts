import api from '../lib/api';
import { Task } from '../types/task';

export const taskService = {
  async getTasksByBoard(boardId: string): Promise<Task[]> {
    const response = await api.get(`/boards/${boardId}/tasks`);
    return response.data;
  },

  async getTaskById(taskId: string): Promise<Task> {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  async createTask(
    listId: string,
    title: string,
    description?: string,
    priority?: string,
    dueDate?: string
  ): Promise<Task> {
    const response = await api.post(`/lists/${listId}/tasks`, {
      title,
      description,
      priority,
      dueDate,
    });
    return response.data;
  },

  async updateTask(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string | null;
    }
  ): Promise<Task> {
    const response = await api.patch(`/tasks/${taskId}`, data);
    return response.data;
  },

  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  },

  async moveTask(
    taskId: string,
    sourceListId: string,
    targetListId: string,
    position: number
  ): Promise<Task> {
    const response = await api.patch(`/tasks/${taskId}/move`, {
      sourceListId,
      targetListId,
      position,
    });
    return response.data;
  },

  async assignTaskMember(taskId: string, userId: string): Promise<Task> {
    const response = await api.post(`/tasks/${taskId}/assignees`, { userId });
    return response.data;
  },

  async removeAssignee(taskId: string, userId: string): Promise<Task> {
    const response = await api.delete(`/tasks/${taskId}/assignees/${userId}`);
    return response.data;
  },
};
