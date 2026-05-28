export interface Notification {
  id: string;
  userId: string;
  type: 'TASK_ASSIGNED' | 'TASK_COMMENTED' | 'MEMBER_JOINED';
  message: string;
  taskId?: string;
  boardId?: string;
  workspaceId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
