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
import { request } from "node:http";
import { Patient } from "./models";

const app = express();
const PORT = 3000;

const patients: Patient[] = [
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
app.get("/api/health", (req, response) => {
  response.json({ status: "ok" });
});

// ============================================================
// TODO 1 (Encontro 2, Pratica 1)
// GET /api/patients  ->  200 com um ARRAY de pacientes.
// Comece devolvendo um array fixo, escrito na mao. Sem banco ainda.
// ============================================================
app.get("/api/patients", (req, response) => {
  const filters = req.query;

  let filteredList = [...patients];
  console.log("REQUEST", filters);
  if (filters.active === "true") {
    filteredList = filteredList.filter((patient: Patient) => patient.active);
  }

  response.json(filteredList);
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
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

function isNationalIdDuplicated(nationalId: string) {
  const duplicated = patients.find(
    (patient) => patient.nationalId === nationalId,
  );

  return duplicated != null;
}

function validatePatientInput(body: any): string[] {
  const errors: string[] = [];

  // Nome
  if (isBlank(body?.name)) {
    errors.push("O campo 'name' é obrigatório.");
  }

  // Nascimento
  if (isBlank(body?.birthDate)) {
    errors.push("O campo 'birthDate' é obrigatório.");
  } else if (!ISO_DATE.test(body.birthDate)) {
    errors.push("O campo 'birthDate' deve estar no formato AAAA-MM-DD.");
  } else {
    const birthDate = new Date(`${body.birthDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthDate > today) {
      errors.push("A data de nascimento não pode ser no futuro.");
    }
  }

  // CNS
  if (isBlank(body?.nationalId)) {
    errors.push("O campo 'nationalId' é obrigatório.");
  } else {
    if (!/^\d+$/.test(body.nationalId)) {
      errors.push("O campo 'nationalId' deve conter somente números.");
    } else if (isNationalIdDuplicated(body.nationalId)) {
      errors.push("CNS já está cadastrado.");
    }
  }

  return errors;
}

app.post("/api/patients", (req, response) => {
  const errors = validatePatientInput(req.body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  const newPatient: Patient = {
    id: Math.max(...patients.map((patient) => patient.id), 0) + 1,
    name: req.body.name.trim(),
    birthDate: req.body.birthDate,
    nationalId: req.body.nationalId,
    active: true,
  };

  patients.push(newPatient);

  response.status(201).json(newPatient);
});

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
