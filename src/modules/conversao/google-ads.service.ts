import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { VendaNegocio } from './entities/venda-negocio.entity';
import { ClienteNegocio } from '../comercial/entities/cliente-negocio.entity';
import { ContatoNegocio } from '../comercial/entities/contato-negocio.entity';

interface GoogleResult {
  ok: boolean;
  resposta?: Record<string, unknown>;
  erro?: string;
}

@Injectable()
export class GoogleAdsService {
  private readonly logger = new Logger(GoogleAdsService.name);

  async enviarConversao(
    venda: VendaNegocio,
    cliente: ClienteNegocio,
    contato: ContatoNegocio,
  ): Promise<GoogleResult> {
    if (!cliente.googleConversionId) {
      return { ok: false, erro: 'Google Conversion ID não configurado' };
    }

    const telefoneNormalizado = (contato.telefone || '').replace(/\D/g, '');
    const telefoneDdi = telefoneNormalizado.startsWith('55')
      ? telefoneNormalizado
      : `55${telefoneNormalizado}`;
    const phoneHash = createHash('sha256').update(telefoneDdi).digest('hex');

    if (venda.gclid) {
      return this.enviarClickConversion(venda, cliente, phoneHash);
    } else {
      return this.enviarEnhancedConversion(venda, cliente, phoneHash);
    }
  }

  /**
   * Path 1: com gclid → ClickConversion (offline conversion upload)
   * Requer Developer Token aprovado pelo Google.
   */
  private async enviarClickConversion(
    venda: VendaNegocio,
    cliente: ClienteNegocio,
    _phoneHash: string,
  ): Promise<GoogleResult> {
    // O Google Ads API v17 usa OAuth2 — por ora registrar intenção e avisar
    this.logger.log(
      `Google Ads ClickConversion enfileirado para venda ${venda.id} (gclid: ${venda.gclid}) — requer Developer Token`,
    );
    // TODO: implementar quando Developer Token estiver aprovado
    return {
      ok: false,
      erro: 'Google Ads ClickConversion requer Developer Token aprovado. Configure via painel de saúde.',
    };
  }

  /**
   * Path 2: sem gclid → Enhanced Conversions for Leads (telefone hash)
   */
  private async enviarEnhancedConversion(
    venda: VendaNegocio,
    _cliente: ClienteNegocio,
    phoneHash: string,
  ): Promise<GoogleResult> {
    this.logger.log(
      `Google Ads Enhanced Conversion enfileirado para venda ${venda.id} (phone hash: ${phoneHash.slice(0, 8)}...)`,
    );
    // TODO: implementar Enhanced Conversions for Leads quando Developer Token estiver aprovado
    return {
      ok: false,
      erro: 'Google Ads Enhanced Conversion requer Developer Token aprovado. Configure via painel de saúde.',
    };
  }
}
