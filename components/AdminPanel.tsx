
import React, { useState } from 'react';
import { User, Company, TicketTemplate, TicketType, RequirementType } from '../types';
import { Users, Building2, Settings, Shield, Plus, MoreHorizontal, Search, Mail, ToggleLeft, ToggleRight, X, Save, FileText, Trash2, CheckSquare, Upload } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  companies: Company[];
  templates?: TicketTemplate[];
  onAddCompany?: (name: string, taxId: string) => void;
  onUpdateTemplates?: (templates: TicketTemplate[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, companies, templates = [], onAddCompany, onUpdateTemplates }) => {
  const [activeSection, setActiveSection] = useState<'users' | 'companies' | 'settings' | 'workflows'>('users');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);

  // Company Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({ name: '', taxId: '' });

  // Workflows State
  const [selectedTemplateType, setSelectedTemplateType] = useState<TicketType>(TicketType.NEW_HIRE);
  const [requirementsBuffer, setRequirementsBuffer] = useState<TicketTemplate[]>(JSON.parse(JSON.stringify(templates)));

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddCompany && newCompanyData.name && newCompanyData.taxId) {
      onAddCompany(newCompanyData.name, newCompanyData.taxId);
      setNewCompanyData({ name: '', taxId: '' });
      setIsCompanyModalOpen(false);
    }
  };

  const getCurrentTemplate = () => {
    let template = requirementsBuffer.find(t => t.ticketType === selectedTemplateType);
    if (!template) {
      // Create if doesn't exist in buffer
      const newTemplate: TicketTemplate = { ticketType: selectedTemplateType, requirements: [] };
      setRequirementsBuffer([...requirementsBuffer, newTemplate]);
      return newTemplate;
    }
    return template;
  };

  const handleAddRequirement = () => {
    const newBuffer = [...requirementsBuffer];
    const templateIndex = newBuffer.findIndex(t => t.ticketType === selectedTemplateType);
    if (templateIndex >= 0) {
      newBuffer[templateIndex].requirements.push({
        id: `req-${Date.now()}`,
        text: 'Nuevo Requisito',
        type: RequirementType.CHECKBOX,
        required: true
      });
      setRequirementsBuffer(newBuffer);
    }
  };

  const handleUpdateRequirement = (reqId: string, field: string, value: any) => {
    const newBuffer = [...requirementsBuffer];
    const templateIndex = newBuffer.findIndex(t => t.ticketType === selectedTemplateType);
    if (templateIndex >= 0) {
      const reqIndex = newBuffer[templateIndex].requirements.findIndex(r => r.id === reqId);
      if (reqIndex >= 0) {
        newBuffer[templateIndex].requirements[reqIndex] = {
          ...newBuffer[templateIndex].requirements[reqIndex],
          [field]: value
        };
        setRequirementsBuffer(newBuffer);
      }
    }
  };

  const handleRemoveRequirement = (reqId: string) => {
    const newBuffer = [...requirementsBuffer];
    const templateIndex = newBuffer.findIndex(t => t.ticketType === selectedTemplateType);
    if (templateIndex >= 0) {
      newBuffer[templateIndex].requirements = newBuffer[templateIndex].requirements.filter(r => r.id !== reqId);
      setRequirementsBuffer(newBuffer);
    }
  };

  const handleSaveTemplates = () => {
    if (onUpdateTemplates) {
      onUpdateTemplates(requirementsBuffer);
      alert('Plantillas actualizadas correctamente');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      
      {/* Company Modal */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Registrar Nueva Empresa</h3>
              <button onClick={() => setIsCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCompany}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
                  <input 
                    type="text" 
                    required
                    value={newCompanyData.name}
                    onChange={(e) => setNewCompanyData({...newCompanyData, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej: Inversiones del Norte SAC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">RUC / Tax ID</label>
                  <input 
                    type="text" 
                    required
                    value={newCompanyData.taxId}
                    onChange={(e) => setNewCompanyData({...newCompanyData, taxId: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej: 20123456789"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCompanyModalOpen(false)} 
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!newCompanyData.name || !newCompanyData.taxId}
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  Guardar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Administración del Sistema</h2>
          <p className="text-slate-500 mt-1">Gestione usuarios, empresas, flujos y configuraciones globales.</p>
        </div>
        <button 
          onClick={() => {
            if (activeSection === 'companies') setIsCompanyModalOpen(true);
            if (activeSection === 'workflows') handleSaveTemplates();
          }}
          className={`bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-medium shadow-sm ${activeSection === 'settings' || activeSection === 'users' ? 'hidden' : ''}`}
        >
          {activeSection === 'workflows' ? <Save size={18} /> : <Plus size={18} />}
          {activeSection === 'users' ? 'Nuevo Usuario' : activeSection === 'workflows' ? 'Guardar Cambios' : 'Nueva Empresa'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveSection('users')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={18} />
          Usuarios
        </button>
        <button
          onClick={() => setActiveSection('companies')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'companies' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 size={18} />
          Empresas
        </button>
        <button
          onClick={() => setActiveSection('workflows')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'workflows' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={18} />
          Flujos de Resolución
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings size={18} />
          Configuración
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
        
        {/* USERS SECTION */}
        {activeSection === 'users' && (
          <div>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar usuario..." 
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="text-sm text-slate-500">Total: <span className="font-semibold text-slate-800">{users.length} usuarios</span></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Usuario</th>
                    <th className="px-6 py-3">Rol</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Último Acceso</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-slate-500 text-xs flex items-center gap-1">
                              <Mail size={10} />
                              {user.name.toLowerCase().replace(' ', '.')}@empresa.com
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          user.role === 'PAYROLL_MANAGER' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Activo
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">Hace 2 horas</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMPANIES SECTION */}
        {activeSection === 'companies' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(company => (
              <div key={company.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group relative bg-white">
                <div className="absolute top-4 right-4 text-slate-300 group-hover:text-indigo-500 transition">
                   <Building2 size={24} />
                </div>
                <h3 className="font-bold text-slate-800 pr-8">{company.name}</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">RUC: {company.taxId}</p>
                
                <div className="space-y-2 border-t border-slate-100 pt-3 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Ciclo Activo:</span>
                    <span className="font-medium text-emerald-600">Octubre 2023</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Colaboradores:</span>
                    <span className="font-medium text-slate-700">124</span>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 text-xs font-medium bg-slate-50 text-slate-700 py-2 rounded border border-slate-200 hover:bg-slate-100 transition">Configuración</button>
                  <button className="flex-1 text-xs font-medium bg-indigo-50 text-indigo-700 py-2 rounded border border-indigo-100 hover:bg-indigo-100 transition">Ver Ciclo</button>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => setIsCompanyModalOpen(true)}
              className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-slate-50 transition cursor-pointer min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-indigo-100">
                <Plus size={24} />
              </div>
              <span className="font-medium">Registrar Nueva Empresa</span>
            </button>
          </div>
        )}

        {/* WORKFLOWS SECTION */}
        {activeSection === 'workflows' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Tipo de Ticket</h3>
                <div className="space-y-1">
                  {Object.values(TicketType).map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedTemplateType(type)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedTemplateType === type 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                          : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Plantilla de Resolución: {selectedTemplateType}</h3>
                    <p className="text-sm text-slate-500">Defina los requisitos obligatorios para cerrar este tipo de ticket.</p>
                  </div>
                  <button 
                    onClick={handleAddRequirement}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Plus size={14} /> Agregar Requisito
                  </button>
                </div>

                <div className="space-y-3">
                  {getCurrentTemplate().requirements.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                      <p className="text-slate-400 text-sm">No hay requisitos configurados.</p>
                    </div>
                  ) : (
                    getCurrentTemplate().requirements.map(req => (
                      <div key={req.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-3 shadow-sm">
                        <div className="mt-2">
                          {req.type === RequirementType.CHECKBOX ? <CheckSquare size={16} className="text-slate-400" /> : <Upload size={16} className="text-slate-400" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input 
                            type="text" 
                            value={req.text}
                            onChange={(e) => handleUpdateRequirement(req.id, 'text', e.target.value)}
                            className="w-full text-sm font-medium text-slate-800 border-b border-slate-100 pb-1 outline-none focus:border-indigo-500"
                            placeholder="Descripción del requisito..."
                          />
                          <div className="flex gap-4 items-center text-xs">
                            <select 
                              value={req.type}
                              onChange={(e) => handleUpdateRequirement(req.id, 'type', e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600"
                            >
                              <option value={RequirementType.CHECKBOX}>Check de Verificación</option>
                              <option value={RequirementType.FILE_UPLOAD}>Subida de Archivo</option>
                            </select>
                            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={req.required}
                                onChange={(e) => handleUpdateRequirement(req.id, 'required', e.target.checked)}
                              />
                              Obligatorio
                            </label>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveRequirement(req.id)}
                          className="text-slate-300 hover:text-red-500 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS SECTION */}
        {activeSection === 'settings' && (
          <div className="p-6 max-w-3xl">
            <div className="space-y-8">
              
              {/* AI Settings */}
              <div>
                <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-indigo-600" />
                  Inteligencia Artificial & Seguridad
                </h3>
                <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">Análisis Automático de Tickets</p>
                      <p className="text-sm text-slate-500">Permitir que Gemini analice incidencias al crearse.</p>
                    </div>
                    <button onClick={() => setAiEnabled(!aiEnabled)} className="text-indigo-600 focus:outline-none">
                      {aiEnabled ? <ToggleRight size={40} className="fill-indigo-100" /> : <ToggleLeft size={40} className="text-slate-400" />}
                    </button>
                  </div>
                  
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h3 className="text-lg font-medium text-slate-800 mb-4">Notificaciones</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                    <input 
                        type="checkbox" 
                        checked={emailNotifs} 
                        onChange={(e) => setEmailNotifs(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
                    />
                    <div>
                        <p className="text-sm font-medium text-slate-800">Resumen diario por correo</p>
                        <p className="text-xs text-slate-500">Recibe un resumen de incidencias críticas a las 8:00 AM.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                    <div>
                        <p className="text-sm font-medium text-slate-800">Alertas de vencimiento de plazos</p>
                        <p className="text-xs text-slate-500">Notificar 2 días antes del cierre de nómina.</p>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
