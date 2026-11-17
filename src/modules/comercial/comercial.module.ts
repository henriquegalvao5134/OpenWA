import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteNegocio } from './entities/cliente-negocio.entity';
import { UsuarioNegocio } from './entities/usuario-negocio.entity';
import { UsuarioCliente } from './entities/usuario-cliente.entity';
import { ContatoNegocio } from './entities/contato-negocio.entity';
import { ComercialService } from './comercial.service';
import { ComercialController } from './comercial.controller';
import { AuthNegocioService } from './auth-negocio.service';
import { AuthNegocioController } from './auth-negocio.controller';
import { JwtNegocioGuard } from './guards/jwt-negocio.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [ClienteNegocio, UsuarioNegocio, UsuarioCliente, ContatoNegocio],
      'data',
    ),
  ],
  controllers: [AuthNegocioController, ComercialController],
  providers: [AuthNegocioService, ComercialService, JwtNegocioGuard],
  exports: [AuthNegocioService, ComercialService, JwtNegocioGuard],
})
export class ComercialModule {}
