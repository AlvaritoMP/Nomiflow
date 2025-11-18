
import React from 'react';
import { AuditLogEntry } from '../types';
import { FileText, User as UserIcon, Clock, CheckCircle2, Upload, Settings } from 'lucide-react';

interface AuditLogProps {
  logs: AuditLogEntry[];
}

export const AuditLog: React.FC<AuditLogProps> = ({ logs }) => {
  const getIcon = (action: string) => {
    if (action.includes('COMPLETED')) return <CheckCircle2 size={16} className="text-emerald-500" />;
    if (action.includes('UPLOADED')) return <Upload size={16} className="text-blue-500" />;
    if (action.includes('WORKFLOW')) return <Settings size={16} className="text-orange-500" />;
    return <FileText size={16} className="text-slate-400" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-slate-800">Registro de Auditoría</h3>
        <p className="text-xs text-slate-500">Historial inmutable de acciones del sistema</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No hay registros recientes.</p>}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 items-start group hover:bg-slate-50 p-2 rounded-lg transition-colors">
            <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              {getIcon(log.action)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-slate-800">{log.userName} <span className="text-xs font-normal text-slate-500">({log.userRole})</span></p>
                <div className="flex items-center text-xs text-slate-400">
                    <Clock size={12} className="mr-1" />
                    {log.timestamp.toLocaleString()}
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-0.5 break-words">{log.details}</p>
              <div className="mt-1">
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide font-medium border border-slate-200">
                    {log.action.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
