
import React, { useState } from 'react';
import { PayrollCycle, Status, PayrollTask, User, UserRole, PayrollStage, Attachment } from '../types';
import { CheckCircle, Circle, Clock, AlertTriangle, FileCheck, CreditCard, Building, Receipt, History, PlayCircle, Lock, ChevronRight, Eye, CheckSquare, Square, Plus, Trash2, Edit3, Upload, FileText, X, Save, ShieldAlert } from 'lucide-react';

interface PayrollProcessProps {
  cycle: PayrollCycle;
  history: PayrollCycle[];
  currentUser: User;
  onUpdateTask: (stageId: string, taskId: string, updates: Partial<PayrollTask>, logAction: string) => void;
  onUpdateWorkflow: (updatedStages: PayrollStage[], logAction: string) => void;
  onCloseCycle: () => void;
}

export const PayrollProcess: React.FC<PayrollProcessProps> = ({ cycle, history, currentUser, onUpdateTask, onUpdateWorkflow, onCloseCycle }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [selectedHistoryCycle, setSelectedHistoryCycle] = useState<PayrollCycle | null>(null);
  
  // Admin Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [stagesBuffer, setStagesBuffer] = useState<PayrollStage[]>([]);

  // Task Modal State
  const [selectedTask, setSelectedTask] = useState<{stageId: string, task: PayrollTask} | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Helper stats
  const totalTasks = cycle.stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
  const completedTasks = cycle.stages.reduce((acc, stage) => acc + stage.tasks.filter(t => t.completed).length, 0);
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const isFullyComplete = totalTasks > 0 && totalTasks === completedTasks;

  // Start Edit Mode
  const handleStartEdit = () => {
      setStagesBuffer(JSON.parse(JSON.stringify(cycle.stages)));
      setIsEditMode(true);
  };

  // Save Workflow Changes
  const handleSaveWorkflow = () => {
      onUpdateWorkflow(stagesBuffer, 'WORKFLOW_UPDATED');
      setIsEditMode(false);
  };

  // Add Stage (Edit Mode)
  const handleAddStage = () => {
      const newStage: PayrollStage = {
          id: `st-${Date.now()}`,
          name: 'Nueva Etapa',
          status: Status.PENDING,
          tasks: []
      };
      setStagesBuffer([...stagesBuffer, newStage]);
  };

  // Add Task (Edit Mode)
  const handleAddTask = (stageIndex: number) => {
      const newTask: PayrollTask = {
          id: `tk-${Date.now()}`,
          title: 'Nueva Tarea',
          completed: false,
          requiresFile: false,
          assignedRole: UserRole.PAYROLL_MANAGER
      };
      const newStages = [...stagesBuffer];
      newStages[stageIndex].tasks.push(newTask);
      setStagesBuffer(newStages);
  };

  // Update Task Definition (Edit Mode)
  const handleTaskDefUpdate = (stageIndex: number, taskIndex: number, field: keyof PayrollTask, value: any) => {
      const newStages = [...stagesBuffer];
      newStages[stageIndex].tasks[taskIndex] = {
          ...newStages[stageIndex].tasks[taskIndex],
          [field]: value
      };
      setStagesBuffer(newStages);
  };

  // Task Execution Handlers
  const handleCompleteTask = (withFile?: Attachment) => {
      if (!selectedTask) return;
      
      const updates: Partial<PayrollTask> = {
          completed: true,
          completedBy: currentUser.id,
          completedAt: new Date(),
      };

      if (withFile) {
          updates.evidenceFile = withFile;
      }

      onUpdateTask(selectedTask.stageId, selectedTask.task.id, updates, 'TASK_COMPLETED');
      setSelectedTask(null);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && selectedTask) {
          const file = e.target.files[0];
          // Mock Upload
          const attachment: Attachment = {
              id: `f-${Date.now()}`,
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              type: file.name.split('.').pop() || 'file',
              url: '#',
              uploadedAt: new Date(),
              uploadedBy: currentUser.id
          };
          
          // If task requires file, we just attach it but don't complete yet unless user clicks complete
          // Or simpler: Uploading IS the completion evidence, but let's keep them separate actions or combined.
          // Design choice: Allow uploading, then user clicks "Mark Complete".
          
          onUpdateTask(selectedTask.stageId, selectedTask.task.id, { evidenceFile: attachment }, 'FILE_UPLOADED');
          setSelectedTask(prev => prev ? ({...prev, task: {...prev.task, evidenceFile: attachment}}) : null);
      }
  };

  const canUserExecuteTask = (task: PayrollTask) => {
      if (isAdmin) return true;
      if (!task.assignedRole) return true; // Open to all if not assigned
      return task.assignedRole === currentUser.role;
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto flex flex-col h-full relative">
      
      {/* Modal de Tarea */}
      {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800">Detalle de Tarea</h3>
                      <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <h4 className="text-lg font-bold text-indigo-900">{selectedTask.task.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{selectedTask.task.description || "Sin descripción adicional."}</p>
                      </div>
                      
                      <div className="flex gap-2 text-xs">
                           <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 text-slate-600">
                               Rol: <strong>{selectedTask.task.assignedRole || 'Todos'}</strong>
                           </span>
                           {selectedTask.task.requiresFile && (
                               <span className="px-2 py-1 bg-orange-50 rounded border border-orange-100 text-orange-600 flex items-center gap-1">
                                   <FileText size={12} /> Requiere Archivo
                               </span>
                           )}
                      </div>

                      {!canUserExecuteTask(selectedTask.task) && !selectedTask.task.completed && (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                              <ShieldAlert size={16} className="text-red-500 mt-0.5" />
                              <p className="text-xs text-red-700">No tienes permisos para ejecutar esta tarea. Se requiere rol: <strong>{selectedTask.task.assignedRole}</strong>.</p>
                          </div>
                      )}

                      {/* Sección de Archivo */}
                      <div className="border-t border-slate-100 pt-4">
                          <p className="text-sm font-medium text-slate-700 mb-2">Sustento / Evidencia</p>
                          
                          {selectedTask.task.evidenceFile ? (
                              <div className="flex items-center p-3 bg-indigo-50 border border-indigo-100 rounded-lg mb-2">
                                  <FileText size={20} className="text-indigo-500 mr-3" />
                                  <div className="flex-1 overflow-hidden">
                                      <p className="text-sm font-medium text-indigo-900 truncate">{selectedTask.task.evidenceFile.name}</p>
                                      <p className="text-xs text-indigo-600">Subido por {selectedTask.task.evidenceFile.uploadedBy} • {new Date(selectedTask.task.evidenceFile.uploadedAt!).toLocaleDateString()}</p>
                                  </div>
                                  {!selectedTask.task.completed && (
                                      <button className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                  )}
                              </div>
                          ) : (
                              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:bg-slate-50 transition relative">
                                  <input 
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleUploadFile}
                                    disabled={selectedTask.task.completed || !canUserExecuteTask(selectedTask.task)}
                                  />
                                  <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                                  <p className="text-sm text-slate-500">Haz clic o arrastra un archivo aquí</p>
                              </div>
                          )}
                      </div>

                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setSelectedTask(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancelar</button>
                      
                      {!selectedTask.task.completed && (
                        <button 
                            onClick={() => handleCompleteTask()}
                            disabled={!canUserExecuteTask(selectedTask.task) || (selectedTask.task.requiresFile && !selectedTask.task.evidenceFile)}
                            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                        >
                            <CheckCircle size={16} />
                            Completar Tarea
                        </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Nómina</h2>
          <p className="text-slate-500 text-sm">Administra el flujo de trabajo y auditoría.</p>
        </div>
        
        <div className="flex gap-3 self-start">
             {isAdmin && activeTab === 'current' && (
                 <button 
                    onClick={() => isEditMode ? handleSaveWorkflow() : handleStartEdit()}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 border ${isEditMode ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                     {isEditMode ? <Save size={16} /> : <Edit3 size={16} />}
                     {isEditMode ? 'Guardar Cambios' : 'Modo Edición'}
                 </button>
             )}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('current')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'current' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <PlayCircle size={16} />
                    Activo
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <History size={16} />
                    Historial
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1">
          {activeTab === 'current' && !isEditMode && (
              <>
                {/* Progress Dashboard */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">
                            {new Date(cycle.startDate).getDate()}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{cycle.period}</h3>
                            <p className="text-xs text-slate-500 font-medium">{progress}% Completado</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full md:mx-8">
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    <button 
                        onClick={onCloseCycle}
                        disabled={!isFullyComplete}
                        className={`px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center ${
                            isFullyComplete 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        >
                        {isFullyComplete ? <CheckCircle size={18} className="mr-2" /> : <Lock size={18} className="mr-2" />}
                        {isFullyComplete ? 'Cerrar Ciclo' : 'Pendiente'}
                    </button>
                </div>

                {/* Task Board */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cycle.stages.map((stage) => (
                        <div key={stage.id} className={`rounded-xl border transition-all duration-200 ${
                            stage.status === Status.IN_PROGRESS ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-100' : 'bg-slate-50/50 border-slate-200'
                        }`}>
                            <div className={`p-3 border-b flex justify-between items-center ${stage.status === Status.IN_PROGRESS ? 'bg-indigo-50/50' : ''}`}>
                                <h3 className={`font-bold text-sm ${stage.status === Status.IN_PROGRESS ? 'text-indigo-900' : 'text-slate-600'}`}>{stage.name}</h3>
                            </div>
                            <div className="p-3 space-y-2">
                                {stage.tasks.map(task => (
                                    <div 
                                        key={task.id} 
                                        onClick={() => setSelectedTask({stageId: stage.id, task})}
                                        className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer group ${
                                            task.completed ? 'border-emerald-100 bg-emerald-50/30' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                                        }`}
                                    >
                                         <div className={`mt-0.5 flex-shrink-0 ${task.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
                                            {task.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate ${task.completed ? 'text-slate-500 line-through' : 'text-slate-700 font-medium'}`}>
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                {task.requiresFile && (
                                                    <span className={`text-[10px] flex items-center gap-0.5 ${task.evidenceFile ? 'text-indigo-600' : 'text-orange-500'}`}>
                                                        <FileText size={10} /> {task.evidenceFile ? 'Adjunto' : 'Req. Archivo'}
                                                    </span>
                                                )}
                                                {task.assignedRole && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 border border-slate-200">
                                                        {task.assignedRole}
                                                    </span>
                                                )}
                                            </div>
                                         </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
              </>
          )}

          {/* ADMIN EDIT MODE */}
          {activeTab === 'current' && isEditMode && (
              <div className="space-y-6">
                  <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg text-indigo-800 text-sm flex items-center gap-2">
                      <Edit3 size={18} />
                      <p>Modificando estructura del ciclo actual. Estos cambios se reflejarán inmediatamente.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {stagesBuffer.map((stage, sIndex) => (
                          <div key={stage.id} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                               <input 
                                    type="text" 
                                    value={stage.name}
                                    onChange={(e) => {
                                        const newStages = [...stagesBuffer];
                                        newStages[sIndex].name = e.target.value;
                                        setStagesBuffer(newStages);
                                    }}
                                    className="w-full font-bold text-sm bg-white border border-slate-200 rounded px-2 py-1 mb-3"
                               />
                               <div className="space-y-3">
                                   {stage.tasks.map((task, tIndex) => (
                                       <div key={task.id} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                                           <input 
                                                type="text" 
                                                value={task.title}
                                                onChange={(e) => handleTaskDefUpdate(sIndex, tIndex, 'title', e.target.value)}
                                                className="w-full text-sm border-b border-slate-100 pb-1 mb-2 outline-none"
                                           />
                                           <div className="grid grid-cols-2 gap-2 mb-2">
                                               <select 
                                                    value={task.assignedRole}
                                                    onChange={(e) => handleTaskDefUpdate(sIndex, tIndex, 'assignedRole', e.target.value)}
                                                    className="text-xs bg-slate-50 border border-slate-200 rounded p-1"
                                               >
                                                   {Object.values(UserRole).map(role => (
                                                       <option key={role} value={role}>{role}</option>
                                                   ))}
                                               </select>
                                               <label className="flex items-center gap-2 text-xs cursor-pointer">
                                                   <input 
                                                        type="checkbox" 
                                                        checked={task.requiresFile}
                                                        onChange={(e) => handleTaskDefUpdate(sIndex, tIndex, 'requiresFile', e.target.checked)}
                                                   />
                                                   Req. Archivo
                                               </label>
                                           </div>
                                           <button 
                                                onClick={() => {
                                                    const newStages = [...stagesBuffer];
                                                    newStages[sIndex].tasks.splice(tIndex, 1);
                                                    setStagesBuffer(newStages);
                                                }}
                                                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                           >
                                               <Trash2 size={12} /> Eliminar
                                           </button>
                                       </div>
                                   ))}
                                   <button onClick={() => handleAddTask(sIndex)} className="w-full py-2 border border-dashed border-slate-300 rounded text-slate-400 hover:text-indigo-500 hover:border-indigo-300 text-xs flex items-center justify-center gap-1 transition">
                                       <Plus size={14} /> Añadir Tarea
                                   </button>
                               </div>
                          </div>
                      ))}
                      <button onClick={handleAddStage} className="min-h-[200px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-slate-50 transition">
                          <Plus size={24} className="mb-2" />
                          <span>Añadir Etapa</span>
                      </button>
                  </div>
              </div>
          )}

          {/* HISTORY VIEW */}
          {activeTab === 'history' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="space-y-3">
                     {history.map(h => (
                         <div key={h.id} onClick={() => setSelectedHistoryCycle(h)} className={`p-4 border rounded-lg cursor-pointer ${selectedHistoryCycle?.id === h.id ? 'bg-indigo-50 border-indigo-500' : 'bg-white hover:bg-slate-50'}`}>
                             <div className="flex justify-between">
                                 <span className="font-bold text-sm text-slate-800">{h.period}</span>
                                 <span className="text-xs text-emerald-600 bg-emerald-50 px-2 rounded-full border border-emerald-100">Cerrado</span>
                             </div>
                             <p className="text-xs text-slate-500 mt-1">Inicio: {new Date(h.startDate).toLocaleDateString()}</p>
                         </div>
                     ))}
                 </div>
                 <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
                     {selectedHistoryCycle ? (
                         <div>
                             <h3 className="font-bold text-lg mb-4">Detalle de Auditoría: {selectedHistoryCycle.period}</h3>
                             <div className="space-y-6">
                                 {selectedHistoryCycle.stages.map(stage => (
                                     <div key={stage.id}>
                                         <h4 className="font-medium text-indigo-900 mb-2 text-sm border-b border-indigo-100 pb-1">{stage.name}</h4>
                                         <ul className="space-y-2">
                                             {stage.tasks.map(task => (
                                                 <li key={task.id} className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-2 rounded">
                                                     <span className="flex items-center gap-2"><CheckSquare size={14} className="text-emerald-500"/> {task.title}</span>
                                                     <div className="text-xs text-right">
                                                         {task.completedBy && <p>Por: Usuario {task.completedBy}</p>}
                                                         {task.evidenceFile && <p className="text-indigo-500 flex items-center justify-end gap-1"><FileText size={10}/> {task.evidenceFile.name}</p>}
                                                     </div>
                                                 </li>
                                             ))}
                                         </ul>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ) : (
                         <div className="h-full flex items-center justify-center text-slate-400">Selecciona un ciclo</div>
                     )}
                 </div>
             </div>
          )}
      </div>
    </div>
  );
};
