import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';
import { ConversaoService } from './conversao.service';
import type { AcaoRevisao } from './conversao.service';
import { AnaliseService } from '../analise/analise.service';
import { JwtNegocioGuard } from '../comercial/guards/jwt-negocio.guard';
import { NegocioUser } from '../comercial/decorators/negocio-user.decorator';
import type { JwtNegocioPayload } from '../comercial/auth-negocio.service';

class RevisarDto {
  @IsString()
  analiseId!: string;

  @IsString()
  @IsIn(['confirmar', 'corrigir', 'rejeitar', 'marcar_venda', 'desfazer'])
  acao!: AcaoRevisao;

  @IsNumber()
  @IsOptional()
  @Min(0)
  valor?: number;

  @IsString()
  @IsOptional()
  produto?: string;

  @IsString()
  @IsOptional()
  motivo?: string;
}

class ReanalisarDto {
  @IsString()
  contatoId!: string;
}

@ApiTags('negocio-conversoes')
@ApiBearerAuth()
@UseGuards(JwtNegocioGuard)
@Controller('api/negocio/:slug/conversoes')
export class ConversaoController {
  constructor(
    private readonly conversaoService: ConversaoService,
    private readonly analiseService: AnaliseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar conversões com filtros' })
  listar(
    @Param('slug') slug: string,
    @Query('revisao') revisao?: string,
    @Query('periodo') periodo?: string,
    @Query('limite') limite?: string,
  ) {
    // slug é usado para resolver o clienteId via service (simplificado aqui)
    return this.conversaoService.listarConversoes(slug, {
      revisao,
      periodo: periodo ? parseInt(periodo) : undefined,
      limite: limite ? parseInt(limite) : undefined,
    });
  }

  @Post('revisar')
  @ApiOperation({ summary: 'Revisar análise: confirmar, corrigir, rejeitar, marcar_venda ou desfazer' })
  revisar(@Body() body: RevisarDto, @NegocioUser() user: JwtNegocioPayload) {
    return this.conversaoService.revisar(body.analiseId, body.acao, user.sub, {
      valor: body.valor,
      produto: body.produto,
      motivo: body.motivo,
    });
  }

  @Post('reanalisar')
  @ApiOperation({ summary: 'Enfileirar reanálise de uma conversa' })
  reanalisar(@Body() body: ReanalisarDto) {
    return this.analiseService.analisarConversa(body.contatoId, true);
  }
}
