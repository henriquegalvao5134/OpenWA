import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { AnaliseIa, StatusAnalise } from './entities/analise-ia.entity';
import { ContatoNegocio } from '../comercial/entities/contato-negocio.entity';
import { ClienteNegocio } from '../comercial/entities/cliente-negocio.entity';
import { Message } from '../message/entities/message.entity';

const SYSTEM_PROMPT = `Você é o AGENTE ANALISTA da plataforma.

# SEU PAPEL
Você lê conversas do WhatsApp de um comércio e registra o que aconteceu. Você NUNCA responde
ninguém, NUNCA sugere mensagens e NUNCA fala com o cliente final. Só observa e relata.

# O QUE VOCÊ RECEBE (em JSON)
- cliente: nome, segmento e observacoes do comércio (fatos específicos deste cliente; valem mais que suposições)
- contato: telefone, nome do WhatsApp, origem
- historico_de_compras: compras JÁ registradas deste contato
- analise_anterior: resumo e status da última análise desta conversa (pode vir vazio)
- horas_sem_resposta
- mensagens: só as mensagens NOVAS, em ordem, com autor, horário e texto

# TAREFAS
1. STATUS DA CONVERSA:
   - venda: confirmação clara de compra
   - ORÇAMENTO NÃO É VENDA: perguntar preço e responder o valor é em_aberto
   - perdida: a oportunidade acabou sem compra
   - em_aberto: ainda pode virar venda
   - nao_comercial: conversa pessoal, fornecedor ou equipe
   Na dúvida entre venda e em_aberto, escolha em_aberto.

2. PRODUTO E VALOR:
   - valor: preencha SOMENTE se status = venda e o valor estiver ESCRITO na conversa
   - NUNCA estime nem invente valor

3. RESUMO: até 2 frases.

4. EVIDÊNCIAS: 1 a 3 trechos curtos e literais das mensagens que justificam o status. Sem trecho, o status deve ser em_aberto.

5. CONFIANÇA (0 a 100): 90-100 confirmação explícita | 70-89 sinais fortes | 40-69 indícios fracos | abaixo de 40 quase nada.

# REGRAS QUE VOCÊ NÃO PODE QUEBRAR
- Use somente o que está escrito nas mensagens. Não invente produto, valor, nome ou motivo.
- Sem dados sensíveis no resumo (cartão, CPF, senha, diagnóstico).
- Responda SOMENTE com o JSON abaixo, sem texto antes ou depois.

# FORMATO DA RESPOSTA
{
  "status": "venda | perdida | em_aberto | nao_comercial",
  "produto": "texto ou null",
  "valor": numero ou null,
  "confianca": numero de 0 a 100,
  "resumo": "até 2 frases",
  "evidencias": ["trecho 1", "trecho 2"]
}`;

interface RespostaIa {
  status: StatusAnalise;
  produto: string | null;
  valor: number | null;
  confianca: number;
  resumo: string;
  evidencias: string[];
}

@Injectable()
export class AnaliseService {
  private readonly logger = new Logger(AnaliseService.name);

  constructor(
    @InjectRepository(AnaliseIa, 'data')
    private readonly analiseRepo: Repository<AnaliseIa>,
    @InjectRepository(ContatoNegocio, 'data')
    private readonly contatoRepo: Repository<ContatoNegocio>,
    @InjectRepository(ClienteNegocio, 'data')
    private readonly clienteRepo: Repository<ClienteNegocio>,
    @InjectRepository(Message, 'data')
    private readonly messageRepo: Repository<Message>,
  ) {}

  private getClient(): Anthropic {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');
    return new Anthropic({ apiKey });
  }

  async analisarConversa(contatoId: string, forcarAnalise = false): Promise<AnaliseIa> {
    const contato = await this.contatoRepo.findOne({ where: { id: contatoId } });
    if (!contato) throw new Error(`Contato ${contatoId} não encontrado`);

    const cliente = await this.clienteRepo.findOne({ where: { id: contato.clienteId } });
    if (!cliente) throw new Error(`Cliente ${contato.clienteId} não encontrado`);

    // Buscar análise anterior para contexto
    const analiseAnterior = await this.analiseRepo.findOne({
      where: { contatoId },
      order: { criadoEm: 'DESC' },
    });

    // Buscar mensagens (últimas 60, suficientes para contexto)
    const mensagens = await this.messageRepo.find({
      where: { sessionId: contato.sessionId, chatId: contato.waChatId },
      order: { timestamp: 'ASC' },
      take: 60,
    });

    if (!mensagens.length && !forcarAnalise) {
      throw new Error(`Nenhuma mensagem encontrada para o contato ${contatoId}`);
    }

    const horasSemResposta = this.calcularHorasSemResposta(mensagens);

    const contexto = {
      cliente: {
        nome: cliente.nome,
        segmento: cliente.segmento,
        observacoes: cliente.observacoes,
      },
      contato: {
        telefone: contato.telefone,
        origem: contato.origem,
      },
      analise_anterior: analiseAnterior
        ? { resumo: analiseAnterior.resumo, status: analiseAnterior.status }
        : null,
      horas_sem_resposta: horasSemResposta,
      mensagens: mensagens.map((m) => ({
        autor: m.direction === 'incoming' ? 'contato' : 'atendente',
        horario: new Date(m.timestamp * 1000).toISOString(),
        texto: m.body || `[${m.type.toUpperCase()}]`,
      })),
    };

    // Chamar IA com retry (máx 3 tentativas)
    let respostaIa: RespostaIa | null = null;
    let ultimoErro: string | null = null;

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        const anthropic = this.getClient();
        const response = await anthropic.messages.create({
          model: cliente.modeloIa,
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: JSON.stringify(contexto) }],
        });

        const textoResposta = response.content[0]?.type === 'text' ? response.content[0].text : '';
        respostaIa = JSON.parse(textoResposta) as RespostaIa;
        ultimoErro = null;
        break;
      } catch (err) {
        ultimoErro = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Tentativa ${tentativa}/3 falhou para contato ${contatoId}: ${ultimoErro}`);
        if (tentativa < 3) await new Promise((r) => setTimeout(r, 2000 * tentativa));
      }
    }

    if (!respostaIa) {
      // Nunca marcar como sucesso em falha de IA
      throw new Error(`IA falhou após 3 tentativas: ${ultimoErro}`);
    }

    // ── Regras de negócio (aplicadas em código, não pela IA) ──────────────
    // Regra 1: venda sem evidência é rebaixada para em_aberto
    if (respostaIa.status === 'venda' && (!respostaIa.evidencias || respostaIa.evidencias.length === 0)) {
      respostaIa.status = 'em_aberto';
      respostaIa.confianca = Math.min(respostaIa.confianca, 50);
    }

    // Regra 2: em status != venda, valor deve ser null
    if (respostaIa.status !== 'venda') {
      respostaIa.valor = null;
    }

    // Gravar análise
    const analise = this.analiseRepo.create({
      contatoId,
      status: respostaIa.status,
      produto: respostaIa.produto,
      valorCentavos: respostaIa.valor != null ? Math.round(respostaIa.valor * 100) : null,
      confianca: respostaIa.confianca,
      resumo: respostaIa.resumo,
      evidencias: respostaIa.evidencias || [],
      modeloIa: cliente.modeloIa,
      revisao: 'pendente',
    });

    return this.analiseRepo.save(analise);
  }

  private calcularHorasSemResposta(mensagens: Message[]): number {
    if (!mensagens.length) return 0;
    const ultima = mensagens[mensagens.length - 1];
    const agora = Date.now() / 1000;
    return Math.round((agora - (ultima.timestamp || 0)) / 3600);
  }

  async listarAnalisesPorContato(contatoId: string): Promise<AnaliseIa[]> {
    return this.analiseRepo.find({
      where: { contatoId },
      order: { criadoEm: 'DESC' },
    });
  }

  async buscarAnalise(id: string): Promise<AnaliseIa | null> {
    return this.analiseRepo.findOne({ where: { id } });
  }

  /**
   * Retorna IDs de contatos elegíveis para análise:
   * - têm mensagens recentes (< 24h)
   * - última mensagem foi há 30+ minutos (conversa parou)
   */
  async buscarContatosParaAnalisar(clienteId: string, limite = 15): Promise<string[]> {
    const cliente = await this.clienteRepo.findOne({ where: { id: clienteId } });
    if (!cliente?.sessionId) return [];

    const vinteEquatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trintaMinutosAtras = new Date(Date.now() - 30 * 60 * 1000);

    const contatos = await this.contatoRepo.find({
      where: { clienteId },
      take: 100,
    });

    const elegíveis: string[] = [];

    for (const contato of contatos) {
      if (elegíveis.length >= limite) break;

      // Verificar se há mensagem nas últimas 24h
      const temMensagemRecente = await this.messageRepo.count({
        where: {
          sessionId: contato.sessionId,
          chatId: contato.waChatId,
          createdAt: MoreThan(vinteEquatroHorasAtras),
        },
      });

      if (!temMensagemRecente) continue;

      // Verificar se última mensagem foi há 30+ min (conversa parou)
      const ultimaMensagem = await this.messageRepo.findOne({
        where: { sessionId: contato.sessionId, chatId: contato.waChatId },
        order: { createdAt: 'DESC' },
      });

      if (!ultimaMensagem) continue;
      if (ultimaMensagem.createdAt > trintaMinutosAtras) continue;

      elegíveis.push(contato.id);
    }

    return elegíveis;
  }
}
