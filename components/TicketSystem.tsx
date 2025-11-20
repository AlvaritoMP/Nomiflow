
import React, { useState } from 'react';
import { Ticket, TicketType, Priority, Status, User, Attachment, TicketTemplate, RequirementType, ResolutionEvidence } from '../types';
import { Paperclip, Send, Bot, MoreVertical, FileText, AlertCircle, CheckCircle2, MessageSquare, X, Save, CheckSquare, Upload, ShieldCheck } from 'lucide-react';
import { analyzeTicketWithGemini } from '../services/geminiService';

interface TicketSystemProps {
  tickets: Ticket[];
  templates?: TicketTemplate[];
  currentUser: User;
  onAddComment: (ticketId: string, text: string) => void;
  onUpdateStatus: (ticketId: string, status: Status) => void;
  onResolveTicket: (ticketId: string, evidence: ResolutionEvidence[]) => void;
  onTicketUpdate: (updatedTicket: Ticket) => void;
  onCreateTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments' | 'status' | 'assignedTo'>) => void;
}

export const TicketSystem: React.FC<TicketSystemProps> = ({ tickets, templates = [], currentUser, onAddComment, onUpdateStatus, onResolveTicket, onTicketUpdate, onCreateTicket }) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [commentInput, setCommentInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Create Mode State
  const [isCreating, setIsCreating] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    title: '',
    description: '',
    type: TicketType.INCIDENT,
    priority: Priority.MEDIUM,
    companyId: ''
  });

  // Resolution Modal State
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionDraft, setResolutionDraft] = useState<ResolutionEvidence[]>([]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentInput.trim() && selectedTicket) {
      onAddComment(selectedTicket.id, commentInput);
      setCommentInput('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedTicket) return;
    setIsAnalyzing(true);
    const analysis = await analyzeTicketWithGemini(selectedTicket);
    onTicketUpdate({ ...selectedTicket, aiAnalysis: analysis });
    setIsAnalyzing(false);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedTicketId(null);
    setNewTicketData({
      title: '',
      description: '',
      type: TicketType.INCIDENT,
      priority: Priority.MEDIUM,
      companyId: tickets[0]?.companyId || '' 
    });
  };

  const handleSaveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketData.title || !newTicketData.description) return;

    onCreateTicket({
      title: newTicketData.title,
      description: newTicketData.description,
      type: newTicketData.type,
      priority: newTicketData.priority,
      companyId: newTicketData.companyId,
      createdBy: currentUser.id
    });

    setIsCreating(false);
  };

  // --- RESOLUTION LOGIC ---

  const handleAttemptStatusChange = (newStatus: Status) => {
    if (!selectedTicket) return;

    if (newStatus === Status.COMPLETED) {
      // Check if there is a template for this ticket type
      const template = templates.find(t => t.ticketType === selectedTicket.type);
      
      if (template && template.requirements.length > 0) {
        // Initialize draft based on template
        const initialDraft: ResolutionEvidence[] = template.requirements.map(req => ({
          requirementId: req.id,
          requirementText: req.text,
          resolvedAt: new Date(),
          resolvedBy: currentUser.id,
          isChecked: false,
          file: undefined
        }));
        setResolutionDraft(initialDraft);
        setIsResolving(true);
        return;
      }
    }

    // If no template or not completing, just update status
    onUpdateStatus(selectedTicket.id, newStatus);
  };

  const handleResolutionChange = (reqId: string, field: 'isChecked' | 'file', value: any) => {
    setResolutionDraft(prev => prev.map(item => {
      if (item.requirementId === reqId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleFileUpload = (reqId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const attachment: Attachment = {
        id: `ev-${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.name.split('.').pop() || 'file',
        url: '#',
        uploadedAt: new Date(),
        uploadedBy: currentUser.id
      };
      handleResolutionChange(reqId, 'file', attachment);
    }
  };

  const submitResolution = () => {
    if (!selectedTicket) return;
    onResolveTicket(selectedTicket.id, resolutionDraft);
    setIsResolving(false);
  };

  const isResolutionValid = () => {
    if (!selectedTicket) return false;
    const template = templates.find(t => t.ticketType === selectedTicket.type);
    if (!template) return true;

    return template.requirements.every(req => {
      if (!req.required) return true;
      const draftItem = resolutionDraft.find(d => d.requirementId === req.id);
      if (!draftItem) return false;
      
      if (req.type === RequirementType.CHECKBOX) return draftItem.isChecked;
      if (req.type === RequirementType.FILE_UPLOAD) return !!draftItem.file;
      return false;
    });
  };

  // --- RENDER HELPERS ---

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL: return 'bg-red-100 text-red-700 border-red-200';
      case Priority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
      case Priority.MEDIUM: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case Priority.LOW: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Resolution Modal */}
      {isResolving && selectedTicket && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <div>
                 <h3 className="font-bold text-slate-800 text-lg">Resolución de Ticket</h3>
                 <p className="text-xs text-slate-500">Complete los requisitos para cerrar: {selectedTicket.title}</p>
               </div>
               <button onClick={() => setIsResolving(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              {templates.find(t => t.ticketType === selectedTicket.type)?.requirements.map((req) => {
                const draftState = resolutionDraft.find(d => d.requirementId === req.id);
                return (
                  <div key={req.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between mb-2">
                      <p className="font-medium text-sm text-slate-800">{req.text}</p>
                      {req.required && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 h-fit">Requerido</span>}
                    </div>

                    {req.type === RequirementType.CHECKBOX ? (
                      <label className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded -ml-2">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${draftState?.isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                          {draftState?.isChecked && <CheckSquare size={14} />}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={!!draftState?.isChecked}
                          onChange={(e) => handleResolutionChange(req.id, 'isChecked', e.target.checked)}
                        />
                        <span className="text-sm text-slate-600">Confirmar cumplimiento</span>
                      </label>
                    ) : (
                      <div className="mt-2">
                        {draftState?.file ? (
                          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                             <div className="flex items-center gap-2 overflow-hidden">
                               <FileText size={16} className="text-indigo-500 flex-shrink-0" />
                               <span className="text-xs font-medium text-indigo-900 truncate">{draftState.file.name}</span>
                             </div>
                             <button onClick={() => handleResolutionChange(req.id, 'file', undefined)} className="text-slate-400 hover:text-red-500">
                               <X size={14} />
                             </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center w-full border-2 border-dashed border-slate-200 rounded-lg p-3 cursor-pointer hover:border-indigo-300 hover:bg-slate-50 transition group">
                            <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-500">
                              <Upload size={16} />
                              <span className="text-xs font-medium">Adjuntar documento</span>
                            </div>
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(req.id, e)} />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsResolving(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition">
                Cancelar
              </button>
              <button 
                onClick={submitResolution}
                disabled={!isResolutionValid()}
                className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck size={18} />
                Finalizar Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-800">Buzón de Nómina</h2>
            <button 
              onClick={handleStartCreate}
              className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition flex items-center gap-1"
            >
              + Nuevo
            </button>
          </div>
          <input type="text" placeholder="Filtrar tickets..." className="w-full text-sm p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {tickets.map(ticket => (
            <div 
              key={ticket.id}
              onClick={() => {
                setSelectedTicketId(ticket.id);
                setIsCreating(false);
              }}
              className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedTicketId === ticket.id && !isCreating ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                <span className="text-xs text-slate-400">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-medium text-slate-800 text-sm truncate mb-1">{ticket.title}</h3>
              <p className="text-xs text-slate-500 truncate">{ticket.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{ticket.type}</span>
                {ticket.aiAnalysis && <Bot size={12} className="text-indigo-500" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area: Toggle between Form and Details */}
      {isCreating ? (
        <div className="flex-1 flex flex-col bg-slate-50">
          <div className="p-5 bg-white border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Nueva Incidencia</h2>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
          <div className="p-8 max-w-2xl mx-auto w-full overflow-y-auto">
            <form onSubmit={handleSaveTicket} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Título del Asunto</label>
                <input 
                  type="text" 
                  required
                  value={newTicketData.title}
                  onChange={(e) => setNewTicketData({...newTicketData, title: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: Error en cálculo de horas extras"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                  <select 
                    value={newTicketData.type}
                    onChange={(e) => setNewTicketData({...newTicketData, type: e.target.value as TicketType})}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {Object.values(TicketType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Prioridad</label>
                  <select 
                    value={newTicketData.priority}
                    onChange={(e) => setNewTicketData({...newTicketData, priority: e.target.value as Priority})}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {Object.values(Priority).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descripción Detallada</label>
                <textarea 
                  required
                  value={newTicketData.description}
                  onChange={(e) => setNewTicketData({...newTicketData, description: e.target.value})}
                  rows={6}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Describa la incidencia, incluse nombres, fechas y detalles relevantes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-2"
                >
                  <Save size={18} />
                  Crear Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : selectedTicket ? (
        <div className="flex-1 flex flex-col bg-slate-50">
          {/* Header */}
          <div className="p-5 bg-white border-b border-slate-200 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-800">{selectedTicket.title}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${selectedTicket.status === Status.COMPLETED ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <p className="text-sm text-slate-500">Reportado por <span className="font-medium text-slate-700">Usuario {selectedTicket.createdBy}</span> • ID: #{selectedTicket.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={selectedTicket.status}
                onChange={(e) => handleAttemptStatusChange(e.target.value as Status)}
                className="text-sm border border-slate-300 rounded-md p-1.5 bg-white"
              >
                <option value={Status.PENDING}>Pendiente</option>
                <option value={Status.IN_PROGRESS}>En Progreso</option>
                <option value={Status.COMPLETED}>Completado</option>
              </select>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Description Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Detalles</h4>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
              
              {selectedTicket.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h5 className="text-xs font-semibold text-slate-500 mb-2">ADJUNTOS</h5>
                  <div className="flex flex-wrap gap-3">
                    {selectedTicket.attachments.map(att => (
                      <div key={att.id} className="flex items-center p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 cursor-pointer transition">
                        <FileText size={16} className="text-indigo-500 mr-2" />
                        <span className="text-slate-700 font-medium">{att.name}</span>
                        <span className="text-slate-400 text-xs ml-2">({att.size})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resolution Evidence Card (If Completed) */}
            {selectedTicket.status === Status.COMPLETED && selectedTicket.resolutionEvidence && (
                <div className="bg-emerald-50/50 p-5 rounded-xl shadow-sm border border-emerald-100">
                    <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                        <ShieldCheck size={18} /> Resolución Verificada
                    </h4>
                    <div className="space-y-3">
                        {selectedTicket.resolutionEvidence.map((ev, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">{ev.requirementText}</p>
                                    {ev.file && (
                                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                            <FileText size={12} /> {ev.file.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Analysis Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl shadow-sm border border-indigo-100">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Bot className="text-indigo-600" size={20} />
                  <h4 className="text-sm font-bold text-indigo-900">Análisis IA de Nómina</h4>
                </div>
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                >
                  {isAnalyzing ? 'Analizando...' : selectedTicket.aiAnalysis ? 'Regenerar Análisis' : 'Analizar Incidencia'}
                </button>
              </div>
              
              {selectedTicket.aiAnalysis ? (
                <div className="prose prose-sm prose-indigo max-w-none text-slate-700 bg-white/50 p-4 rounded-lg border border-indigo-50">
                   <div className="whitespace-pre-wrap">{selectedTicket.aiAnalysis}</div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Solicita a Gemini un análisis de impacto en nómina, documentación faltante y pasos a seguir.</p>
              )}
            </div>

            {/* Timeline / Comments */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Historial y Chat</h4>
              {selectedTicket.comments.map(comment => (
                <div key={comment.id} className={`flex gap-3 ${comment.userId === currentUser.id ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${comment.userId === currentUser.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                    {comment.userId === currentUser.id ? 'YO' : 'U'}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${comment.userId === currentUser.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                    <p>{comment.text}</p>
                    <p className={`text-[10px] mt-1 ${comment.userId === currentUser.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {comment.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSendComment} className="flex gap-2">
              <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <Paperclip size={20} />
              </button>
              <input 
                type="text" 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Escribe un comentario o actualización..." 
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <button 
                type="submit"
                disabled={!commentInput.trim()}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400 flex-col">
          <MessageSquare size={48} className="mb-4 opacity-20" />
          <p>Selecciona un ticket para ver los detalles o crea uno nuevo.</p>
        </div>
      )}
    </div>
  );
};
