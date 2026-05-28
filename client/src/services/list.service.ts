import api from '../lib/api';
import { List } from '../types/list';

export const listService = {
  async getListsByBoard(boardId: string): Promise<List[]> {
    const response = await api.get(`/boards/${boardId}/lists`);
    return response.data;
  },

  async createList(boardId: string, title: string): Promise<List> {
    const response = await api.post(`/boards/${boardId}/lists`, { title });
    return response.data;
  },

  async updateList(listId: string, title: string): Promise<List> {
    const response = await api.patch(`/lists/${listId}`, { title });
    return response.data;
  },

  async deleteList(listId: string): Promise<void> {
    await api.delete(`/lists/${listId}`);
  },

  async reorderLists(boardId: string, items: { listId: string; position: number }[]): Promise<any> {
    const response = await api.patch(`/boards/${boardId}/lists/reorder`, { items });
    return response.data;
  },
};
