import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { WorkspaceRole } from '../enums/workspace-role.enum';

export type WorkspaceDocument = Workspace & Document;

@Schema({ _id: false })
export class WorkspaceMember {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: Object.values(WorkspaceRole), required: true })
  role: WorkspaceRole;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;
}

export const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);

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
export class Workspace {
  @Prop({ required: true, minlength: 2 })
  name: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  ownerId: MongooseSchema.Types.ObjectId;

  @Prop({ type: [WorkspaceMemberSchema], default: [] })
  members: WorkspaceMember[];
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
