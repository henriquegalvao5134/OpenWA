import { Entity, Column, PrimaryColumn } from 'typeorm';

/** Tabela de ligação muitos-para-muitos: um usuário pode gerenciar vários clientes */
@Entity('usuario_cliente')
export class UsuarioCliente {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  usuarioId!: string;

  @PrimaryColumn({ type: 'varchar', length: 36 })
  clienteId!: string;
}
