
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PayrollProcess } from './components/PayrollProcess';
import { TicketSystem } from './components/TicketSystem';
import { AdminPanel } from './components/AdminPanel';
import { AuditLog } from './components/AuditLog';
import { GlobalOverview } from './components/GlobalOverview';
import { FiscalCalendar } from './components/FiscalCalendar';
import { MOCK_COMPANIES, MOCK_USERS, INITIAL_TICKETS, generatePayrollCycle, getMockHistory, MOCK_AUDIT_LOGS, MOCK_TEMPLATES } from './services/mockData';
import { Ticket, Status, PayrollCycle, PayrollTask, User, AuditLogEntry, PayrollStage, UserRole, Company, TicketTemplate, ResolutionEvidence } from './types';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Company State management
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState(MOCK_COMPANIES[0].id);
  
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  
  // Templates State
  const [templates, setTemplates] = useState<TicketTemplate[]>(MOCK_TEMPLATES);

  // User Context (Simulating login switcher for demo)
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[3]); // Default to Admin for demo

  // Payroll Cycle State
  const [currentPayrollCycle, setCurrentPayrollCycle] = useState<PayrollCycle>(() => generatePayrollCycle(MOCK_COMPANIES[0].id));
  const [payrollHistory, setPayrollHistory] = useState<PayrollCycle[]>(() => getMockHistory(MOCK_COMPANIES[0].id));
  
  // Audit State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);

  // Reset cycle data when company changes
  useEffect(() => {
    // In a real app, fetch data for the selected company here
    // For mock, we regenerate purely based on ID to simulate a fresh state or switch context
    setCurrentPayrollCycle(generatePayrollCycle(selectedCompanyId));
    setPayrollHistory(getMockHistory(selectedCompanyId));
  }, [selectedCompanyId]);

  const companyTickets = tickets.filter(t => t.companyId === selectedCompanyId);
  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  // Helper to Log Audits
  const logAudit = (action: string, details: string, relatedEntityId?: string) => {
      const newLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action,
          details,
          relatedEntityId
      };
      setAuditLogs(prev => [newLog, ...prev]);
  };

  // Handlers
  const handleTicketUpdate = (updatedTicket: Ticket) => {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
  };

  const handleAddComment = (ticketId: string, text: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          updatedAt: new Date(),
          comments: [...t.comments, {
            id: `cm-${Date.now()}`,
            userId: currentUser.id,
            text,
            timestamp: new Date()
          }]
        };
      }
      return t;
    }));
  };

  const handleStatusUpdate = (ticketId: string, status: Status) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, updatedAt: new Date() } : t));
    logAudit('TICKET_STATUS_UPDATE', `Ticket ${ticketId} actualizado a ${status}`, ticketId);
  };

  const handleResolveTicket = (ticketId: string, evidence: ResolutionEvidence[]) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: Status.COMPLETED,
          updatedAt: new Date(),
          resolutionEvidence: evidence
        };
      }
      return t;
    }));
    logAudit('TICKET_RESOLVED', `Ticket ${ticketId} resuelto con sustento`, ticketId);
  };

  const handleCreateTicket = (newTicketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments' | 'status' | 'assignedTo'>) => {
    const newTicket: Ticket = {
        id: `t-${Date.now()}`,
        ...newTicketData,
        companyId: newTicketData.companyId || selectedCompanyId,
        status: Status.PENDING,
        assignedTo: MOCK_USERS[0].id, // Default Payroll Manager
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: [],
        comments: []
    };
    setTickets(prev => [newTicket, ...prev]);
    logAudit('TICKET_CREATED', `Nuevo ticket creado: ${newTicket.title}`, newTicket.id);
  };

  // Updated Payroll Logic
  const handleUpdateTask = (stageId: string, taskId: string, updates: Partial<PayrollTask>, actionType: string) => {
    setCurrentPayrollCycle(prev => {
      const newStages = prev.stages.map(stage => {
        if (stage.id === stageId) {
          const newTasks = stage.tasks.map(task => {
            if (task.id === taskId) return { ...task, ...updates };
            return task;
          });
          
          const allComplete = newTasks.every(t => t.completed);
          const someComplete = newTasks.some(t => t.completed);
          const newStatus = allComplete ? Status.COMPLETED : someComplete ? Status.IN_PROGRESS : Status.PENDING;

          return { ...stage, tasks: newTasks, status: newStatus };
        }
        return stage;
      });
      return { ...prev, stages: newStages };
    });

    // Find task title for log
    const taskTitle = currentPayrollCycle.stages.find(s => s.id === stageId)?.tasks.find(t => t.id === taskId)?.title || 'Tarea desconocida';
    
    let detailText = '';
    if (actionType === 'TASK_COMPLETED') detailText = `Completó la tarea "${taskTitle}"`;
    if (actionType === 'FILE_UPLOADED') detailText = `Adjuntó archivo a tarea "${taskTitle}"`;
    
    logAudit(actionType, detailText, taskId);
  };

  const handleUpdateWorkflow = (updatedStages: PayrollStage[], logAction: string) => {
      setCurrentPayrollCycle(prev => ({...prev, stages: updatedStages}));
      logAudit(logAction, 'Se modificó la estructura del flujo de nómina', currentPayrollCycle.id);
  };

  const handleCloseCycle = () => {
    const completedCycle = { ...currentPayrollCycle, status: Status.COMPLETED };
    setPayrollHistory(prev => [completedCycle, ...prev]);
    
    const nextCycle = generatePayrollCycle(selectedCompanyId);
    nextCycle.period = 'Noviembre 2023'; 
    setCurrentPayrollCycle(nextCycle);
    
    logAudit('CYCLE_CLOSED', `Cierre de nómina del periodo ${currentPayrollCycle.period}`, currentPayrollCycle.id);
    alert("Ciclo cerrado. Se ha generado el periodo Noviembre 2023.");
  };

  const handleAddCompany = (name: string, taxId: string) => {
    const newCompany: Company = {
      id: `c-${Date.now()}`,
      name,
      taxId
    };
    setCompanies(prev => [...prev, newCompany]);
    logAudit('COMPANY_CREATED', `Se registró nueva razón social: ${name}`, newCompany.id);
  };

  const handleGlobalSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setActiveTab('dashboard');
  };

  const handleUpdateTemplates = (newTemplates: TicketTemplate[]) => {
      setTemplates(newTemplates);
      logAudit('TEMPLATES_UPDATED', 'Se actualizaron las plantillas de resolución de tickets');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          currentUser={currentUser}
          companies={companies} // Pass dynamic companies
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={setSelectedCompanyId}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Demo Role Switcher for Testing Collaboration */}
        <div className="bg-slate-800 text-white px-4 py-1 text-xs flex justify-center items-center gap-2">
            <span className="opacity-70">Modo Demo - Simular Rol:</span>
            {MOCK_USERS.map(u => (
                <button 
                    key={u.id}
                    onClick={() => setCurrentUser(u)}
                    className={`px-2 py-0.5 rounded ${currentUser.id === u.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                    {u.role}
                </button>
            ))}
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'dashboard' && (
            <Dashboard tickets={companyTickets} currentCycle={currentPayrollCycle} />
          )}
          {activeTab === 'global' && (
            <GlobalOverview 
              companies={companies} 
              tickets={tickets} 
              onSelectCompany={handleGlobalSelectCompany}
            />
          )}
          {activeTab === 'process' && (
            <PayrollProcess 
              cycle={currentPayrollCycle} 
              history={payrollHistory}
              currentUser={currentUser}
              onUpdateTask={handleUpdateTask}
              onUpdateWorkflow={handleUpdateWorkflow}
              onCloseCycle={handleCloseCycle}
            />
          )}
          {activeTab === 'tickets' && (
            <TicketSystem 
              tickets={companyTickets}
              templates={templates}
              currentUser={currentUser}
              onAddComment={handleAddComment}
              onUpdateStatus={handleStatusUpdate}
              onResolveTicket={handleResolveTicket}
              onTicketUpdate={handleTicketUpdate}
              onCreateTicket={handleCreateTicket}
            />
          )}
          {activeTab === 'calendar' && (
            <FiscalCalendar company={selectedCompany} />
          )}
          {activeTab === 'admin' && (
            <AdminPanel 
              users={MOCK_USERS}
              companies={companies} 
              templates={templates}
              onAddCompany={handleAddCompany}
              onUpdateTemplates={handleUpdateTemplates}
            />
          )}
          {activeTab === 'audit' && (
            <AuditLog logs={auditLogs} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
