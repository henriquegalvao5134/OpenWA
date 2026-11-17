import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthNegocioService } from './auth-negocio.service';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  senha!: string;
}

@ApiTags('negocio-auth')
@Controller('api/negocio/auth')
export class AuthNegocioController {
  constructor(private readonly authService: AuthNegocioService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login para usuários negócio (email + senha)' })
  @ApiResponse({ status: 200, description: 'Token JWT retornado' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.senha);
  }
}
