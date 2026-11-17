import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export type PapelUsuario = 'admin' | 'equipe' | 'cliente';

@Entity('usuarios_negocio')
export class UsuarioNegocio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email!: string;

  /** Senha hasheada com bcrypt (cost 12) — nunca expor em responses */
  @Column({ type: 'varchar', length: 60 })
  senhaHash!: string;

  @Column({ type: 'varchar', length: 200 })
  nome!: string;

  @Column({ type: 'varchar', length: 20, default: 'equipe' })
  papel!: PapelUsuario;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn()
  criadoEm!: Date;
}
