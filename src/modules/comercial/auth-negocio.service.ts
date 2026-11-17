import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UsuarioNegocio, PapelUsuario } from './entities/usuario-negocio.entity';

export interface JwtNegocioPayload {
  sub: string;
  email: string;
  papel: PapelUsuario;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthNegocioService {
  constructor(
    @InjectRepository(UsuarioNegocio)
    private readonly usuarioRepo: Repository<UsuarioNegocio>,
  ) {}

  private get secret(): string {
    const s = process.env.JWT_NEGOCIO_SECRET;
    if (!s) throw new Error('JWT_NEGOCIO_SECRET não configurado');
    return s;
  }

  async login(email: string, senha: string): Promise<{ token: string; usuario: Omit<UsuarioNegocio, 'senhaHash'> }> {
    const usuario = await this.usuarioRepo.findOne({ where: { email, ativo: true } });
    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaOk = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaOk) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtNegocioPayload = {
      sub: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
    };

    const token = jwt.sign(payload, this.secret, { expiresIn: '24h' });
    const { senhaHash: _, ...rest } = usuario;
    return { token, usuario: rest };
  }

  verifyToken(token: string): JwtNegocioPayload {
    try {
      return jwt.verify(token, this.secret) as JwtNegocioPayload;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async criarAdmin(email: string, senha: string, nome: string): Promise<UsuarioNegocio> {
    const existe = await this.usuarioRepo.findOne({ where: { email } });
    if (existe) throw new ConflictException(`Usuário ${email} já existe`);

    const hash = await bcrypt.hash(senha, 12);
    const admin = this.usuarioRepo.create({ email, senhaHash: hash, nome, papel: 'admin' });
    return this.usuarioRepo.save(admin);
  }

  async criarUsuario(email: string, senha: string, nome: string, papel: PapelUsuario = 'equipe'): Promise<UsuarioNegocio> {
    const existe = await this.usuarioRepo.findOne({ where: { email } });
    if (existe) throw new ConflictException(`Usuário ${email} já existe`);

    const hash = await bcrypt.hash(senha, 12);
    const usuario = this.usuarioRepo.create({ email, senhaHash: hash, nome, papel });
    return this.usuarioRepo.save(usuario);
  }
}
