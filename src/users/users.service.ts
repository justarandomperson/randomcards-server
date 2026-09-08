import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserSchema, User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createuserDto: CreateUserDto): Promise<UserDocument> {
    const user = await this.usersRepository.create(createuserDto);
    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    return this.usersRepository.findAll();
  }

  async findOne(username: string): Promise<UserDocument | null> {
    const user = await this.usersRepository.findOne(username);
    return user;
  }
}
