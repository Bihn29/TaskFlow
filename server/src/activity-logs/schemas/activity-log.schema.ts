import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true })
export class ActivityLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Board', required: false })
  boardId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Task', required: false })
  taskId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ required: false })
  message?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  metadata?: any;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

// Index configurations for high timeline performance
ActivityLogSchema.index({ boardId: 1, createdAt: -1 });
ActivityLogSchema.index({ taskId: 1, createdAt: -1 });

// Serialization
ActivityLogSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
