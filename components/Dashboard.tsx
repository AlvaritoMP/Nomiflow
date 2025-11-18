import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Ticket, PayrollCycle, Status } from '../types';
import { AlertTriangle, CheckCircle2, Clock, Activity } from 'lucide-react';

interface DashboardProps {
  tickets: Ticket[];
  currentCycle: PayrollCycle;
}

export const Dashboard: React.FC<DashboardProps> = ({ tickets, currentCycle }) => {
  
  // Prepare data for charts
  const ticketsByPriority = [
    { name: 'Crítico', value: tickets.filter(t => t.priority === 'CRITICAL').length, color: '#EF4444' },
    { name: 'Alto', value: tickets.filter(t => t.priority === 'HIGH').length, color: '#F97316' },
    { name: 'Medio', value: tickets.filter(t => t.priority === 'MEDIUM').length, color: '#EAB308' },
    { name: 'Bajo', value: tickets.filter(t => t.priority === 'LOW').length, color: '#10B981' },
  ];

  const completionData = [
      { name: 'Completado', value: 45 },
      { name: 'Pendiente', value: 55 }
  ];

  const incidentTypeData = [
      { name: 'Altas', count: 3 },
      { name: 'Bajas', count: 1 },
      { name: 'Descansos', count: 5 },
      { name: 'Incidencias', count: 2 },
  ];

  const pendingIncidents = tickets.filter(t => t.status !== Status.COMPLETED).length;
  const criticalIncidents = tickets.filter(t => t.priority === 'CRITICAL' && t.status !== Status.COMPLETED).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Incidencias Pendientes</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{pendingIncidents}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Clock size={20} />
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Críticas</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{criticalIncidents}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle size={20} />
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Etapa Actual</p>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate max-w-[120px]">Procesamiento</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Activity size={20} />
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Cumplimiento</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">85%</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <CheckCircle2 size={20} />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6">Tipos de Incidencias (Mes Actual)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incidentTypeData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f1f5f9' }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6">Prioridad de Tickets</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={ticketsByPriority}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {ticketsByPriority.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
                {ticketsByPriority.map((item) => (
                    <div key={item.name} className="flex items-center text-xs text-slate-600">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        {item.name}: {item.value}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Auditoría Reciente</h3>
          </div>
          <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((i) => (
                  <div key={i} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50">
                      <div className="text-slate-400 text-xs min-w-[60px]">Hace {i}h</div>
                      <div className="flex-1">
                          <p className="text-sm text-slate-700"><span className="font-semibold">Ana Martínez</span> completó la tarea <span className="font-medium text-indigo-600">Validación de Asistencias</span></p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};
