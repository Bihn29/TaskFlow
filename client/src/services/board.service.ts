import api from '../lib/api';
import { Board } from '../types/board';

export const boardService = {
  async getBoardsByWorkspace(workspaceId: string): Promise<Board[]> {
    const response = await api.get(`/workspaces/${workspaceId}/boards`);
    return response.data;
  },

  async getBoardById(boardId: string): Promise<Board> {
    const response = await api.get(`/boards/${boardId}`);
    return response.data;
  },

  async createBoard(workspaceId: string, name: string, description: string): Promise<Board> {
    const response = await api.post(`/workspaces/${workspaceId}/boards`, { name, description });
    return response.data;
  },
};
