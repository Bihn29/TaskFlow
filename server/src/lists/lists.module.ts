import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { List, ListSchema } from './schemas/list.schema';
import { ListsService } from './lists.service';
import { ListsController } from './lists.controller';
import { BoardsModule } from '../boards/boards.module';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: List.name, schema: ListSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    BoardsModule,
    AuthModule,
    RealtimeModule,
    ActivityLogsModule,
  ],
  controllers: [ListsController],
  providers: [ListsService],
  exports: [ListsService, MongooseModule],
})
export class ListsModule {}
