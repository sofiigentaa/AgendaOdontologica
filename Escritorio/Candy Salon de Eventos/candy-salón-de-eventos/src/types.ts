export type EventType =
  | 'Cumpleaños'
  | 'Boda'
  | 'Quinceañero'
  | 'Corporativo'
  | 'Baby Shower'
  | 'Catering'
  | 'Graduación'
  | 'Bautismo'
  | 'Cena Privada'
  | 'Otro';

export type PaymentMethod =
  | 'Efectivo'
  | 'Transferencia'
  | 'Tarjeta'
  | 'Mercado Pago'
  | 'Cheque'
  | 'Otro';

export type PaymentConcept =
  | 'Seña inicial'
  | 'Abono parcial'
  | 'Pago final'
  | 'Adicional'
  | 'Devolución';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  concept: PaymentConcept;
  notes?: string;
  receiptNumber?: string;
}

export type EventStatus =
  | 'no_deposit'      // Sin seña
  | 'deposit_paid'    // Con seña / Pago parcial
  | 'fully_paid'      // Totalmente abonado (saldo $0)
  | 'completed'       // Realizado
  | 'cancelled';      // Cancelado

export type ReminderCategory =
  | 'cobro_saldo'
  | 'confirmar_invitados'
  | 'proveedores_catering'
  | 'decoracion_candy'
  | 'aviso_cliente'
  | 'otro';

export type ReminderPriority = 'high' | 'medium' | 'low';

export interface ReminderItem {
  id: string;
  eventId?: string; // Optional: linked to a specific event
  eventTitle?: string;
  clientName?: string;
  clientPhone?: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  category: ReminderCategory;
  completed: boolean;
  priority: ReminderPriority;
  notes?: string;
  createdAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  eventType: EventType;
  eventDate: string; // Format: YYYY-MM-DD
  eventTime?: string; // Format: HH:mm
  location?: string;
  guestCount?: number;
  totalAmount: number; // Monto total presupuestado
  depositAmount: number; // Seña inicial registrada
  paymentHistory: PaymentRecord[]; // Historial de pagos
  status: EventStatus;
  notes?: string;
  reminders?: ReminderItem[]; // Recordatorios asociados al evento
  createdAt: string;
  updatedAt: string;
}

export type FilterStatus = 'all' | 'pending_balance' | 'fully_paid' | 'upcoming_7_days' | 'this_month';
export type ViewMode = 'table' | 'calendar';
export type SortOption = 'date_asc' | 'date_desc' | 'balance_desc' | 'total_desc' | 'client_asc';
