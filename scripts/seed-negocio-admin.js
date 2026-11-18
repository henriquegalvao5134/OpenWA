#!/usr/bin/env node
/**
 * Seed: cria o primeiro usuário admin do módulo ELO (negócio).
 *
 * Uso (na VPS, dentro de /opt/openwa):
 *   node scripts/seed-negocio-admin.js
 *
 * Variáveis de ambiente (opcionais):
 *   ADMIN_EMAIL  — padrão: admin@gd3.com.br
 *   ADMIN_SENHA  — padrão: GD3admin2026!
 *   DATABASE_NAME — caminho do arquivo SQLite (padrão: ./data/openwa.sqlite)
 *
 * Dependências: better-sqlite3, bcryptjs (já no package.json)
 */
'use strict';

const path = require('path');
const crypto = require('crypto');

// Carrega .env da pasta data/ se existir (mesmo padrão do app)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', 'data', '.env.generated') });
  require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: false });
} catch {
  // dotenv opcional
}

const DB_PATH = process.env.DATABASE_NAME || path.join(__dirname, '..', 'data', 'openwa.sqlite');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gd3.com.br';
const ADMIN_SENHA = process.env.ADMIN_SENHA || 'GD3admin2026!';

async function main() {
  // --- bcrypt ---
  let bcrypt;
  try {
    bcrypt = require('bcryptjs');
  } catch {
    console.error('❌  bcryptjs não encontrado. Rode: npm ci');
    process.exit(1);
  }

  // --- better-sqlite3 ---
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch {
    console.error('❌  better-sqlite3 não encontrado. Rode: npm ci');
    process.exit(1);
  }

  // Abre o banco
  let db;
  try {
    db = new Database(DB_PATH, { readonly: false, fileMustExist: true });
  } catch (err) {
    console.error(`❌  Não conseguiu abrir ${DB_PATH}:`, err.message);
    console.error('    O app precisa ter iniciado ao menos uma vez para criar o banco.');
    process.exit(1);
  }

  // Verifica se a tabela existe
  const tableExists = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios_negocio'`)
    .get();

  if (!tableExists) {
    console.error('❌  Tabela usuarios_negocio não existe.');
    console.error('    Inicie o app uma vez (pm2 start openwa) para rodar as migrations.');
    db.close();
    process.exit(1);
  }

  // Verifica se o email já existe
  const existing = db.prepare(`SELECT id FROM usuarios_negocio WHERE email = ?`).get(ADMIN_EMAIL);
  if (existing) {
    console.log(`ℹ️   Usuário ${ADMIN_EMAIL} já existe (id: ${existing.id}). Nada feito.`);
    db.close();
    return;
  }

  // Hash da senha
  const senhaHash = await bcrypt.hash(ADMIN_SENHA, 12);
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO usuarios_negocio (id, email, senhaHash, nome, papel, ativo, criadoEm)
     VALUES (?, ?, ?, ?, 'admin', 1, datetime('now'))`,
  ).run(id, ADMIN_EMAIL, senhaHash, 'Admin GD3');

  db.close();

  console.log('✅  Admin criado com sucesso!');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Senha: ${ADMIN_SENHA}`);
  console.log(`   ID:    ${id}`);
  console.log('');
  console.log('⚠️   Troque a senha após o primeiro login.');
}

main().catch((err) => {
  console.error('❌  Erro inesperado:', err);
  process.exit(1);
});
