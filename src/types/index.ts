export interface User {
  id: string;
  dni: string;
  fullName: string;
  role: 'COMUNERO' | 'EMPRESA' | 'ADMIN' | 'AUDITOR';
  trustLevel: 'VERDE' | 'AMARILLO' | 'ROJO';
  points: number;
  sector?: string;
}

export interface Oferta {
  id: string;
  title: string;
  description: string;
  company: string;
  daysLeft: number;
  salary: string;
  location: string;
  requirements: string[];
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
