export type HealthInsuranceType = 'particular' | 'osde' | 'swiss_medical' | 'galeno' | 'pami' | 'ioma' | 'omint' | 'medife' | 'otra';

export interface CallReminder {
  id: string;
  contactId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
  completed: boolean;
  createdAt: string;
}

export interface ContactAttachment {
  id: string;
  contactId: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // Base64 data URL or Blob URL
  createdAt: string;
}

export interface ContactNote {
  id: string;
  contactId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  color?: 'yellow' | 'pink' | 'blue' | 'green' | 'amber';
}

export interface Contact {
  id: string;
  fullName: string;
  isParticular: boolean;
  insuranceName?: string; // e.g., 'OSDE 310', 'Swiss Medical', 'PAMI'
  affiliateNumber?: string; // Optional member ID
  primaryPhone: string;
  altPhone?: string;
  email?: string;
  address?: string;
  observations?: string;
  isFavorite: boolean;
  avatarColor?: string; // Hex or tailwind class for initial avatar
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'grid' | 'list' | 'compact';
export type FilterType = 'all' | 'favorites' | 'reminders' | 'insurance' | 'particular' | 'notes';
export type MainTab = 'contacts' | 'calendar';

export type DentistName = 'Yani' | 'Marie' | 'Ambas';

export interface InsuranceFolderFile {
  id: string;
  insuranceName: string; // e.g. 'OSDE', 'IAPOS', 'Ecles San Pedro', or 'General'
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  dataUrl: string;
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  contactId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes?: number;
  motive?: string;
  dentist?: 'Yani' | 'Marie' | 'Ambas' | string;
  completed: boolean;
  createdAt: string;

  // Financial and Cost details per turn
  ingresos?: number;
  descartables?: number;
  estampillas?: number;
  materiales?: number;
  mecanicoDental?: number;
  porcentajeHonorario?: number; // Configurable percentage (e.g. 50%)
}
