import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<UserDocument> {
    const { name, email, password } = registerDto;

    // Check if the user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng bởi tài khoản khác');
    }

    // Encrypt/Hash the password securely using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save to the database via UsersService
    return this.usersService.createUser(name, email, passwordHash);
  }

  /**
   * Validate credentials and emit JWT access token
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const { email, password } = loginDto;

    // Find the user in the database
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Compare passwords securely
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Payload structure for JWT
    const payload = { sub: user._id.toString(), email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    // Convert mongoose document to JSON to invoke transform hooks
    const userJson = user.toJSON();

    return {
      accessToken,
      user: userJson,
    };
  }

  /**
   * Verify and fetch current user profile by their ID
   */
  async getMe(userId: string): Promise<UserDocument> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại hoặc phiên đăng nhập đã hết hạn');
    }
    return user;
  }
}
