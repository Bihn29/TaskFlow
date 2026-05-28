import { User } from './user';

export interface ActivityLog {
  id: string;
  workspaceId: string;
  boardId?: string;
  taskId?: string;
  userId: User; // Populated user info
  action: string;
  message?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}
