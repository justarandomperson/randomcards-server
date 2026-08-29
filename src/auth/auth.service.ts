import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/signin.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ValidateTokenDto } from './dto/ValidateToken.dto';
import bcrypt from "bcrypt"
import { NotFoundError } from 'rxjs';


@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

      async signUp(createUserDto: CreateUserDto): Promise<{access_token: string}>
    {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10)

        const existingUser = await this.usersService.findOne(createUserDto.username);
        if (existingUser) throw new NotFoundException("Username is taken")

        const user = await this.usersService.create({username: createUserDto.username, password: hashedPassword})
        
        const payload = { sub: user._id.toString(), username: user.username }
        return {
            access_token: await this.jwtService.signAsync(payload)
        }
    }

    async signIn(signInDto: SignInDto): Promise<{access_token: string}>
    {
        const {username, password} = signInDto;
        
        const user = await this.usersService.findOne(username);
        if (!user) throw new NotFoundException("User not found")

        const validPassword = await bcrypt.compare(password, user.password)

        if (!validPassword) throw new UnauthorizedException("Invalid username or password")
        const payload = { sub: user._id.toString(), username: user.username }
        return {
            access_token: await this.jwtService.signAsync(payload)
        }
    }

    async validateToken(validateTokenDto: ValidateTokenDto)
    {
        try {
        const payload = this.jwtService.verify(validateTokenDto.token);
        return { valid: true, payload };
        } catch {
        throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
