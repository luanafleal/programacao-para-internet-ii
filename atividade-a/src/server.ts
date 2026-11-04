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
import express, { response } from "express";
import { request } from "node:http";
import { db } from "./database";
import { Patient, PatientRow, EncounterRow } from "./models";

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
app.get("/api/health", (req, response) => {
  response.json({ status: "ok" });
});

// ============================================================
// TODO 1 (Encontro 2, Pratica 1)
// GET /api/patients  ->  200 com um ARRAY de pacientes.
// Comece devolvendo um array fixo, escrito na mao. Sem banco ainda.
// ============================================================
function toPatientJson(row: PatientRow): Patient {
  return {
    id: row.id,
    name: row.name,
    birthDate: row.birth_date,
    nationalId: row.national_id,
    active: row.active === 1,
  };
}

function toEncountersJson(row: EncounterRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    startedAt: row.started_at,
    chiefComplaint: row.chief_complaint,
    notes: row.notes,
  };
}

app.get("/api/patients", (req, response) => {
  const filters = req.query;

  let rows: PatientRow[];

  if (filters.active === "true") {
    rows = db
      .prepare(
        "SELECT id, name, birth_date, national_id, active FROM patients WHERE active = ? ORDER BY name",
      )
      .all(1) as PatientRow[];
  } else {
    rows = db
      .prepare(
        "SELECT id, name, birth_date, national_id, active FROM patients ORDER BY name",
      )
      .all() as PatientRow[];
  }

  const patients = rows.map(toPatientJson);

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
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

function isNationalIdDuplicated(nationalId: string): boolean {
  const row = db
    .prepare("SELECT id FROM patients WHERE national_id = ?")
    .get(nationalId);

  return row != null;
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

  const result = db
    .prepare(
      `
      INSERT INTO patients (
        name,
        birth_date,
        national_id,
        active
      )
      VALUES (?, ?, ?, ?)
    `,
    )
    .run(req.body.name.trim(), req.body.birthDate, req.body.nationalId, 1);

  const row = db
    .prepare("SELECT * FROM patients WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as PatientRow;

  response.status(201).json(toPatientJson(row));
});

// ============================================================
// TODO 3 (Encontro 2, Pratica 3)
// Troque o array em memoria pelo banco:
//   import { db } from "./database";
//   const rows = db.prepare("SELECT ... FROM patients ORDER BY name").all();
// E crie GET /api/patients/:id devolvendo 404 quando nao existir.
// ============================================================
app.get("/api/patients/:id", (req, response) => {
  const id = Number(req.params.id);

  const row = db.prepare("SELECT * FROM patients WHERE id = ?").get(id) as
    | PatientRow
    | undefined;

  if (!row) {
    response.status(404).json({
      error: "Paciente não encontrado.",
    });
    return;
  }

  response.json(toPatientJson(row));
});

// Encounters
app.get("/api/patients/:id/encounters", (req, response) => {
  const patientId = Number(req.params.id);

  if (!Number.isInteger(patientId) || patientId <= 0) {
    response.status(400).json({
      error: "ID do paciente inválido",
    });
    return;
  }

  const patient = db
    .prepare("SELECT id FROM patients WHERE id = ?")
    .get(patientId);

  if (!patient) {
    response.status(404).json({
      error: "Paciente não encontrado.",
    });
    return;
  }

  const rows = db
    .prepare("SELECT * FROM encounters WHERE patient_id = ?")
    .all(patientId) as EncounterRow[];

  response.json(rows.map(toEncountersJson));
});

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function validateEncounterInput(body: any): string[] {
  const errors: string[] = [];

  if (isBlank(body?.chiefComplaint)) {
    errors.push("O campo 'chiefComplaint' é obrigatório.");
  }

  if (isBlank(body?.startedAt)) {
    errors.push("O campo 'startedAt' é obrigatório.");
  } else if (!ISO_DATETIME.test(body.startedAt)) {
    errors.push("O campo 'startedAt' deve estar no formato AAAA-MM-DDTHH:MM.");
  }

  return errors;
}

app.post("/api/patients/:id/encounters", (req, response) => {
  const patientId = Number(req.params.id);

  if (!Number.isInteger(patientId) || patientId <= 0) {
    response.status(400).json({
      error: "ID do paciente inválido",
    });
    return;
  }

  const errors = validateEncounterInput(req.body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  const patient = db
    .prepare("SELECT id FROM patients WHERE id = ?")
    .get(patientId);

  if (!patient) {
    response.status(404).json({
      error: "Paciente não encontrado.",
    });
    return;
  }

  const result = db
    .prepare(
      `
    INSERT INTO encounters (
      patient_id,
      started_at,
      chief_complaint
    )
    VALUES (?, ?, ?)
    `,
    )
    .run(patientId, req.body.startedAt, req.body.chiefComplaint.trim());

  const row = db
    .prepare("SELECT * FROM encounters WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as EncounterRow;

    response.status(201).json(toEncountersJson(row));
});
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Mini-Prontuario no ar em http://localhost:${PORT}`);
});
