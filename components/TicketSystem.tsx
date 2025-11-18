import React, { useState } from 'react';
import { Ticket, TicketType, Priority, Status, User, Attachment } from '../types';
import { Paperclip, Send, Bot, MoreVertical, FileText, AlertCircle, CheckCircle2, MessageSquare, X, Save } from 'lucide-react';
import { analyzeTicketWithGemini } from '../services/geminiService';

interface TicketSystemProps {
  tickets: Ticket[];
  currentUser: User;
  onAddComment: (ticketId: string, text: string) => void;
  onUpdateStatus: (ticketId: string, status: Status) => void;
  onTicketUpdate: (updatedTicket: Ticket) => void;
  onCreateTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments' | 'status' | 'assignedTo'>) => void;
}

export const TicketSystem: React.FC<TicketSystemProps> = ({ tickets, currentUser, onAddComment, onUpdateStatus, onTicketUpdate, onCreateTicket }) => {
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
      companyId: tickets[0]?.companyId || '' // Default to first ticket's company or handle via props if needed strictly
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
    // Optionally select the new ticket (handled via useEffect in parent or simple reset here)
  };

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
    <div className="flex h-[calc(100vh-7rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                onChange={(e) => onUpdateStatus(selectedTicket.id, e.target.value as Status)}
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