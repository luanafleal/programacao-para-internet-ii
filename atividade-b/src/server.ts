/**
 * ============================================================
 * Painel de Medicacao - Servidor HTTP
 * ============================================================
 * Isto e um "Hello World": so a rota de saude e o servidor
 * estatico. As quatro rotas da atividade (listar, criar, obter
 * um, remover) ainda nao existem — sao o que voce vai construir.
 */
import express from "express";
import { db } from "./database";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

// ============================================================
// PASSO 1 — GET /api/medications
//   db.prepare("SELECT ... FROM medication_orders").all()
//   Nao esqueca de traduzir snake_case -> camelCase antes de responder.
// ============================================================
function toMedicationJson(medication: any) {
  return {
    id: medication.id,
    patientName: medication.patient_name,
    medicationName: medication.medication_name,
    dosage: medication.dosage,
    route: medication.route,
    scheduledAt: medication.scheduled_at,
    notes: medication.notes,
  };
}

app.get("/api/medications", (_request, response) => {
  const rows = db
    .prepare(
      `SELECT id, patient_name, medication_name, dosage,
        route, scheduled_at, notes
      FROM medication_orders
      ORDER BY scheduled_at ASC `,
    )
    .all();

  response.status(200).json(rows.map(toMedicationJson));
});

// ============================================================
// PASSO 3 — POST /api/medications
//   valide patientName, medicationName, dosage, route, scheduledAt
//   INSERT parametrizado -> responda 201 com o registro criado
// ============================================================
function isBlank(value?: string) {
  return !value || value.trim() === "";
}

const ROUTES = ["Oral", "Intravenosa", "Intramuscular"];

function validateMedicationInput(body: any) {
  const errors = [];

  if (isBlank(body.patientName)) {
    errors.push("O campo 'patientName' é obrigatório.");
  }

  if (isBlank(body.medicationName)) {
    errors.push("O campo 'medicationName' é obrigatório.");
  }

  if (isBlank(body.dosage)) {
    errors.push("O campo 'dosage' é obrigatório.");
  }

  if (!ROUTES.includes(body.route)) {
    errors.push(`'route' inválido. Opções: ${ROUTES}`);
  }

  if (isBlank(body.scheduledAt)) {
    errors.push("O campo 'scheduledAt' é obrigatório.");
  }

  return errors;
}

app.post("/api/medications", (request, response) => {
  const problem = validateMedicationInput(request.body);
  if (problem.length > 0) {
    response.status(400).json({ error: problem });
    return;
  }
  const { patientName, medicationName, dosage, route, scheduledAt, notes } =
    request.body;
  const result = db
    .prepare(
      `INSERT INTO medication_orders
(patient_name, medication_name, dosage, route,
scheduled_at, notes)
VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      patientName,
      medicationName,
      dosage,
      route,
      scheduledAt,
      notes ?? null,
    );
  // ... buscar o registro criado e responder 201
  const created = db
    .prepare("SELECT * FROM medication_orders WHERE id = ?")
    .get(result.lastInsertRowid);

  response.status(201).json(toMedicationJson(created));
});
// ============================================================
// PASSO 4 — GET /api/medications/:id
//   db.prepare("SELECT ... WHERE id = ?").get(id)
//   undefined -> 404
// ============================================================
app.get("/api/medications/:id", (request, response) => {
  const row = db
    .prepare(
      `SELECT id, patient_name, medication_name, dosage,
      route, scheduled_at, notes
      FROM medication_orders
      WHERE id = ?`,
    )
    .get(request.params.id);

  if (!row) {
    response.status(404).json({
      error: "Prescrição não encontrada.",
    });
    return;
  }

  response.status(200).json(toMedicationJson(row));
});

// ============================================================
// PASSO 5 — DELETE /api/medications/:id
//   db.prepare("DELETE FROM medication_orders WHERE id = ?").run(id)
//   responda 204, sem corpo
// ============================================================
app.delete("/api/medications/:id", (request, response) => {
  const existing = db
    .prepare("SELECT id FROM medication_orders WHERE id = ?")
    .get(request.params.id);

  if (!existing) {
    response.status(404).json({ error: "Prescrição não encontrada." });
    return;
  }

  db.prepare("DELETE FROM medication_orders WHERE id = ?")
    .run(request.params.id);

  response.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Painel de Medicacao no ar em http://localhost:${PORT}`);
});
