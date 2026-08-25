import React, { useState, useEffect, useMemo } from 'react';
import { 
  getStoredContacts, 
  saveStoredContacts, 
  getStoredReminders, 
  saveStoredReminders, 
  getStoredNotes, 
  saveStoredNotes, 
  getStoredAttachments, 
  saveStoredAttachments,
  getStoredAppointments,
  saveStoredAppointments,
  getStoredInsuranceFiles,
  saveStoredInsuranceFiles,
  resetToSampleData,
  clearAllAgendaData,
  clearAppointmentsOnly,
  fetchFromCloudDatabase,
  syncToCloudDatabase
} from './utils/storage';
import { getAllInsuranceFilesFromIDB } from './utils/idbStorage';
import { 
  subscribeToFirestoreAgenda, 
  fetchFromFirestore, 
  forceSyncToCloud,
  syncToFirestore,
  SESSION_DEVICE_ID,
  subscribeToFirestoreInsuranceFiles,
  saveInsuranceFileToCloud,
  deleteInsuranceFileFromCloud,
  saveAttachmentToCloud,
  deleteAttachmentFromCloud
} from './services/firebaseFirestore';
import { Contact, CallReminder, ContactNote, ContactAttachment, Appointment, InsuranceFolderFile, ViewMode, FilterType, MainTab } from './types';
import { INITIAL_APPOINTMENTS } from './data/sampleContacts';
import { OBRAS_SOCIALES_LIST } from './constants/insurances';
import { Header } from './components/Header';
import { ContactCard } from './components/ContactCard';
import { ContactFormModal } from './components/ContactFormModal';
import { ContactDetailModal } from './components/ContactDetailModal';
import { ReminderListModal } from './components/ReminderListModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CalendarView } from './components/CalendarView';
import { ScheduleAppointmentModal } from './components/ScheduleAppointmentModal';
import { QuickNoteModal } from './components/QuickNoteModal';
import { ShareContactModal } from './components/ShareContactModal';
import { InsuranceFolderModal } from './components/InsuranceFolderModal';
import { FinanceSummaryModal } from './components/FinanceSummaryModal';
import { ResetAgendaModal } from './components/ResetAgendaModal';
import { AssistantChat } from './components/AssistantChat';
import { Toast } from './components/Toast';
import { PatientSearchSelect } from './components/PatientSearchSelect';
import { GoogleActionModal, GoogleActionType } from './components/GoogleActionModal';
import { initAuth, googleSignIn, logoutGoogle, getAccessToken } from './services/googleAuth';
import { createGoogleCalendarEvent, sendGmailAppointmentConfirmation } from './services/googleWorkspace';
import { formatDateWithDayName } from './utils/time';
import { User } from 'firebase/auth';
import { supabase } from './supabaseClient';
import { fetchFromSupabase, syncToSupabase, subscribeToSupabaseRealtime } from './utils/supabaseSync';
import { 
  Users, 
  UserPlus, 
  SearchX, 
  Star, 
  ShieldCheck, 
  Bell, 
  Sparkles, 
  BookOpen, 
  Info, 
  Calendar as CalendarIcon, 
  FileText,
  Folder,
  Calculator,
  Plus
} from 'lucide-react';

export default function App() {
  // State
  const [activeTab, setActiveTab] = useState<MainTab>('calendar');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reminders, setReminders] = useState<CallReminder[]>([]);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [attachments, setAttachments] = useState<ContactAttachment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [insuranceFiles, setInsuranceFiles] = useState<InsuranceFolderFile[]>([]);

  // Google Workspace state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isExecutingGoogleAction, setIsExecutingGoogleAction] = useState(false);
  const [googleActionModalState, setGoogleActionModalState] = useState<{
    isOpen: boolean;
    actionType: GoogleActionType;
    appointmentData: {
      patientName: string;
      patientEmail?: string;
      dateFormatted: string;
      time: string;
      durationMinutes: number;
      dentist: string;
      motive?: string;
    };
    rawAppointment?: any;
    contact?: Contact;
  }>({
    isOpen: false,
    actionType: 'sync_calendar',
    appointmentData: {
      patientName: '',
      dateFormatted: '',
      time: '',
      durationMinutes: 30,
      dentist: '',
    },
  });

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modals state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isInsuranceFolderOpen, setIsInsuranceFolderOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [selectedDetailContact, setSelectedDetailContact] = useState<Contact | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);

  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [sharingContact, setSharingContact] = useState<Contact | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Appointment Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalInitialContactId, setScheduleModalInitialContactId] = useState('');
  const [scheduleModalInitialDate, setScheduleModalInitialDate] = useState('');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isScheduleContactLocked, setIsScheduleContactLocked] = useState(false);
  const [targetCalendarDate, setTargetCalendarDate] = useState<string | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  // Manual & automatic bi-directional sync function
  const handleManualSync = async () => {
    setIsSyncingCloud(true);
    try {
      // 1. Sync to Supabase PostgreSQL (Unlimited)
      await syncToSupabase({
        contacts,
        appointments,
        reminders,
        notes,
        insuranceFiles,
      });

      const sbData = await fetchFromSupabase();
      if (sbData) {
        if (sbData.contacts !== undefined && sbData.contacts.length > 0) {
          setContacts(sbData.contacts);
          try { localStorage.setItem('mi_agenda_contacts_v4', JSON.stringify(sbData.contacts)); } catch {}
        }
        if (sbData.appointments !== undefined && sbData.appointments.length > 0) {
          setAppointments(sbData.appointments);
          try { localStorage.setItem('mi_agenda_appointments_v4', JSON.stringify(sbData.appointments)); } catch {}
        }
        if (sbData.reminders !== undefined && sbData.reminders.length > 0) {
          setReminders(sbData.reminders);
          try { localStorage.setItem('mi_agenda_reminders_v4', JSON.stringify(sbData.reminders)); } catch {}
        }
        if (sbData.notes !== undefined && sbData.notes.length > 0) {
          setNotes(sbData.notes);
          try { localStorage.setItem('mi_agenda_notes_v4', JSON.stringify(sbData.notes)); } catch {}
        }
        if (sbData.insuranceFiles !== undefined && sbData.insuranceFiles.length > 0) {
          setInsuranceFiles(sbData.insuranceFiles);
          saveStoredInsuranceFiles(sbData.insuranceFiles);
        }
      }

      showToast('☁️ ¡Agenda y turnos sincronizados con la nube (PC y Celular)!');
    } catch (e) {
      showToast('Aviso de sincronización. Los datos permanecen guardados en este dispositivo.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Re-sync automatically via Supabase when mobile or PC browser tab becomes active/visible
  useEffect(() => {
    const handleActiveSync = () => {
      fetchFromSupabase().then((sbData) => {
        if (sbData) {
          if (sbData.contacts !== undefined) {
            setContacts(sbData.contacts);
            try { localStorage.setItem('mi_agenda_contacts_v4', JSON.stringify(sbData.contacts)); } catch {}
          }
          if (sbData.appointments !== undefined) {
            setAppointments(sbData.appointments);
            try { localStorage.setItem('mi_agenda_appointments_v4', JSON.stringify(sbData.appointments)); } catch {}
          }
          if (sbData.reminders !== undefined) {
            setReminders(sbData.reminders);
            try { localStorage.setItem('mi_agenda_reminders_v4', JSON.stringify(sbData.reminders)); } catch {}
          }
          if (sbData.notes !== undefined) {
            setNotes(sbData.notes);
            try { localStorage.setItem('mi_agenda_notes_v4', JSON.stringify(sbData.notes)); } catch {}
          }
          if (sbData.insuranceFiles !== undefined) {
            setInsuranceFiles(sbData.insuranceFiles);
            saveStoredInsuranceFiles(sbData.insuranceFiles);
          }
        }
      }).catch(() => {});
    };

    window.addEventListener('focus', handleActiveSync);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleActiveSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleActiveSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Initialize data from local storage and sync with Supabase
  useEffect(() => {
    const localContacts = getStoredContacts();
    const localReminders = getStoredReminders();
    const localNotes = getStoredNotes();
    const localAttachments = getStoredAttachments();
    const localAppointments = getStoredAppointments();
    const localInsuranceFiles = getStoredInsuranceFiles();

    setContacts(localContacts);
    setReminders(localReminders);
    setNotes(localNotes);
    setAttachments(localAttachments);
    setAppointments(localAppointments);
    setInsuranceFiles(localInsuranceFiles);

    // Sync large files from IndexedDB if available
    getAllInsuranceFilesFromIDB().then((idbFiles) => {
      if (idbFiles && idbFiles.length > 0) {
        setInsuranceFiles(idbFiles);
      }
    }).catch(() => {});

    // 1. Initial sync with Supabase
    fetchFromSupabase().then((sbData) => {
      if (sbData) {
        if (sbData.contacts !== undefined) {
          setContacts(sbData.contacts);
          try { localStorage.setItem('mi_agenda_contacts_v4', JSON.stringify(sbData.contacts)); } catch {}
        }
        if (sbData.appointments !== undefined) {
          setAppointments(sbData.appointments);
          try { localStorage.setItem('mi_agenda_appointments_v4', JSON.stringify(sbData.appointments)); } catch {}
        }
        if (sbData.reminders !== undefined) {
          setReminders(sbData.reminders);
          try { localStorage.setItem('mi_agenda_reminders_v4', JSON.stringify(sbData.reminders)); } catch {}
        }
        if (sbData.notes !== undefined) {
          setNotes(sbData.notes);
          try { localStorage.setItem('mi_agenda_notes_v4', JSON.stringify(sbData.notes)); } catch {}
        }
        if (sbData.insuranceFiles !== undefined) {
          setInsuranceFiles(sbData.insuranceFiles);
          saveStoredInsuranceFiles(sbData.insuranceFiles);
        }
      }
    }).catch(() => {});

    // 2. Direct Supabase Realtime Channels subscription for instant cross-device database synchronization
    const unsubscribeSupabaseRealtime = subscribeToSupabaseRealtime(async () => {
      try {
        const sbData = await fetchFromSupabase();
        if (sbData) {
          if (sbData.contacts !== undefined) {
            setContacts(sbData.contacts);
            try { localStorage.setItem('mi_agenda_contacts_v4', JSON.stringify(sbData.contacts)); } catch {}
          }
          if (sbData.appointments !== undefined) {
            setAppointments(sbData.appointments);
            try { localStorage.setItem('mi_agenda_appointments_v4', JSON.stringify(sbData.appointments)); } catch {}
          }
          if (sbData.reminders !== undefined) {
            setReminders(sbData.reminders);
            try { localStorage.setItem('mi_agenda_reminders_v4', JSON.stringify(sbData.reminders)); } catch {}
          }
          if (sbData.notes !== undefined) {
            setNotes(sbData.notes);
            try { localStorage.setItem('mi_agenda_notes_v4', JSON.stringify(sbData.notes)); } catch {}
          }
          if (sbData.insuranceFiles !== undefined) {
            setInsuranceFiles(sbData.insuranceFiles);
            saveStoredInsuranceFiles(sbData.insuranceFiles);
          }
        }
      } catch {}
    });

    return () => {
      unsubscribeSupabaseRealtime();
    };
  }, []);

  // Google Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        showToast(`Conectado a Google con éxito: ${res.user.email}`);
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast(`Error al conectar Google: ${err.message || 'Intente nuevamente'}`);
      }
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
    showToast('Cuenta de Google desconectada');
  };

  const handlePromptGoogleAction = (
    actionType: GoogleActionType,
    appointmentData: any,
    contact: Contact
  ) => {
    setGoogleActionModalState({
      isOpen: true,
      actionType,
      appointmentData: {
        patientName: contact.fullName,
        patientEmail: contact.email,
        dateFormatted: formatDateWithDayName(appointmentData.date),
        time: appointmentData.time,
        durationMinutes: appointmentData.durationMinutes || 30,
        dentist: appointmentData.dentist || 'Marie',
        motive: appointmentData.motive,
      },
      rawAppointment: appointmentData,
      contact,
    });
  };

  const handleExecuteGoogleAction = async () => {
    const { actionType, rawAppointment, contact } = googleActionModalState;
    if (!rawAppointment || !contact) return;

    let token = googleToken;
    if (!token) {
      token = await getAccessToken();
    }

    if (!token) {
      showToast('Por favor vuelve a iniciar sesión con Google para obtener los permisos.');
      handleConnectGoogle();
      return;
    }

    setIsExecutingGoogleAction(true);

    try {
      const date = rawAppointment.date;
      const time = rawAppointment.time;
      const durationMinutes = rawAppointment.durationMinutes || 30;
      const [h, m] = time.split(':').map(Number);
      const totalEndMin = (h || 0) * 60 + (m || 0) + durationMinutes;
      const endH = Math.floor(totalEndMin / 60) % 24;
      const endM = totalEndMin % 60;

      const startDateTime = `${date}T${time}:00`;
      const endDateTime = `${date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

      if (actionType === 'sync_calendar' || actionType === 'sync_and_email') {
        const calResult = await createGoogleCalendarEvent(token, {
          summary: `Turno: ${contact.fullName} (Dra. ${rawAppointment.dentist || 'Marie'})`,
          description: `Paciente: ${contact.fullName}\nObra Social: ${contact.isParticular ? 'Particular' : contact.insuranceName || 'Particular'}\nTeléfono: ${contact.primaryPhone || '-'}\nMotivo: ${rawAppointment.motive || 'Consulta odontológica'}`,
          startDateTime,
          endDateTime,
        });

        if (calResult.success) {
          showToast('📅 Turno agendado con éxito en tu Google Calendar');
        } else {
          showToast(`Error en Google Calendar: ${calResult.error}`);
        }
      }

      if (actionType === 'send_email' || actionType === 'sync_and_email') {
        if (contact.email) {
          const emailResult = await sendGmailAppointmentConfirmation(token, {
            to: contact.email,
            subject: `Confirmación de Turno Odontológico - ${formatDateWithDayName(date)} ${time} hs`,
            patientName: contact.fullName,
            dentistName: rawAppointment.dentist || 'Marie',
            dateStr: formatDateWithDayName(date),
            timeStr: time,
            durationMinutes,
            motive: rawAppointment.motive || 'Consulta y atención odontológica',
          });

          if (emailResult.success) {
            showToast(`✉️ Correo de confirmación enviado por Gmail a ${contact.email}`);
          } else {
            showToast(`Error al enviar Gmail: ${emailResult.error}`);
          }
        }
      }

      setGoogleActionModalState((prev) => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Error al ejecutar acción de Google'}`);
    } finally {
      setIsExecutingGoogleAction(false);
    }
  };

  // Save contacts on update
  const updateContacts = (newContacts: Contact[]) => {
    setContacts(newContacts);
    saveStoredContacts(newContacts);
    syncToFirestore({ contacts: newContacts }, true);
    syncToSupabase({ contacts: newContacts });
  };

  const updateReminders = (newReminders: CallReminder[]) => {
    setReminders(newReminders);
    saveStoredReminders(newReminders);
    syncToFirestore({ reminders: newReminders }, true);
    syncToSupabase({ reminders: newReminders });
  };

  const updateNotes = (newNotes: ContactNote[]) => {
    setNotes(newNotes);
    saveStoredNotes(newNotes);
    syncToFirestore({ notes: newNotes }, true);
    syncToSupabase({ notes: newNotes });
  };

  const updateAttachments = (newAttachments: ContactAttachment[]) => {
    setAttachments(newAttachments);
    saveStoredAttachments(newAttachments);
    syncToFirestore({ attachments: newAttachments }, true);
  };

  const updateAppointments = (newAppts: Appointment[]) => {
    setAppointments(newAppts);
    saveStoredAppointments(newAppts);
    syncToFirestore({ appointments: newAppts }, true);
    syncToSupabase({ appointments: newAppts });
  };

  const updateInsuranceFiles = (newFiles: InsuranceFolderFile[]) => {
    setInsuranceFiles(newFiles);
    saveStoredInsuranceFiles(newFiles);
    syncToSupabase({ insuranceFiles: newFiles });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Insurance Folder File Handlers
  const handleAddInsuranceFile = (fileData: Omit<InsuranceFolderFile, 'id' | 'createdAt'>) => {
    const newFile: InsuranceFolderFile = {
      id: `insfile-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...fileData,
    };
    const updated = [newFile, ...insuranceFiles];
    updateInsuranceFiles(updated);
    saveInsuranceFileToCloud(newFile).catch((e) => console.error('Cloud save file error:', e));
    showToast(`Archivo "${newFile.title}" guardado y sincronizado`);
  };

  const handleDeleteInsuranceFile = (fileId: string) => {
    const updated = insuranceFiles.filter((f) => f.id !== fileId);
    updateInsuranceFiles(updated);
    deleteInsuranceFileFromCloud(fileId).catch((e) => console.error('Cloud delete file error:', e));
    showToast('Archivo eliminado de la carpeta de obra social');
  };

  const handleClearAllInsuranceFiles = () => {
    const toDelete = [...insuranceFiles];
    updateInsuranceFiles([]);
    toDelete.forEach((f) => {
      deleteInsuranceFileFromCloud(f.id).catch((e) => console.error('Cloud delete error:', e));
    });
    showToast('Todos los archivos han sido eliminados de la carpeta');
  };

  const handleEditAppointmentFinances = (
    appointmentId: string,
    financialData: {
      ingresos: number;
      descartables: number;
      estampillas: number;
      materiales: number;
      mecanicoDental: number;
      porcentajeHonorario: number;
      dentist: 'Yani' | 'Marie' | 'Ambas';
    }
  ) => {
    const updated = appointments.map((a) =>
      a.id === appointmentId ? { ...a, ...financialData } : a
    );
    updateAppointments(updated);
    showToast('Datos financieros del turno actualizados');
  };

  // Appointment Handlers
  const handleSaveAppointment = (
    data: {
      contactId: string;
      date: string;
      time: string;
      durationMinutes: number;
      motive: string;
      dentist?: 'Yani' | 'Marie' | 'Ambas' | string;
      completed: boolean;
      ingresos?: number;
      descartables?: number;
      estampillas?: number;
      materiales?: number;
      mecanicoDental?: number;
      porcentajeHonorario?: number;
      appointmentId?: string;
    },
    appointmentId?: string
  ) => {
    const targetId = data.appointmentId || appointmentId;
    if (targetId) {
      const updated = appointments.map((a) =>
        a.id === targetId ? { ...a, ...data, id: targetId } : a
      );
      updateAppointments(updated);
      showToast('Turno actualizado en el calendario');
    } else {
      const newAppt: Appointment = {
        id: `appt-${Date.now()}`,
        dentist: (data.dentist as 'Yani' | 'Marie' | 'Ambas') || 'Marie',
        ...data,
        createdAt: new Date().toISOString(),
      };
      updateAppointments([newAppt, ...appointments]);
      showToast('Nuevo turno agendado en el calendario');
    }
  };

  const handleToggleAppointmentComplete = (appointmentId: string) => {
    const updated = appointments.map((a) =>
      a.id === appointmentId ? { ...a, completed: !a.completed } : a
    );
    updateAppointments(updated);
    showToast('Estado del turno actualizado');
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    const updated = appointments.filter((a) => a.id !== appointmentId);
    updateAppointments(updated);
    showToast('Turno eliminado del calendario');
  };

  const handleOpenScheduleModalGeneral = (initialDate?: string, editingAppt?: Appointment | null) => {
    setScheduleModalInitialContactId(editingAppt ? editingAppt.contactId : '');
    setScheduleModalInitialDate(initialDate || new Date().toISOString().split('T')[0]);
    setEditingAppointment(editingAppt || null);
    setIsScheduleContactLocked(Boolean(editingAppt));
    setIsScheduleModalOpen(true);
  };

  const handleOpenScheduleModalForContact = (contact: Contact) => {
    setScheduleModalInitialContactId(contact.id);
    setScheduleModalInitialDate(new Date().toISOString().split('T')[0]);
    setEditingAppointment(null);
    setIsScheduleContactLocked(true);
    setIsScheduleModalOpen(true);
  };

  // Auto Schedule handler from AI Assistant
  const handleAutoScheduleFromAssistant = (payload: {
    patient: {
      fullName: string;
      isParticular?: boolean;
      insuranceName?: string;
      affiliateNumber?: string;
      primaryPhone?: string;
      secondaryPhone?: string;
      email?: string;
      address?: string;
      isFavorite?: boolean;
      notes?: string;
    };
    appointment: {
      date: string;
      time: string;
      motive?: string;
    };
  }) => {
    if (!payload || !payload.patient || !payload.patient.fullName) return;

    const patientName = payload.patient.fullName.trim();
    let existingContact = contacts.find(
      (c) => c.fullName.trim().toLowerCase() === patientName.toLowerCase()
    );

    let currentContactList = contacts;
    let contactId = existingContact?.id;

    if (!existingContact) {
      const newContact: Contact = {
        id: `cnt-${Date.now()}`,
        fullName: patientName,
        isParticular: payload.patient.isParticular ?? false,
        insuranceName: payload.patient.insuranceName || '',
        affiliateNumber: payload.patient.affiliateNumber || '',
        primaryPhone: payload.patient.primaryPhone || '',
        altPhone: payload.patient.secondaryPhone || '',
        email: payload.patient.email || '',
        address: payload.patient.address || '',
        isFavorite: payload.patient.isFavorite ?? false,
        observations: payload.patient.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      contactId = newContact.id;
      currentContactList = [newContact, ...contacts];
      updateContacts(currentContactList);
    }

    if (payload.appointment && payload.appointment.date && contactId) {
      const newAppt: Appointment = {
        id: `appt-${Date.now()}`,
        contactId,
        date: payload.appointment.date,
        time: payload.appointment.time || '10:00',
        durationMinutes: 30,
        motive: payload.appointment.motive || payload.patient.notes || 'Consulta odontológica',
        dentist: (payload.appointment as any).dentist || 'Yani',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      updateAppointments([newAppt, ...appointments]);
      showToast(`¡Turno de ${patientName} agendado automáticamente en el calendario para el ${payload.appointment.date} a las ${newAppt.time} hs!`);
    } else {
      showToast(`¡Paciente ${patientName} guardado en la agenda!`);
    }
  };

  // Get unique list of health insurances for dropdown filter
  const insuranceList = useMemo(() => {
    const list = new Set<string>(OBRAS_SOCIALES_LIST);
    contacts.forEach((c) => {
      if (!c.isParticular && c.insuranceName) {
        list.add(c.insuranceName);
      }
    });
    return Array.from(list).sort();
  }, [contacts]);

  // Filter contacts by search and filter chips
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Search term filter (by name, primary phone, alt phone, email, insurance, affiliate or address)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = contact.fullName.toLowerCase().includes(query);
        const phoneMatch = contact.primaryPhone.includes(query) || (contact.altPhone && contact.altPhone.includes(query));
        const emailMatch = contact.email ? contact.email.toLowerCase().includes(query) : false;
        const insuranceMatch = contact.insuranceName ? contact.insuranceName.toLowerCase().includes(query) : false;
        const affiliateMatch = contact.affiliateNumber ? contact.affiliateNumber.toLowerCase().includes(query) : false;
        const obsMatch = contact.observations ? contact.observations.toLowerCase().includes(query) : false;

        if (!nameMatch && !phoneMatch && !emailMatch && !insuranceMatch && !affiliateMatch && !obsMatch) {
          return false;
        }
      }

      // Filter category
      if (selectedFilter === 'favorites' && !contact.isFavorite) {
        return false;
      }

      if (selectedFilter === 'particular' && !contact.isParticular) {
        return false;
      }

      if (selectedFilter === 'reminders') {
        const hasActiveRem = reminders.some((r) => r.contactId === contact.id && !r.completed);
        if (!hasActiveRem) return false;
      }

      if (selectedFilter === 'notes') {
        const hasNotes = notes.some((n) => n.contactId === contact.id);
        if (!hasNotes) return false;
      }

      if (selectedInsurance && contact.insuranceName !== selectedInsurance) {
        return false;
      }

      return true;
    });
  }, [contacts, searchTerm, selectedFilter, selectedInsurance, reminders, notes]);

  // Handler: Add / Save Contact
  const handleSaveContact = (data: Partial<Contact>) => {
    if (editingContact) {
      // Edit existing
      const updated = contacts.map((c) =>
        c.id === editingContact.id
          ? {
              ...c,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      updateContacts(updated as Contact[]);
      showToast(`Contacto "${data.fullName}" actualizado correctamente`);
      if (selectedDetailContact?.id === editingContact.id) {
        setSelectedDetailContact({ ...selectedDetailContact, ...data } as Contact);
      }
    } else {
      // Create new
      const newContact: Contact = {
        id: `contact-${Date.now()}`,
        fullName: data.fullName || '',
        isParticular: data.isParticular ?? false,
        insuranceName: data.insuranceName || '',
        affiliateNumber: data.affiliateNumber || '',
        primaryPhone: data.primaryPhone || '',
        altPhone: data.altPhone || '',
        email: data.email || '',
        address: data.address || '',
        observations: data.observations || '',
        isFavorite: data.isFavorite ?? false,
        avatarColor: data.avatarColor || 'bg-blue-600',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updateContacts([newContact, ...contacts]);
      showToast(`Nuevo contacto "${newContact.fullName}" registrado`);
    }
  };

  // Handler: Delete Contact
  const handleConfirmDelete = () => {
    if (!deletingContact) return;
    const filteredC = contacts.filter((c) => c.id !== deletingContact.id);
    const filteredR = reminders.filter((r) => r.contactId !== deletingContact.id);
    const filteredN = notes.filter((n) => n.contactId !== deletingContact.id);
    const filteredA = attachments.filter((a) => a.contactId !== deletingContact.id);

    updateContacts(filteredC);
    updateReminders(filteredR);
    updateNotes(filteredN);
    updateAttachments(filteredA);

    showToast(`Contacto "${deletingContact.fullName}" eliminado`);
    setDeletingContact(null);
    setIsDetailModalOpen(false);
  };

  // Handler: Toggle Favorite
  const handleToggleFavorite = (contactId: string) => {
    const updated = contacts.map((c) => {
      if (c.id === contactId) {
        const nextFav = !c.isFavorite;
        showToast(nextFav ? `Añadido a favoritos` : `Quitado de favoritos`);
        return { ...c, isFavorite: nextFav };
      }
      return c;
    });
    updateContacts(updated);
  };

  // Handler: Update Contact Observations
  const handleUpdateObservations = (contactId: string, observations: string) => {
    const updated = contacts.map((c) =>
      c.id === contactId
        ? {
            ...c,
            observations,
            updatedAt: new Date().toISOString(),
          }
        : c
    );
    updateContacts(updated);
    if (selectedDetailContact && selectedDetailContact.id === contactId) {
      setSelectedDetailContact({ ...selectedDetailContact, observations });
    }
    showToast('Observaciones actualizadas');
  };

  // Handler: Reminders logic
  const handleAddReminder = (contactId: string, date: string, time: string, note?: string) => {
    const newRem: CallReminder = {
      id: `rem-${Date.now()}`,
      contactId,
      date,
      time,
      note,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    updateReminders([...reminders, newRem]);
  };

  const handleToggleReminderComplete = (reminderId: string) => {
    const updated = reminders.map((r) =>
      r.id === reminderId ? { ...r, completed: !r.completed } : r
    );
    updateReminders(updated);
    showToast('Estado del recordatorio actualizado');
  };

  const handleDeleteReminder = (reminderId: string) => {
    const updated = reminders.filter((r) => r.id !== reminderId);
    updateReminders(updated);
    showToast('Recordatorio eliminado');
  };

  const handleUpdateReminder = (
    reminderId: string,
    data: { date: string; time: string; note?: string }
  ) => {
    const updated = reminders.map((r) =>
      r.id === reminderId
        ? {
            ...r,
            date: data.date,
            time: data.time,
            note: data.note,
          }
        : r
    );
    updateReminders(updated);
    showToast('Recordatorio actualizado correctamente');
  };

  // Handler: Notes logic
  const handleAddNote = (contactId: string, text: string, color?: 'yellow' | 'pink' | 'blue' | 'green' | 'amber') => {
    const newNote: ContactNote = {
      id: `note-${Date.now()}`,
      contactId,
      text,
      createdAt: new Date().toISOString(),
      color,
    };
    updateNotes([...notes, newNote]);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    updateNotes(updated);
    showToast('Nota eliminada');
  };

  const handleUpdateNote = (noteId: string, text: string, color?: 'yellow' | 'pink' | 'blue' | 'green' | 'amber') => {
    const updated = notes.map((n) =>
      n.id === noteId
        ? {
            ...n,
            text,
            ...(color ? { color } : {}),
            updatedAt: new Date().toISOString(),
          }
        : n
    );
    updateNotes(updated);
    showToast('Nota actualizada correctamente');
  };

  // Handler: Attachments logic
  const handleAddAttachment = (contactId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newAtt: ContactAttachment = {
        id: `att-${Date.now()}`,
        contactId,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        createdAt: new Date().toISOString(),
      };
      updateAttachments([...attachments, newAtt]);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    const updated = attachments.filter((a) => a.id !== attachmentId);
    updateAttachments(updated);
    showToast('Archivo adjunto eliminado');
  };

  // Backup & Restore
  const handleExportJson = () => {
    const exportData = {
      contacts,
      reminders,
      notes,
      attachments,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mi_Agenda_Copia_Seguridad_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada correctamente');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.contacts) updateContacts(parsed.contacts);
        if (parsed.reminders) updateReminders(parsed.reminders);
        if (parsed.notes) updateNotes(parsed.notes);
        if (parsed.attachments) updateAttachments(parsed.attachments);
        showToast('Datos de la agenda importados correctamente');
      } catch (err) {
        showToast('Error al importar archivo JSON no válido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    setIsResetModalOpen(true);
  };

  const handleClearAll = () => {
    clearAllAgendaData();
    setContacts([]);
    setReminders([]);
    setNotes([]);
    setAttachments([]);
    setAppointments([]);
    setInsuranceFiles([]);
    showToast('¡Agenda vaciada por completo! Lista para usar en producción.');
  };

  const handleClearAppointmentsOnly = () => {
    clearAppointmentsOnly();
    setAppointments([]);
    showToast('¡Turnos del calendario eliminados! Se conservaron los pacientes.');
  };

  const handleResetSampleData = () => {
    resetToSampleData();
    setContacts(getStoredContacts());
    setReminders(getStoredReminders());
    setNotes(getStoredNotes());
    setAttachments(getStoredAttachments());
    setAppointments(getStoredAppointments());
    setInsuranceFiles(getStoredInsuranceFiles());
    showToast('Datos de ejemplo restablecidos correctamente');
  };

  const pendingRemindersCount = reminders.filter((r) => !r.completed).length;
  const favoritesCount = contacts.filter((c) => c.isFavorite).length;

  const contactsSummarySample = useMemo(() => {
    return contacts.slice(0, 10).map((c) => `${c.fullName} (${c.isParticular ? 'Particular' : c.insuranceName || 'Sin obra social'})`).join('; ');
  }, [contacts]);

  const handleToggleAssistant = () => {
    setIsAssistantOpen(true);
    setTimeout(() => {
      document.getElementById('ai-assistant-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#333333] font-sans flex flex-col w-full max-w-full overflow-x-clip">
      
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAssistantOpen={isAssistantOpen}
        onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        selectedInsurance={selectedInsurance}
        onInsuranceChange={setSelectedInsurance}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAddModal={() => {
          setEditingContact(null);
          setIsFormModalOpen(true);
        }}
        onOpenScheduleModal={() => handleOpenScheduleModalGeneral()}
        onOpenRemindersModal={() => setIsRemindersModalOpen(true)}
        pendingRemindersCount={pendingRemindersCount}
        totalContactsCount={contacts.length}
        appointmentsCount={appointments.length}
        favoritesCount={favoritesCount}
        insuranceList={insuranceList}
        notesCount={notes.length}
        onResetData={handleResetData}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onOpenQuickNoteModal={() => setIsQuickNoteModalOpen(true)}
        onOpenInsuranceFolderModal={() => setIsInsuranceFolderOpen(true)}
        onOpenFinanceModal={() => setIsFinanceModalOpen(true)}
        googleUser={googleUser}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
        isConnectingGoogle={isConnectingGoogle}
        isSyncingCloud={isSyncingCloud}
        onManualSync={handleManualSync}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-30 flex items-center gap-2.5">
        <button
          id="btn-floating-add-note"
          onClick={() => setIsQuickNoteModalOpen(true)}
          className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[#4CAF7D] hover:bg-[#3d986b] text-white font-bold text-xs rounded-full shadow-xl border border-white/40 flex items-center gap-1.5 sm:gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Ver o añadir notas u observaciones médicas"
        >
          <FileText className="w-4 h-4 text-white" />
          <span>Notas ({notes.length})</span>
        </button>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1600px] 2xl:max-w-[1780px] w-full mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-5 pb-28 md:pb-6 space-y-3 sm:space-y-5">

        {/* Tab Switch View Render */}
        {activeTab === 'calendar' ? (
          <CalendarView
            appointments={appointments}
            contacts={contacts}
            onOpenScheduleModal={handleOpenScheduleModalGeneral}
            onToggleAppointmentComplete={handleToggleAppointmentComplete}
            onDeleteAppointment={handleDeleteAppointment}
            onSelectContact={(c) => {
              setSelectedDetailContact(c);
              setIsDetailModalOpen(true);
            }}
            onOpenAddContactModal={() => {
              setEditingContact(null);
              setIsFormModalOpen(true);
            }}
            targetDate={targetCalendarDate}
            onClearTargetDate={() => setTargetCalendarDate(null)}
            googleUser={googleUser}
            onPromptGoogleAction={handlePromptGoogleAction}
            onConnectGoogle={handleConnectGoogle}
          />
        ) : (
          <>
            {/* Top Patient Quick Search / Select Bar for Contacts (Sticky) */}
            <div 
              style={{ top: 'var(--app-header-height, 53px)' }}
              className="sticky z-30 bg-[#F5F5F5] pt-1 pb-2.5 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]"
            >
              <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-2.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex-1">
                  <PatientSearchSelect
                    id="select-contact-quick-medical-file"
                    contacts={contacts}
                    onSelectContact={(c) => {
                      setSelectedDetailContact(c);
                      setIsDetailModalOpen(true);
                    }}
                    placeholder="Escribir o seleccionar nombre de paciente para abrir su ficha médica..."
                    clearOnSelect={true}
                    onOpenAddContactModal={() => {
                      setEditingContact(null);
                      setIsFormModalOpen(true);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingContact(null);
                    setIsFormModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#4CAF7D] hover:bg-[#3d986b] text-white text-xs font-bold rounded-xl shadow-2xs transition-all shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Nuevo Paciente</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {filteredContacts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto my-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-[#2E7D5E] rounded-2xl flex items-center justify-center mx-auto">
                  <SearchX className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#333333]">No se encontraron contactos</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Pruebe cambiando los términos de búsqueda o registrando un nuevo contacto.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFilter('all');
                    setSelectedInsurance('');
                    setEditingContact(null);
                    setIsFormModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#4CAF7D] hover:bg-[#3d986b] text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registrar Nuevo Contacto</span>
                </button>
              </div>
            ) : (
              /* Contact Cards Layout */
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid-fluid-contacts'
                    : 'space-y-2.5'
                }
              >
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    reminders={reminders}
                    attachmentsCount={attachments.filter((a) => a.contactId === contact.id).length}
                    notesCount={notes.filter((n) => n.contactId === contact.id).length}
                    viewMode={viewMode}
                    onViewDetails={(c) => {
                      setSelectedDetailContact(c);
                      setIsDetailModalOpen(true);
                    }}
                    onEdit={(c) => {
                      setEditingContact(c);
                      setIsFormModalOpen(true);
                    }}
                    onDelete={(c) => {
                      setDeletingContact(c);
                      setIsDeleteModalOpen(true);
                    }}
                    onToggleFavorite={handleToggleFavorite}
                    onAddReminder={(c) => {
                      setSelectedDetailContact(c);
                      setIsDetailModalOpen(true);
                    }}
                    onScheduleAppointment={handleOpenScheduleModalForContact}
                    onShareContact={(c) => {
                      setSharingContact(c);
                      setIsShareModalOpen(true);
                    }}
                    onShowToast={showToast}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto mb-16 md:mb-0">
        <div className="max-w-[1600px] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 font-medium">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span><strong>Mi Agenda</strong> — Aplicación de gestión de contactos y obras sociales</span>
          </p>
          <p className="text-slate-400">
            Exporta tus contactos o envía WhatsApps con un solo clic.
          </p>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <ContactFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveContact}
        initialData={editingContact}
      />

      <ContactDetailModal
        contact={selectedDetailContact}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(c) => {
          setIsDetailModalOpen(false);
          setEditingContact(c);
          setIsFormModalOpen(true);
        }}
        onDelete={(c) => {
          setDeletingContact(c);
          setIsDeleteModalOpen(true);
        }}
        onToggleFavorite={handleToggleFavorite}
        onScheduleAppointment={handleOpenScheduleModalForContact}
        onEditAppointment={(appt) => handleOpenScheduleModalGeneral(appt.date, appt)}
        appointments={appointments}
        reminders={reminders}
        onAddReminder={handleAddReminder}
        onUpdateReminder={handleUpdateReminder}
        onToggleReminderComplete={handleToggleReminderComplete}
        onDeleteReminder={handleDeleteReminder}
        notes={notes}
        onAddNote={handleAddNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        attachments={attachments}
        onAddAttachment={handleAddAttachment}
        onDeleteAttachment={handleDeleteAttachment}
        onUpdateObservations={handleUpdateObservations}
        onShareContact={(c) => {
          setSharingContact(c);
          setIsShareModalOpen(true);
        }}
        onShowToast={showToast}
      />

      <InsuranceFolderModal
        isOpen={isInsuranceFolderOpen}
        onClose={() => setIsInsuranceFolderOpen(false)}
        files={insuranceFiles}
        onAddFile={handleAddInsuranceFile}
        onDeleteFile={handleDeleteInsuranceFile}
        onClearAllFiles={handleClearAllInsuranceFiles}
      />

      <FinanceSummaryModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        appointments={appointments}
        contacts={contacts}
        onEditAppointmentFinances={handleEditAppointmentFinances}
        onToggleAppointmentComplete={handleToggleAppointmentComplete}
        onShowToast={showToast}
      />

      <ScheduleAppointmentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        contacts={contacts}
        appointments={appointments}
        onSaveAppointment={handleSaveAppointment}
        onOpenAddContactModal={() => {
          setEditingContact(null);
          setIsFormModalOpen(true);
        }}
        initialContactId={scheduleModalInitialContactId}
        initialDate={scheduleModalInitialDate}
        editingAppointment={editingAppointment}
        isContactLocked={isScheduleContactLocked}
        googleUser={googleUser}
        onConnectGoogle={handleConnectGoogle}
        onPromptGoogleAction={handlePromptGoogleAction}
      />

      <ReminderListModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        reminders={reminders}
        contacts={contacts}
        onToggleComplete={handleToggleReminderComplete}
        onDeleteReminder={handleDeleteReminder}
        onUpdateReminder={handleUpdateReminder}
        onSelectContact={(c) => {
          setSelectedDetailContact(c);
          setIsDetailModalOpen(true);
        }}
        onShowToast={showToast}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        contact={deletingContact}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <QuickNoteModal
        isOpen={isQuickNoteModalOpen}
        onClose={() => setIsQuickNoteModalOpen(false)}
        contacts={contacts}
        notes={notes}
        onAddNote={handleAddNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onShowToast={showToast}
        onSelectContactDetail={(contact) => {
          setSelectedDetailContact(contact);
          setIsDetailModalOpen(true);
        }}
      />

      <ShareContactModal
        isOpen={isShareModalOpen}
        contact={sharingContact}
        onClose={() => setIsShareModalOpen(false)}
        onShowToast={showToast}
      />

      <ResetAgendaModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onClearAll={handleClearAll}
        onClearAppointmentsOnly={handleClearAppointmentsOnly}
        onResetSampleData={handleResetSampleData}
        contactsCount={contacts.length}
        appointmentsCount={appointments.length}
      />

      {/* Google Action Confirmation Dialog */}
      <GoogleActionModal
        isOpen={googleActionModalState.isOpen}
        onClose={() => setGoogleActionModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteGoogleAction}
        actionType={googleActionModalState.actionType}
        appointmentData={googleActionModalState.appointmentData}
        isExecuting={isExecutingGoogleAction}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Native Mobile Bottom Navigation Bar (Visible only on mobile screens) */}
      <nav 
        id="mobile-bottom-nav" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-around"
      >
        {/* Turnos Tab */}
        <button
          id="btn-mobile-nav-calendar"
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[56px] ${
            activeTab === 'calendar'
              ? 'text-[#2E7D5E] font-extrabold bg-emerald-50/80'
              : 'text-slate-500 font-semibold hover:text-slate-800'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-none">Turnos</span>
        </button>

        {/* Pacientes Tab */}
        <button
          id="btn-mobile-nav-contacts"
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[56px] ${
            activeTab === 'contacts'
              ? 'text-[#2E7D5E] font-extrabold bg-emerald-50/80'
              : 'text-slate-500 font-semibold hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-none">Pacientes</span>
        </button>

        {/* Central Quick Add Turno Button */}
        <button
          id="btn-mobile-nav-add-schedule"
          type="button"
          onClick={() => handleOpenScheduleModalGeneral()}
          className="flex flex-col items-center justify-center -mt-5 bg-[#2E7D5E] hover:bg-[#24664c] text-white w-12 h-12 rounded-full shadow-lg border-2 border-white cursor-pointer active:scale-95 transition-all"
          title="Agendar nuevo turno"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Obras Sociales Folder */}
        <button
          id="btn-mobile-nav-insurance"
          type="button"
          onClick={() => setIsInsuranceFolderOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[56px] text-slate-500 hover:text-emerald-700 font-semibold"
        >
          <Folder className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] mt-0.5 leading-none">Obras Soc.</span>
        </button>

        {/* Finanzas Summary */}
        <button
          id="btn-mobile-nav-finances"
          type="button"
          onClick={() => setIsFinanceModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[56px] text-slate-500 hover:text-amber-600 font-semibold"
        >
          <Calculator className="w-5 h-5 text-amber-600" />
          <span className="text-[10px] mt-0.5 leading-none">Finanzas</span>
        </button>
      </nav>

    </div>
  );
}
