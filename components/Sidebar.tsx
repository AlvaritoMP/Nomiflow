import React from 'react';
import { LayoutDashboard, GitMerge, MessageSquare, FileText, Calendar, Settings, LogOut, Globe } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'global', label: 'Control Global', icon: Globe },
    { id: 'process', label: 'Ciclo de Nómina', icon: GitMerge },
    { id: 'tickets', label: 'Gestión de Tickets', icon: MessageSquare },
    { id: 'audit', label: 'Auditoría & Logs', icon: FileText },
    { id: 'calendar', label: 'Calendario Fiscal', icon: Calendar },
  ];

  return (
    <aside className={`fixed lg:sticky top-0 left-0 z-30 h-screen bg-slate-900 text-white w-64 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
          <span className="font-bold text-white">N</span>
        </div>
        <span className="font-bold text-lg tracking-tight">NóminaFlow AI</span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menú Principal</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={20} className="mr-3" />
              {item.label}
            </button>
          );
        })}

        <div className="mt-8">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configuración</p>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'admin' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Settings size={20} className="mr-3" />
            Administración
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
          <LogOut size={20} className="mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};