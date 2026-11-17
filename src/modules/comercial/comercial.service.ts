import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteNegocio } from './entities/cliente-negocio.entity';
import { UsuarioCliente } from './entities/usuario-cliente.entity';
import type { JwtNegocioPayload } from './auth-negocio.service';

@Injectable()
export class ComercialService {
  constructor(
    @InjectRepository(ClienteNegocio)
    private readonly clienteRepo: Repository<ClienteNegocio>,
    @InjectRepository(UsuarioCliente)
    private readonly ucRepo: Repository<UsuarioCliente>,
  ) {}

  async listarClientes(user: JwtNegocioPayload): Promise<ClienteNegocio[]> {
    if (user.papel === 'admin') {
      return this.clienteRepo.find({ where: { ativo: true }, order: { nome: 'ASC' } });
    }
    // Para papel equipe/cliente: retorna só os clientes vinculados
    const vinculos = await this.ucRepo.find({ where: { usuarioId: user.sub } });
    if (!vinculos.length) return [];
    const ids = vinculos.map((v) => v.clienteId);
    return this.clienteRepo.find({ where: ids.map((id) => ({ id, ativo: true })), order: { nome: 'ASC' } });
  }

  async buscarCliente(id: string, user: JwtNegocioPayload): Promise<ClienteNegocio> {
    const cliente = await this.clienteRepo.findOne({ where: { id } });
    if (!cliente) throw new NotFoundException(`Cliente ${id} não encontrado`);

    if (user.papel !== 'admin') {
      const vinculo = await this.ucRepo.findOne({ where: { usuarioId: user.sub, clienteId: id } });
      if (!vinculo) throw new ForbiddenException('Acesso negado a este cliente');
    }

    // Nunca retornar o access token criptografado
    const { metaAccessTokenEncrypted: _, ...rest } = cliente;
    return rest as ClienteNegocio;
  }

  async criarCliente(
    dados: Partial<ClienteNegocio>,
    user: JwtNegocioPayload,
  ): Promise<ClienteNegocio> {
    if (user.papel !== 'admin') throw new ForbiddenException('Apenas admins podem criar clientes');
    const cliente = this.clienteRepo.create(dados);
    return this.clienteRepo.save(cliente);
  }

  async atualizarCliente(
    id: string,
    dados: Partial<ClienteNegocio>,
    user: JwtNegocioPayload,
  ): Promise<ClienteNegocio> {
    if (user.papel !== 'admin') throw new ForbiddenException('Apenas admins podem editar clientes');
    const cliente = await this.clienteRepo.findOne({ where: { id } });
    if (!cliente) throw new NotFoundException(`Cliente ${id} não encontrado`);

    // Nunca sobrescrever token via PATCH sem campo dedicado
    delete (dados as Partial<ClienteNegocio>).metaAccessTokenEncrypted;
    Object.assign(cliente, dados);
    return this.clienteRepo.save(cliente);
  }
}
