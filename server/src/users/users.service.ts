import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new user in the database
   */
  async createUser(name: string, email: string, passwordHash: string): Promise<UserDocument> {
    const newUser = new this.userModel({
      name,
      email,
      passwordHash,
      avatarUrl: null,
    });
    return newUser.save();
  }

  /**
   * Find a user by their email address
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Find a user by their unique database MongoDB ID
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}
