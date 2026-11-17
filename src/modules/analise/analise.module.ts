import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnaliseIa } from './entities/analise-ia.entity';
import { ContatoNegocio } from '../comercial/entities/contato-negocio.entity';
import { ClienteNegocio } from '../comercial/entities/cliente-negocio.entity';
import { Message } from '../message/entities/message.entity';
import { AnaliseService } from './analise.service';
import { AnaliseScheduler } from './analise.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [AnaliseIa, ContatoNegocio, ClienteNegocio, Message],
      'data',
    ),
  ],
  providers: [AnaliseService, AnaliseScheduler],
  exports: [AnaliseService],
})
export class AnaliseModule {}
