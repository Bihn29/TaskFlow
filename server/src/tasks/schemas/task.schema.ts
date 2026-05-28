import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { TaskPriority } from '../enums/task-priority.enum';

export type TaskDocument = Task & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Task {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Board', required: true })
  boardId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'List', required: true })
  listId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  position: number;

  @Prop({ type: String, enum: Object.values(TaskPriority), default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Prop({ type: Date, default: null })
  dueDate: Date | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  assignees: Types.ObjectId[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);
