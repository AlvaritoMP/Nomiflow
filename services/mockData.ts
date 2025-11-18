
import { Company, PayrollCycle, Status, Ticket, TicketType, Priority, User, UserRole, AuditLogEntry } from "../types";

export const MOCK_COMPANIES: Company[] = [
  { id: 'c1', name: 'Corporación Tech Solutions SAC', taxId: '20100100101' },
  { id: 'c2', name: 'Logística y Transportes Rapid', taxId: '20550550551' },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Ana Martínez', role: UserRole.PAYROLL_MANAGER, avatar: 'https://picsum.photos/id/1011/100/100' },
  { id: 'u2', name: 'Carlos Ruíz', role: UserRole.OPERATIONS, avatar: 'https://picsum.photos/id/1012/100/100' },
  { id: 'u3', name: 'Elena Gómez', role: UserRole.ACCOUNTING, avatar: 'https://picsum.photos/id/1027/100/100' },
  { id: 'u4', name: 'Admin Sistema', role: UserRole.ADMIN, avatar: 'https://picsum.photos/id/1005/100/100' },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 't1',
    title: 'Alta nuevo ingeniero de software',
    description: 'Por favor procesar el ingreso de Juan Perez para el 15 de Octubre. Salario 5000. Se adjunta DNI y CV.',
    type: TicketType.NEW_HIRE,
    status: Status.PENDING,
    priority: Priority.HIGH,
    companyId: 'c1',
    createdBy: 'u2',
    assignedTo: 'u1',
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000),
    attachments: [{ id: 'a1', name: 'DNI_Juan.pdf', url: '#', type: 'pdf', size: '1.2MB' }],
    comments: [
      { id: 'cm1', userId: 'u2', text: 'Documentos cargados.', timestamp: new Date(Date.now() - 86400000 * 2) },
      { id: 'cm2', userId: 'u1', text: 'Recibido, validando en T-Registro.', timestamp: new Date(Date.now() - 86400000) }
    ]
  },
  {
    id: 't2',
    title: 'Error en horas extras Planta 2',
    description: 'El tareo enviado ayer tenía un error en la celda F45. Las horas de Luis son 12, no 21.',
    type: TicketType.INCIDENT,
    status: Status.IN_PROGRESS,
    priority: Priority.CRITICAL,
    companyId: 'c2',
    createdBy: 'u2',
    assignedTo: 'u1',
    createdAt: new Date(Date.now() - 3600000 * 4),
    updatedAt: new Date(Date.now()),
    attachments: [],
    comments: []
  },
    {
    id: 't3',
    title: 'Solicitud Adelanto Quincena',
    description: 'Lista de personal que solicita adelanto para el día 15.',
    type: TicketType.ADVANCE_PAYMENT,
    status: Status.COMPLETED,
    priority: Priority.MEDIUM,
    companyId: 'c1',
    createdBy: 'u2',
    assignedTo: 'u1',
    createdAt: new Date(Date.now() - 86400000 * 5),
    updatedAt: new Date(Date.now() - 86400000 * 3),
    attachments: [{ id: 'a2', name: 'Lista_Adelantos.xlsx', url: '#', type: 'xlsx', size: '45KB' }],
    comments: []
  }
];

export const generatePayrollCycle = (companyId: string): PayrollCycle => ({
  id: `cycle-${companyId}-${Date.now()}`,
  companyId,
  period: 'Octubre 2023',
  currentStageId: 'st2', // Processing
  startDate: new Date(),
  status: Status.IN_PROGRESS,
  stages: [
    {
      id: 'st1',
      name: 'Recepción de Novedades',
      status: Status.COMPLETED,
      tasks: [
        { 
            id: 'tk1', 
            title: 'Cargar Tareo Operaciones', 
            completed: true, 
            assignedRole: UserRole.OPERATIONS,
            requiresFile: true,
            evidenceFile: { id: 'f1', name: 'Tareo_Oct_Sem1.xlsx', size: '2MB', type: 'xlsx', url: '#', uploadedAt: new Date(), uploadedBy: 'u2' },
            dueDate: new Date() 
        },
        { 
            id: 'tk2', 
            title: 'Validar Asistencias', 
            completed: true,
            assignedRole: UserRole.PAYROLL_MANAGER,
            requiresFile: false
        },
      ]
    },
    {
      id: 'st2',
      name: 'Procesamiento y Cálculo',
      status: Status.IN_PROGRESS,
      tasks: [
        { 
            id: 'tk4', 
            title: 'Ingreso de variables al Sistema', 
            completed: true,
            assignedRole: UserRole.PAYROLL_MANAGER,
            requiresFile: false
        },
        { 
            id: 'tk5', 
            title: 'Cálculo preliminar', 
            completed: false,
            assignedRole: UserRole.PAYROLL_MANAGER,
            requiresFile: true 
        },
      ]
    },
    {
      id: 'st3',
      name: 'Archivos de Pago',
      status: Status.PENDING,
      tasks: [
        { id: 'tk7', title: 'Generar TXT Bancos', completed: false, assignedRole: UserRole.PAYROLL_MANAGER, requiresFile: true },
        { id: 'tk9', title: 'Envío a Tesorería', completed: false, assignedRole: UserRole.PAYROLL_MANAGER, requiresFile: false },
      ]
    },
    {
      id: 'st6',
      name: 'Contabilidad',
      status: Status.PENDING,
      tasks: [
        { id: 'tk14', title: 'Generar Asiento de Nómina', completed: false, assignedRole: UserRole.ACCOUNTING, requiresFile: true },
        { id: 'tk16', title: 'Carga en ERP Contable', completed: false, assignedRole: UserRole.ACCOUNTING, requiresFile: false },
      ]
    }
  ]
});

export const getMockHistory = (companyId: string): PayrollCycle[] => {
    return [
        {
            id: 'hist-1',
            companyId,
            period: 'Septiembre 2023',
            currentStageId: 'st6',
            startDate: new Date('2023-09-01'),
            status: Status.COMPLETED,
            stages: []
        }
    ];
};

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
    {
        id: 'log-1',
        timestamp: new Date(Date.now() - 100000),
        userId: 'u2',
        userName: 'Carlos Ruíz',
        userRole: UserRole.OPERATIONS,
        action: 'FILE_UPLOADED',
        details: 'Subió el archivo "Tareo_Oct_Sem1.xlsx" para la tarea "Cargar Tareo Operaciones"',
        relatedEntityId: 'tk1'
    },
    {
        id: 'log-2',
        timestamp: new Date(Date.now() - 90000),
        userId: 'u2',
        userName: 'Carlos Ruíz',
        userRole: UserRole.OPERATIONS,
        action: 'TASK_COMPLETED',
        details: 'Completó la tarea "Cargar Tareo Operaciones"',
        relatedEntityId: 'tk1'
    }
];
