import { Injectable } from "@nestjs/common";
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

  // Employee Management
  async getEmployees(tenantId: string, locationId?: string, page: number = 1, limit: number = 20): Promise<{ data: Employee[]; total: number }> {
    const filtered = this.employees.filter((e) => e.tenantId === tenantId && (!locationId || e.locationId === locationId));
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async getGlobalEmployees(locationId?: string, page: number = 1, limit: number = 20): Promise<{ data: Employee[]; total: number }> {
    const filtered = this.employees.filter((e) => !locationId || e.locationId === locationId);
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async getEmployeeById(tenantId: string, employeeId: string): Promise<Employee | null> {
    return this.employees.find((e) => e.id === employeeId && e.tenantId === tenantId) || null;
  }
  async getGlobalEmployeeById(employeeId: string): Promise<Employee | null> { return this.employees.find((e) => e.id === employeeId) || null; }
  async createEmployee(tenantId: string, data: CreateEmployeeDto): Promise<Employee> {
    const employee: any = { id: `emp-${Date.now()}`, tenantId, ...data, fullName: `${data.firstName} ${data.lastName}`, status: "active", createdAt: new Date(), updatedAt: new Date() };
    this.employees.push(employee); return employee;
  }
  async updateEmployee(tenantId: string, id: string, data: UpdateEmployeeDto): Promise<Employee> {
    const idx = this.employees.findIndex((e) => e.id === id && e.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.employees[idx] = { ...this.employees[idx], ...data, status: (data.status as any) || this.employees[idx].status, updatedAt: new Date() } as any; return this.employees[idx];
  }
  async deactivateEmployee(t: string, id: string): Promise<Employee> { return this.updateEmployee(t, id, { status: "terminated" } as any); }
  async promoteEmployee(t: string, id: string, data: any): Promise<Employee> { return this.updateEmployee(t, id, { ...data, status: "promoted" } as any); }
  async transferEmployee(t: string, id: string, data: any): Promise<Employee> { return this.updateEmployee(t, id, { ...data, status: "transferred" } as any); }
  async suspendEmployee(t: string, id: string, reason: string): Promise<Employee> { return this.updateEmployee(t, id, { status: "suspended", metadata: { reason } } as any); }

  // Attendance
  async getAttendance(tenantId: string, locationId?: string, employeeId?: string, s?: string, e?: string, page: number = 1, limit: number = 20): Promise<{ data: Attendance[]; total: number }> {
    const filtered = this.attendance.filter((a) => a.tenantId === tenantId && (!locationId || a.locationId === locationId) && (!employeeId || a.employeeId === employeeId));
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async getGlobalAttendance(empId?: string, s?: string, e?: string, page: number = 1, limit: number = 20): Promise<{ data: Attendance[]; total: number }> {
    const filtered = this.attendance.filter((a) => !empId || a.employeeId === empId);
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async clockIn(tenantId: string, employeeId: string, locationId: string): Promise<Attendance> {
    const record: Attendance = { id: `att-${Date.now()}`, tenantId, employeeId, locationId, date: new Date().toISOString().split("T")[0], clockIn: new Date(), status: "present", createdAt: new Date(), updatedAt: new Date() };
    this.attendance.push(record); return record;
  }
  async clockOut(tenantId: string, employeeId: string): Promise<Attendance> {
    const record = this.attendance.find((a) => a.employeeId === employeeId && a.tenantId === tenantId && a.status === "present");
    if (!record) throw new Error("No active clock-in"); record.updatedAt = new Date(); return record;
  }
  async assignShift(t: string, eid: string, sid: string, lid: string, date: string): Promise<void> { return; }

  // Candidates & Recruitment
  async getCandidates(tenantId: string, status?: string): Promise<Candidate[]> { return this.candidates.filter((c) => c.tenantId === tenantId && (!status || c.status === status)); }
  async getCandidateById(tenantId: string, id: string): Promise<Candidate | null> { return this.candidates.find((c) => c.id === id && c.tenantId === tenantId) || null; }
  async createCandidate(tenantId: string, data: any): Promise<Candidate> {
    const cand: Candidate = { id: `cand-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.candidates.push(cand); return cand;
  }
  async updateCandidate(tenantId: string, id: string, data: any): Promise<Candidate> {
    const idx = this.candidates.findIndex((c) => c.id === id && c.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.candidates[idx] = { ...this.candidates[idx], ...data, updatedAt: new Date() }; return this.candidates[idx];
  }
  async hireCandidate(tenantId: string, id: string): Promise<Employee> {
    const cand = await this.getCandidateById(tenantId, id); if (!cand) throw new Error("Not found");
    return this.createEmployee(tenantId, { firstName: cand.firstName, lastName: cand.lastName, email: cand.email } as any);
  }
  async getInterviews(tenantId: string, candidateId?: string): Promise<Interview[]> { return this.interviews.filter((i) => i.tenantId === tenantId && (!candidateId || i.candidateId === candidateId)); }
  async scheduleInterview(tenantId: string, data: any): Promise<Interview> {
    const int: Interview = { id: `int-${Date.now()}`, tenantId, ...data, scheduledAt: new Date(data.scheduledAt), createdAt: new Date(), updatedAt: new Date() };
    this.interviews.push(int); return int;
  }
  async updateInterviewStatus(tenantId: string, id: string, status: string): Promise<Interview> {
    const int = this.interviews.find((i) => i.id === id && i.tenantId === tenantId);
    if (!int) throw new Error("Not found"); int.status = status as any; int.updatedAt = new Date(); return int;
  }
  async getTalentLeads(tenantId: string, status?: string): Promise<TalentLead[]> { return this.leads.filter((l) => l.tenantId === tenantId && (!status || l.status === status)); }
  async createTalentLead(tenantId: string, data: any): Promise<TalentLead> {
    const lead: TalentLead = { id: `lead-${Date.now()}`, tenantId, ...data, leadScore: data.leadScore || 0, createdAt: new Date(), updatedAt: new Date() };
    this.leads.push(lead); return lead;
  }
  async getTalentLeadById(tenantId: string, id: string): Promise<TalentLead | null> { return this.leads.find((l) => l.id === id && l.tenantId === tenantId) || null; }
  async updateTalentLead(tenantId: string, id: string, data: any): Promise<TalentLead> {
    const idx = this.leads.findIndex((l) => l.id === id && l.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.leads[idx] = { ...this.leads[idx], ...data, updatedAt: new Date() }; return this.leads[idx];
  }

  // Org Structure
  async getLocations(tenantId: string): Promise<any[]> { return []; }
  async getDepartments(tenantId: string): Promise<Department[]> { return this.departments.filter((d) => d.tenantId === tenantId); }
  async getGlobalDepartments(): Promise<Department[]> { return this.departments; }
  async getDepartmentById(t: string, id: string): Promise<Department | null> { return this.departments.find((d) => d.id === id && d.tenantId === t) || null; }
  async createDepartment(tenantId: string, data: CreateDepartmentDto): Promise<Department> {
    const d: Department = { id: `dept-${Date.now()}`, tenantId, ...data, status: "active", createdAt: new Date(), updatedAt: new Date() };
    this.departments.push(d); return d;
  }
  async getPositions(tenantId: string, deptId?: string): Promise<Position[]> { return this.positions.filter((p) => p.tenantId === tenantId && (!deptId || p.departmentId === deptId)); }
  async getPositionById(tenantId: string, id: string): Promise<Position | null> { return this.positions.find((p) => p.id === id && p.tenantId === tenantId) || null; }
  async createPosition(tenantId: string, data: any): Promise<Position> {
    const pos: Position = { id: `pos-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.positions.push(pos); return pos;
  }
  async updatePosition(tenantId: string, id: string, data: any): Promise<Position> {
    const idx = this.positions.findIndex((p) => p.id === id && p.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.positions[idx] = { ...this.positions[idx], ...data, updatedAt: new Date() }; return this.positions[idx];
  }

  // Job Requisitions
  async getRequisitions(tenantId: string, status?: string): Promise<JobRequisition[]> { return this.requisitions.filter((r) => r.tenantId === tenantId && (!status || r.status === status)); }
  async getGlobalRequisitions(status?: string): Promise<JobRequisition[]> { return this.requisitions.filter((r) => !status || r.status === status); }
  async createRequisition(tenantId: string, data: CreateRequisitionDto): Promise<JobRequisition> {
    const r: JobRequisition = { id: `req-${Date.now()}`, tenantId, ...data, status: "open", createdAt: new Date(), updatedAt: new Date() };
    this.requisitions.push(r); return r;
  }
  async updateRequisition(tenantId: string, id: string, data: Partial<JobRequisition>): Promise<JobRequisition> {
    const idx = this.requisitions.findIndex((r) => r.id === id && r.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.requisitions[idx] = { ...this.requisitions[idx], ...data, updatedAt: new Date() }; return this.requisitions[idx];
  }

  // Leave & Payroll
  async getLeaveRequests(tenantId: string, locId?: string, status?: string, empId?: string): Promise<LeaveRequest[]> {
    return this.leaveRequests.filter((l) => l.tenantId === tenantId && (!status || l.status === status) && (!empId || l.employeeId === empId));
  }
  async getGlobalLeaveRequests(status?: string, empId?: string): Promise<LeaveRequest[]> {
    return this.leaveRequests.filter((l) => (!status || l.status === status) && (!empId || l.employeeId === empId));
  }
  async createLeaveRequest(tenantId: string, data: CreateLeaveRequestDto): Promise<LeaveRequest> {
    const req: LeaveRequest = { id: `lv-${Date.now()}`, tenantId, ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate), requestedAt: new Date(), status: "pending", createdAt: new Date(), updatedAt: new Date() };
    this.leaveRequests.push(req); return req;
  }
  async approveLeaveRequest(t: string, id: string, rev: string, notes?: string): Promise<LeaveRequest> {
    const req = this.leaveRequests.find((l) => l.id === id && l.tenantId === t);
    if (!req) throw new Error("Not found"); req.status = "approved"; (req as any).reviewedBy = rev; (req as any).reviewNotes = notes; return req;
  }
  async rejectLeaveRequest(t: string, id: string, rev: string, notes: string): Promise<LeaveRequest> {
    const req = this.leaveRequests.find((l) => l.id === id && l.tenantId === t);
    if (!req) throw new Error("Not found"); req.status = "rejected"; (req as any).reviewedBy = rev; (req as any).reviewNotes = notes; return req;
  }
  async getPayroll(tenantId: string, locId?: string, empId?: string, period?: string): Promise<Payroll[]> { return this.payrolls.filter((p) => p.tenantId === tenantId && (!empId || p.employeeId === empId)); }
  async getGlobalPayroll(empId: string, period?: string): Promise<Payroll[]> { return this.payrolls.filter((p) => p.employeeId === empId); }
  async calculatePayroll(tenantId: string, empId: string, period: string): Promise<Payroll> {
    const p: Payroll = { id: `pay-${Date.now()}`, tenantId, employeeId: empId, period, baseSalary: 4000, grossPay: 5000, netPay: 4000, status: "draft", createdAt: new Date(), updatedAt: new Date() };
    this.payrolls.push(p); return p;
  }
  async getPayrollRuns(tenantId: string): Promise<PayrollRun[]> { return this.runs.filter((r) => r.tenantId === tenantId); }
  async getPayrollLines(tenantId: string, runId: string): Promise<PayrollLine[]> { return this.lines.filter((l) => l.payrollRunId === runId && l.tenantId === tenantId); }
  async getExchangeRates(tenantId: string): Promise<ExchangeRate[]> { return this.rates.filter((r) => r.tenantId === tenantId); }

  // Performance & Compensation
  async getPerformanceCycles(tenantId: string): Promise<PerformanceCycle[]> { return this.performanceCycles.filter((c) => c.tenantId === tenantId); }
  async createPerformanceCycle(tenantId: string, data: CreatePerformanceCycleDto): Promise<PerformanceCycle> {
    const c: PerformanceCycle = { id: `cyc-${Date.now()}`, tenantId, ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate), dueDate: new Date(data.dueDate), status: "draft", createdAt: new Date(), updatedAt: new Date() };
    this.performanceCycles.push(c); return c;
  }
  async getPerformanceReviews(tenantId: string, cycleId?: string, empId?: string): Promise<PerformanceReview[]> {
    return this.performanceReviews.filter((r) => r.tenantId === tenantId && (!cycleId || r.cycleId === cycleId) && (!empId || r.employeeId === empId));
  }
  async submitPerformanceReview(tenantId: string, data: SubmitReviewDto): Promise<PerformanceReview> {
    const rev: PerformanceReview = { id: `rev-${Date.now()}`, tenantId, ...data, rating: data.rating || 0, status: "submitted", createdAt: new Date(), updatedAt: new Date() };
    this.performanceReviews.push(rev); return rev;
  }
  async updatePerformanceCycle(tenantId: string, id: string, data: any): Promise<PerformanceCycle> {
    const idx = this.performanceCycles.findIndex((c) => c.id === id && c.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.performanceCycles[idx] = { ...this.performanceCycles[idx], ...data, updatedAt: new Date() }; return this.performanceCycles[idx];
  }
  async getGlobalPerformanceReviews(cycleId?: string, empId?: string): Promise<PerformanceReview[]> { return this.performanceReviews; }
  async getEmployeePerformanceHistory(tenantId: string, employeeId: string): Promise<PerformanceReview[]> { return this.performanceReviews.filter(r => r.employeeId === employeeId); }
  async getEmployeeGoals(tenantId: string, empId: string): Promise<PerformanceGoal[]> { return this.performanceGoals.filter((g) => g.employeeId === empId && g.tenantId === tenantId); }
  async updatePerformanceGoal(tenantId: string, data: any): Promise<PerformanceGoal> {
    const goal: PerformanceGoal = { id: data.id || `pg-${Date.now()}`, tenantId, ...data, createdAt: new Date(), updatedAt: new Date() };
    const idx = this.performanceGoals.findIndex((g) => g.id === goal.id);
    if (idx !== -1) { this.performanceGoals[idx] = { ...this.performanceGoals[idx], ...goal }; return this.performanceGoals[idx]; }
    this.performanceGoals.push(goal); return goal;
  }
  async getGoalById(tenantId: string, id: string): Promise<PerformanceGoal | null> { return this.performanceGoals.find((g) => g.id === id && g.tenantId === tenantId) || null; }
  async getCompensation(tenantId: string, empId: string): Promise<Compensation | null> { return this.compensations.find((c) => c.employeeId === empId && c.tenantId === tenantId) || null; }
  async updateCompensation(tenantId: string, empId: string, data: any): Promise<Compensation> {
    const idx = this.compensations.findIndex((c) => c.employeeId === empId && c.tenantId === tenantId);
    if (idx !== -1) { this.compensations[idx] = { ...this.compensations[idx], ...data }; return this.compensations[idx]; }
    const c: Compensation = { id: `cmp-${Date.now()}`, tenantId, employeeId: empId, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.compensations.push(c); return c;
  }

  // Cases & Contracts
  async getCases(tenantId: string, status?: string, empId?: string): Promise<HRCase[]> {
    return this.cases.filter((c) => c.tenantId === tenantId && (!status || c.status === status) && (!empId || c.employeeId === empId));
  }
  async getCaseById(tenantId: string, id: string): Promise<HRCase | null> { return this.cases.find((c) => c.id === id && c.tenantId === tenantId) || null; }
  async createCase(tenantId: string, data: CreateCaseDto): Promise<HRCase> {
    const c: HRCase = { id: `case-${Date.now()}`, tenantId, ...data, status: "open", priority: (data.priority as any) || "medium", createdAt: new Date(), updatedAt: new Date() };
    this.cases.push(c); return c;
  }
  async updateCase(tenantId: string, id: string, data: any): Promise<HRCase> {
    const idx = this.cases.findIndex((c) => c.id === id && c.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.cases[idx] = { ...this.cases[idx], ...data, updatedAt: new Date() }; return this.cases[idx];
  }
  async getContracts(tenantId: string, locId?: string, empId?: string): Promise<Contract[]> { return this.contracts.filter((c) => c.tenantId === tenantId && (!empId || c.employeeId === empId)); }
  async getGlobalContracts(empId?: string): Promise<Contract[]> { return this.contracts.filter(c => !empId || c.employeeId === empId); }
  async createContract(tenantId: string, data: CreateContractDto): Promise<Contract> {
    const c: Contract = { id: `ct-${Date.now()}`, tenantId, ...data, startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : undefined, status: "active", createdAt: new Date(), updatedAt: new Date() };
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
  async findTalentBySkills(t: string, ids: string[], limit: number = 20): Promise<any[]> {
    const matches = new Map<string, any>();
    this.employeeSkills.filter((es) => es.tenantId === t && ids.includes(es.skillId) && es.proficiency >= 1)
      .forEach((es) => {
        const emp = this.employees.find((e) => e.id === es.employeeId); const sk = this.skills.find((s) => s.id === es.skillId);
        if (emp && sk) {
          if (!matches.has(es.employeeId)) matches.set(es.employeeId, { employee: emp, matchedSkills: [], totalProficiency: 0 });
          const m = matches.get(es.employeeId); m.matchedSkills.push({ name: sk.name, proficiency: es.proficiency }); m.totalProficiency += es.proficiency;
        }
      });
    return Array.from(matches.values()).map((m) => ({ ...m, matchCount: m.matchedSkills.length, matchPercentage: (m.matchedSkills.length / ids.length) * 100 })).sort((a,b) => b.matchPercentage - a.matchPercentage).slice(0, limit);
  }
  async findReplacementCandidates(tenantId: string, positionId: string): Promise<any[]> { return []; }
  async getPositionSkills(tenantId: string, positionId: string): Promise<PositionSkill[]> { return this.positionSkills.filter(ps => ps.positionId === positionId); }
  async updatePositionSkill(tenantId: string, data: any): Promise<PositionSkill> {
    const ps: PositionSkill = { id: `ps-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.positionSkills.push(ps); return ps;
  }
  async updatePositionJobPost(tenantId: string, positionId: string, data: any): Promise<any> { return {}; }
  async getPositionJobPost(tenantId: string, positionId: string): Promise<any> { return {}; }

  // Training
  async getTrainingProgramsBySkills(tenantId: string, skillIds: string[]): Promise<TrainingProgram[]> { return []; }
  async getEmployeeTrainingHistory(t: string, id: string): Promise<TrainingAssignment[]> { return this.trainingAssignments.filter((a) => a.employeeId === id && a.tenantId === t); }
  async enrollInTrainingProgram(t: string, eid: string, pid: string): Promise<TrainingAssignment> {
    const a: TrainingAssignment = { id: `ta-${Date.now()}`, tenantId: t, employeeId: eid, programId: pid, status: "enrolled", assignedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
    this.trainingAssignments.push(a); return a;
  }
  async getTrainingProgramById(t: string, id: string): Promise<TrainingProgram | null> { return this.trainingPrograms.find((p) => p.id === id && p.tenantId === t) || null; }
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
    const idx = this.trainingAssignments.findIndex(a => a.id === id && a.tenantId === tenantId);
    if (idx === -1) throw new Error("Not found");
    this.trainingAssignments[idx] = { ...this.trainingAssignments[idx], ...data, updatedAt: new Date() }; return this.trainingAssignments[idx];
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

  // Analytics & Misc
  async getDepartmentBudgetData(t: string, id: string): Promise<any> { return {}; }
  async getActualLaborCostHistory(t: string, id: string, l: number): Promise<any[]> { return []; }
  async getHolidays(tenantId: string): Promise<any[]> { return []; }
  async createHoliday(tenantId: string, data: any): Promise<any> { return {}; }
  async getHeadcountTrend(tenantId: string): Promise<any[]> { return []; }
  async getTurnoverStats(tenantId: string): Promise<any> { return {}; }
  async getDepartmentAnalytics(tenantId: string): Promise<any[]> { return []; }
  async getCompensationAnalytics(tenantId: string): Promise<any> { return {}; }
  async getRetentionRiskData(tenantId: string): Promise<any[]> { return []; }
  async getEngagementMetrics(tenantId: string): Promise<any> { return {}; }
}
