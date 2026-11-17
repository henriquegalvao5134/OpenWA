import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { VendaNegocio } from './entities/venda-negocio.entity';
import { ClienteNegocio } from '../comercial/entities/cliente-negocio.entity';
import { ContatoNegocio } from '../comercial/entities/contato-negocio.entity';

interface CapiResult {
  ok: boolean;
  resposta?: Record<string, unknown>;
  erro?: string;
}

@Injectable()
export class MetaCapiService {
  private readonly logger = new Logger(MetaCapiService.name);

  async enviarConversao(
    venda: VendaNegocio,
    cliente: ClienteNegocio,
    contato: ContatoNegocio,
  ): Promise<CapiResult> {
    if (!cliente.metaPixelId || !cliente.metaAccessTokenEncrypted) {
      return { ok: false, erro: 'Meta Pixel ID ou Access Token não configurado' };
    }

    // Descriptografar token (armazenado em texto puro por ora — melhorar com AES-256-GCM)
    const accessToken = cliente.metaAccessTokenEncrypted;
    const datasetId = cliente.metaPixelId;

    const telefoneNormalizado = (contato.telefone || '').replace(/\D/g, '');
    const telefoneDdi = telefoneNormalizado.startsWith('55')
      ? telefoneNormalizado
      : `55${telefoneNormalizado}`;

    const phoneHash = createHash('sha256').update(telefoneDdi).digest('hex');
    const eventTime = Math.floor(venda.criadoEm.getTime() / 1000);

    const temCtwaClid = !!venda.ctwaClid;
    const actionSource = temCtwaClid ? 'business_messaging' : 'other';

    const userData: Record<string, unknown> = { ph: [phoneHash] };
    if (temCtwaClid) {
      userData.ctwa_clid = venda.ctwaClid;
    }

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: 'Purchase',
          event_time: eventTime,
          event_id: venda.id,
          action_source: actionSource,
          ...(temCtwaClid ? { messaging_channel: 'whatsapp' } : {}),
          user_data: userData,
          custom_data: {
            value: venda.valorCentavos != null ? (venda.valorCentavos / 100).toFixed(2) : undefined,
            currency: 'BRL',
          },
        },
      ],
    };

    // LDU obrigatório quando metaLdu = true (farmácia, saúde)
    if (cliente.metaLdu) {
      payload.data_processing_options = ['LDU'];
      payload.data_processing_options_country = 0;
      payload.data_processing_options_state = 0;
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${datasetId}/events?access_token=${accessToken}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const erro = JSON.stringify(json);
        this.logger.warn(`Meta CAPI falhou para venda ${venda.id}: ${erro}`);
        return { ok: false, resposta: json, erro };
      }

      this.logger.debug(`Meta CAPI ok para venda ${venda.id}`);
      return { ok: true, resposta: json };
    } catch (err) {
      const erro = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erro ao chamar Meta CAPI: ${erro}`);
      return { ok: false, erro };
    }
  }
}
