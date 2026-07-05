import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserSchema, User } from './schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) {}

      async create(createuserDto: CreateUserDto): Promise<User> {
    const createdCat = new this.userModel(createuserDto);
    return createdCat.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
