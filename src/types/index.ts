export interface User {
  id: string;
  dni: string;
  fullName: string;
  role: 'COMUNERO' | 'EMPRESA' | 'ADMIN' | 'AUDITOR' | 'DIRECTIVA';
  trustLevel: 'VERDE' | 'AMARILLO' | 'ROJO';
  points: number;
  sector?: string;
}

export interface Oferta {
  id: string;
  title: string;
  description?: string;
  company?: string;
  companyName?: string;
  daysLeft?: number | null;
  salary?: string | number;
  location?: string;
  sector?: string;
  vacancies?: number;
  status?: string;
  estadoLabel?: string;
  tipoManoObra?: string;
  regimenLaboral?: string;
  sistemaTrabajo?: string;
  horarioTrabajo?: string;
  requirements?: string[] | Record<string, unknown>;
}

export interface Postulacion {
  id: string;
  oferta: Partial<Oferta>;
  status: string;
  timeline: TimelineStep[];
}

export interface TimelineStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  notes?: string;
}
