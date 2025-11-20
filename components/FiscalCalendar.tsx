
import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, CheckCircle2, Clock, Info, DollarSign, Building2, FileText, Plus, X, Save } from 'lucide-react';

interface FiscalCalendarProps {
  company: Company;
}

type EventType = 'TAX' | 'LEGAL' | 'INTERNAL' | 'PAYMENT';

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: EventType;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'WARNING';
  description: string;
  amount?: string;
  isCustom?: boolean;
}

export const FiscalCalendar: React.FC<FiscalCalendarProps> = ({ company }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // State for events
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: '',
    type: 'INTERNAL' as EventType,
    description: '',
    amount: ''
  });

  // Generar eventos automáticamente + mezclar con personalizados
  useEffect(() => {
    const generateEvents = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const generatedEvents: CalendarEvent[] = [];
      const lastDigit = parseInt(company.taxId.charAt(company.taxId.length - 1)) || 0;

      // 1. Declaración de Impuestos (PLAME/SUNAT)
      const taxDay = 14 + lastDigit;
      const taxDate = new Date(year, month, taxDay);
      const today = new Date();

      generatedEvents.push({
        id: `tax-${month}-${year}`,
        date: taxDate,
        title: 'Declaración Mensual (PLAME)',
        type: 'TAX',
        status: taxDate < today ? 'COMPLETED' : taxDate.getDate() - today.getDate() <= 2 ? 'WARNING' : 'PENDING',
        description: `Vencimiento para RUC terminado en ${lastDigit}. Incluye Renta 5ta y Essalud.`,
        amount: 'S/ 12,450.00 (Est.)'
      });

      // 2. Pago AFP
      const afpDate = new Date(year, month, 5);
      generatedEvents.push({
        id: `legal-${month}-${year}`,
        date: afpDate,
        title: 'Pago de AFPs',
        type: 'LEGAL',
        status: afpDate < today ? 'COMPLETED' : 'PENDING',
        description: 'Pago de aportes previsionales a las administradoras de fondos (AFP Net).',
        amount: 'S/ 8,320.00'
      });

      // 3. Quincena
      const quincenaDate = new Date(year, month, 15);
      generatedEvents.push({
        id: `pay1-${month}-${year}`,
        date: quincenaDate,
        title: 'Pago de Adelanto (Quincena)',
        type: 'PAYMENT',
        status: quincenaDate < today ? 'COMPLETED' : 'PENDING',
        description: 'Transferencia de adelantos de sueldo al 40%.',
      });

      // 4. Cierre de Novedades
      const cierreDate = new Date(year, month, 20);
      generatedEvents.push({
        id: `int1-${month}-${year}`,
        date: cierreDate,
        title: 'Cierre de Tareos y Novedades',
        type: 'INTERNAL',
        status: cierreDate < today ? 'COMPLETED' : 'WARNING',
        description: 'Fecha límite para recepción de horas extras y descansos médicos del área operativa.',
      });

      // 5. Pago Fin de Mes
      const lastDay = new Date(year, month + 1, 0).getDate();
      const payDate = new Date(year, month, lastDay === 31 || lastDay === 30 ? 30 : lastDay);
      generatedEvents.push({
        id: `pay2-${month}-${year}`,
        date: payDate,
        title: 'Pago de Haberes Mensual',
        type: 'PAYMENT',
        status: 'PENDING',
        description: 'Dispersión de nómina mensual y gratificaciones si corresponde.',
        amount: 'S/ 45,200.00 (Est.)'
      });

      // Combinar generados con personalizados
      setEvents([...generatedEvents, ...customEvents]);
    };

    generateEvents();
  }, [currentDate, company, customEvents]);

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.title) return;

    const newEvent: CalendarEvent = {
      id: `custom-${Date.now()}`,
      date: selectedDate, // Use currently selected date
      title: newEventData.title,
      type: newEventData.type,
      description: newEventData.description,
      amount: newEventData.amount,
      status: 'PENDING',
      isCustom: true
    };

    setCustomEvents([...customEvents, newEvent]);
    setIsModalOpen(false);
    setNewEventData({ title: '', type: 'INTERNAL', description: '', amount: '' });
  };

  const openAddModal = () => {
    setIsModalOpen(true);
  };

  // Navegación de mes
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Renderizado del calendario
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 border-b border-r border-slate-100"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayEvents = events.filter(e => e.date.getDate() === day && e.date.getMonth() === date.getMonth() && e.date.getFullYear() === date.getFullYear());
    const isToday = new Date().toDateString() === date.toDateString();
    const isSelected = selectedDate.toDateString() === date.toDateString();

    days.push(
      <div 
        key={day} 
        onClick={() => setSelectedDate(date)}
        className={`h-24 border-b border-r border-slate-100 p-2 cursor-pointer transition-colors relative group
          ${isToday ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}
          ${isSelected ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50' : ''}
        `}
      >
        <span className={`text-sm font-medium ${isToday ? 'text-indigo-600 bg-indigo-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
          {day}
        </span>
        
        <div className="mt-1 space-y-1 overflow-hidden">
          {dayEvents.slice(0, 3).map(evt => (
            <div 
              key={evt.id} 
              className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${
                evt.type === 'TAX' ? 'bg-red-100 text-red-700 border-red-200' :
                evt.type === 'LEGAL' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                evt.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                'bg-blue-100 text-blue-700 border-blue-200'
              }`}
            >
              {evt.title}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div className="text-[9px] text-slate-400 pl-1">+ {dayEvents.length - 3} más</div>
          )}
        </div>
      </div>
    );
  }

  // Eventos del día seleccionado
  const selectedEvents = events.filter(e => e.date.toDateString() === selectedDate.toDateString());

  const getEventTypeStyles = (type: EventType) => {
      switch(type) {
          case 'TAX': return { bg: 'bg-red-100', text: 'text-red-800', icon: Building2, label: 'Impuestos' };
          case 'LEGAL': return { bg: 'bg-orange-100', text: 'text-orange-800', icon: FileText, label: 'Legal' };
          case 'PAYMENT': return { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: DollarSign, label: 'Pago' };
          default: return { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock, label: 'Interno' };
      }
  };

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Modal de Nuevo Evento */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Nuevo Evento / Recordatorio</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-indigo-50 border-b border-indigo-100">
              <p className="text-xs text-indigo-800 flex items-center gap-2">
                <CalendarIcon size={14} />
                Para el día: <span className="font-bold">{selectedDate.toLocaleDateString()}</span>
              </p>
            </div>
            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  value={newEventData.title}
                  onChange={(e) => setNewEventData({...newEventData, title: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: Enviar reporte de provisiones"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Evento</label>
                <select 
                  value={newEventData.type}
                  onChange={(e) => setNewEventData({...newEventData, type: e.target.value as EventType})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="INTERNAL">Proceso Interno</option>
                  <option value="PAYMENT">Pago</option>
                  <option value="TAX">Impuesto / Fiscal</option>
                  <option value="LEGAL">Legal / AFP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto Estimado (Opcional)</label>
                <input 
                  type="text" 
                  value={newEventData.amount}
                  onChange={(e) => setNewEventData({...newEventData, amount: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: S/ 5,000.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea 
                  rows={3}
                  value={newEventData.description}
                  onChange={(e) => setNewEventData({...newEventData, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Detalles adicionales..."
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Guardar Recordatorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon size={20} className="text-indigo-600" />
            Calendario Fiscal {company.taxId && <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 ml-2">RUC: {company.taxId}</span>}
          </h2>
          <div className="flex items-center gap-4">
             <span className="text-slate-700 font-medium w-32 text-center">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
             <div className="flex bg-white rounded-md shadow-sm border border-slate-200">
               <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-l-md text-slate-600"><ChevronLeft size={20} /></button>
               <div className="w-px bg-slate-200"></div>
               <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-r-md text-slate-600"><ChevronRight size={20} /></button>
             </div>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 overflow-y-auto">
          {days}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-slate-200 flex gap-4 text-xs justify-center bg-slate-50">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>Obligaciones Fiscales</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>Pagos AFP/Legal</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded"></div>Pagos Nómina</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>Procesos Internos</div>
        </div>
      </div>

      {/* Side Panel for Details */}
      <div className="w-80 border-l border-slate-200 bg-white flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
             <div>
               <h3 className="text-3xl font-bold text-slate-800">{selectedDate.getDate()}</h3>
               <p className="text-slate-500 uppercase text-sm font-medium">{months[selectedDate.getMonth()]} {selectedDate.getFullYear()}</p>
               <p className="text-xs text-slate-400 mt-1">{['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][selectedDate.getDay()]}</p>
             </div>
             <button 
                onClick={openAddModal}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition" 
                title="Agregar Evento"
             >
                <Plus size={20} />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedEvents.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                      <CheckCircle2 size={40} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No hay eventos programados para este día.</p>
                      <button 
                        onClick={openAddModal}
                        className="mt-4 text-indigo-600 text-xs font-medium hover:underline"
                      >
                        + Agregar recordatorio
                      </button>
                  </div>
              ) : (
                  selectedEvents.map(evt => {
                      const style = getEventTypeStyles(evt.type);
                      const Icon = style.icon;
                      return (
                          <div key={evt.id} className="p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition bg-white group">
                              <div className="flex justify-between items-start mb-2">
                                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${style.bg} ${style.text}`}>
                                      <Icon size={10} />
                                      {style.label}
                                  </div>
                                  {evt.status === 'WARNING' && <AlertCircle size={14} className="text-orange-500" />}
                                  {evt.status === 'COMPLETED' && <CheckCircle2 size={14} className="text-emerald-500" />}
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm mb-1">{evt.title}</h4>
                              <p className="text-xs text-slate-500 mb-2 leading-relaxed">{evt.description}</p>
                              {evt.amount && (
                                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-50 p-1.5 rounded">
                                      <DollarSign size={12} className="text-slate-400" />
                                      {evt.amount}
                                  </div>
                              )}
                              {evt.isCustom && (
                                <div className="mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-400 italic text-right">
                                  Creado manualmente
                                </div>
                              )}
                          </div>
                      );
                  })
              )}
          </div>
      </div>
    </div>
  );
};
