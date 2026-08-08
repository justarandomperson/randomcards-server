import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SignInDto } from './dto/signin.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("signup")
    signUp(@Body() createUserDto: CreateUserDto)
    {
        return this.authService.signUp(createUserDto)
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    signIn(@Body() signinDto: SignInDto)
    {
        return this.authService.signIn(signinDto)
    }
}
