import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnaliseService } from './analise.service';
import { ClienteNegocio } from '../comercial/entities/cliente-negocio.entity';

@Injectable()
export class AnaliseScheduler {
  private readonly logger = new Logger(AnaliseScheduler.name);
  private rodando = false;

  constructor(
    private readonly analiseService: AnaliseService,
    @InjectRepository(ClienteNegocio, 'data')
    private readonly clienteRepo: Repository<ClienteNegocio>,
  ) {}

  /** A cada 15 minutos, analisa conversas paradas há 30+ min */
  @Cron('*/15 * * * *')
  async rodarAnalises(): Promise<void> {
    if (this.rodando) {
      this.logger.debug('Análise ainda em execução, pulando rodada');
      return;
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      this.logger.debug('ANTHROPIC_API_KEY não configurada — scheduler inativo');
      return;
    }

    this.rodando = true;
    try {
      const clientes = await this.clienteRepo.find({ where: { ativo: true } });
      this.logger.debug(`Iniciando análise para ${clientes.length} clientes ativos`);

      for (const cliente of clientes) {
        await this.analisarCliente(cliente);
      }
    } catch (err) {
      this.logger.error('Erro no scheduler de análise', err);
    } finally {
      this.rodando = false;
    }
  }

  private async analisarCliente(cliente: ClienteNegocio): Promise<void> {
    try {
      const contatoIds = await this.analiseService.buscarContatosParaAnalisar(cliente.id, 15);
      if (!contatoIds.length) return;

      this.logger.debug(`${cliente.slug}: ${contatoIds.length} conversas para analisar`);

      for (const contatoId of contatoIds) {
        try {
          await this.analiseService.analisarConversa(contatoId);
        } catch (err) {
          this.logger.warn(`Falha ao analisar contato ${contatoId}: ${err instanceof Error ? err.message : err}`);
        }
      }
    } catch (err) {
      this.logger.error(`Erro ao processar cliente ${cliente.slug}`, err);
    }
  }
}
