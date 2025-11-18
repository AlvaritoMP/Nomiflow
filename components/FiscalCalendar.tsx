
import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, CheckCircle2, Clock, Info, DollarSign, Building2, FileText } from 'lucide-react';

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
}

export const FiscalCalendar: React.FC<FiscalCalendarProps> = ({ company }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Generar eventos automáticamente basado en la empresa y el mes actual
  useEffect(() => {
    const generateEvents = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const generatedEvents: CalendarEvent[] = [];
      const lastDigit = parseInt(company.taxId.charAt(company.taxId.length - 1)) || 0;

      // 1. Declaración de Impuestos (PLAME/SUNAT)
      // Lógica simulada: Vencimiento día 14 + último dígito del RUC
      const taxDay = 14 + lastDigit;
      const taxDate = new Date(year, month, taxDay);
      const today = new Date();

      generatedEvents.push({
        id: 'tax-1',
        date: taxDate,
        title: 'Declaración Mensual (PLAME)',
        type: 'TAX',
        status: taxDate < today ? 'COMPLETED' : taxDate.getDate() - today.getDate() <= 2 ? 'WARNING' : 'PENDING',
        description: `Vencimiento para RUC terminado en ${lastDigit}. Incluye Renta 5ta y Essalud.`,
        amount: 'S/ 12,450.00 (Est.)'
      });

      // 2. Pago AFP (5to día útil aprox - simulado al día 5 del mes siguiente al devengue, aqui lo ponemos en el mes actual para demo)
      const afpDate = new Date(year, month, 5);
      generatedEvents.push({
        id: 'legal-1',
        date: afpDate,
        title: 'Pago de AFPs',
        type: 'LEGAL',
        status: afpDate < today ? 'COMPLETED' : 'PENDING',
        description: 'Pago de aportes previsionales a las administradoras de fondos (AFP Net).',
        amount: 'S/ 8,320.00'
      });

      // 3. Quincena (Adelanto)
      const quincenaDate = new Date(year, month, 15);
      generatedEvents.push({
        id: 'pay-1',
        date: quincenaDate,
        title: 'Pago de Adelanto (Quincena)',
        type: 'PAYMENT',
        status: quincenaDate < today ? 'COMPLETED' : 'PENDING',
        description: 'Transferencia de adelantos de sueldo al 40%.',
      });

      // 4. Cierre de Novedades (Interno)
      const cierreDate = new Date(year, month, 20);
      generatedEvents.push({
        id: 'int-1',
        date: cierreDate,
        title: 'Cierre de Tareos y Novedades',
        type: 'INTERNAL',
        status: cierreDate < today ? 'COMPLETED' : 'WARNING',
        description: 'Fecha límite para recepción de horas extras y descansos médicos del área operativa.',
      });

      // 5. Pago Fin de Mes
      const lastDay = new Date(year, month + 1, 0).getDate(); // Último día del mes
      const payDate = new Date(year, month, lastDay === 31 || lastDay === 30 ? 30 : lastDay); // Usualmente se paga el 30
      generatedEvents.push({
        id: 'pay-2',
        date: payDate,
        title: 'Pago de Haberes Mensual',
        type: 'PAYMENT',
        status: 'PENDING',
        description: 'Dispersión de nómina mensual y gratificaciones si corresponde.',
        amount: 'S/ 45,200.00 (Est.)'
      });

      setEvents(generatedEvents);
    };

    generateEvents();
  }, [currentDate, company]);

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
  
  // Ajustar para que la semana empiece Lunes (opcional, aqui standard Domingo)
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 border-b border-r border-slate-100"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayEvents = events.filter(e => e.date.getDate() === day);
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
          {dayEvents.map(evt => (
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
    <div className="flex h-[calc(100vh-7rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
          <div className="p-6 border-b border-slate-100">
              <h3 className="text-3xl font-bold text-slate-800">{selectedDate.getDate()}</h3>
              <p className="text-slate-500 uppercase text-sm font-medium">{months[selectedDate.getMonth()]} {selectedDate.getFullYear()}</p>
              <p className="text-xs text-slate-400 mt-1">{['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][selectedDate.getDay()]}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedEvents.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                      <CheckCircle2 size={40} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No hay eventos programados para este día.</p>
                      <button className="mt-4 text-indigo-600 text-xs font-medium hover:underline">+ Agregar recordatorio</button>
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
                          </div>
                      );
                  })
              )}
          </div>
      </div>
    </div>
  );
};
