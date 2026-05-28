import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ListDocument = List & Document;

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
export class List {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Board', required: true })
  boardId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, required: true })
  position: number;
}

export const ListSchema = SchemaFactory.createForClass(List);
