export type Patient = {
  id: number;
  name: string;
  birthDate: string;
  nationalId: string;
  active: boolean;
};

export type PatientRow = {
  id: number;
  name: string;
  birth_date: string;
  national_id: string;
  active: number;
};

export type EncounterRow = {
  id: number;
  patient_id: string;
  started_at: string;
  chief_complaint: string;
  notes: string;
};