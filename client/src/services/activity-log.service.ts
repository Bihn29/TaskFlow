import api from '../lib/api';
import { ActivityLog } from '../types/activity-log';

export const activityLogService = {
  async getBoardActivityLogs(boardId: string): Promise<ActivityLog[]> {
    const response = await api.get(`/boards/${boardId}/activity-logs`);
    return response.data;
  },

  async getTaskActivityLogs(taskId: string): Promise<ActivityLog[]> {
    const response = await api.get(`/tasks/${taskId}/activity-logs`);
    return response.data;
  },
};
