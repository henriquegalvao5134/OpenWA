import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ComercialService } from './comercial.service';
import { JwtNegocioGuard } from './guards/jwt-negocio.guard';
import { NegocioUser } from './decorators/negocio-user.decorator';
import type { JwtNegocioPayload } from './auth-negocio.service';
import { Public } from '../auth/decorators/auth.decorators';

class CriarClienteDto {
  @IsString()
  @MaxLength(100)
  slug!: string;

  @IsString()
  @MaxLength(200)
  nome!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  segmento?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sessionId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  metaPixelId?: string;
}

class AtualizarClienteDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  segmento?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sessionId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  metaPixelId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  modeloIa?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  googleConversionId?: string;

  @IsBoolean()
  @IsOptional()
  metaLdu?: boolean;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

@ApiTags('negocio-clientes')
@ApiBearerAuth()
@Public()
@UseGuards(JwtNegocioGuard)
@Controller('negocio/clientes')
export class ComercialController {
  constructor(private readonly service: ComercialService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes (admin: todos; equipe/cliente: vinculados)' })
  listar(@NegocioUser() user: JwtNegocioPayload) {
    return this.service.listarClientes(user);
  }

  @Post()
  @ApiOperation({ summary: 'Criar cliente (admin)' })
  @ApiResponse({ status: 201 })
  criar(@Body() body: CriarClienteDto, @NegocioUser() user: JwtNegocioPayload) {
    return this.service.criarCliente(body, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do cliente' })
  buscar(@Param('id') id: string, @NegocioUser() user: JwtNegocioPayload) {
    return this.service.buscarCliente(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente (admin)' })
  atualizar(
    @Param('id') id: string,
    @Body() body: AtualizarClienteDto,
    @NegocioUser() user: JwtNegocioPayload,
  ) {
    return this.service.atualizarCliente(id, body, user);
  }
}
