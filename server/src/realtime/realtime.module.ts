import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule, // Gain direct injection of JwtService and configuration bindings
  ],
  providers: [
    RealtimeGateway,
    RealtimeService,
  ],
  exports: [
    RealtimeService, // Export RealtimeService to enable cross-module integrations
  ],
})
export class RealtimeModule {}
