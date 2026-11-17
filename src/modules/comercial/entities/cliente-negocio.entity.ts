import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { jsonColumnType } from '../../../common/utils/column-types';

@Entity('clientes_negocio')
export class ClienteNegocio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 200 })
  nome!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  segmento!: string | null;

  /** ID da sessão OpenWA vinculada (ex: "henrique", "fort-popular") */
  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId!: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  metaPixelId!: string | null;

  /** Access token Meta criptografado — não expor em responses */
  @Column({ type: 'text', nullable: true })
  metaAccessTokenEncrypted!: string | null;

  /** Quando true, envia LDU (Limited Data Use) no Meta CAPI */
  @Column({ type: 'boolean', default: true })
  metaLdu!: boolean;

  /** Modelo Claude usado na análise de conversas */
  @Column({ type: 'varchar', length: 60, default: 'claude-haiku-4-5' })
  modeloIa!: string;

  /** ID da conversão Google Ads (ex: AW-123456789/AbCdEfGhIjK) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  googleConversionId!: string | null;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @Column({ type: jsonColumnType(), default: '{}' })
  config!: Record<string, unknown>;

  @CreateDateColumn()
  criadoEm!: Date;
}
