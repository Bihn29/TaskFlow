import api from '../lib/api';
import { Comment } from '../types/comment';

export const commentService = {
  async getCommentsByTask(taskId: string): Promise<Comment[]> {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  async createComment(taskId: string, content: string): Promise<Comment> {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await api.patch(`/comments/${commentId}`, { content });
    return response.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  },
};
