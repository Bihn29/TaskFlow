import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BoardDocument = Board & Document;

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
export class Board {
  @Prop({ required: true, minlength: 2 })
  name: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;
}

export const BoardSchema = SchemaFactory.createForClass(Board);
