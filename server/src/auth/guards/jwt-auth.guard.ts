import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    // Custom handling if needed, otherwise default behaviour
    if (err || !user) {
      throw err || new UnauthorizedException('Bạn cần đăng nhập để truy cập tài nguyên này');
    }
    return user;
  }
}
