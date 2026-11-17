import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { jsonColumnType, dateColumnType } from '../../../common/utils/column-types';
import { DateTransformer } from '../../../common/transformers/date.transformer';

export type StatusAnalise = 'venda' | 'perdida' | 'em_aberto' | 'nao_comercial';
export type RevisaoAnalise = 'pendente' | 'confirmada' | 'rejeitada';

@Entity('analises_ia')
export class AnaliseIa {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  contatoId!: string;

  @Column({ type: 'varchar', length: 20, default: 'em_aberto' })
  status!: StatusAnalise;

  @Column({ type: 'varchar', length: 200, nullable: true })
  produto!: string | null;

  /** Valor estimado da venda em centavos (evita float) */
  @Column({ type: 'integer', nullable: true })
  valorCentavos!: number | null;

  /** Nível de confiança da IA: 0–100 */
  @Column({ type: 'integer', default: 0 })
  confianca!: number;

  @Column({ type: 'text', nullable: true })
  resumo!: string | null;

  /** Array de trechos de conversa que sustentam a análise */
  @Column({ type: jsonColumnType(), default: '[]' })
  evidencias!: string[];

  @Column({ type: 'varchar', length: 20, default: 'pendente' })
  revisao!: RevisaoAnalise;

  /** ID do UsuarioNegocio que revisou */
  @Column({ type: 'varchar', length: 36, nullable: true })
  revisadoPor!: string | null;

  @Column({ type: dateColumnType(), nullable: true, transformer: DateTransformer })
  revisadoEm!: Date | null;

  /** Modelo Claude usado (lido de ClienteNegocio.modeloIa no momento da análise) */
  @Column({ type: 'varchar', length: 60, nullable: true })
  modeloIa!: string | null;

  @CreateDateColumn()
  criadoEm!: Date;
}
