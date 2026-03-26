import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { IHRRepository } from "./hr.repository.interface";
import { Employee } from "../entities/employee.entity";
import { Candidate } from "../entities/candidate.entity";
import { Position } from "../entities/position.entity";
import { Compensation } from "../entities/compensation.entity";
import { Department } from "../entities/department.entity";
import { JobRequisition } from "../entities/requisition.entity";
import { Attendance } from "../entities/attendance.entity";
import { LeaveRequest } from "../entities/leave-request.entity";
import { Payroll } from "../entities/payroll.entity";
import { PerformanceCycle } from "../entities/performance-cycle.entity";
import { PerformanceReview } from "../entities/performance-review.entity";
import { HRCase } from "../entities/hr-case.entity";
import { Contract } from "../entities/contract.entity";
import { Interview } from "../entities/interview.entity";
import { TalentLead } from "../entities/talent-lead.entity";
import { ComplianceDocument } from "../entities/compliance-document.entity";
import { BenefitPlan } from "../entities/benefit-plan.entity";
import { EmployeeBenefit } from "../entities/employee-benefit.entity";
import { CareerPath } from "../entities/career-path.entity";
import { MentorshipPair } from "../entities/mentorship-pair.entity";
import { PositionSkill } from "../entities/position-skill.entity";
import { PerformanceGoal } from "../entities/performance-goal.entity";
import { TrainingProgram } from "../entities/training-program.entity";
import { TrainingAssignment } from "../entities/training-assignment.entity";
import { ProgramSkill } from "../entities/program-skill.entity";
import { BudgetScenario } from "../entities/budget-scenario.entity";
import { HeadcountPlan } from "../entities/headcount-plan.entity";
import { ExchangeRate } from "../entities/exchange-rate.entity";
import { PayrollRun } from "../entities/payroll-run.entity";
import { PayrollLine } from "../entities/payroll-line.entity";
import { SuccessionPlan } from "../entities/succession-plan.entity";
import { SuccessionCandidate } from "../entities/succession-candidate.entity";
import { Skill } from "../entities/skill.entity";
import { EmployeeSkill } from "../entities/employee-skill.entity";
import { CreateEmployeeDto } from "../dto/create-employee.dto";
import { UpdateEmployeeDto } from "../dto/update-employee.dto";
import { CreateLeaveRequestDto } from "../dto/create-leave-request.dto";
import { CreateDepartmentDto } from "../dto/create-department.dto";
import { CreateRequisitionDto } from "../dto/create-requisition.dto";
import { CreatePerformanceCycleDto } from "../dto/create-performance-cycle.dto";
import { SubmitReviewDto } from "../dto/submit-review.dto";
import { CreateCaseDto } from "../dto/create-case.dto";
import { CreateContractDto } from "../dto/create-contract.dto";

@Injectable()
export class HRMockRepository extends IHRRepository {
  private employees: Employee[] = [];
  private candidates: Candidate[] = [];
  private positions: Position[] = [];
  private compensations: Compensation[] = [];
  private departments: Department[] = [];
  private interviews: Interview[] = [];
  private leads: TalentLead[] = [];
  private documents: ComplianceDocument[] = [];
  private scenarios: BudgetScenario[] = [];
  private plans: HeadcountPlan[] = [];
  private rates: ExchangeRate[] = [];
  private runs: PayrollRun[] = [];
  private lines: PayrollLine[] = [];
  private successionPlans: SuccessionPlan[] = [];
  private successionCandidates: SuccessionCandidate[] = [];
  private skills: Skill[] = [];
  private employeeSkills: EmployeeSkill[] = [];
  private benefitPlans: BenefitPlan[] = [];
  private employeeBenefits: EmployeeBenefit[] = [];
  private careerPaths: CareerPath[] = [];
  private mentorshipPairs: MentorshipPair[] = [];
  private positionSkills: PositionSkill[] = [];
  private performanceReviews: PerformanceReview[] = [];
  private performanceGoals: PerformanceGoal[] = [];
  private trainingPrograms: TrainingProgram[] = [];
  private trainingAssignments: TrainingAssignment[] = [];
  private programSkills: ProgramSkill[] = [];
  private attendance: Attendance[] = [];
  private requisitions: JobRequisition[] = [];
  private cases: HRCase[] = [];
  private contracts: Contract[] = [];
  private performanceCycles: PerformanceCycle[] = [];
  private leaveRequests: LeaveRequest[] = [];
  private payrolls: Payroll[] = [];

  // Get By ID Methods
  async getEmployeeById(tenantId: string, employeeId: string): Promise<Employee | null> {
    return this.employees.find((e) => e.id === employeeId && e.tenantId === tenantId) || null;
  }
  async getGlobalEmployeeById(employeeId: string): Promise<Employee | null> { return this.employees.find((e) => e.id === employeeId) || null; }
  async getRequisitionById(tenantId: string, id: string): Promise<JobRequisition | null> {
    return this.requisitions.find((r) => r.id === id && r.tenantId === tenantId) || null;
  }
  async getContractById(tenantId: string, id: string): Promise<Contract | null> {
    return this.contracts.find((c) => c.id === id && c.tenantId === tenantId) || null;
  }
  async getTrainingAssignmentById(tenantId: string, id: string): Promise<any | null> {
    return this.trainingAssignments.find((a) => a.id === id && a.tenantId === tenantId) || null;
  }
  async getLeaveRequestById(tenantId: string, id: string): Promise<LeaveRequest | null> {
    return this.leaveRequests.find((r) => r.id === id && r.tenantId === tenantId) || null;
  }
  async getDepartmentById(tenantId: string, departmentId: string): Promise<Department | null> {
    return this.departments.find((d) => d.id === departmentId && d.tenantId === tenantId) || null;
  }
  async getPerformanceCycleById(tenantId: string, id: string): Promise<PerformanceCycle | null> {
    return this.performanceCycles.find((c) => c.id === id && c.tenantId === tenantId) || null;
  }
  async getCaseById(tenantId: string, id: string): Promise<HRCase | null> {
    return this.cases.find((c) => c.id === id && c.tenantId === tenantId) || null;
  }
  async getCandidateById(tenantId: string, id: string): Promise<Candidate | null> {
    return this.candidates.find((c) => c.id === id && c.tenantId === tenantId) || null;
  }
  async getPositionById(tenantId: string, id: string): Promise<Position | null> {
    return this.positions.find((p) => p.id === id && p.tenantId === tenantId) || null;
  }
  async getInterviewById(tenantId: string, id: string): Promise<Interview | null> {
    return this.interviews.find((i) => i.id === id && i.tenantId === tenantId) || null;
  }
  async getTalentLeadById(tenantId: string, id: string): Promise<TalentLead | null> {
    return this.leads.find((l) => l.id === id && l.tenantId === tenantId) || null;
  }
  async getGoalById(tenantId: string, id: string): Promise<PerformanceGoal | null> {
    return this.performanceGoals.find((g) => g.id === id && g.tenantId === tenantId) || null;
  }
  async getTrainingProgramById(tenantId: string, id: string): Promise<TrainingProgram | null> {
    return this.trainingPrograms.find((p) => p.id === id && p.tenantId === tenantId) || null;
  }

  // Employee Management
  // Employee Management
  async getEmployees(tenantId: string, locationId?: string, page: number = 1, limit: number = 20): Promise<{ data: Employee[]; total: number }> {
    const filtered = this.employees.filter((e) => e.tenantId === tenantId && (!locationId || e.locationId === locationId));
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async getGlobalEmployees(locationId?: string, page: number = 1, limit: number = 20): Promise<{ data: Employee[]; total: number }> {
    const filtered = this.employees.filter((e) => !locationId || e.locationId === locationId);
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async createEmployee(tenantId: string, data: CreateEmployeeDto, tx?: Prisma.TransactionClient): Promise<Employee> {
    const employee: Employee = { 
      id: `emp-${Date.now()}`, 
      tenantId, 
      ...data, 
      fullName: `${data.firstName} ${data.lastName}`, 
      status: "active", 
      employeeCode: `EMP-${Date.now()}`,
      hireDate: new Date(),
      employmentType: "full_time",
      position: (data as any).position || "Staff",
      departmentId: data.departmentId || "DEPT-001",
      roleTitle: (data as any).roleTitle || "Staff",
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as any;
    this.employees.push(employee); return employee;
  }
  async updateEmployee(tenantId: string, employeeId: string, data: UpdateEmployeeDto, tx?: Prisma.TransactionClient): Promise<Employee> {
    const idx = this.employees.findIndex((e) => e.id === employeeId && e.tenantId === tenantId);
    if (idx === -1) throw new Error("Employee not found");
    this.employees[idx] = { ...this.employees[idx], ...data, updatedAt: new Date() } as any; return this.employees[idx];
  }
  async deactivateEmployee(tenantId: string, employeeId: string, tx?: Prisma.TransactionClient): Promise<Employee> {
    const idx = this.employees.findIndex((e) => e.id === employeeId && e.tenantId === tenantId);
    if (idx === -1) throw new Error("Employee not found");
    this.employees[idx].status = "terminated"; return this.employees[idx];
  }
  async promoteEmployee(tenantId: string, employeeId: string, data: any, tx?: Prisma.TransactionClient): Promise<Employee> {
    const idx = this.employees.findIndex((e) => e.id === employeeId && e.tenantId === tenantId);
    if (idx === -1) throw new Error("Employee not found");
    this.employees[idx] = { ...this.employees[idx], position: data.newRole, roleTitle: data.newRoleTitle || this.employees[idx].roleTitle, updatedAt: new Date() };
    return this.employees[idx];
  }
  async transferEmployee(tenantId: string, employeeId: string, data: any, tx?: Prisma.TransactionClient): Promise<Employee> {
    const idx = this.employees.findIndex((e) => e.id === employeeId && e.tenantId === tenantId);
    if (idx === -1) throw new Error("Employee not found");
    this.employees[idx] = { ...this.employees[idx], departmentId: data.targetDepartment || this.employees[idx].departmentId, locationId: data.targetLocation || this.employees[idx].locationId, updatedAt: new Date() };
    return this.employees[idx];
  }
  async suspendEmployee(tenantId: string, employeeId: string, reason: string, tx?: Prisma.TransactionClient): Promise<Employee> {
    const idx = this.employees.findIndex((e) => e.id === employeeId && e.tenantId === tenantId);
    if (idx === -1) throw new Error("Employee not found");
    this.employees[idx].status = "suspended"; return this.employees[idx];
  }

  // Attendance & Shifts
  // Attendance & Shifts
  async getAttendance(tenantId: string, locationId?: string, employeeId?: string, startDate?: string, endDate?: string, page: number = 1, limit: number = 50): Promise<{ data: Attendance[]; total: number }> {
    const filtered = this.attendance.filter((a) => a.tenantId === tenantId && (!locationId || a.locationId === locationId) && (!employeeId || a.employeeId === employeeId));
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async getGlobalAttendance(employeeId?: string, startDate?: string, endDate?: string, page: number = 1, limit: number = 50): Promise<{ data: Attendance[]; total: number }> {
    const filtered = this.attendance.filter((a) => !employeeId || a.employeeId === employeeId);
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async clockIn(tenantId: string, employeeId: string, locationId: string, shiftId?: string, method?: string, metadata?: any, tx?: Prisma.TransactionClient): Promise<Attendance> {
    const a: Attendance = { id: `att-${Date.now()}`, tenantId, employeeId, locationId, clockIn: new Date(), status: "present", date: new Date(), createdAt: new Date(), updatedAt: new Date() } as any;
    this.attendance.push(a); return a;
  }
  async clockOut(tenantId: string, employeeId: string, tx?: Prisma.TransactionClient): Promise<Attendance> {
    const att = this.attendance.find((a) => a.employeeId === employeeId && a.tenantId === tenantId && !a.clockOut);
    if (!att) throw new Error("No active clock-in found"); att.clockOut = new Date(); return att;
  }
  async assignShift(tenantId: string, employeeId: string, shiftId: string, locationId: string, date: string, tx?: Prisma.TransactionClient): Promise<void> { return; }

  // Global Scheduling
  async getWorkSchedules(tenantId: string, locationId?: string, status?: string): Promise<any[]> { return []; }
  async createWorkSchedule(tenantId: string, data: any, tx?: Prisma.TransactionClient): Promise<any> { return { id: `sch-${Date.now()}`, ...data }; }
  async updateWorkSchedule(tenantId: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<any> { return { id, ...data }; }
  async getWorkShifts(tenantId: string, scheduleId?: string, employeeId?: string): Promise<any[]> { return []; }
  async createWorkShift(tenantId: string, data: any, tx?: Prisma.TransactionClient): Promise<any> { return { id: `shf-${Date.now()}`, ...data }; }
  async updateWorkShift(tenantId: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<any> { return { id, ...data }; }
  async approveWorkSchedule(tenantId: string, id: string, approvedBy: string, tx?: Prisma.TransactionClient): Promise<any> { return { id, status: "APPROVED" }; }

  // Leave Management
  async getLeaveRequests(tenantId: string, locationId?: string, status?: string, employeeId?: string): Promise<LeaveRequest[]> { return this.leaveRequests.filter((r) => r.tenantId === tenantId && (!status || r.status === status) && (!employeeId || r.employeeId === employeeId)); }
  async getGlobalLeaveRequests(status?: string, employeeId?: string): Promise<LeaveRequest[]> { return this.leaveRequests.filter((r) => (!status || r.status === status) && (!employeeId || r.employeeId === employeeId)); }
  async createLeaveRequest(tenantId: string, data: CreateLeaveRequestDto, tx?: Prisma.TransactionClient): Promise<LeaveRequest> {
    const r: LeaveRequest = { id: `lv-${Date.now()}`, tenantId, ...data, status: "pending", requestedAt: new Date(), startDate: new Date(data.startDate), endDate: new Date(data.endDate), createdAt: new Date(), updatedAt: new Date() } as any;
    this.leaveRequests.push(r); return r;
  }
  async approveLeaveRequest(tenantId: string, id: string, revId: string, n?: string, tx?: Prisma.TransactionClient): Promise<LeaveRequest> {
    const r = this.leaveRequests.find((r) => r.id === id && r.tenantId === tenantId);
    if (!r) throw new Error("Not found"); r.status = "approved"; (r as any).reviewedBy = revId; r.reviewedAt = new Date(); r.updatedAt = new Date(); return r;
  }
  async rejectLeaveRequest(tenantId: string, id: string, revId: string, n: string, tx?: Prisma.TransactionClient): Promise<LeaveRequest> {
    const r = this.leaveRequests.find((r) => r.id === id && r.tenantId === tenantId);
    if (!r) throw new Error("Not found"); r.status = "rejected"; (r as any).reviewedBy = revId; r.reviewedAt = new Date(); r.updatedAt = new Date(); return r;
  }

  // Payroll Management
  async getPayroll(t: string, l?: string, e?: string, p?: string): Promise<Payroll[]> { return this.payrolls.filter((pa) => pa.tenantId === t && (!e || pa.employeeId === e) && (!p || pa.period === p)); }
  async getGlobalPayroll(e: string, p?: string): Promise<Payroll[]> { return this.payrolls.filter((pa) => pa.employeeId === e && (!p || pa.period === p)); }
  async calculatePayroll(tenantId: string, employeeId: string, period: string, tx?: Prisma.TransactionClient): Promise<Payroll> {
    const pa: Payroll = { id: `pay-${Date.now()}`, tenantId, employeeId, period, grossPay: 5000, netPay: 4000, status: "draft", baseSalary: 5000, createdAt: new Date(), updatedAt: new Date() } as any;
    this.payrolls.push(pa); return pa;
  }
  async getPayrollRuns(tenantId: string): Promise<PayrollRun[]> { return this.runs.filter(r => r.tenantId === tenantId); }
  async getPayrollLines(tenantId: string, runId: string): Promise<PayrollLine[]> { return this.lines.filter(l => l.payrollRunId === runId); }

  // Organization Management
  async getLocations(tenantId: string): Promise<any[]> { return []; }
  async getDepartments(tenantId: string): Promise<Department[]> { return this.departments.filter((d) => d.tenantId === tenantId); }
  async getGlobalDepartments(): Promise<Department[]> { return this.departments; }
  async createDepartment(tenantId: string, data: CreateDepartmentDto, tx?: Prisma.TransactionClient): Promise<Department> {
    const d: Department = { id: `dept-${Date.now()}`, tenantId, ...data, status: "active", createdAt: new Date(), updatedAt: new Date() };
    this.departments.push(d); return d;
  }

  // Recruitment & Talent
  async getRequisitions(t: string, s?: string): Promise<JobRequisition[]> { return this.requisitions.filter((r) => r.tenantId === t && (!s || r.status === s)); }
  async getGlobalRequisitions(s?: string): Promise<JobRequisition[]> { return this.requisitions.filter((r) => (!s || r.status === s)); }
  async createRequisition(t: string, data: CreateRequisitionDto, tx?: Prisma.TransactionClient): Promise<JobRequisition> {
    const r: JobRequisition = { id: `req-${Date.now()}`, tenantId: t, ...data, status: "open", createdAt: new Date(), updatedAt: new Date() };
    this.requisitions.push(r); return r;
  }
  async updateRequisition(t: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<JobRequisition> {
    const idx = this.requisitions.findIndex((r) => r.id === id && r.tenantId === t);
    if (idx === -1) throw new Error("Not found");
    this.requisitions[idx] = { ...this.requisitions[idx], ...data, updatedAt: new Date() }; return this.requisitions[idx];
  }
  async getCandidates(t: string, s?: string): Promise<Candidate[]> { return this.candidates.filter((c) => c.tenantId === t && (!s || c.status === s)); }
  async createCandidate(tenantId: string, data: any, tx?: Prisma.TransactionClient): Promise<Candidate> {
    const c: Candidate = { id: `cand-${Date.now()}`, tenantId, ...data, status: "applied", createdAt: new Date(), updatedAt: new Date() };
    this.candidates.push(c); return c;
  }
  async updateCandidate(tenantId: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<Candidate> {
    const idx = this.candidates.findIndex((c) => c.id === id && c.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.candidates[idx] = { ...this.candidates[idx], ...data, updatedAt: new Date() }; return this.candidates[idx];
  }
  async hireCandidate(tenantId: string, candidateId: string, data: any, tx?: Prisma.TransactionClient): Promise<Employee> {
    const c = this.candidates.find((c) => c.id === candidateId && c.tenantId === tenantId);
    if (!c) throw new Error("Not found");
    return this.createEmployee(tenantId, { firstName: c.firstName, lastName: c.lastName, email: c.email, role: "employee", departmentId: "new" } as any, tx);
  }
  async getTalentLeads(t: string, s?: string): Promise<TalentLead[]> { return this.leads.filter((l) => l.tenantId === t && (!s || l.status === s)); }
  async createTalentLead(t: string, data: any): Promise<TalentLead> {
    const l: TalentLead = { id: `lead-${Date.now()}`, tenantId: t, ...data, status: "new", createdAt: new Date(), updatedAt: new Date() };
    this.leads.push(l); return l;
  }
  async updateTalentLead(t: string, id: string, data: any): Promise<TalentLead> {
    const idx = this.leads.findIndex((l) => l.id === id && l.tenantId === t);
    if (idx === -1) throw new Error("Not found");
    this.leads[idx] = { ...this.leads[idx], ...data, updatedAt: new Date() }; return this.leads[idx];
  }
  async getInterviews(t: string, cid?: string): Promise<Interview[]> { return this.interviews.filter((i) => i.tenantId === t && (!cid || i.candidateId === cid)); }
  async scheduleInterview(t: string, data: any, tx?: Prisma.TransactionClient): Promise<Interview> {
    const i: Interview = { id: `int-${Date.now()}`, tenantId: t, ...data, status: "scheduled", createdAt: new Date(), updatedAt: new Date() };
    this.interviews.push(i); return i;
  }
  async updateInterviewStatus(t: string, id: string, s: string, tx?: Prisma.TransactionClient): Promise<Interview> {
    const i = this.interviews.find((i) => i.id === id && i.tenantId === t);
    if (!i) throw new Error("Not found"); i.status = s as any; return i;
  }

  // Headcount & Compensation
  async getPositions(t: string, d?: string): Promise<Position[]> { return this.positions.filter((p) => p.tenantId === t && (!d || p.departmentId === d)); }
  async createPosition(t: string, data: any, tx?: Prisma.TransactionClient): Promise<Position> {
    const p: Position = { id: `pos-${Date.now()}`, tenantId: t, ...data, status: "open", createdAt: new Date(), updatedAt: new Date() };
    this.positions.push(p); return p;
  }
  async updatePosition(t: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<Position> {
    const idx = this.positions.findIndex((p) => p.id === id && p.tenantId === t);
    if (idx === -1) throw new Error("Not found");
    this.positions[idx] = { ...this.positions[idx], ...data, updatedAt: new Date() }; return this.positions[idx];
  }
  async getCompensation(t: string, eid: string): Promise<Compensation | null> { return this.compensations.find((c) => c.employeeId === eid && c.tenantId === t) || null; }
  async updateCompensation(t: string, eid: string, data: any, tx?: Prisma.TransactionClient): Promise<Compensation> {
    const idx = this.compensations.findIndex((c) => c.employeeId === eid && c.tenantId === t);
    if (idx !== -1) { this.compensations[idx] = { ...this.compensations[idx], ...data, updatedAt: new Date() }; return this.compensations[idx]; }
    const c: Compensation = { id: `comp-${Date.now()}`, tenantId: t, employeeId: eid, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.compensations.push(c); return c;
  }

  // Performance Management
  async getPerformanceCycles(t: string): Promise<PerformanceCycle[]> { return this.performanceCycles.filter((c) => c.tenantId === t); }
  async createPerformanceCycle(tenantId: string, data: CreatePerformanceCycleDto): Promise<PerformanceCycle> {
    const c: PerformanceCycle = { id: `pc-${Date.now()}`, tenantId, ...data, status: "active", createdAt: new Date(), updatedAt: new Date(), startDate: new Date(data.startDate), endDate: new Date(data.endDate), dueDate: new Date(data.dueDate) } as any;
    this.performanceCycles.push(c); return c;
  }
  async updatePerformanceCycle(tenantId: string, id: string, data: any): Promise<PerformanceCycle> {
    const idx = this.performanceCycles.findIndex((c) => c.id === id && c.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.performanceCycles[idx] = { ...this.performanceCycles[idx], ...data, updatedAt: new Date() }; return this.performanceCycles[idx];
  }
  async getPerformanceReviews(t: string, cid?: string, eid?: string): Promise<PerformanceReview[]> { return this.performanceReviews.filter((r) => r.tenantId === t && (!cid || r.cycleId === cid) && (!eid || r.employeeId === eid)); }
  async getGlobalPerformanceReviews(cid?: string, eid?: string): Promise<PerformanceReview[]> { return this.performanceReviews.filter((r) => (!cid || r.cycleId === cid) && (!eid || r.employeeId === eid)); }
  async submitPerformanceReview(tenantId: string, data: SubmitReviewDto, tx?: Prisma.TransactionClient): Promise<PerformanceReview> {
    const r: PerformanceReview = { id: `pr-${Date.now()}`, tenantId, ...data, status: "submitted", submittedAt: new Date(), createdAt: new Date(), updatedAt: new Date() } as any;
    this.performanceReviews.push(r); return r;
  }
  async getEmployeePerformanceHistory(t: string, eid: string): Promise<PerformanceReview[]> { return this.performanceReviews.filter((r) => r.employeeId === eid && r.tenantId === t); }
  async getEmployeeGoals(t: string, eid: string): Promise<PerformanceGoal[]> { return this.performanceGoals.filter((g) => g.employeeId === eid && g.tenantId === t); }
  async updatePerformanceGoal(tenantId: string, data: any): Promise<PerformanceGoal> {
    const idx = this.performanceGoals.findIndex((g) => g.id === data.id && g.tenantId === tenantId);
    if (idx !== -1) { this.performanceGoals[idx] = { ...this.performanceGoals[idx], ...data, updatedAt: new Date() }; return this.performanceGoals[idx]; }
    const g: PerformanceGoal = { id: `goal-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() } as any;
    this.performanceGoals.push(g); return g;
  }
  async updatePerformanceGoalStatus(tenantId: string, id: string, status: string): Promise<PerformanceGoal> {
    const goal = this.performanceGoals.find(g => g.id === id && g.tenantId === tenantId);
    if (!goal) throw new Error("Goal not found"); goal.status = status as any; goal.updatedAt = new Date(); return goal;
  }

  // Case Management
  async getCases(t: string, lid?: string, s?: string, eid?: string): Promise<HRCase[]> { return this.cases.filter((c) => c.tenantId === t && (!s || c.status === s) && (!eid || c.employeeId === eid)); }
  async createCase(tenantId: string, data: CreateCaseDto, tx?: Prisma.TransactionClient): Promise<HRCase> {
    const c: HRCase = { id: `case-${Date.now()}`, tenantId, ...data, status: "open", priority: data.priority || "medium", createdAt: new Date(), updatedAt: new Date() } as any;
    this.cases.push(c); return c;
  }
  async updateCase(tenantId: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<HRCase> {
    const idx = this.cases.findIndex((c) => c.id === id && c.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.cases[idx] = { ...this.cases[idx], ...data, updatedAt: new Date() }; return this.cases[idx];
  }

  // Contract Management
  async getContracts(t: string, lid?: string, eid?: string): Promise<Contract[]> { return this.contracts.filter((c) => c.tenantId === t && (!eid || c.employeeId === eid)); }
  async getGlobalContracts(eid?: string): Promise<Contract[]> { return this.contracts.filter((c) => !eid || c.employeeId === eid); }
  async createContract(tenantId: string, data: CreateContractDto): Promise<Contract> {
    const c: Contract = { id: `ctr-${Date.now()}`, tenantId, ...data, status: "active", startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : undefined, createdAt: new Date(), updatedAt: new Date() } as any;
    this.contracts.push(c); return c;
  }
  async updateContract(tenantId: string, id: string, data: any): Promise<Contract> {
    const idx = this.contracts.findIndex((c) => c.id === id && c.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.contracts[idx] = { ...this.contracts[idx], ...data, updatedAt: new Date() }; return this.contracts[idx];
  }

  // Skills & Training
  async getSkills(tenantId: string, category?: string): Promise<Skill[]> { return this.skills.filter((s) => s.tenantId === tenantId && (!category || (s as any).category === category)); }
  async createSkill(tenantId: string, data: any): Promise<Skill> {
    const sk: Skill = { id: `sk-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.skills.push(sk); return sk;
  }
  async getEmployeeSkills(tenantId: string, empId: string): Promise<EmployeeSkill[]> { return this.employeeSkills.filter((s) => s.employeeId === empId && s.tenantId === tenantId); }
  async addEmployeeSkill(tenantId: string, data: any): Promise<EmployeeSkill> {
    const es: EmployeeSkill = { id: `es-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.employeeSkills.push(es); return es;
  }
  async updateEmployeeSkill(t: string, data: any): Promise<EmployeeSkill> {
    const idx = this.employeeSkills.findIndex((es) => es.employeeId === data.employeeId && es.skillId === data.skillId && es.tenantId === t);
    if (idx !== -1) { this.employeeSkills[idx] = { ...this.employeeSkills[idx], ...data, updatedAt: new Date() }; return this.employeeSkills[idx]; }
    return this.addEmployeeSkill(t, data);
  }
  async findTalentBySkills(t: string, ids: string[], limit: number = 20): Promise<any[]> { return []; }
  async findReplacementCandidates(tenantId: string, positionId: string): Promise<any[]> { return []; }
  async getPositionSkills(tenantId: string, positionId: string): Promise<PositionSkill[]> { return this.positionSkills.filter(ps => ps.positionId === positionId); }
  async updatePositionSkill(tenantId: string, data: any): Promise<PositionSkill> {
    const ps: PositionSkill = { id: `ps-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.positionSkills.push(ps); return ps;
  }
  async getTrainingProgramsBySkills(tenantId: string, skillIds: string[]): Promise<TrainingProgram[]> { return []; }
  async getEmployeeTrainingHistory(t: string, id: string): Promise<TrainingAssignment[]> { return this.trainingAssignments.filter((a) => a.employeeId === id && a.tenantId === t); }
  async enrollInTrainingProgram(t: string, eid: string, pid: string): Promise<TrainingAssignment> {
    const a: TrainingAssignment = { id: `ta-${Date.now()}`, tenantId: t, employeeId: eid, programId: pid, status: "enrolled", assignedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
    this.trainingAssignments.push(a); return a;
  }
  async getTrainingPrograms(tenantId: string): Promise<any[]> { return this.trainingPrograms.filter(p => p.tenantId === tenantId); }
  async createTrainingProgram(tenantId: string, data: any): Promise<any> {
    const p: TrainingProgram = { id: `tp-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.trainingPrograms.push(p); return p;
  }
  async getTrainingAssignments(tenantId: string): Promise<any[]> { return this.trainingAssignments.filter(a => a.tenantId === tenantId); }
  async createTrainingAssignment(tenantId: string, data: any): Promise<any> {
    const a: TrainingAssignment = { id: `ta-${Date.now()}`, tenantId, ...data, status: "assigned", assignedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
    this.trainingAssignments.push(a); return a;
  }
  async updateTrainingAssignment(tenantId: string, id: string, data: any): Promise<any> {
    const idx = this.trainingAssignments.findIndex((a) => a.id === id && a.tenantId === tenantId);
    if (idx === -1) throw new Error("Assignment not found");
    this.trainingAssignments[idx] = { ...this.trainingAssignments[idx], ...data, updatedAt: new Date() };
    return this.trainingAssignments[idx];
  }

  // Benefits & Career
  async getBenefitPlans(tenantId: string): Promise<BenefitPlan[]> { return this.benefitPlans.filter((p) => p.tenantId === tenantId); }
  async createBenefitPlan(tenantId: string, data: any): Promise<BenefitPlan> {
    const p: BenefitPlan = { id: `bp-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.benefitPlans.push(p); return p;
  }
  async getEmployeeBenefits(tenantId: string, empId: string): Promise<EmployeeBenefit[]> { return this.employeeBenefits.filter((b) => b.employeeId === empId && b.tenantId === tenantId); }
  async enrollInBenefit(tenantId: string, data: any): Promise<EmployeeBenefit> {
    const b: EmployeeBenefit = { id: `eb-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.employeeBenefits.push(b); return b;
  }
  async getCareerPaths(tenantId: string): Promise<CareerPath[]> { return this.careerPaths.filter((p) => p.tenantId === tenantId); }
  async createCareerPath(tenantId: string, data: any): Promise<CareerPath> {
    const p: CareerPath = { id: `cp-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.careerPaths.push(p); return p;
  }
  async getMentorshipPairs(tenantId: string, empId: string): Promise<MentorshipPair[]> { return this.mentorshipPairs.filter((p) => (p.mentorId === empId || p.menteeId === empId) && p.tenantId === tenantId); }
  async createMentorshipPair(tenantId: string, data: any): Promise<MentorshipPair> {
    const m: MentorshipPair = { id: `mp-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.mentorshipPairs.push(m); return m;
  }

  // Compliance
  async getComplianceDocuments(t: string, empId?: string): Promise<ComplianceDocument[]> { return this.documents.filter((d) => d.tenantId === t && (!empId || d.employeeId === empId)); }
  async uploadComplianceDocument(tenantId: string, data: any): Promise<ComplianceDocument> {
    const doc: ComplianceDocument = { id: `doc-${Date.now()}`, tenantId, ...data, verificationStatus: "pending", createdAt: new Date(), updatedAt: new Date() };
    this.documents.push(doc); return doc;
  }
  async getGlobalComplianceStatus(tenantId: string, status?: string): Promise<any> {
    const docs = this.documents.filter((d) => d.tenantId === tenantId && (!status || d.verificationStatus === status));
    return { total: docs.length, verified: docs.filter(d => d.verificationStatus === "verified").length };
  }
  async verifyDocument(tenantId: string, id: string, by: string, status: string): Promise<ComplianceDocument> {
    const doc = this.documents.find(d => d.id === id && d.tenantId === tenantId);
    if (!doc) throw new Error("Not found"); doc.verificationStatus = status as any; (doc as any).verifiedBy = by; doc.updatedAt = new Date(); return doc;
  }
  async getComplianceModules(tenantId: string): Promise<any[]> { return []; }
  async enableComplianceModule(tenantId: string, key: string, config?: any): Promise<any> { return {}; }
  async getComplianceReports(tenantId: string): Promise<any[]> { return []; }
  async createComplianceReport(tenantId: string, data: any): Promise<any> { return {}; }

  // Strategic Workforce & Succession
  async getBudgetScenarios(tenantId: string): Promise<BudgetScenario[]> { return this.scenarios.filter((s) => s.tenantId === tenantId); }
  async createBudgetScenario(tenantId: string, data: any): Promise<BudgetScenario> {
    const s: BudgetScenario = { id: `bc-${Date.now()}`, tenantId, ...data, status: "DRAFT", createdAt: new Date(), updatedAt: new Date() };
    this.scenarios.push(s); return s;
  }
  async getHeadcountPlans(tenantId: string, scenarioId: string): Promise<HeadcountPlan[]> { return this.plans.filter((p) => p.scenarioId === scenarioId && p.tenantId === tenantId); }
  async updateHeadcountPlan(t: string, id: string, data: any): Promise<HeadcountPlan> {
    const idx = this.plans.findIndex((p) => p.id === id && p.tenantId === t);
    if (idx === -1) throw new Error("Not found");
    this.plans[idx] = { ...this.plans[idx], ...data, updatedAt: new Date() }; return this.plans[idx];
  }
  async getExchangeRates(tenantId: string): Promise<ExchangeRate[]> { return this.rates.filter(r => r.tenantId === tenantId); }
  async getSuccessionPlans(tenantId: string): Promise<SuccessionPlan[]> { return this.successionPlans.filter((p) => p.tenantId === tenantId); }
  async getSuccessionPlan(t: string, pid: string): Promise<SuccessionPlan | null> {
    const p = this.successionPlans.find(p => p.positionId === pid && p.tenantId === t);
    if (!p) return null; return { ...p, candidates: this.successionCandidates.filter(c => c.planId === p.id) };
  }
  async createSuccessionPlan(tenantId: string, data: any): Promise<SuccessionPlan> {
    const p: SuccessionPlan = { id: `sp-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.successionPlans.push(p); return p;
  }
  async addSuccessionCandidate(tenantId: string, data: any): Promise<SuccessionCandidate> {
    const sc: SuccessionCandidate = { id: `sc-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.successionCandidates.push(sc); return sc;
  }
  async getBenchStrength(t: string, d?: string): Promise<any> { return { departmentId: d, criticalRoles: 0, benchStrengthScore: 0, readinessCounts: {} }; }

  // Analytics & Reporting
  async getDepartmentBudgetData(t: string, id: string): Promise<any> { return {}; }
  async getActualLaborCostHistory(t: string, id: string, l: number): Promise<any[]> { return []; }
  async getHolidays(tenantId: string): Promise<any[]> { return []; }
  async createHoliday(tenantId: string, data: any): Promise<any> { return {}; }
  async getHeadcountTrend(tenantId: string): Promise<any[]> { return []; }
  async getExperienceRate(tenantId: string): Promise<any> { return { rate: 0 }; }
  async getTurnoverStats(tenantId: string): Promise<any> { return {}; }
  async getDepartmentAnalytics(tenantId: string): Promise<any[]> { return []; }
  async getCompensationAnalytics(tenantId: string): Promise<any> { return {}; }
  async getRetentionRiskData(tenantId: string): Promise<any[]> { return []; }
  async getEngagementMetrics(tenantId: string): Promise<any> { return {}; }

  // Miscellaneous
  async updatePositionJobPost(tenantId: string, positionId: string, data: any): Promise<any> { return {}; }
  async getPositionJobPost(tenantId: string, positionId: string): Promise<any> { return {}; }
  async executePayrollTransaction(tenantId: string, period: string, activeEmployees: any[], tx?: Prisma.TransactionClient): Promise<any> {
    const totalNetPay = activeEmployees.length * 4000;
    const run = { 
      id: `run-${Date.now()}`, 
      tenantId, 
      name: period, 
      status: 'PROCESSED', 
      totalNetPay, 
      totalGrossPay: totalNetPay * 1.2, 
      periodStart: new Date(),
      periodEnd: new Date(),
      createdAt: new Date() 
    };
    this.runs.push(run as any);
    return run;
  }
}
