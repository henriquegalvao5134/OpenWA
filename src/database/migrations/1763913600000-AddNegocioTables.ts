import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNegocioTables1763913600000 implements MigrationInterface {
  name = 'AddNegocioTables1763913600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Skip if tables already exist (synchronize → migrations adoption path)
    if (await queryRunner.hasTable('clientes_negocio')) {
      return;
    }

    const isPostgres = queryRunner.dataSource.options.type === 'postgres';

    if (isPostgres) {
      await this.upPostgres(queryRunner);
    } else {
      await this.upSqlite(queryRunner);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.dataSource.options.type === 'postgres';

    if (isPostgres) {
      await this.downPostgres(queryRunner);
    } else {
      await this.downSqlite(queryRunner);
    }
  }

  // ──────────────────────────────────────────────
  //  SQLite
  // ──────────────────────────────────────────────

  private async upSqlite(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "clientes_negocio" (
        "id" varchar PRIMARY KEY NOT NULL,
        "slug" varchar(100) NOT NULL,
        "nome" varchar(200) NOT NULL,
        "segmento" varchar(100),
        "sessionId" varchar(100),
        "observacoes" text,
        "metaPixelId" varchar(50),
        "metaAccessTokenEncrypted" text,
        "metaLdu" boolean NOT NULL DEFAULT (1),
        "modeloIa" varchar(60) NOT NULL DEFAULT ('claude-haiku-4-5'),
        "googleConversionId" varchar(100),
        "ativo" boolean NOT NULL DEFAULT (1),
        "config" text NOT NULL DEFAULT ('{}'),
        "criadoEm" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_clientes_negocio_slug" UNIQUE ("slug")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "usuarios_negocio" (
        "id" varchar PRIMARY KEY NOT NULL,
        "email" varchar(254) NOT NULL,
        "senhaHash" varchar(60) NOT NULL,
        "nome" varchar(200) NOT NULL,
        "papel" varchar(20) NOT NULL DEFAULT ('equipe'),
        "ativo" boolean NOT NULL DEFAULT (1),
        "criadoEm" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_usuarios_negocio_email" UNIQUE ("email")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "usuario_cliente" (
        "usuarioId" varchar(36) NOT NULL,
        "clienteId" varchar(36) NOT NULL,
        PRIMARY KEY ("usuarioId", "clienteId")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "contatos_negocio" (
        "id" varchar PRIMARY KEY NOT NULL,
        "clienteId" varchar(36) NOT NULL,
        "sessionId" varchar(100) NOT NULL,
        "waChatId" varchar(100) NOT NULL,
        "telefone" varchar(30),
        "nomeValidado" varchar(200),
        "origem" varchar(30) NOT NULL DEFAULT ('desconhecido'),
        "ctwaClid" text,
        "gclid" varchar(200),
        "etapa" varchar(20) NOT NULL DEFAULT ('lead'),
        "ultimoContatoEm" datetime,
        "criadoEm" datetime NOT NULL DEFAULT (datetime('now')),
        "atualizadoEm" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_contatos_negocio_cliente_chat" UNIQUE ("clienteId", "waChatId")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contatos_negocio_cliente_chat" ON "contatos_negocio" ("clienteId", "waChatId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contatos_negocio_etapa" ON "contatos_negocio" ("clienteId", "etapa")`,
    );

    await queryRunner.query(
      `CREATE TABLE "analises_ia" (
        "id" varchar PRIMARY KEY NOT NULL,
        "contatoId" varchar(36) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT ('em_aberto'),
        "produto" varchar(200),
        "valorCentavos" integer,
        "confianca" integer NOT NULL DEFAULT (0),
        "resumo" text,
        "evidencias" text NOT NULL DEFAULT ('[]'),
        "revisao" varchar(20) NOT NULL DEFAULT ('pendente'),
        "revisadoPor" varchar(36),
        "revisadoEm" datetime,
        "modeloIa" varchar(60),
        "criadoEm" datetime NOT NULL DEFAULT (datetime('now'))
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_analises_ia_contato" ON "analises_ia" ("contatoId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_analises_ia_revisao" ON "analises_ia" ("revisao")`,
    );

    await queryRunner.query(
      `CREATE TABLE "vendas_negocio" (
        "id" varchar PRIMARY KEY NOT NULL,
        "contatoId" varchar(36) NOT NULL,
        "analiseId" varchar(36),
        "valorCentavos" integer,
        "produto" varchar(200),
        "origem" varchar(30),
        "ctwaClid" text,
        "gclid" varchar(200),
        "revisao" varchar(20) NOT NULL DEFAULT ('pendente'),
        "metaEnviada" boolean NOT NULL DEFAULT (0),
        "metaEnviadaEm" datetime,
        "metaResposta" text,
        "metaErro" text,
        "googleEnviada" boolean NOT NULL DEFAULT (0),
        "googleResposta" text,
        "googleErro" text,
        "criadoEm" datetime NOT NULL DEFAULT (datetime('now'))
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vendas_negocio_contato" ON "vendas_negocio" ("contatoId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vendas_negocio_revisao" ON "vendas_negocio" ("revisao")`,
    );
  }

  private async downSqlite(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendas_negocio_revisao"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendas_negocio_contato"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendas_negocio"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_analises_ia_revisao"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_analises_ia_contato"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "analises_ia"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contatos_negocio_etapa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contatos_negocio_cliente_chat"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contatos_negocio"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuario_cliente"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuarios_negocio"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clientes_negocio"`);
  }

  // ──────────────────────────────────────────────
  //  PostgreSQL
  // ──────────────────────────────────────────────

  private async upPostgres(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "clientes_negocio" (
        "id" varchar PRIMARY KEY NOT NULL,
        "slug" varchar(100) NOT NULL,
        "nome" varchar(200) NOT NULL,
        "segmento" varchar(100),
        "sessionId" varchar(100),
        "observacoes" text,
        "metaPixelId" varchar(50),
        "metaAccessTokenEncrypted" text,
        "metaLdu" boolean NOT NULL DEFAULT true,
        "modeloIa" varchar(60) NOT NULL DEFAULT 'claude-haiku-4-5',
        "googleConversionId" varchar(100),
        "ativo" boolean NOT NULL DEFAULT true,
        "config" text NOT NULL DEFAULT '{}',
        "criadoEm" timestamp NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_clientes_negocio_slug" UNIQUE ("slug")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "usuarios_negocio" (
        "id" varchar PRIMARY KEY NOT NULL,
        "email" varchar(254) NOT NULL,
        "senhaHash" varchar(60) NOT NULL,
        "nome" varchar(200) NOT NULL,
        "papel" varchar(20) NOT NULL DEFAULT 'equipe',
        "ativo" boolean NOT NULL DEFAULT true,
        "criadoEm" timestamp NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_usuarios_negocio_email" UNIQUE ("email")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "usuario_cliente" (
        "usuarioId" varchar(36) NOT NULL,
        "clienteId" varchar(36) NOT NULL,
        PRIMARY KEY ("usuarioId", "clienteId")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "contatos_negocio" (
        "id" varchar PRIMARY KEY NOT NULL,
        "clienteId" varchar(36) NOT NULL,
        "sessionId" varchar(100) NOT NULL,
        "waChatId" varchar(100) NOT NULL,
        "telefone" varchar(30),
        "nomeValidado" varchar(200),
        "origem" varchar(30) NOT NULL DEFAULT 'desconhecido',
        "ctwaClid" text,
        "gclid" varchar(200),
        "etapa" varchar(20) NOT NULL DEFAULT 'lead',
        "ultimoContatoEm" timestamp,
        "criadoEm" timestamp NOT NULL DEFAULT NOW(),
        "atualizadoEm" timestamp NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_contatos_negocio_cliente_chat" UNIQUE ("clienteId", "waChatId")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contatos_negocio_cliente_chat" ON "contatos_negocio" ("clienteId", "waChatId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contatos_negocio_etapa" ON "contatos_negocio" ("clienteId", "etapa")`,
    );

    await queryRunner.query(
      `CREATE TABLE "analises_ia" (
        "id" varchar PRIMARY KEY NOT NULL,
        "contatoId" varchar(36) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'em_aberto',
        "produto" varchar(200),
        "valorCentavos" integer,
        "confianca" integer NOT NULL DEFAULT 0,
        "resumo" text,
        "evidencias" text NOT NULL DEFAULT '[]',
        "revisao" varchar(20) NOT NULL DEFAULT 'pendente',
        "revisadoPor" varchar(36),
        "revisadoEm" timestamp,
        "modeloIa" varchar(60),
        "criadoEm" timestamp NOT NULL DEFAULT NOW()
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_analises_ia_contato" ON "analises_ia" ("contatoId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_analises_ia_revisao" ON "analises_ia" ("revisao")`,
    );

    await queryRunner.query(
      `CREATE TABLE "vendas_negocio" (
        "id" varchar PRIMARY KEY NOT NULL,
        "contatoId" varchar(36) NOT NULL,
        "analiseId" varchar(36),
        "valorCentavos" integer,
        "produto" varchar(200),
        "origem" varchar(30),
        "ctwaClid" text,
        "gclid" varchar(200),
        "revisao" varchar(20) NOT NULL DEFAULT 'pendente',
        "metaEnviada" boolean NOT NULL DEFAULT false,
        "metaEnviadaEm" timestamp,
        "metaResposta" text,
        "metaErro" text,
        "googleEnviada" boolean NOT NULL DEFAULT false,
        "googleResposta" text,
        "googleErro" text,
        "criadoEm" timestamp NOT NULL DEFAULT NOW()
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vendas_negocio_contato" ON "vendas_negocio" ("contatoId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vendas_negocio_revisao" ON "vendas_negocio" ("revisao")`,
    );
  }

  private async downPostgres(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendas_negocio_revisao"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendas_negocio_contato"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendas_negocio"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_analises_ia_revisao"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_analises_ia_contato"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "analises_ia"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contatos_negocio_etapa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contatos_negocio_cliente_chat"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contatos_negocio"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuario_cliente"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuarios_negocio"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clientes_negocio"`);
  }
}
