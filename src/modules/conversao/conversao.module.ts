import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendaNegocio } from './entities/venda-negocio.entity';
import { AnaliseIa } from '../analise/entities/analise-ia.entity';
import { ContatoNegocio } from '../comercial/entities/contato-negocio.entity';
import { ClienteNegocio } from '../comercial/entities/cliente-negocio.entity';
import { Message } from '../message/entities/message.entity';
import { ConversaoService } from './conversao.service';
import { ConversaoController } from './conversao.controller';
import { MetaCapiService } from './meta-capi.service';
import { GoogleAdsService } from './google-ads.service';
import { AnaliseService } from '../analise/analise.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [VendaNegocio, AnaliseIa, ContatoNegocio, ClienteNegocio, Message],
      'data',
    ),
  ],
  controllers: [ConversaoController],
  providers: [ConversaoService, MetaCapiService, GoogleAdsService, AnaliseService],
  exports: [ConversaoService],
})
export class ConversaoModule {}
