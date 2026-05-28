import { User } from './user';

export interface WorkspaceMember {
  userId: User | string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string | User;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}
