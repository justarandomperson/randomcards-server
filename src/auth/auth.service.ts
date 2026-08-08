import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/signin.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';


@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

      async signUp(createUserDto: CreateUserDto): Promise<{access_token: string}>
    {
        const user = await this.usersService.create(createUserDto)
        
        const payload = { sub: user._id.toString(), username: user.username }
        return {
            access_token: await this.jwtService.signAsync(payload)
        }
    }

    async signIn(signInDto: SignInDto): Promise<{access_token: string}>
    {
        const {username, password} = signInDto;
        
        const user = await this.usersService.findOne(username);
        if (user?.password !== password) throw new UnauthorizedException("Invalid username or password")
        const payload = { sub: user._id.toString(), username: user.username }
        return {
            access_token: await this.jwtService.signAsync(payload)
        }
    }
}
