import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SignInDto } from './dto/signin.dto';
import { ValidateTokenDto } from './dto/ValidateToken.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto) {
    return await this.authService.signUp(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async Login(@Body() signinDto: SignInDto) {
    return await this.authService.signIn(signinDto);
  }

  @Post('validate')
  async validateToken(@Body() validateTokenDto: ValidateTokenDto) {
    return await this.authService.validateToken(validateTokenDto);
  }
}
