import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Board, BoardSchema } from './schemas/board.schema';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { List, ListSchema } from '../lists/schemas/list.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: List.name, schema: ListSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    WorkspacesModule,
    AuthModule,
    RealtimeModule,
    ActivityLogsModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService, MongooseModule],
})
export class BoardsModule {}
