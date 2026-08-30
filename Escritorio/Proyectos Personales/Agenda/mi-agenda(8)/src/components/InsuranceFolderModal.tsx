import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FileText, 
  Upload, 
  X, 
  Trash2, 
  Plus,
  Download,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  FileCheck,
  Eye,
  Share2
} from 'lucide-react';
import { InsuranceFolderFile } from '../types';
import { OBRAS_SOCIALES_LIST } from '../constants/insurances';

interface InsuranceFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: InsuranceFolderFile[];
  onAddFile: (file: Omit<InsuranceFolderFile, 'id' | 'createdAt'>) => void;
  onDeleteFile: (id: string) => void;
  onClearAllFiles?: () => void;
}

// Convert Base64 / dataUrl to Blob safely for large files (supports 100MB+ without browser limits)
function dataUrlToBlob(dataUrl: string, defaultType = 'application/octet-stream'): Blob {
  try {
    if (dataUrl && dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : defaultType;
      
      if (!parts[0].includes(';base64')) {
        const decoded = decodeURIComponent(parts[1]);
        return new Blob([decoded], { type: mime });
      }

      const byteCharacters = atob(parts[1]);
      const byteArrays: Uint8Array[] = [];
      const sliceSize = 1024 * 512; // 512KB slices to prevent memory spikes

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      return new Blob(byteArrays, { type: mime });
    }
    return new Blob([dataUrl || ''], { type: defaultType });
  } catch (err) {
    console.warn('Could not convert dataUrl to Blob, falling back:', err);
    return new Blob([dataUrl || ''], { type: defaultType });
  }
}

export const InsuranceFolderModal: React.FC<InsuranceFolderModalProps> = ({
  isOpen,
  onClose,
  files = [],
  onAddFile,
  onDeleteFile,
  onClearAllFiles,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [readingProgressText, setReadingProgressText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<InsuranceFolderFile | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // Form states for file upload
  const [selectedInsurance, setSelectedInsurance] = useState('General');
  const [fileTitle, setFileTitle] = useState('');
  const [fileNotes, setFileNotes] = useState('');
  const [selectedFileData, setSelectedFileData] = useState<{
    fileName: string;
    fileSize: number;
    fileType: string;
    dataUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeFiles = Array.isArray(files) ? files.filter(Boolean) : [];

  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setIsUploading(safeFiles.length === 0);
      handleClearSelectedFile();
      setErrorMessage(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, safeFiles.length]);

  if (!isOpen) return null;

  const handleClearSelectedFile = () => {
    setSelectedFileData(null);
    setFileTitle('');
    setFileNotes('');
    setSelectedInsurance('General');
    setErrorMessage(null);
    setIsReadingFile(false);
    setReadingProgressText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    if (!file) return;

    if (file.size > 350 * 1024 * 1024) {
      setErrorMessage('El archivo seleccionado supera los 350MB. Intente con un archivo un poco más liviano.');
      return;
    }

    setIsReadingFile(true);
    setReadingProgressText(
      file.size > 20 * 1024 * 1024 
        ? `Cargando archivo grande (${(file.size / (1024 * 1024)).toFixed(1)} MB)... Por favor espere unos segundos.`
        : 'Cargando archivo...'
    );

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;
        setSelectedFileData({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          dataUrl: dataUrl,
        });
        if (!fileTitle) {
          const defaultName = file.name.replace(/\.[^/.]+$/, '');
          setFileTitle(defaultName);
        }
        setIsReadingFile(false);
        setReadingProgressText('');
      } catch (err) {
        console.error('Error processing file:', err);
        setErrorMessage('Ocurrió un error al procesar el archivo. Intente nuevamente.');
        setIsReadingFile(false);
        setReadingProgressText('');
      }
    };

    reader.onerror = () => {
      setErrorMessage('No se pudo leer el archivo. Intente con otro formato o verifique los permisos.');
      setIsReadingFile(false);
      setReadingProgressText('');
    };

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setReadingProgressText(`Cargando... ${percent}% (${(event.loaded / (1024 * 1024)).toFixed(1)} MB / ${(event.total / (1024 * 1024)).toFixed(1)} MB)`);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileData) {
      setErrorMessage('Por favor seleccione o arrastre un archivo primero.');
      return;
    }

    onAddFile({
      insuranceName: selectedInsurance || 'General',
      title: fileTitle.trim() || selectedFileData.fileName,
      fileName: selectedFileData.fileName,
      fileSize: selectedFileData.fileSize,
      fileType: selectedFileData.fileType,
      dataUrl: selectedFileData.dataUrl,
      notes: fileNotes.trim() || undefined,
    });

    handleClearSelectedFile();
    setIsUploading(false);
  };

  // Preview file inside dedicated responsive viewer modal
  const handlePreviewFile = (file: InsuranceFolderFile) => {
    setPreviewFile(file);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    if (file.dataUrl && file.dataUrl.length > 50) {
      const isPdf = file.fileType === 'application/pdf' || /\.pdf$/i.test(file.fileName || '');
      const blob = dataUrlToBlob(file.dataUrl, file.fileType || (isPdf ? 'application/pdf' : 'application/octet-stream'));
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewFile(null);
  };

  // Open file in browser tab or native reader
  const handleOpenDirectInTab = (file: InsuranceFolderFile) => {
    try {
      if (!file.dataUrl || file.dataUrl.length < 50) {
        handlePreviewFile(file);
        return;
      }
      const isPdf = file.fileType === 'application/pdf' || /\.pdf$/i.test(file.fileName || '');
      const blob = dataUrlToBlob(file.dataUrl, file.fileType || (isPdf ? 'application/pdf' : 'application/octet-stream'));
      const url = URL.createObjectURL(blob);
      
      const newWin = window.open(url, '_blank');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        // If popup was blocked, fallback to preview
        handlePreviewFile(file);
      }
    } catch (e) {
      console.error('Error opening file in new tab:', e);
      handlePreviewFile(file);
    }
  };

  // Download directly to device storage
  const handleDownloadFile = (file: InsuranceFolderFile) => {
    try {
      if (!file.dataUrl || file.dataUrl.length < 50) {
        handlePreviewFile(file);
        return;
      }
      const isPdf = file.fileType === 'application/pdf' || /\.pdf$/i.test(file.fileName || '');
      const blob = dataUrlToBlob(file.dataUrl, file.fileType || (isPdf ? 'application/pdf' : 'application/octet-stream'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName || file.title || 'documento';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      console.error('Error al descargar archivo:', e);
    }
  };

  // Native Mobile Share / Open with Phone Apps (WhatsApp, Drive, Adobe, Files, etc.)
  const handleShareMobileApp = async (file: InsuranceFolderFile) => {
    try {
      if (!file.dataUrl || file.dataUrl.length < 50) {
        handlePreviewFile(file);
        return;
      }
      const isPdf = file.fileType === 'application/pdf' || /\.pdf$/i.test(file.fileName || '');
      const blob = dataUrlToBlob(file.dataUrl, file.fileType || (isPdf ? 'application/pdf' : 'application/octet-stream'));
      const fileName = file.fileName || file.title || (isPdf ? 'documento.pdf' : 'archivo');
      const fileObj = new File([blob], fileName, { type: file.fileType || (isPdf ? 'application/pdf' : 'application/octet-stream') });

      // Try native file sharing
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [fileObj] })) {
        await navigator.share({
          files: [fileObj],
          title: file.title || fileName,
          text: `Documento Odontológico (${file.insuranceName || 'Obra Social'}): ${file.title || fileName}`
        });
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return; // User intentionally cancelled share sheet
      }
      console.warn('Native file share not available or failed:', err);
    }

    // Fallback: Download file directly + open WhatsApp or fallback options
    handleDownloadFile(file);
    try {
      const shareText = encodeURIComponent(`📄 Documento Odontológico: ${file.title || file.fileName} (${file.insuranceName || 'Obra Social'})`);
      window.open(`https://wa.me/?text=${shareText}`, '_blank');
    } catch {
      // Ignored
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileBadgeColor = (fileName?: string) => {
    if (!fileName) return 'bg-amber-100 text-amber-800 border-amber-200';
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (['doc', 'docx'].includes(ext || '')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-fade-backdrop">
      <div 
        id="modal-insurance-folder"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-2 sm:my-4 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] animate-modal-pop"
      >
        {/* Modal Header */}
        <div className="bg-[#2E7D5E] text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-[#24664c] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-md shrink-0">
              <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span>Carpeta de Obras Sociales</span>
                <span className="text-[11px] sm:text-xs bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full border border-white/30 shrink-0">
                  {safeFiles.length} {safeFiles.length === 1 ? 'archivo' : 'archivos'}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100 truncate">
                Nomencladores, planillas de aranceles y normativas por obra social
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isUploading && (
              <button
                type="button"
                onClick={() => {
                  setIsUploading(true);
                  handleClearSelectedFile();
                }}
                className="px-3 py-1.5 bg-white text-[#2E7D5E] hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 min-h-[36px]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adjuntar Archivo</span>
                <span className="sm:hidden">Adjuntar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Upload New File Section */}
          {isUploading && (
            <form onSubmit={handleUploadSubmit} className="p-4 sm:p-5 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl space-y-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#2E7D5E]" />
                  Adjuntar Nuevo Archivo a la Carpeta
                </h3>
                {safeFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploading(false);
                      handleClearSelectedFile();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer flex items-center gap-1 min-h-[32px]"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cerrar</span>
                  </button>
                )}
              </div>

              {/* Error Notification if any */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-[#2E7D5E] bg-emerald-100/80 scale-[1.01] shadow-md'
                    : selectedFileData
                    ? 'border-emerald-400 bg-white shadow-xs'
                    : 'border-emerald-300/80 bg-white hover:border-[#2E7D5E] hover:bg-emerald-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="insurance-file-input"
                  accept="*/*"
                />

                {isReadingFile ? (
                  <div className="py-4 flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-[#2E7D5E] animate-spin" />
                    <p className="text-xs font-bold text-emerald-900">{readingProgressText || 'Cargando archivo...'}</p>
                  </div>
                ) : selectedFileData ? (
                  <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-emerald-100 text-[#2E7D5E] rounded-xl border border-emerald-200 shrink-0">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={selectedFileData.fileName}>
                          {selectedFileData.fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {formatSize(selectedFileData.fileSize)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearSelectedFile();
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0 min-h-[36px]"
                    >
                      Cambiar Archivo
                    </button>
                  </div>
                ) : (
                  <div className="py-2 sm:py-4 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-[#2E7D5E] mb-1">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Arrastra tu archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Soporta PDFs, fotos, imágenes, Excel, Word y documentos pesados (hasta 350 MB).
                    </p>
                  </div>
                )}
              </div>

              {/* File Meta Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Obra Social o Categoría <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedInsurance}
                    onChange={(e) => setSelectedInsurance(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2E7D5E] font-medium"
                    required
                  >
                    <option value="General">📂 General / Todas las Obras Sociales</option>
                    {OBRAS_SOCIALES_LIST.map((os) => (
                      <option key={os} value={os}>
                        {os}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título o Descripción Corta <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    placeholder="Ej: Nomenclador 2026, Aranceles OSDE, etc."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2E7D5E]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas u Observaciones del Documento (Opcional)
                </label>
                <input
                  type="text"
                  value={fileNotes}
                  onChange={(e) => setFileNotes(e.target.value)}
                  placeholder="Ej: Códigos de autorización válidos hasta fin de año..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2E7D5E]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
                {safeFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploading(false);
                      handleClearSelectedFile();
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer min-h-[40px]"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!selectedFileData}
                  className={`w-full sm:w-auto px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] ${
                    selectedFileData
                      ? 'bg-[#2E7D5E] hover:bg-[#24664c] active:bg-[#1d523d] cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed opacity-70'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar y Adjuntar a la Carpeta</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Attached Files */}
          {safeFiles.length === 0 && !isUploading ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 space-y-3">
              <Folder className="w-12 h-12 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No hay archivos en la Carpeta de Obras Sociales</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Sube nomencladores, normativas o tablas de aranceles para tenerlos siempre disponibles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploading(true)}
                className="px-4 py-2.5 bg-[#2E7D5E] hover:bg-[#24664c] text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>Adjuntar Primer Archivo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {safeFiles.length > 0 && (
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Archivos Guardados ({safeFiles.length})
                  </h4>
                  {onClearAllFiles && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('¿Seguro que deseas vaciar y eliminar todos los archivos de la carpeta de Obras Sociales?')) {
                          onClearAllFiles();
                        }
                      }}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-colors cursor-pointer"
                    >
                      Vaciar Carpeta
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {safeFiles.map((f) => {
                  if (!f) return null;
                  const displayName = f.fileName || f.title || 'documento';
                  const ext = displayName.includes('.') ? displayName.split('.').pop()?.toUpperCase() : 'DOC';
                  const dateStr = f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Guardado';
                  
                  return (
                    <div
                      key={f.id}
                      className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <div className="p-2 bg-emerald-50 rounded-xl text-[#2E7D5E] shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform shadow-2xs">
                              <FileText className="w-5 h-5 text-[#2E7D5E]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200 truncate max-w-[160px]">
                                  {f.insuranceName || 'General'}
                                </span>
                                <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getFileBadgeColor(f.fileName)}`}>
                                  {ext}
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug group-hover:text-[#2E7D5E] transition-colors break-words">
                                {f.title || f.fileName}
                              </h4>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 font-mono shrink-0 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                            {dateStr}
                          </span>
                        </div>

                        {f.notes && (
                          <p className="text-xs text-slate-600 bg-amber-50/60 p-2 rounded-xl border border-amber-200/70 italic">
                            📝 {f.notes}
                          </p>
                        )}

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-600 font-mono truncate flex-1" title={displayName}>
                            {displayName}
                          </p>
                          {(f.fileSize || 0) > 0 && (
                            <span className="text-[10.5px] font-bold text-slate-600 shrink-0 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {formatSize(f.fileSize)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions & Delete Confirmation */}
                      {deletingFileId === f.id ? (
                        <div className="pt-2 border-t border-rose-100 bg-rose-50/90 p-2 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                          <span className="text-xs font-extrabold text-rose-800">¿Eliminar?</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteFile(f.id);
                                setDeletingFileId(null);
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer transition-colors min-h-[36px]"
                            >
                              Sí, eliminar
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingFileId(null)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-colors min-h-[36px]"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 sm:gap-2">
                          {/* Botón principal: Ver / Visualizar archivo */}
                          <button
                            type="button"
                            onClick={() => handlePreviewFile(f)}
                            className="flex-1 py-2 px-2.5 sm:px-3 bg-[#2E7D5E] hover:bg-[#24664c] active:bg-[#1d523d] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                            title="Visualizar archivo en pantalla completa"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver Archivo</span>
                          </button>

                          {/* Compartir / Enviar móvil */}
                          <button
                            type="button"
                            onClick={() => handleShareMobileApp(f)}
                            title="Compartir por WhatsApp o aplicaciones"
                            className="p-2 sm:p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Descargar directo */}
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(f)}
                            title="Descargar archivo al dispositivo"
                            className="p-2 sm:p-2.5 text-slate-600 hover:text-[#2E7D5E] hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => setDeletingFileId(f.id)}
                            title="Eliminar archivo"
                            className="p-2 sm:p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span className="truncate">Documentación Odontológica Sincronizada</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer min-h-[38px]"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Built-in Fullscreen Preview Reader Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full h-full max-w-5xl mx-auto overflow-hidden border border-slate-700">
            {/* Header */}
            <div className="bg-[#2E7D5E] text-white px-3 sm:px-5 py-3 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-white shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {previewFile.title || previewFile.fileName}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-100">
                    <span>{previewFile.insuranceName || 'General'}</span>
                    <span>•</span>
                    <span>{formatSize(previewFile.fileSize)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleShareMobileApp(previewFile)}
                  className="px-2.5 sm:px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer min-h-[36px]"
                  title="Compartir archivo"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Compartir</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewFile)}
                  className="px-2.5 sm:px-3 py-1.5 bg-white text-[#2E7D5E] hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer min-h-[36px]"
                  title="Descargar archivo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Descargar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenDirectInTab(previewFile)}
                  className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Abrir en pestaña nueva del navegador"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-1.5 sm:p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ml-1"
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 bg-slate-100 overflow-auto p-2 sm:p-4 flex items-center justify-center">
              {previewFile.dataUrl && previewFile.dataUrl.length > 50 ? (
                previewFile.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(previewFile.fileName || '') ? (
                  <img
                    src={previewFile.dataUrl}
                    alt={previewFile.title}
                    className="max-h-full max-w-full object-contain rounded-xl shadow-md mx-auto"
                  />
                ) : previewBlobUrl ? (
                  <iframe
                    src={previewBlobUrl}
                    title={previewFile.title}
                    className="w-full h-full min-h-[55vh] rounded-xl border border-slate-300 bg-white"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4 max-w-md">
                    <FileText className="w-16 h-16 text-[#2E7D5E] mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{previewFile.fileName}</h4>
                      <p className="text-xs text-slate-500 mt-1">Este formato puede abrirse o descargarse directamente.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(previewFile)}
                      className="px-5 py-2.5 bg-[#2E7D5E] hover:bg-[#24664c] text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar {previewFile.fileName}</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-3 max-w-md">
                  <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Archivo no disponible en este dispositivo</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Este archivo fue registrado antes de habilitar la sincronización en la nube. Vuelve a adjuntarlo para que se sincronice en todos tus dispositivos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
