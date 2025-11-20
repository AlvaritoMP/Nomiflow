
export enum Status {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TicketType {
  INCIDENT = 'Incidencia',
  NEW_HIRE = 'Alta',
  TERMINATION = 'Baja',
  SICK_LEAVE = 'Descanso Médico',
  OVERTIME = 'Horas Extras',
  ADVANCE_PAYMENT = 'Adelanto Sueldo'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PAYROLL_MANAGER = 'PAYROLL_MANAGER',
  OPERATIONS = 'OPERATIONS',
  ACCOUNTING = 'ACCOUNTING'
}

export enum RequirementType {
  CHECKBOX = 'CHECKBOX',
  FILE_UPLOAD = 'FILE_UPLOAD'
}

export interface ResolutionRequirement {
  id: string;
  text: string;
  type: RequirementType;
  required: boolean;
}

export interface TicketTemplate {
  ticketType: TicketType;
  requirements: ResolutionRequirement[];
}

export interface ResolutionEvidence {
  requirementId: string;
  requirementText: string;
  isChecked?: boolean;
  file?: Attachment;
  resolvedAt: Date;
  resolvedBy: string;
}

export interface Company {
  id: string;
  name: string;
  taxId: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploadedBy?: string;
  uploadedAt?: Date;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: TicketType;
  status: Status;
  priority: Priority;
  companyId: string;
  createdBy: string; // User ID
  assignedTo: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
  comments: Comment[];
  aiAnalysis?: string;
  resolutionEvidence?: ResolutionEvidence[]; // New field for stored resolution data
}

export interface PayrollTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedBy?: string; // User ID
  completedAt?: Date;
  assignedRole?: UserRole; // El rol que puede ejecutar esto
  requiresFile: boolean; // Si requiere sustento
  evidenceFile?: Attachment; // El archivo de sustento
  dueDate?: Date;
}

export interface PayrollStage {
  id: string;
  name: string;
  status: Status;
  tasks: PayrollTask[];
}

export interface PayrollCycle {
  id: string;
  companyId: string;
  period: string; 
  currentStageId: string;
  stages: PayrollStage[];
  startDate: Date;
  status: Status;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: string; // 'TASK_COMPLETED', 'FILE_UPLOADED', 'WORKFLOW_UPDATED', etc.
  details: string;
  relatedEntityId?: string; // ID de tarea o ciclo
}
