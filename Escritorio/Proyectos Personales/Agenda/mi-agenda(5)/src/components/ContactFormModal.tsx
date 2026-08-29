import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  User, 
  Shield, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Star, 
  Check, 
  Building2,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Contact } from '../types';
import { OBRAS_SOCIALES_LIST } from '../constants/insurances';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: Partial<Contact>) => void;
  initialData?: Contact | null;
}

const normalizeSearch = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const AVATAR_COLORS = [
  'bg-[#2E7D5E]',
  'bg-emerald-600',
  'bg-teal-600',
  'bg-emerald-700',
  'bg-teal-700',
  'bg-emerald-800',
];

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [fullName, setFullName] = useState('');
  const [isParticular, setIsParticular] = useState(false);
  const [insuranceQuery, setInsuranceQuery] = useState('');
  const [isInsuranceDropdownOpen, setIsInsuranceDropdownOpen] = useState(false);
  const insuranceDropdownRef = useRef<HTMLDivElement>(null);

  const [affiliateNumber, setAffiliateNumber] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [observations, setObservations] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [avatarColor, setAvatarColor] = useState('bg-[#2E7D5E]');
  const [errors, setErrors] = useState<{ fullName?: string; primaryPhone?: string }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (insuranceDropdownRef.current && !insuranceDropdownRef.current.contains(event.target as Node)) {
        setIsInsuranceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || '');
      setIsParticular(initialData.isParticular ?? false);
      const ins = initialData.insuranceName || '';
      setInsuranceQuery(ins === 'Particular' ? '' : ins);
      setAffiliateNumber(initialData.affiliateNumber || '');
      setPrimaryPhone(initialData.primaryPhone || '');
      setAltPhone(initialData.altPhone || '');
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setObservations(initialData.observations || '');
      setIsFavorite(initialData.isFavorite ?? false);
      setAvatarColor(initialData.avatarColor || 'bg-[#2E7D5E]');
    } else {
      // Reset defaults for new contact
      setFullName('');
      setIsParticular(false);
      setInsuranceQuery('');
      setAffiliateNumber('');
      setPrimaryPhone('');
      setAltPhone('');
      setEmail('');
      setAddress('');
      setObservations('');
      setIsFavorite(false);
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    }
    setIsInsuranceDropdownOpen(false);
    setErrors({});
  }, [initialData, isOpen]);

  const filteredInsurances = useMemo(() => {
    const q = normalizeSearch(insuranceQuery);
    if (!q) return OBRAS_SOCIALES_LIST;
    return OBRAS_SOCIALES_LIST.filter(ins => normalizeSearch(ins).includes(q));
  }, [insuranceQuery]);

  const hasExactMatch = useMemo(() => {
    const q = normalizeSearch(insuranceQuery);
    return OBRAS_SOCIALES_LIST.some(ins => normalizeSearch(ins) === q);
  }, [insuranceQuery]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { fullName?: string; primaryPhone?: string } = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'El nombre y apellido es obligatorio';
    }
    if (!primaryPhone.trim()) {
      newErrors.primaryPhone = 'El teléfono principal es obligatorio';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalInsurance = isParticular 
      ? 'Particular' 
      : (insuranceQuery.trim() || 'Obra Social');

    onSave({
      fullName: fullName.trim(),
      isParticular,
      insuranceName: finalInsurance,
      affiliateNumber: isParticular ? '' : affiliateNumber.trim(),
      primaryPhone: primaryPhone.trim(),
      altPhone: altPhone.trim(),
      email: email.trim(),
      address: address.trim(),
      observations: observations.trim(),
      isFavorite,
      avatarColor,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-backdrop">
      <div 
        id="modal-contact-form"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden transform transition-all max-h-[94vh] sm:max-h-[90vh] flex flex-col animate-modal-pop"
      >
        {/* Modal Header */}
        <div className="bg-[#2E7D5E] text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-[#24664c] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                {initialData ? 'Editar Contacto' : 'Registrar Nuevo Contacto'}
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100 leading-tight">
                Complete los datos requeridos e información médica u observaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Información Personal</span>
            </h3>

            <div>
              {/* Full Name */}
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre y Apellido <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                placeholder="Ej: Dr. Martín González"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errors.fullName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'
                } rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all`}
              />
              {errors.fullName && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Favorite Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFavoriteCheck"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-400"
              />
              <label htmlFor="isFavoriteCheck" className="text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer select-none">
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                <span>Marcar como contacto favorito</span>
              </label>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 2: Healthcare & Insurance Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Obra Social o Particular</span>
              </h3>

              {/* Toggle Particular vs Obra Social */}
              <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsParticular(false)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    !isParticular ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Obra Social / Prepaga
                </button>
                <button
                  type="button"
                  onClick={() => setIsParticular(true)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    isParticular ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Particular
                </button>
              </div>
            </div>

            {!isParticular ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                {/* Searchable Insurance Selector */}
                <div className="relative" ref={insuranceDropdownRef}>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Nombre de Obra Social / Prepaga</span>
                    {insuranceQuery && (
                      <span className="text-[10px] text-[#2E7D5E] font-bold">
                        {filteredInsurances.length} {filteredInsurances.length === 1 ? 'coincidencia' : 'coincidencias'}
                      </span>
                    )}
                  </label>
                  
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={insuranceQuery}
                      onChange={(e) => {
                        setInsuranceQuery(e.target.value);
                        setIsInsuranceDropdownOpen(true);
                      }}
                      onFocus={() => setIsInsuranceDropdownOpen(true)}
                      placeholder="Seleccione o escriba para buscar..."
                      className="w-full pl-9 pr-16 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E7D5E] focus:border-[#2E7D5E]"
                    />
                    
                    <div className="absolute right-2 top-2 flex items-center gap-0.5">
                      {insuranceQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setInsuranceQuery('');
                            setIsInsuranceDropdownOpen(true);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Borrar texto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsInsuranceDropdownOpen((prev) => !prev)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Ver listado"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isInsuranceDropdownOpen ? 'rotate-180 text-[#2E7D5E]' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown list */}
                  {isInsuranceDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="p-1.5 space-y-0.5">
                        {filteredInsurances.length > 0 ? (
                          filteredInsurances.map((ins) => {
                            const isSelected = normalizeSearch(insuranceQuery) === normalizeSearch(ins);
                            return (
                              <button
                                key={ins}
                                type="button"
                                onClick={() => {
                                  setInsuranceQuery(ins);
                                  setIsInsuranceDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50 text-[#2E7D5E] font-bold'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span>{ins}</span>
                                {isSelected && <Check className="w-4 h-4 text-[#2E7D5E]" />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No se encontraron obras sociales que coincidan con "{insuranceQuery}"
                          </div>
                        )}

                        {/* Option to use custom typed text if not an exact match */}
                        {insuranceQuery.trim() && !hasExactMatch && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsInsuranceDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 flex items-center gap-2 border border-emerald-200 mt-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Usar <strong>"{insuranceQuery.trim()}"</strong> (Otra obra social)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Affiliate Number Field (Campo opcional para numero de afiliado) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Número de Afiliado</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={affiliateNumber}
                      onChange={(e) => setAffiliateNumber(e.target.value)}
                      placeholder="Ej: 12-345678-01"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                Este contacto se categoriza como atención o servicio <strong>Particular</strong> (sin número de afiliado).
              </div>
            )}
          </div>

          <hr className="border-slate-200" />

          {/* Section 3: Contact & Communication */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>Teléfonos y Canales de Comunicación</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Primary Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono Principal <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={primaryPhone}
                    onChange={(e) => {
                      setPrimaryPhone(e.target.value);
                      if (errors.primaryPhone) setErrors((prev) => ({ ...prev, primaryPhone: undefined }));
                    }}
                    placeholder="Ej: +5491145892020"
                    className={`w-full pl-9 pr-3 py-2 bg-slate-50 border ${
                      errors.primaryPhone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'
                    } rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white`}
                  />
                </div>
                {errors.primaryPhone && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.primaryPhone}</p>
                )}
              </div>

              {/* Alternative Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono Alternativo <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="Ej: +541148210033"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej: Av. Santa Fe 1234, CABA"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 4: Observations & Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Observaciones o Notas Adicionales</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ej: Días y horarios de atención, especialidad, requerimiento de órdenes..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-contact"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#4CAF7D] hover:bg-[#3d986b] text-white text-sm font-bold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {initialData ? 'Guardar Cambios' : 'Registrar Contacto'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
