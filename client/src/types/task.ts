import { User } from './user';

export interface Task {
  id: string;
  title: string;
  description: string;
  boardId: string;
  listId: string;
  position: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  createdBy: string | User;
  assignees: (string | User)[];
  createdAt: string;
  updatedAt: string;
}
