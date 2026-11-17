import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { jsonColumnType, dateColumnType } from '../../../common/utils/column-types';
import { DateTransformer } from '../../../common/transformers/date.transformer';

export type RevisaoVenda = 'pendente' | 'confirmada';

@Entity('vendas_negocio')
export class VendaNegocio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  contatoId!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  analiseId!: string | null;

  /** Valor em centavos */
  @Column({ type: 'integer', nullable: true })
  valorCentavos!: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  produto!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  origem!: string | null;

  @Column({ type: 'text', nullable: true })
  ctwaClid!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  gclid!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pendente' })
  revisao!: RevisaoVenda;

  // ── Meta CAPI ──────────────────────────────────────────────
  @Column({ type: 'boolean', default: false })
  metaEnviada!: boolean;

  @Column({ type: dateColumnType(), nullable: true, transformer: DateTransformer })
  metaEnviadaEm!: Date | null;

  @Column({ type: jsonColumnType(), nullable: true })
  metaResposta!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  metaErro!: string | null;

  // ── Google Ads ─────────────────────────────────────────────
  @Column({ type: 'boolean', default: false })
  googleEnviada!: boolean;

  @Column({ type: jsonColumnType(), nullable: true })
  googleResposta!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  googleErro!: string | null;

  @CreateDateColumn()
  criadoEm!: Date;
}
