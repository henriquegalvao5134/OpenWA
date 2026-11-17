import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendaNegocio } from './entities/venda-negocio.entity';
import { AnaliseIa } from '../analise/entities/analise-ia.entity';
import { ContatoNegocio } from '../comercial/entities/contato-negocio.entity';
import { ClienteNegocio } from '../comercial/entities/cliente-negocio.entity';
import { MetaCapiService } from './meta-capi.service';
import { GoogleAdsService } from './google-ads.service';

export type AcaoRevisao = 'confirmar' | 'corrigir' | 'rejeitar' | 'marcar_venda' | 'desfazer';

@Injectable()
export class ConversaoService {
  constructor(
    @InjectRepository(VendaNegocio)
    private readonly vendaRepo: Repository<VendaNegocio>,
    @InjectRepository(AnaliseIa)
    private readonly analiseRepo: Repository<AnaliseIa>,
    @InjectRepository(ContatoNegocio)
    private readonly contatoRepo: Repository<ContatoNegocio>,
    @InjectRepository(ClienteNegocio)
    private readonly clienteRepo: Repository<ClienteNegocio>,
    private readonly metaCapi: MetaCapiService,
    private readonly googleAds: GoogleAdsService,
  ) {}

  async listarConversoes(
    clienteId: string,
    filtros?: { revisao?: string; periodo?: number; limite?: number },
  ) {
    const qb = this.analiseRepo
      .createQueryBuilder('a')
      .innerJoin(ContatoNegocio, 'c', 'c.id = a.contatoId')
      .where('c.clienteId = :clienteId', { clienteId })
      .orderBy('a.criadoEm', 'DESC')
      .take(filtros?.limite || 50);

    if (filtros?.revisao) {
      qb.andWhere('a.revisao = :revisao', { revisao: filtros.revisao });
    }
    if (filtros?.periodo) {
      const desde = new Date(Date.now() - filtros.periodo * 24 * 60 * 60 * 1000);
      qb.andWhere('a.criadoEm >= :desde', { desde });
    }

    return qb.getMany();
  }

  async revisar(
    analiseId: string,
    acao: AcaoRevisao,
    revisadoPor: string,
    dados?: { valor?: number; produto?: string; motivo?: string },
  ) {
    const analise = await this.analiseRepo.findOne({ where: { id: analiseId } });
    if (!analise) throw new NotFoundException(`Análise ${analiseId} não encontrada`);

    const contato = await this.contatoRepo.findOne({ where: { id: analise.contatoId } });
    if (!contato) throw new NotFoundException('Contato não encontrado');

    const cliente = await this.clienteRepo.findOne({ where: { id: contato.clienteId } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    switch (acao) {
      case 'confirmar':
      case 'corrigir':
        return this.confirmarAnalise(analise, contato, cliente, revisadoPor, dados);

      case 'rejeitar':
        return this.rejeitarAnalise(analise, revisadoPor, dados?.motivo);

      case 'marcar_venda':
        return this.marcarComoVenda(analise, contato, cliente, revisadoPor, dados);

      case 'desfazer':
        return this.desfazerRevisao(analise);

      default:
        throw new BadRequestException(`Ação '${acao}' não reconhecida`);
    }
  }

  private async confirmarAnalise(
    analise: AnaliseIa,
    contato: ContatoNegocio,
    cliente: ClienteNegocio,
    revisadoPor: string,
    dados?: { valor?: number; produto?: string },
  ) {
    // 1. Marcar análise como confirmada
    analise.revisao = 'confirmada';
    analise.revisadoPor = revisadoPor;
    analise.revisadoEm = new Date();
    await this.analiseRepo.save(analise);

    // 2. Criar ou atualizar venda
    let venda = await this.vendaRepo.findOne({ where: { analiseId: analise.id } });
    if (!venda) {
      venda = this.vendaRepo.create({
        contatoId: contato.id,
        analiseId: analise.id,
        ctwaClid: contato.ctwaClid,
        gclid: contato.gclid,
        origem: contato.origem,
      });
    }

    venda.revisao = 'confirmada';
    if (dados?.valor != null) venda.valorCentavos = Math.round(dados.valor * 100);
    else venda.valorCentavos = analise.valorCentavos;
    if (dados?.produto) venda.produto = dados.produto;
    else venda.produto = analise.produto;

    await this.vendaRepo.save(venda);

    // 3. Enviar para plataformas de forma síncrona (nunca fire-and-forget)
    await this.enviarParaPlataformas(venda, cliente, contato);

    return { analise, venda };
  }

  private async rejeitarAnalise(analise: AnaliseIa, revisadoPor: string, _motivo?: string) {
    analise.revisao = 'rejeitada';
    analise.revisadoPor = revisadoPor;
    analise.revisadoEm = new Date();
    return this.analiseRepo.save(analise);
  }

  private async marcarComoVenda(
    analise: AnaliseIa,
    contato: ContatoNegocio,
    cliente: ClienteNegocio,
    revisadoPor: string,
    dados?: { valor?: number; produto?: string },
  ) {
    analise.status = 'venda';
    return this.confirmarAnalise(analise, contato, cliente, revisadoPor, dados);
  }

  private async desfazerRevisao(analise: AnaliseIa) {
    // Verificar se a venda já foi enviada
    const venda = await this.vendaRepo.findOne({ where: { analiseId: analise.id } });
    if (venda?.metaEnviada || venda?.googleEnviada) {
      throw new BadRequestException('Não é possível desfazer: conversão já enviada para plataformas');
    }

    analise.revisao = 'pendente';
    analise.revisadoPor = null;
    analise.revisadoEm = null;
    await this.analiseRepo.save(analise);

    if (venda) {
      venda.revisao = 'pendente';
      await this.vendaRepo.save(venda);
    }

    return analise;
  }

  /**
   * Envia a venda para Meta CAPI e Google Ads e grava resultado no banco.
   * Nunca fire-and-forget — toda chamada tem resultado gravado.
   */
  private async enviarParaPlataformas(
    venda: VendaNegocio,
    cliente: ClienteNegocio,
    contato: ContatoNegocio,
  ) {
    // Meta CAPI
    const metaResult = await this.metaCapi.enviarConversao(venda, cliente, contato);
    venda.metaEnviada = metaResult.ok;
    if (metaResult.ok) venda.metaEnviadaEm = new Date();
    venda.metaResposta = metaResult.resposta ?? null;
    venda.metaErro = metaResult.erro ?? null;

    // Google Ads
    const googleResult = await this.googleAds.enviarConversao(venda, cliente, contato);
    venda.googleEnviada = googleResult.ok;
    venda.googleResposta = googleResult.resposta ?? null;
    venda.googleErro = googleResult.erro ?? null;

    await this.vendaRepo.save(venda);
  }
}
