import { User } from './user';

export interface Comment {
  id: string;
  taskId: string;
  userId: string | User;
  content: string;
  createdAt: string;
  updatedAt: string;
}
