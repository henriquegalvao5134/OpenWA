import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendaNegocio } from './entities/venda-negocio.entity';
import { AnaliseIa } from '../analise/entities/analise-ia.entity';
import { ContatoNegocio } from '../comercial/entities/contato-negocio.entity';
import { ClienteNegocio } from '../comercial/entities/cliente-negocio.entity';
import { ConversaoService } from './conversao.service';
import { ConversaoController } from './conversao.controller';
import { MetaCapiService } from './meta-capi.service';
import { GoogleAdsService } from './google-ads.service';
import { ComercialModule } from '../comercial/comercial.module';
import { AnaliseModule } from '../analise/analise.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [VendaNegocio, AnaliseIa, ContatoNegocio, ClienteNegocio],
      'data',
    ),
    ComercialModule,
    AnaliseModule,
  ],
  controllers: [ConversaoController],
  providers: [ConversaoService, MetaCapiService, GoogleAdsService],
  exports: [ConversaoService],
})
export class ConversaoModule {}
