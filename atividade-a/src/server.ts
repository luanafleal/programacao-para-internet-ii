/**
 * ============================================================
 * Mini-Prontuario - Servidor HTTP
 * ============================================================
 * Esta semana o servidor e PROPOSITALMENTE simples:
 * um unico arquivo, sem camadas, sem arquitetura.
 * O objetivo e enxergar o HTTP acontecendo.
 *
 * A separacao em camadas chega na Semana 03. Ate la, o que
 * queremos e que voce saiba exatamente o que cada linha faz.
 */
import express from "express";

const app = express();
const PORT = 3000;

// ------------------------------------------------------------
// MIDDLEWARES - executam ANTES das rotas, em ordem
// ------------------------------------------------------------

// Le o corpo da requisicao quando o Content-Type e application/json
// e coloca o resultado em req.body.
// SEM ESTA LINHA, req.body vem `undefined`. Erro numero 1 da turma.
app.use(express.json());

// Serve os arquivos de public/ como conteudo estatico.
// Por isso o frontend e a API vivem na MESMA origem (localhost:3000)
// e nao precisamos falar de CORS ainda.
app.use(express.static("public"));

// ------------------------------------------------------------
// ROTAS
// ------------------------------------------------------------

/** Rota de saude: serve para saber se o servidor esta de pe. */
app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

// ============================================================
// TODO 1 (Encontro 2, Pratica 1)
// GET /api/patients  ->  200 com um ARRAY de pacientes.
// Comece devolvendo um array fixo, escrito na mao. Sem banco ainda.
// ============================================================
app.get("/api/patients", (_request, response) => {
  const patients = [
    {
      id: 1,
      name: "Ana Beatriz Nogueira",
      birthDate: "1991-03-14",
      nationalId: "700012345678901",
      active: true,
    },
    {
      id: 2,
      name: "Carlos Eduardo Matias",
      birthDate: "1978-11-02",
      nationalId: "700012345678902",
      active: true,
    },
    {
      id: 3,
      name: "Dulcineia Rocha Lima",
      birthDate: "1955-07-23",
      nationalId: "700012345678903",
      active: true,
    },
    {
      id: 4,
      name: "Eduardo Vasconcelos",
      birthDate: "2003-01-09",
      nationalId: "700012345678904",
      active: false,
    },
    {
      id: 5,
      name: "Fernanda Passos Alves",
      birthDate: "1986-09-30",
      nationalId: "700012345678905",
      active: true,
    },
    {
      id: 6,
      name: "Gustavo Rios Camelo",
      birthDate: "1999-05-17",
      nationalId: "700012345678906",
      active: true,
    },
    {
      id: 7,
      name: "Helena Marques Sa",
      birthDate: "1968-12-05",
      nationalId: "700012345678907",
      active: false,
    },
    {
      id: 8,
      name: "Igor Bastos Teixeira",
      birthDate: "1994-08-21",
      nationalId: "700012345678908",
      active: true,
    },
  ];

  response.json(patients);
});

// ============================================================
// TODO 2 (Encontro 2, Pratica 2)
// POST /api/patients
//   - leia req.body
//   - valide: name obrigatorio (texto nao vazio)
//              birthDate obrigatorio no formato AAAA-MM-DD
//              nationalId obrigatorio
//   - se invalido:  400  { "error": "mensagem util" }
//   - se valido:    201  com o paciente criado
// ============================================================

// ============================================================
// TODO 3 (Encontro 2, Pratica 3)
// Troque o array em memoria pelo banco:
//   import { db } from "./database";
//   const rows = db.prepare("SELECT ... FROM patients ORDER BY name").all();
// E crie GET /api/patients/:id devolvendo 404 quando nao existir.
// ============================================================

// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Mini-Prontuario no ar em http://localhost:${PORT}`);
});
