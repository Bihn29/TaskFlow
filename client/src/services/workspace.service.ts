import api from '../lib/api';
import { Workspace } from '../types/workspace';

export const workspaceService = {
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await api.get('/workspaces');
    return response.data;
  },

  async getWorkspaceById(workspaceId: string): Promise<Workspace> {
    const response = await api.get(`/workspaces/${workspaceId}`);
    return response.data;
  },

  async createWorkspace(name: string, description: string): Promise<Workspace> {
    const response = await api.post('/workspaces', { name, description });
    return response.data;
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}`);
  },
};

