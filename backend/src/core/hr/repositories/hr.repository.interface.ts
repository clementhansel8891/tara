import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateEmployeeDto } from "../dto/create-employee.dto";
import { UpdateEmployeeDto } from "../dto/update-employee.dto";
import { CreateLeaveRequestDto } from "../dto/create-leave-request.dto";
import { CreateDepartmentDto } from "../dto/create-department.dto";
import { CreateRequisitionDto } from "../dto/create-requisition.dto";
import { CreatePerformanceCycleDto } from "../dto/create-performance-cycle.dto";
import { SubmitReviewDto } from "../dto/submit-review.dto";
import { CreateCaseDto } from "../dto/create-case.dto";
import { CreateContractDto } from "../dto/create-contract.dto";
import { Employee } from "../entities/employee.entity";
import { Attendance } from "../entities/attendance.entity";
import { LeaveRequest } from "../entities/leave-request.entity";
import { Payroll } from "../entities/payroll.entity";
import { Department } from "../entities/department.entity";
import { JobRequisition } from "../entities/requisition.entity";
import { PerformanceCycle } from "../entities/performance-cycle.entity";
import { PerformanceReview } from "../entities/performance-review.entity";
import { HRCase } from "../entities/hr-case.entity";
import { Contract } from "../entities/contract.entity";
import { Candidate } from "../entities/candidate.entity";
import { Position } from "../entities/position.entity";
import { Compensation } from "../entities/compensation.entity";
import { Interview } from "../entities/interview.entity";
import { TalentLead } from "../entities/talent-lead.entity";
import { ComplianceDocument } from "../entities/compliance-document.entity";
import { BudgetScenario } from "../entities/budget-scenario.entity";
import { HeadcountPlan } from "../entities/headcount-plan.entity";
import { ExchangeRate } from "../entities/exchange-rate.entity";
import { PayrollRun } from "../entities/payroll-run.entity";
import { PayrollLine } from "../entities/payroll-line.entity";
import { SuccessionPlan } from "../entities/succession-plan.entity";
import { SuccessionCandidate } from "../entities/succession-candidate.entity";
import { Skill } from "../entities/skill.entity";
import { EmployeeSkill } from "../entities/employee-skill.entity";
import { BenefitPlan } from "../entities/benefit-plan.entity";
import { EmployeeBenefit } from "../entities/employee-benefit.entity";
import { CareerPath } from "../entities/career-path.entity";
import { MentorshipPair } from "../entities/mentorship-pair.entity";
import { PositionSkill } from "../entities/position-skill.entity";
import { PerformanceGoal } from "../entities/performance-goal.entity";
import { TrainingProgram } from "../entities/training-program.entity";
import { TrainingAssignment } from "../entities/training-assignment.entity";
import { ProgramSkill } from "../entities/program-skill.entity";

@Injectable()
export abstract class IHRRepository {
  // Get By ID Methods
  abstract getEmployeeById(tenantId: string, employeeId: string): Promise<Employee | null>;
  abstract getGlobalEmployeeById(employeeId: string): Promise<Employee | null>;
  abstract getRequisitionById(tenantId: string, id: string): Promise<JobRequisition | null>;
  abstract getContractById(tenantId: string, id: string): Promise<Contract | null>;
  abstract getTrainingAssignmentById(tenantId: string, id: string): Promise<any | null>;
  abstract getLeaveRequestById(tenantId: string, id: string): Promise<LeaveRequest | null>;
  abstract getDepartmentById(tenantId: string, departmentId: string): Promise<Department | null>;
  abstract getPerformanceCycleById(tenantId: string, id: string): Promise<PerformanceCycle | null>;
  abstract getCaseById(tenantId: string, id: string): Promise<HRCase | null>;
  abstract getCandidateById(tenantId: string, id: string): Promise<Candidate | null>;
  abstract getPositionById(tenantId: string, id: string): Promise<Position | null>;
  abstract getInterviewById(tenantId: string, id: string): Promise<Interview | null>;
  abstract getTalentLeadById(tenantId: string, id: string): Promise<TalentLead | null>;
  abstract getGoalById(tenantId: string, id: string): Promise<PerformanceGoal | null>;
  abstract getTrainingProgramById(tenantId: string, id: string): Promise<TrainingProgram | null>;

  // Employee Management
  abstract getEmployees(tenantId: string, locationId?: string, page?: number, limit?: number): Promise<{ data: Employee[]; total: number }>;
  abstract getGlobalEmployees(locationId?: string, page?: number, limit?: number): Promise<{ data: Employee[]; total: number }>;
  abstract createEmployee(tenantId: string, data: CreateEmployeeDto, tx?: Prisma.TransactionClient): Promise<Employee>;
  abstract updateEmployee(tenantId: string, employeeId: string, data: UpdateEmployeeDto, tx?: Prisma.TransactionClient): Promise<Employee>;
  abstract deactivateEmployee(tenantId: string, employeeId: string, tx?: Prisma.TransactionClient): Promise<Employee>;
  abstract promoteEmployee(tenantId: string, employeeId: string, data: any, tx?: Prisma.TransactionClient): Promise<Employee>;
  abstract transferEmployee(tenantId: string, employeeId: string, data: any, tx?: Prisma.TransactionClient): Promise<Employee>;
  abstract suspendEmployee(tenantId: string, employeeId: string, reason: string, tx?: Prisma.TransactionClient): Promise<Employee>;

  // Attendance & Shifts
  abstract getAttendance(tenantId: string, locationId?: string, employeeId?: string, startDate?: string, endDate?: string, page?: number, limit?: number): Promise<{ data: Attendance[]; total: number }>;
  abstract getGlobalAttendance(employeeId?: string, startDate?: string, endDate?: string, page?: number, limit?: number): Promise<{ data: Attendance[]; total: number }>;
  abstract clockIn(tenantId: string, employeeId: string, locationId: string, shiftId?: string, method?: string, metadata?: any, tx?: Prisma.TransactionClient): Promise<Attendance>;
  abstract clockOut(tenantId: string, employeeId: string, tx?: Prisma.TransactionClient): Promise<Attendance>;
  abstract assignShift(tenantId: string, employeeId: string, shiftId: string, locationId: string, date: string, tx?: Prisma.TransactionClient): Promise<void>;

  // Global Scheduling
  abstract getWorkSchedules(tenantId: string, locationId?: string, status?: string): Promise<any[]>;
  abstract createWorkSchedule(tenantId: string, data: any, tx?: Prisma.TransactionClient): Promise<any>;
  abstract updateWorkSchedule(tenantId: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<any>;
  abstract getWorkShifts(tenantId: string, scheduleId?: string, employeeId?: string): Promise<any[]>;
  abstract createWorkShift(tenantId: string, data: any, tx?: Prisma.TransactionClient): Promise<any>;
  abstract updateWorkShift(tenantId: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<any>;
  abstract approveWorkSchedule(tenantId: string, id: string, approvedBy: string, tx?: Prisma.TransactionClient): Promise<any>;

  // Leave Management
  abstract getLeaveRequests(tenantId: string, locationId?: string, status?: string, employeeId?: string): Promise<LeaveRequest[]>;
  abstract getGlobalLeaveRequests(status?: string, employeeId?: string): Promise<LeaveRequest[]>;
  abstract createLeaveRequest(tenantId: string, data: CreateLeaveRequestDto, tx?: Prisma.TransactionClient): Promise<LeaveRequest>;
  abstract approveLeaveRequest(tenantId: string, requestId: string, reviewerId: string, notes?: string, tx?: Prisma.TransactionClient): Promise<LeaveRequest>;
  abstract rejectLeaveRequest(tenantId: string, requestId: string, reviewerId: string, notes: string, tx?: Prisma.TransactionClient): Promise<LeaveRequest>;

  // Payroll Management
  abstract getPayroll(tenantId: string, locationId?: string, employeeId?: string, period?: string): Promise<Payroll[]>;
  abstract getGlobalPayroll(employeeId: string, period?: string): Promise<Payroll[]>;
  abstract calculatePayroll(tenantId: string, employeeId: string, period: string, tx?: Prisma.TransactionClient): Promise<Payroll>;
  abstract getPayrollRuns(tenantId: string): Promise<PayrollRun[]>;
  abstract getPayrollLines(tenantId: string, runId: string): Promise<PayrollLine[]>;

  // Organization Management
  abstract getLocations(tenantId: string): Promise<any[]>;
  abstract getDepartments(tenantId: string): Promise<Department[]>;
  abstract getGlobalDepartments(): Promise<Department[]>;
  abstract createDepartment(tenantId: string, data: CreateDepartmentDto, tx?: Prisma.TransactionClient): Promise<Department>;

  // Recruitment & Talent
  abstract getRequisitions(tenantId: string, status?: string): Promise<JobRequisition[]>;
  abstract getGlobalRequisitions(status?: string): Promise<JobRequisition[]>;
  abstract createRequisition(tenantId: string, data: CreateRequisitionDto, tx?: Prisma.TransactionClient): Promise<JobRequisition>;
  abstract updateRequisition(tenantId: string, id: string, data: Partial<JobRequisition>, tx?: Prisma.TransactionClient): Promise<JobRequisition>;
  abstract getCandidates(tenantId: string, status?: string): Promise<Candidate[]>;
  abstract createCandidate(tenantId: string, data: any, tx?: Prisma.TransactionClient): Promise<Candidate>;
  abstract updateCandidate(tenantId: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<Candidate>;
  abstract hireCandidate(tenantId: string, candidateId: string, data: any, tx?: Prisma.TransactionClient): Promise<Employee>;
  abstract executePayrollTransaction(tenantId: string, period: string, activeEmployees: any[], tx?: Prisma.TransactionClient): Promise<any>;
  abstract getTalentLeads(tenantId: string, status?: string): Promise<TalentLead[]>;
  abstract createTalentLead(tenantId: string, data: any): Promise<TalentLead>;
  abstract updateTalentLead(tenantId: string, id: string, data: any): Promise<TalentLead>;
  abstract getInterviews(tenantId: string, candidateId?: string): Promise<Interview[]>;
  abstract scheduleInterview(tenantId: string, data: any, tx?: Prisma.TransactionClient): Promise<Interview>;
  abstract updateInterviewStatus(tenantId: string, id: string, status: string, tx?: Prisma.TransactionClient): Promise<Interview>;

  // Headcount & Compensation
  abstract getPositions(tenantId: string, deptId?: string): Promise<Position[]>;
  abstract createPosition(tenantId: string, data: any, tx?: Prisma.TransactionClient): Promise<Position>;
  abstract updatePosition(tenantId: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<Position>;
  abstract getCompensation(tenantId: string, employeeId: string): Promise<Compensation | null>;
  abstract updateCompensation(tenantId: string, employeeId: string, data: any, tx?: Prisma.TransactionClient): Promise<Compensation>;

  // Performance Management
  abstract getPerformanceCycles(tenantId: string): Promise<PerformanceCycle[]>;
  abstract createPerformanceCycle(tenantId: string, data: CreatePerformanceCycleDto): Promise<PerformanceCycle>;
  abstract updatePerformanceCycle(tenantId: string, id: string, data: any): Promise<PerformanceCycle>;
  abstract getPerformanceReviews(tenantId: string, cycleId?: string, employeeId?: string): Promise<PerformanceReview[]>;
  abstract getGlobalPerformanceReviews(cycleId?: string, employeeId?: string): Promise<PerformanceReview[]>;
  abstract submitPerformanceReview(tenantId: string, data: SubmitReviewDto, tx?: Prisma.TransactionClient): Promise<PerformanceReview>;
  abstract getEmployeePerformanceHistory(tenantId: string, employeeId: string): Promise<PerformanceReview[]>;
  abstract getEmployeeGoals(tenantId: string, employeeId: string): Promise<PerformanceGoal[]>;
  abstract updatePerformanceGoal(tenantId: string, data: any): Promise<PerformanceGoal>;
  abstract updatePerformanceGoalStatus?(tenantId: string, id: string, status: string): Promise<PerformanceGoal>;

  // Case Management
  abstract getCases(tenantId: string, locationId?: string, status?: string, employeeId?: string): Promise<HRCase[]>;
  abstract createCase(tenantId: string, data: CreateCaseDto, tx?: Prisma.TransactionClient): Promise<HRCase>;
  abstract updateCase(tenantId: string, id: string, data: any, tx?: Prisma.TransactionClient): Promise<HRCase>;

  // Contract Management
  abstract getContracts(tenantId: string, locationId?: string, employeeId?: string): Promise<Contract[]>;
  abstract getGlobalContracts(employeeId?: string): Promise<Contract[]>;
  abstract createContract(tenantId: string, data: CreateContractDto, tx?: Prisma.TransactionClient): Promise<Contract>;
  abstract updateContract(tenantId: string, id: string, data: any): Promise<Contract>;

  // Skills & Training
  abstract getSkills(tenantId: string, category?: string): Promise<Skill[]>;
  abstract createSkill(tenantId: string, data: any): Promise<Skill>;
  abstract getEmployeeSkills(tenantId: string, employeeId: string): Promise<EmployeeSkill[]>;
  abstract addEmployeeSkill(tenantId: string, data: any): Promise<EmployeeSkill>;
  abstract updateEmployeeSkill(tenantId: string, data: any): Promise<EmployeeSkill>;
  abstract getPositionSkills(tenantId: string, positionId: string): Promise<PositionSkill[]>;
  abstract updatePositionSkill(tenantId: string, data: any): Promise<PositionSkill>;
  abstract findTalentBySkills(tenantId: string, skillIds: string[], limit?: number): Promise<any[]>;
  abstract findReplacementCandidates(tenantId: string, positionId: string): Promise<any[]>;
  abstract getTrainingPrograms(tenantId: string): Promise<any[]>;
  abstract getTrainingProgramsBySkills(tenantId: string, skillIds: string[]): Promise<TrainingProgram[]>;
  abstract getEmployeeTrainingHistory(tenantId: string, employeeId: string): Promise<TrainingAssignment[]>;
  abstract createTrainingProgram(tenantId: string, data: any): Promise<any>;
  abstract enrollInTrainingProgram(tenantId: string, employeeId: string, programId: string): Promise<TrainingAssignment>;
  abstract getTrainingAssignments(tenantId: string): Promise<any[]>;
  abstract createTrainingAssignment(tenantId: string, data: any): Promise<any>;
  abstract updateTrainingAssignment(tenantId: string, id: string, data: any): Promise<any>;

  // Benefits & Career
  abstract getBenefitPlans(tenantId: string): Promise<BenefitPlan[]>;
  abstract createBenefitPlan(tenantId: string, data: any): Promise<BenefitPlan>;
  abstract getEmployeeBenefits(tenantId: string, employeeId: string): Promise<EmployeeBenefit[]>;
  abstract enrollInBenefit(tenantId: string, data: any): Promise<EmployeeBenefit>;
  abstract getCareerPaths(tenantId: string): Promise<CareerPath[]>;
  abstract createCareerPath(tenantId: string, data: any): Promise<CareerPath>;
  abstract getMentorshipPairs(tenantId: string, employeeId: string): Promise<MentorshipPair[]>;
  abstract createMentorshipPair(tenantId: string, data: any): Promise<MentorshipPair>;

  // Compliance
  abstract getComplianceDocuments(tenantId: string, employeeId?: string): Promise<ComplianceDocument[]>;
  abstract uploadComplianceDocument(tenantId: string, data: any): Promise<ComplianceDocument>;
  abstract getGlobalComplianceStatus(tenantId: string, status?: string): Promise<any>;
  abstract verifyDocument(tenantId: string, documentId: string, verifiedBy: string, status: string, details?: any): Promise<ComplianceDocument>;
  abstract getComplianceModules(tenantId: string): Promise<any[]>;
  abstract enableComplianceModule(tenantId: string, moduleKey: string, config?: any): Promise<any>;
  abstract getComplianceReports(tenantId: string): Promise<any[]>;
  abstract createComplianceReport(tenantId: string, data: any): Promise<any>;

  // Strategic Workforce & Succession
  abstract getBudgetScenarios(tenantId: string): Promise<BudgetScenario[]>;
  abstract createBudgetScenario(tenantId: string, data: any): Promise<BudgetScenario>;
  abstract getHeadcountPlans(tenantId: string, scenarioId: string): Promise<HeadcountPlan[]>;
  abstract updateHeadcountPlan(tenantId: string, id: string, data: any): Promise<HeadcountPlan>;
  abstract getExchangeRates(tenantId: string): Promise<ExchangeRate[]>;
  abstract getSuccessionPlans(tenantId: string): Promise<SuccessionPlan[]>;
  abstract getSuccessionPlan(tenantId: string, positionId: string): Promise<SuccessionPlan | null>;
  abstract createSuccessionPlan(tenantId: string, data: any): Promise<SuccessionPlan>;
  abstract addSuccessionCandidate(tenantId: string, data: any): Promise<SuccessionCandidate>;
  abstract getBenchStrength(tenantId: string, departmentId?: string): Promise<any>;

  // Analytics & Reporting
  abstract getHeadcountTrend(tenantId: string): Promise<any[]>;
  abstract getTurnoverStats(tenantId: string): Promise<any>;
  abstract getDepartmentAnalytics(tenantId: string): Promise<any[]>;
  abstract getCompensationAnalytics(tenantId: string): Promise<any>;
  abstract getExperienceRate(tenantId: string): Promise<any>;
  abstract getActualLaborCostHistory(tenantId: string, departmentId: string, monthLimit: number): Promise<any[]>;
  abstract getDepartmentBudgetData(tenantId: string, departmentId: string): Promise<any>;
  abstract getHolidays(tenantId: string): Promise<any[]>;
  abstract createHoliday(tenantId: string, data: any): Promise<any>;
  abstract getRetentionRiskData(tenantId: string): Promise<any[]>;
  abstract getEngagementMetrics(tenantId: string): Promise<any>;

  // Miscellaneous
  abstract updatePositionJobPost(tenantId: string, positionId: string, data: any): Promise<any>;
  abstract getPositionJobPost(tenantId: string, positionId: string): Promise<any>;
}
