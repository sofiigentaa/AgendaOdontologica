import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, User, Phone, Shield, UserPlus, Check } from 'lucide-react';
import { Contact } from '../types';

interface PatientSearchSelectProps {
  id?: string;
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: string;
  placeholder?: string;
  className?: string;
  clearOnSelect?: boolean;
  onOpenAddContactModal?: () => void;
}

export const PatientSearchSelect: React.FC<PatientSearchSelectProps> = ({
  id = 'patient-search-autocomplete',
  contacts,
  onSelectContact,
  selectedContactId,
  placeholder = 'Escribir o seleccionar nombre de paciente para abrir su ficha médica...',
  className = '',
  clearOnSelect = true,
  onOpenAddContactModal,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Alphabetically sorted contacts
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => 
      a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' })
    );
  }, [contacts]);

  // Filtered contacts based on query
  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedContacts;
    return sortedContacts.filter((c) => {
      const nameMatch = c.fullName.toLowerCase().includes(q);
      const phoneMatch = c.primaryPhone ? c.primaryPhone.toLowerCase().includes(q) : false;
      const insuranceMatch = c.insuranceName ? c.insuranceName.toLowerCase().includes(q) : false;
      const affiliateMatch = c.affiliateNumber ? c.affiliateNumber.toLowerCase().includes(q) : false;
      const particularMatch = c.isParticular && 'particular'.includes(q);
      return nameMatch || phoneMatch || insuranceMatch || affiliateMatch || particularMatch;
    });
  }, [sortedContacts, query]);

  // Sync query if a selected contact is passed and not in clearOnSelect mode
  useEffect(() => {
    if (!clearOnSelect && selectedContactId) {
      const found = contacts.find((c) => c.id === selectedContactId);
      if (found) {
        setQuery(found.fullName);
      }
    }
  }, [selectedContactId, contacts, clearOnSelect]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (contact: Contact) => {
    onSelectContact(contact);
    if (clearOnSelect) {
      setQuery('');
    } else {
      setQuery(contact.fullName);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredContacts.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev > 0 ? prev - 1 : filteredContacts.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredContacts.length) {
        handleSelect(filteredContacts[highlightedIndex]);
      } else if (filteredContacts.length === 1) {
        handleSelect(filteredContacts[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input container */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
          <Search className="w-4 h-4 text-[#2E7D5E]" />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-16 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-[#2E7D5E] focus:border-[#2E7D5E] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]/20 transition-all shadow-2xs"
          autoComplete="off"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-[#2E7D5E] rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
            title={isOpen ? "Cerrar sugerencias" : "Ver lista de pacientes"}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#2E7D5E]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-80 flex flex-col">
          {/* Top suggestion header */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>
              {query ? `Sugerencias para "${query}" (${filteredContacts.length})` : `Todos los pacientes (${sortedContacts.length})`}
            </span>
            <span className="text-[10px] text-slate-400">
              Usa ↑ ↓ y Enter para elegir
            </span>
          </div>

          {/* Results List */}
          <ul
            ref={listRef}
            className="overflow-y-auto max-h-64 divide-y divide-slate-100 divide-dashed"
            role="listbox"
          >
            {filteredContacts.length === 0 ? (
              <li className="p-4 text-center text-xs text-slate-500">
                <p>No se encontraron pacientes que coincidan con <strong className="text-slate-800 font-bold">"{query}"</strong></p>
              </li>
            ) : (
              filteredContacts.map((contact, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = contact.id === selectedContactId;

                return (
                  <li
                    key={contact.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(contact)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-emerald-50 text-slate-900'
                        : isSelected
                        ? 'bg-slate-50 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-[#2E7D5E] font-bold text-xs flex items-center justify-center shrink-0">
                        {contact.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-slate-900 truncate notranslate" translate="no">
                            {contact.fullName}
                          </p>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate mt-0.5">
                          {contact.primaryPhone && (
                            <span className="flex items-center gap-1 font-mono whitespace-nowrap shrink-0">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="whitespace-nowrap">{contact.primaryPhone}</span>
                            </span>
                          )}
                          {contact.isParticular ? (
                            <span className="text-[#2E7D5E] font-semibold">
                              Particular
                            </span>
                          ) : (
                            <span className="text-blue-600 font-semibold truncate">
                              {contact.insuranceName} {contact.affiliateNumber ? `(N° ${contact.affiliateNumber})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {contact.isParticular ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Particular
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                          {contact.insuranceName || 'Prepaga'}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
