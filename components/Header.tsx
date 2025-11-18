import React from 'react';
import { Company, User } from '../types';
import { Bell, Search, Menu, Building2 } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  companies, 
  selectedCompanyId, 
  onSelectCompany,
  toggleSidebar 
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
          <Building2 size={18} className="text-slate-500 mr-2" />
          <select 
            value={selectedCompanyId}
            onChange={(e) => onSelectCompany(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-64 cursor-pointer"
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar incidencia, tarea..." 
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
          />
        </div>

        <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <Bell size={20} />
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800">{currentUser.name}</p>
            <p className="text-xs text-slate-500">{currentUser.role}</p>
          </div>
          <img src={currentUser.avatar} alt="User" className="h-9 w-9 rounded-full object-cover border border-slate-200" />
        </div>
      </div>
    </header>
  );
};
