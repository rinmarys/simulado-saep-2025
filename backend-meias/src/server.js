// server.js — mini backend (Prova SAEP) - CORRIGIDO
// npm i express cors pg
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  user: 'postgres',            // <-- ajuste aqui
  password: 'senai',           // <-- ajuste aqui
  host: 'localhost',
  port: 5432,
  database: 'saep_db',         // banco exigido pela prova
});

app.use(cors());
app.use(express.json());

// util simples
const ok = (res, data) => res.json(data);
const fail = (res, err, code = 500) => {
  console.error(err);
  res.status(code).json({ error: typeof err === 'string' ? err : 'Erro interno' });
};

// -----------------------------
// HEALTHCHECK
// -----------------------------
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    ok(res, { status: 'ok' });
  } catch (e) { fail(res, e); }
});

// -----------------------------
// USUÁRIOS
// -----------------------------

// cadastro de usuário (nome, email, senha, tipo)
app.post('/usuarios', async (req, res) => {
  const { nome, email, senha, tipo = 'aluno' } = req.body || {};
  if (!nome || !email || !senha) return fail(res, 'Campos obrigatórios: nome, email, senha', 400);
  try {
    const q = `
      INSERT INTO usuarios (nome, email, senha, tipo)
      VALUES ($1,$2,$3,$4)
      RETURNING id, nome, email, tipo
    `;
    const r = await pool.query(q, [nome, email, senha, tipo]);
    ok(res, r.rows[0]);
  } catch (e) {
    if (String(e?.message).includes('unique')) return fail(res, 'E-mail já cadastrado', 409);
    fail(res, e);
  }
});

// login simples (sem sessão/JWT — retorna o usuário se credenciais ok)
app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return fail(res, 'Informe email e senha', 400);
  try {
    const r = await pool.query(
      'SELECT id, nome, email, tipo FROM usuarios WHERE email=$1 AND senha=$2',
      [email, senha]
    );
    if (r.rows.length === 0) return fail(res, 'Credenciais inválidas', 401);
    ok(res, r.rows[0]);
  } catch (e) { fail(res, e); }
});

// -----------------------------
// MATERIAIS (era produtos - CORRIGIDO)
// -----------------------------

// listar materiais (ordem alfabética, busca opcional ?q=)
app.get('/materiais', async (req, res) => {
  const q = (req.query.q || '').trim();
  const hasQ = q.length > 0;
  const sql =
    `SELECT id, nome, quantidade, estoque_minimo,
            (quantidade < estoque_minimo) AS abaixo_do_minimo
       FROM materiais
      ${hasQ ? 'WHERE lower(nome) LIKE lower($1)' : ''}
      ORDER BY nome ASC`;
  try {
    const args = hasQ ? [`%${q}%`] : [];
    const r = await pool.query(sql, args);
    ok(res, r.rows);
  } catch (e) { fail(res, e); }
});

// obter 1 material
app.get('/materiais/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, nome, quantidade, estoque_minimo,
              (quantidade < estoque_minimo) AS abaixo_do_minimo
         FROM materiais WHERE id=$1`,
      [req.params.id]
    );
    if (!r.rows.length) return fail(res, 'Material não encontrado', 404);
    ok(res, r.rows[0]);
  } catch (e) { fail(res, e); }
});

// criar material
app.post('/materiais', async (req, res) => {
  const { nome, quantidade = 0, estoque_minimo = 0 } = req.body || {};
  if (!nome) return fail(res, 'Campo obrigatório: nome', 400);
  try {
    const r = await pool.query(
      `INSERT INTO materiais (nome, quantidade, estoque_minimo)
       VALUES ($1,$2,$3)
       RETURNING id, nome, quantidade, estoque_minimo`,
      [nome, Number(quantidade) || 0, Number(estoque_minimo) || 0]
    );
    ok(res, r.rows[0]);
  } catch (e) { fail(res, e); }
});

// atualizar material
app.put('/materiais/:id', async (req, res) => {
  const { nome, quantidade, estoque_minimo } = req.body || {};
  try {
    const r = await pool.query(
      `UPDATE materiais
          SET nome = COALESCE($1, nome),
              quantidade = COALESCE($2, quantidade),
              estoque_minimo = COALESCE($3, estoque_minimo)
        WHERE id=$4
      RETURNING id, nome, quantidade, estoque_minimo`,
      [nome ?? null, quantidade ?? null, estoque_minimo ?? null, req.params.id]
    );
    if (!r.rows.length) return fail(res, 'Material não encontrado', 404);
    ok(res, r.rows[0]);
  } catch (e) { fail(res, e); }
});

// deletar material
app.delete('/materiais/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM materiais WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return fail(res, 'Material não encontrado', 404);
    ok(res, { message: 'Material excluído' });
  } catch (e) { fail(res, e); }
});

// -----------------------------
// MOVIMENTAÇÕES (empréstimo/devolução)
// -----------------------------

// criar movimentação + atualizar saldo do material (transação simples)
app.post('/movimentacoes', async (req, res) => {
  const { material_id, usuario_id, tipo, quantidade, data_movimentacao, data_devolucao, status } = req.body || {};
  if (!material_id || !usuario_id || !tipo || !quantidade)
    return fail(res, 'Campos obrigatórios: material_id, usuario_id, tipo, quantidade', 400);

  if (!['emprestimo', 'devolucao'].includes(String(tipo).toLowerCase()))
    return fail(res, "tipo deve ser 'emprestimo' ou 'devolucao'", 400);

  // emprestimo = diminui estoque, devolucao = aumenta estoque
  const delta = String(tipo).toLowerCase() === 'devolucao' ? +Math.abs(quantidade) : -Math.abs(quantidade);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // atualiza saldo
    const up = await client.query(
      'UPDATE materiais SET quantidade = quantidade + $1 WHERE id=$2 RETURNING id, nome, quantidade, estoque_minimo',
      [delta, material_id]
    );
    if (!up.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return fail(res, 'Material não encontrado', 404);
    }

    // registra movimento
    const ins = await client.query(
      `INSERT INTO movimentacoes (material_id, usuario_id, tipo, quantidade, data_movimentacao, data_devolucao, status)
       VALUES ($1,$2,$3,$4,COALESCE($5, NOW()),$6,COALESCE($7,'emprestado'))
       RETURNING id, material_id, usuario_id, tipo, quantidade, data_movimentacao, data_devolucao, status`,
      [
        material_id,
        usuario_id,
        String(tipo).toLowerCase(),
        Math.abs(quantidade),
        data_movimentacao || null,
        data_devolucao || null,
        status || (String(tipo).toLowerCase() === 'emprestimo' ? 'emprestado' : 'devolvido')
      ]
    );

    await client.query('COMMIT');
    client.release();

    ok(res, {
      movimento: ins.rows[0],
      material: {
        ...up.rows[0],
        abaixo_do_minimo: up.rows[0].quantidade < up.rows[0].estoque_minimo,
      },
    });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) { }
    client.release();
    fail(res, e);
  }
});

// histórico geral ou filtrado por material (?material_id=)
app.get('/movimentacoes', async (req, res) => {
  const { material_id } = req.query;
  const hasFilter = !!material_id;
  const sql = `
    SELECT m.id, m.material_id, mat.nome AS material_nome,
           m.usuario_id, u.nome AS responsavel_nome,
           m.tipo, m.quantidade, m.data_movimentacao, m.data_devolucao, m.status
      FROM movimentacoes m
      JOIN materiais mat ON mat.id = m.material_id
      JOIN usuarios u ON u.id = m.usuario_id
     ${hasFilter ? 'WHERE m.material_id = $1' : ''}
     ORDER BY m.data_movimentacao DESC, m.id DESC
  `;
  try {
    const r = await pool.query(sql, hasFilter ? [material_id] : []);
    ok(res, r.rows);
  } catch (e) { fail(res, e); }
});

// -----------------------------
// START
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));