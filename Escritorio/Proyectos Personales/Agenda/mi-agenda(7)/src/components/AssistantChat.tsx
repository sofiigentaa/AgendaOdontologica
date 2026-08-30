import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Trash2, 
  Minimize2, 
  Maximize2,
  PlusCircle,
  MessageSquare,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Contact } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  autoScheduledData?: any;
  noteData?: {
    text: string;
    patientName?: string;
    createdAt: string;
  };
  postitData?: any;
}

interface AssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  totalContactsCount: number;
  favoritesCount: number;
  insuranceList: string[];
  pendingRemindersCount: number;
  contactsSample?: string;
  contactsList?: Contact[];
  embedded?: boolean;
  onOpenAddModal?: () => void;
  onAddNote?: (contactId: string, text: string, color?: 'yellow' | 'pink' | 'blue' | 'green' | 'amber') => void;
  onAutoScheduleAppointment?: (data: {
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
  }) => void;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  isOpen,
  onClose,
  onToggle,
  totalContactsCount,
  favoritesCount,
  insuranceList,
  pendingRemindersCount,
  contactsSample,
  contactsList = [],
  embedded = true,
  onOpenAddModal,
  onAddNote,
  onAutoScheduleAppointment,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: '¡Hola! 👋 Soy tu **Asistente de Agendamiento y Notas** del **Consultorio Marie - Yani**.\n\nPuedo ayudarte a:\n• 📅 **Agendar turnos y pacientes** en el calendario\n• 📝 **Añadir notas y observaciones** a las fichas de los contactos\n• 🏥 Filtrar obras sociales y recordatorios\n\n¿Qué deseas hacer hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Note Creator State
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteContactId, setNoteContactId] = useState<string>('');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, showNoteForm]);

  const extractJsonBlocks = (text: string) => {
    let cleanText = text;
    let appointmentData = null;
    let noteData = null;

    // Appointment JSON match
    const apptRegex = /```(?:json:contact_appointment|json)?\s*([\s\S]*?)\s*```/;
    const apptMatch = text.match(apptRegex);
    if (apptMatch && apptMatch[1]) {
      try {
        const parsed = JSON.parse(apptMatch[1]);
        if (parsed && (parsed.fullName || parsed.patient?.fullName || parsed.appointmentDate)) {
          appointmentData = parsed;
          cleanText = cleanText.replace(apptRegex, '').trim();
        }
      } catch (e) {
        // Silent fail
      }
    }

    // Note JSON match (json:contact_note or legacy json:postit_note)
    const noteRegex = /```(?:json:contact_note|json:postit_note)?\s*([\s\S]*?)\s*```/;
    const noteMatch = cleanText.match(noteRegex);
    if (noteMatch && noteMatch[1]) {
      try {
        const parsedP = JSON.parse(noteMatch[1]);
        if (parsedP && parsedP.text) {
          noteData = parsedP;
          cleanText = cleanText.replace(noteRegex, '').trim();
        }
      } catch (e) {
        // Silent fail
      }
    }

    return { cleanText, appointmentData, noteData };
  };

  const handleCreateNoteSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noteText.trim()) return;

    const selectedContact = contactsList.find((c) => c.id === noteContactId);
    const patientName = selectedContact ? selectedContact.fullName : undefined;
    const targetContactId = noteContactId || 'general';

    if (onAddNote) {
      onAddNote(targetContactId, noteText.trim());
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: `📝 Añadir Nota / Observación: "${noteText.trim()}"${patientName ? ` para ${patientName}` : ''}`,
      timestamp: nowStr,
    };

    // Append assistant note message
    const assistantMsg: Message = {
      id: `note-${Date.now()}`,
      role: 'assistant',
      content: `¡Nota u observación registrada con éxito en la ficha!`,
      noteData: {
        text: noteText.trim(),
        patientName,
        createdAt: new Date().toLocaleDateString() + ' ' + nowStr,
      },
      timestamp: nowStr,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setNoteText('');
    setShowNoteForm(false);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    if (query.toLowerCase().includes('nota') || query.toLowerCase().includes('observacion') || query.toLowerCase().includes('añadir nota')) {
      setShowNoteForm(true);
      if (!textToSend) setInput('');
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const agendaContext = {
        totalContacts: totalContactsCount,
        favoritesCount,
        insurances: insuranceList,
        pendingRemindersCount,
        summarySample: contactsSample,
      };

      const payloadMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          agendaContext,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con la IA.');
      }

      const rawText = data.text || 'No pude obtener una respuesta en este momento.';
      const { cleanText, appointmentData, noteData } = extractJsonBlocks(rawText);

      let autoScheduledData = null;

      if (appointmentData && onAutoScheduleAppointment) {
        const p = appointmentData;
        const patientData = p.patient || {
          fullName: p.fullName,
          isParticular: p.isParticular,
          insuranceName: p.insuranceName,
          affiliateNumber: p.affiliateNumber,
          primaryPhone: p.primaryPhone,
          secondaryPhone: p.secondaryPhone,
          email: p.email,
          address: p.address,
          isFavorite: p.isFavorite,
          notes: p.notes,
        };

        const appointmentObj = p.appointment || {
          date: p.appointmentDate,
          time: p.appointmentTime,
          motive: p.appointmentMotive || p.notes,
        };

        autoScheduledData = {
          patient: patientData,
          appointment: appointmentObj,
        };

        onAutoScheduleAppointment({
          patient: patientData,
          appointment: appointmentObj,
        });
      }

      // Handle server returned note
      let parsedNote = null;
      if (noteData) {
        const matchedContact = contactsList.find(
          (c) => noteData.patientName && c.fullName.toLowerCase().includes(noteData.patientName.toLowerCase())
        );
        const contactId = matchedContact ? matchedContact.id : 'general';
        if (onAddNote) {
          onAddNote(contactId, noteData.text);
        }
        parsedNote = {
          text: noteData.text,
          patientName: matchedContact ? matchedContact.fullName : noteData.patientName,
          createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: cleanText,
        autoScheduledData,
        noteData: parsedNote || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Ocurrió un problema de red'}. Por favor, reintenta más tarde.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'Chat reiniciado. ¿En qué te ayudo hoy?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const suggestionChips = [
    '📝 Añadir Nota / Observación',
    '📅 Agendar nuevo paciente',
    '💳 Registrar Obra Social',
    '⭐ Registrar Favorito',
  ];

  if (!isOpen && embedded) {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-md text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              Asistente de Agendamiento de Turnos
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Cuestionario Proactivo
              </span>
            </h3>
            <p className="text-xs text-slate-300">Te hace las preguntas necesarias para agendar a tus pacientes y contactos</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Abrir Asistente</span>
        </button>
      </div>
    );
  }

  if (!isOpen && !embedded) {
    return (
      <motion.button
        id="btn-trigger-assistant-floating"
        onClick={onToggle}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-full shadow-xl shadow-indigo-600/30 border border-white/20 font-semibold text-sm cursor-pointer transition-all hover:shadow-2xl"
        title="Abrir Asistente IA para Agendar Turnos"
      >
        <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
        <span>Asistente IA</span>
      </motion.button>
    );
  }

  const containerClasses = embedded
    ? 'w-full bg-slate-900 text-slate-100 rounded-2xl shadow-xl border border-slate-700 flex flex-col overflow-hidden my-2 h-[520px]'
    : `fixed z-50 bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden transition-all duration-200 ${
        isExpanded
          ? 'bottom-4 right-4 left-4 top-4 sm:left-auto sm:top-auto sm:w-[540px] sm:h-[680px] max-h-[95vh]'
          : 'bottom-4 right-4 left-4 sm:left-auto sm:w-[430px] h-[580px] max-h-[85vh]'
      }`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="bg-[#2E7D5E] p-3.5 px-4 border-b border-[#24664c] flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-md text-white">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">Asistente Marie - Yani</h2>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white font-bold border border-white/30">
                Turnos & Notas
              </span>
            </div>
            <p className="text-[11px] text-emerald-100">Consultorio odontológico e interacción con la agenda</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              title="Abrir formulario manual de contacto"
              className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-xs"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleClearHistory}
            title="Borrar chat"
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {!embedded && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Contraer' : 'Expandir'}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={onClose}
            title="Ocultar asistente"
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Creator Panel Form Overlay */}
      <AnimatePresence>
        {showNoteForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateNoteSubmit}
            className="bg-slate-950 border-b border-emerald-500/30 p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Añadir Nota / Observación al Paciente</span>
              </span>
              <button
                type="button"
                onClick={() => setShowNoteForm(false)}
                className="text-slate-400 hover:text-white p-1 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Note Textarea */}
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escriba la nota u observación para agregar a la ficha del paciente..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              required
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Select Patient */}
              <div className="flex-1 min-w-[160px]">
                <select
                  value={noteContactId}
                  onChange={(e) => setNoteContactId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-400"
                >
                  <option value="">Nota General (Sin paciente asignado)</option>
                  {contactsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      👤 {c.fullName} {c.insuranceName ? `(${c.insuranceName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Guardar Observación</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Context bar summary */}
      <div className="bg-slate-950/60 px-4 py-1.5 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>📋 Total Contactos: <strong className="text-slate-200">{totalContactsCount}</strong></span>
        <span>🏥 Obras Soc./Prepagas: <strong className="text-slate-200">{insuranceList.length}</strong></span>
        <span>🔔 Recordatorios: <strong className="text-slate-200">{pendingRemindersCount}</strong></span>
      </div>

      {/* Messages Body */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90 text-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-emerald-300" />
              </div>
            )}

            <div className={`group relative max-w-[88%] rounded-2xl p-3.5 ${
              msg.role === 'user'
                ? 'bg-emerald-800 text-white rounded-tr-none shadow-md border border-emerald-700'
                : 'bg-slate-800 border border-slate-700/70 text-slate-100 rounded-tl-none shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed break-words font-sans text-xs sm:text-sm">
                {msg.content}
              </div>

              {/* Note / Observation Card Render */}
              {msg.noteData && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-slate-100 text-xs space-y-2 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Nota / Observación Agregada</span>
                    </span>
                    {msg.noteData.patientName && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-200 border border-emerald-800/80 font-semibold text-[10px]">
                        👤 {msg.noteData.patientName}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                    {msg.noteData.text}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Guardada en la ficha del paciente
                    </span>
                    <span>{msg.noteData.createdAt}</span>
                  </div>
                </div>
              )}

              {/* Auto Scheduled Visual Card */}
              {msg.autoScheduledData && (
                <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/40 text-emerald-100 text-xs space-y-2 shadow-inner">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <CalendarCheck className="w-4 h-4 text-emerald-400" />
                    <span>¡Turno y Paciente Agendados en Calendario!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400">Paciente:</span>{' '}
                      <strong className="text-white block truncate">{msg.autoScheduledData.patient?.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Cobertura:</span>{' '}
                      <span className="text-emerald-300 block truncate font-medium">
                        {msg.autoScheduledData.patient?.isParticular ? 'Particular' : (msg.autoScheduledData.patient?.insuranceName || 'Obra Social')}
                      </span>
                    </div>
                    {msg.autoScheduledData.appointment?.date && (
                      <div>
                        <span className="text-slate-400">Fecha Turno:</span>{' '}
                        <strong className="text-white font-bold block">{msg.autoScheduledData.appointment.date}</strong>
                      </div>
                    )}
                    {msg.autoScheduledData.appointment?.time && (
                      <div>
                        <span className="text-slate-400">Horario:</span>{' '}
                        <strong className="text-white font-bold block">{msg.autoScheduledData.appointment.time} hs</strong>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/90 font-medium pt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Guardado automáticamente en la agenda y el calendario.</span>
                  </div>
                </div>
              )}

              <div className={`mt-1.5 flex items-center justify-between gap-2 text-[10px] ${
                msg.role === 'user' ? 'text-emerald-100' : 'text-slate-400'
              }`}>
                <span>{msg.timestamp}</span>

                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-white rounded flex items-center gap-1"
                    title="Copiar respuesta o ficha"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-[#2E7D5E] text-white border border-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <div className="w-7 h-7 rounded-lg bg-[#2E7D5E] text-white border border-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-white" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#4CAF7D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-[#4CAF7D] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-[#4CAF7D] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-1 text-slate-400 text-xs">Procesando respuestas del paciente...</span>
            </div>
          </div>
        )}

      </div>

      {/* Quick Suggestion Chips */}
      {messages.length <= 3 && !isLoading && (
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap gap-1.5 overflow-x-auto text-[11px]">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-[#2E7D5E] text-slate-300 hover:text-white border border-slate-700 hover:border-[#4CAF7D] rounded-full transition-all text-left whitespace-nowrap shrink-0 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe los datos del paciente o responde la pregunta..."
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4CAF7D] focus:border-[#4CAF7D] disabled:opacity-50 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-[#4CAF7D] hover:bg-[#3d986b] disabled:bg-slate-800 text-white disabled:text-slate-600 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
