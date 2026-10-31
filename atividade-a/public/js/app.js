/**
 * ============================================================
 * ORQUESTRAÇÃO
 * ------------------------------------------------------------
 * Este arquivo é o maestro. Ele não guarda estado e não desenha
 * nada sozinho. Ele apenas:
 *
 *   1. liga eventos do usuário às AÇÕES do estado
 *   2. manda a tela ser redesenhada quando o estado muda
 *   3. dispara a carga inicial dos dados
 *
 * O fluxo é sempre o mesmo, e sempre em um sentido só:
 *
 *   evento  ->  ação  ->  estado  ->  render  ->  tela
 *
 * Nunca o contrário. A tela nunca é a fonte da verdade.
 * ============================================================
 */
import { listPatients, createPatient } from "./api.js";
import {
  subscribe,
  getState,
  setPatients,
  setSearchTerm,
  setOnlyActive,
  setError,
  addPatient,
} from "./state.js";
import {
  renderPatientList,
  renderCounter,
  renderLoading,
  renderError,
} from "./render.js";

/* --- Os elementos que existem na página. Buscamos UMA vez. --- */
const searchInput = document.querySelector("#search-input");
const onlyActiveInput = document.querySelector("#only-active-input");
const patientListElement = document.querySelector("#patient-list");
const resultCounterElement = document.querySelector("#result-counter");
const buttonTheme = document.querySelector("#dark-mode-input");
const nameInput = document.querySelector("#name-input");
const birthDateInput = document.querySelector("#birth-date-input");
const nationalIdInput = document.querySelector("#national-id-input");
const saveButton = document.querySelector("#save-button");
const formFeedbackElement = document.querySelector("#form-feedback");

/**
 * A ÚNICA função que desenha a tela inteira.
 * Ela é chamada toda vez que o estado muda — e apenas por isso.
 */
function renderApp(state) {
  if (state.errorMessage) {
    renderError(state.errorMessage, patientListElement);
    resultCounterElement.textContent = "";
    return;
  }

  if (state.isLoading) {
    renderLoading(patientListElement);
    resultCounterElement.textContent = "";
    return;
  }

  renderPatientList(
    state.visiblePatients,
    state.searchTerm,
    patientListElement,
  );
  renderCounter(
    state.visiblePatients.length,
    state.patients.length,
    resultCounterElement,
  );
}

/* --- Eventos do usuário viram AÇÕES, nunca alterações de DOM --- */
searchInput.addEventListener("input", (event) => {
  setSearchTerm(event.target.value);
});

onlyActiveInput.addEventListener("change", (event) => {
  setOnlyActive(event.target.checked);
});

/* --- Tema claro/escuro --- */
const THEME_KEY = "preferencia-tema";

function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.dataset.tema = "escuro";
  } else {
    delete document.documentElement.dataset.tema;
  }

  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

buttonTheme.addEventListener("change", (event) => {
  applyTheme(event.target.checked);
});

/**
 * Cadastro de paciente.
 *
 * A ordem importa e é sempre a mesma:
 *   1. desabilita o botão  (evita duplo clique — POST não é idempotente)
 *   2. chama a camada de comunicação
 *   3. em caso de sucesso, atualiza o ESTADO (nunca o DOM direto)
 *   4. em caso de erro, mostra a mensagem que veio do servidor
 *   5. reabilita o botão, deu certo ou não
 */
saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;
  setFeedback("Enviando…", null);

  try {
    const created = await createPatient({
      name: nameInput.value,
      birthDate: birthDateInput.value,
      nationalId: nationalIdInput.value,
    });

    addPatient(created);
    setFeedback(`Paciente #${created.id} cadastrado.`, "success");
    nameInput.value = "";
    birthDateInput.value = "";
    nationalIdInput.value = "";
  } catch (error) {
    setFeedback(error.message, "error");
  } finally {
    saveButton.disabled = false;
  }
});

function setFeedback(message, kind) {
  formFeedbackElement.textContent = message;
  formFeedbackElement.className = kind
    ? `patient-form__feedback patient-form__feedback--${kind}`
    : "patient-form__feedback";
}

/* --- Sempre que o estado mudar, a tela é redesenhada --- */
subscribe(renderApp);

/* --- Carga inicial --- */
async function start() {
  renderApp(getState());

  try {
    const patients = await listPatients();
    setPatients(patients);
  } catch (error) {
    setError(error.message);
  }
}

start();
