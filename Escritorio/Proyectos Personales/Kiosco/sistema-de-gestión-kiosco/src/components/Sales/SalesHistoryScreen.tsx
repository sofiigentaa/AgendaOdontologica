import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Eye, 
  RotateCcw, 
  Printer, 
  Download
} from 'lucide-react';
import { useKiosk } from '../../context/KioskContext';
import { Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface SalesHistoryScreenProps {
  onReprintReceipt?: (sale: Sale) => void;
}

export const SalesHistoryScreen: React.FC<SalesHistoryScreenProps> = () => {
  const { sales, cancelSale } = useKiosk();

  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'completada' | 'anulada'>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');

  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [cancelTargetSale, setCancelTargetSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('Error de cobro / Devolución del cliente');

  const handleExecuteCancel = () => {
    if (!cancelTargetSale) return;
    cancelSale(cancelTargetSale.id, cancelReason);
    setCancelTargetSale(null);
    setViewingSale(null);
  };

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const filteredSales = sales.filter((s) => {
    if (selectedStatus !== 'ALL' && s.status !== selectedStatus) return false;
    if (selectedMethod !== 'ALL' && s.paymentMethod !== selectedMethod) return false;

    if (dateFilter === 'TODAY' && !s.date.startsWith(todayStr)) return false;
    if (dateFilter === 'YESTERDAY' && !s.date.startsWith(yesterdayStr)) return false;
    if (dateFilter === 'WEEK' && new Date(s.date) < weekAgo) return false;
    if (dateFilter === 'MONTH' && new Date(s.date) < monthAgo) return false;

    const query = search.toLowerCase().trim();
    if (query) {
      const matchId = s.id.toLowerCase().includes(query);
      const matchCustomer = s.customerName?.toLowerCase().includes(query);
      const matchProduct = s.items.some((i) => i.productName.toLowerCase().includes(query));
      if (!matchId && !matchCustomer && !matchProduct) return false;
    }

    return true;
  });

  const totalBilled = filteredSales.filter(s => s.status === 'completada').reduce((acc, s) => acc + s.total, 0);
  const totalProfit = filteredSales.filter(s => s.status === 'completada').reduce((acc, s) => acc + s.totalProfit, 0);
  const countCompleted = filteredSales.filter(s => s.status === 'completada').length;
  const countCancelled = filteredSales.filter(s => s.status === 'anulada').length;

  const exportSalesCSV = () => {
    const headers = ['ID_Venta', 'Fecha_Hora', 'Total', 'Ganancia', 'Metodo_Pago', 'Estado', 'Items_Detalle', 'Cliente'];
    const rows = filteredSales.map((s) => [
      s.id,
      formatDateTime(s.date),
      s.total,
      s.totalProfit,
      '"' + s.paymentMethod + '"',
      s.status,
      '"' + s.items.map((i) => i.quantity + 'x ' + i.productName).join('; ') + '"',
      '"' + (s.customerName || '') + '"',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'registro_ventas_kiosco_' + todayStr + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3.5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Registro Histórico de Ventas</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Consulte tickets emitidos, medios de pago y opción de anulación con reposición automática de stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 flex items-center gap-1 self-start sm:self-auto"
            title="Imprimir listado y reporte de ventas filtrado"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Imprimir Historial</span>
          </button>

          <button
            onClick={exportSalesCSV}
            className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 flex items-center gap-1 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Historial CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturación Filtrada</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{formatCurrency(totalBilled)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{countCompleted} tickets completados</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ganancia Neta</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">{formatCurrency(totalProfit)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Margen: {totalBilled > 0 ? ((totalProfit / totalBilled) * 100).toFixed(1) + '%' : '0%'}
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tickets Emitidos</div>
          <div className="text-xl font-bold font-mono text-indigo-600 mt-0.5">{countCompleted}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ventas efectivas</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventas Anuladas</div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-0.5">{countCancelled}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Con stock reintegrado</div>
        </div>

      </div>

      {/* Filter and Date selector */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-2.5">
        
        {/* Date Quick Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'TODAY', label: 'Hoy' },
            { id: 'YESTERDAY', label: 'Ayer' },
            { id: 'WEEK', label: 'Últimos 7 días' },
            { id: 'MONTH', label: 'Últimos 30 días' },
            { id: 'ALL', label: 'Todo el Historial' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id as any)}
              className={'px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all ' + (
                dateFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Secondary Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-1 border-t border-slate-100">
          
          <div className="md:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ID ticket, producto o cliente..."
              className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Todos los Medios de Pago</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta de Débito">Tarjeta Débito</option>
              <option value="Tarjeta de Crédito">Tarjeta Crédito</option>
              <option value="Transferencia / MP">Transferencia / MP</option>
              <option value="Cuenta Corriente (Fiado)">Cuenta Corriente (Fiado)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="completada">Completadas</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>

        </div>
      </div>

      {/* Sales Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5">Ticket #</th>
                <th className="py-2.5 px-3">Fecha & Hora</th>
                <th className="py-2.5 px-3">Artículos</th>
                <th className="py-2.5 px-3">Medio de Pago</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">Ganancia</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No se encontraron transacciones en este período.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const isCancelled = s.status === 'anulada';
                  const totalItems = s.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr key={s.id} className={'hover:bg-slate-50 transition-colors ' + (isCancelled ? 'opacity-50 bg-slate-50/50' : '')}>
                      {/* ID */}
                      <td className="py-2 px-3.5 font-mono font-bold text-slate-900">
                        #{s.id.slice(-6).toUpperCase()}
                        {s.customerName && (
                          <div className="text-[10px] text-amber-700 font-sans font-semibold truncate max-w-[120px]">
                            {s.customerName}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(s.date)}
                      </td>

                      {/* Items */}
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {s.items.map((i) => i.quantity + 'x ' + i.productName).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {totalItems} artículos en total
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                          {s.paymentMethod}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-2 px-3 text-right font-bold font-mono text-slate-900 text-xs">
                        {formatCurrency(s.total)}
                      </td>

                      {/* Profit */}
                      <td className="py-2 px-3 text-right font-bold font-mono text-emerald-600 text-xs">
                        {isCancelled ? '-' : formatCurrency(s.totalProfit)}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center">
                        {isCancelled ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 uppercase">
                            Anulada
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                            Completada
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingSale(s)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                            title="Ver detalle de ticket"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!isCancelled && (
                            <button
                              onClick={() => setCancelTargetSale(s)}
                              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-colors"
                              title="Anular venta y reponer stock"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {viewingSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-lg p-5 shadow-xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Ticket #{viewingSale.id.slice(-6).toUpperCase()}
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">{formatDateTime(viewingSale.date)}</p>
              </div>
              <button onClick={() => setViewingSale(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
              {viewingSale.items.map((it, idx) => (
                <div key={idx} className="py-1.5 flex justify-between">
                  <div>
                    <span className="font-bold">{it.quantity}x</span> {it.productName}
                    <div className="text-[10px] text-slate-400 font-mono">@{formatCurrency(it.unitPrice)}</div>
                  </div>
                  <span className="font-bold font-mono text-slate-900">{formatCurrency(it.total)}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(viewingSale.subtotal)}</span>
              </div>
              {viewingSale.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(viewingSale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span className="text-indigo-600">{formatCurrency(viewingSale.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold pt-1">
                <span>Ganancia Neta:</span>
                <span>{formatCurrency(viewingSale.totalProfit)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setViewingSale(null)}
                className="px-4 py-1.5 rounded bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancelTargetSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-lg p-5 shadow-xl border border-slate-200 space-y-3.5">
            <h4 className="font-bold text-rose-600 text-sm flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" />
              <span>Anular Venta #{cancelTargetSale.id.slice(-6).toUpperCase()}</span>
            </h4>
            <p className="text-xs text-slate-600">
              Al anular esta venta por <span className="font-bold font-mono">{formatCurrency(cancelTargetSale.total)}</span>, las unidades vendidas volverán automáticamente al inventario físico.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de Anulación</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setCancelTargetSale(null)}
                className="flex-1 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteCancel}
                className="flex-1 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
