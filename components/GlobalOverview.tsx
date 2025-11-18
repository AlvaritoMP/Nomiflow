import React from 'react';
import { Company, Ticket, Status, PayrollCycle, Priority } from '../types';
import { Building2, AlertCircle, CheckCircle2, Clock, ArrowRight, Activity, AlertTriangle } from 'lucide-react';
import { generatePayrollCycle } from '../services/mockData';

interface GlobalOverviewProps {
  companies: Company[];
  tickets: Ticket[];
  onSelectCompany: (companyId: string) => void;
}

export const GlobalOverview: React.FC<GlobalOverviewProps> = ({ companies, tickets, onSelectCompany }) => {
  
  // Helper function to simulate getting the current state of other companies
  // In a real app, this would come from a backend API that returns a summary of all companies
  const getCompanySummary = (companyId: string) => {
    const cycle = generatePayrollCycle(companyId);
    // Simulate random progress for demo purposes if it's the non-active company
    // Deterministic based on ID length to be consistent during renders
    const seed = companyId.charCodeAt(0) + companyId.charCodeAt(companyId.length - 1);
    const randomProgress = companyId === 'c1' ? 65 : (seed * 7) % 100; 
    const status = randomProgress > 80 ? 'On Track' : randomProgress > 40 ? 'Delayed' : 'Critical';
    
    const totalTasks = cycle.stages.reduce((acc, s) => acc + s.tasks.length, 0);
    const completedTasks = Math.floor((totalTasks * randomProgress) / 100);

    return {
      period: cycle.period,
      progress: randomProgress,
      statusLabel: status,
      tasksCompleted: completedTasks,
      totalTasks: totalTasks,
      currentStage: cycle.stages[Math.floor((cycle.stages.length - 1) * (randomProgress/100))].name
    };
  };

  const getCompanyTicketStats = (companyId: string) => {
    const companyTickets = tickets.filter(t => t.companyId === companyId);
    const critical = companyTickets.filter(t => t.priority === Priority.CRITICAL && t.status !== Status.COMPLETED).length;
    const open = companyTickets.filter(t => t.status !== Status.COMPLETED).length;
    return { critical, open };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Control Global de Nómina</h2>
        <p className="text-slate-500 mt-1">Monitoreo en tiempo real de flujos y alertas por razón social.</p>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Empresas Activas</p>
              <h3 className="text-3xl font-bold">{companies.length}</h3>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <Building2 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-indigo-200">
            <CheckCircle2 size={14} className="mr-1" />
            <span>Todas operando en periodo Octubre 2023</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Incidencias Totales</p>
              <h3 className="text-3xl font-bold text-slate-800">
                {tickets.filter(t => t.status !== Status.COMPLETED).length}
              </h3>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            <span className="text-red-500 font-bold">{tickets.filter(t => t.priority === Priority.CRITICAL && t.status !== Status.COMPLETED).length} Críticas</span> requieren atención inmediata.
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Avance Promedio</p>
              <h3 className="text-3xl font-bold text-slate-800">68%</h3>
            </div>
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
              <Activity size={24} />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '68%' }}></div>
          </div>
        </div>
      </div>

      {/* Company Grid */}
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Building2 size={20} />
        Estado por Razón Social
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {companies.map((company) => {
          const summary = getCompanySummary(company.id);
          const ticketStats = getCompanyTicketStats(company.id);
          
          return (
            <div 
              key={company.id} 
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer"
              onClick={() => onSelectCompany(company.id)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 truncate pr-2" title={company.name}>{company.name}</h4>
                    <p className="text-xs text-slate-500">{company.taxId}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                    summary.statusLabel === 'On Track' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    summary.statusLabel === 'Delayed' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                    'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {summary.statusLabel === 'On Track' ? 'Al Día' : summary.statusLabel === 'Delayed' ? 'Retraso' : 'Crítico'}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Progreso ({summary.period})</span>
                    <span className="font-bold">{summary.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        summary.progress < 30 ? 'bg-red-500' : summary.progress < 70 ? 'bg-yellow-400' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${summary.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Fase actual: {summary.currentStage}</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="flex-1 flex items-center justify-center gap-1.5 text-slate-600 bg-slate-50 py-2 rounded-lg text-xs font-medium">
                        <AlertCircle size={14} className={ticketStats.open > 0 ? "text-indigo-500" : "text-slate-400"} />
                        {ticketStats.open} Incidencias
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-700 py-2 rounded-lg text-xs font-medium border border-red-100">
                        <AlertTriangle size={14} />
                        {ticketStats.critical} Críticas
                    </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 flex justify-center items-center border-t border-slate-100 group-hover:bg-indigo-50 transition-colors">
                <span className="text-xs font-bold text-indigo-600 flex items-center">
                  Gestionar Nómina <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};