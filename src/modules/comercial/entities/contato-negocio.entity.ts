import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { dateColumnType } from '../../../common/utils/column-types';
import { DateTransformer } from '../../../common/transformers/date.transformer';

export type OrigemContato = 'anuncio_meta' | 'anuncio_google' | 'bio_instagram' | 'organico' | 'desconhecido';
export type EtapaContato = 'lead' | 'oportunidade' | 'vendido' | 'perdido';

@Entity('contatos_negocio')
@Unique(['clienteId', 'waChatId'])
export class ContatoNegocio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  clienteId!: string;

  /** Nome da sessão OpenWA (ex: "henrique") */
  @Column({ type: 'varchar', length: 100 })
  sessionId!: string;

  /** Chat ID do WhatsApp: "5521970172814@c.us" */
  @Column({ type: 'varchar', length: 100 })
  waChatId!: string;

  /** Número normalizado: "5521970172814" */
  @Column({ type: 'varchar', length: 30, nullable: true })
  telefone!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nomeValidado!: string | null;

  @Column({ type: 'varchar', length: 30, default: 'desconhecido' })
  origem!: OrigemContato;

  /** ctwa_clid do Meta (só presente na 1ª msg de quem clicou no anúncio Click-to-WhatsApp) */
  @Column({ type: 'text', nullable: true })
  ctwaClid!: string | null;

  /** gclid do Google Ads */
  @Column({ type: 'varchar', length: 200, nullable: true })
  gclid!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'lead' })
  etapa!: EtapaContato;

  @Column({ type: dateColumnType(), nullable: true, transformer: DateTransformer })
  ultimoContatoEm!: Date | null;

  @CreateDateColumn()
  criadoEm!: Date;

  @UpdateDateColumn()
  atualizadoEm!: Date;
}
