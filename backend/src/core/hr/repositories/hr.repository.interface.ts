import { Injectable } from "@nestjs/common";
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
  abstract getEmployees(
    tenantId: string,
    locationId?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Employee[]; total: number }>;

  abstract getGlobalEmployees(
    locationId?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Employee[]; total: number }>;

  abstract getEmployeeById(
    tenantId: string,
    employeeId: string,
  ): Promise<Employee | null>;

  abstract getGlobalEmployeeById(employeeId: string): Promise<Employee | null>;

  abstract createEmployee(
    tenantId: string,
    data: CreateEmployeeDto,
  ): Promise<Employee>;

  abstract updateEmployee(
    tenantId: string,
    employeeId: string,
    data: UpdateEmployeeDto,
  ): Promise<Employee>;

  abstract deactivateEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<Employee>;

  abstract promoteEmployee(
    tenantId: string,
    employeeId: string,
    data: any,
  ): Promise<Employee>;

  abstract transferEmployee(
    tenantId: string,
    employeeId: string,
    data: any,
  ): Promise<Employee>;

  abstract suspendEmployee(
    tenantId: string,
    employeeId: string,
    reason: string,
  ): Promise<Employee>;

  abstract getAttendance(
    tenantId: string,
    locationId?: string,
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Attendance[]; total: number }>;

  abstract getGlobalAttendance(
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Attendance[]; total: number }>;

  abstract clockIn(
    tenantId: string,
    employeeId: string,
    locationId: string,
  ): Promise<Attendance>;

  abstract clockOut(
    tenantId: string,
    employeeId: string,
  ): Promise<Attendance>;

  abstract assignShift(
    tenantId: string,
    employeeId: string,
    shiftId: string,
    locationId: string,
    date: string,
  ): Promise<void>;

  abstract getLeaveRequests(
    tenantId: string,
    locationId?: string,
    status?: string,
    employeeId?: string,
  ): Promise<LeaveRequest[]>;

  abstract getGlobalLeaveRequests(
    status?: string,
    employeeId?: string,
  ): Promise<LeaveRequest[]>;

  abstract createLeaveRequest(
    tenantId: string,
    data: CreateLeaveRequestDto,
  ): Promise<LeaveRequest>;

  abstract approveLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes?: string,
  ): Promise<LeaveRequest>;

  abstract rejectLeaveRequest(
    tenantId: string,
    requestId: string,
    reviewerId: string,
    notes: string,
  ): Promise<LeaveRequest>;

  abstract getPayroll(
    tenantId: string,
    locationId?: string,
    employeeId?: string,
    period?: string,
  ): Promise<Payroll[]>;

  abstract getGlobalPayroll(
    employeeId: string,
    period?: string,
  ): Promise<Payroll[]>;

  abstract calculatePayroll(
    tenantId: string,
    employeeId: string,
    period: string,
  ): Promise<Payroll>;

  abstract getLocations(tenantId: string): Promise<any[]>;

  abstract getDepartments(tenantId: string): Promise<Department[]>;

  abstract getGlobalDepartments(): Promise<Department[]>;

  abstract getDepartmentById(
    tenantId: string,
    departmentId: string,
  ): Promise<Department | null>;

  abstract createDepartment(
    tenantId: string,
    data: CreateDepartmentDto,
  ): Promise<Department>;

  abstract getRequisitions(
    tenantId: string,
    status?: string,
  ): Promise<JobRequisition[]>;

  abstract getGlobalRequisitions(status?: string): Promise<JobRequisition[]>;

  abstract createRequisition(
    tenantId: string,
    data: CreateRequisitionDto,
  ): Promise<JobRequisition>;

  abstract updateRequisition(
    tenantId: string,
    id: string,
    data: Partial<JobRequisition>,
  ): Promise<JobRequisition>;

  abstract getPerformanceCycles(tenantId: string): Promise<PerformanceCycle[]>;

  abstract createPerformanceCycle(
    tenantId: string,
    data: CreatePerformanceCycleDto,
  ): Promise<PerformanceCycle>;

  abstract getPerformanceReviews(
    tenantId: string,
    cycleId?: string,
    employeeId?: string,
  ): Promise<PerformanceReview[]>;

  abstract submitPerformanceReview(
    tenantId: string,
    data: SubmitReviewDto,
  ): Promise<PerformanceReview>;

  abstract updatePerformanceCycle(
    tenantId: string,
    id: string,
    data: any,
  ): Promise<PerformanceCycle>;

  abstract getGlobalPerformanceReviews(
    cycleId?: string,
    employeeId?: string,
  ): Promise<PerformanceReview[]>;

  abstract getCases(
    tenantId: string,
    status?: string,
    employeeId?: string,
  ): Promise<HRCase[]>;

  abstract getCaseById(tenantId: string, id: string): Promise<HRCase | null>;

  abstract createCase(tenantId: string, data: CreateCaseDto): Promise<HRCase>;

  abstract updateCase(tenantId: string, id: string, data: any): Promise<HRCase>;

  abstract getContracts(
    tenantId: string,
    locationId?: string,
    employeeId?: string,
  ): Promise<Contract[]>;

  abstract getGlobalContracts(employeeId?: string): Promise<Contract[]>;

  abstract createContract(
    tenantId: string,
    data: CreateContractDto,
  ): Promise<Contract>;

  abstract updateContract(tenantId: string, id: string, data: any): Promise<Contract>;

  abstract getCandidates(tenantId: string, status?: string): Promise<Candidate[]>;

  abstract getCandidateById(tenantId: string, id: string): Promise<Candidate | null>;

  abstract createCandidate(tenantId: string, data: any): Promise<Candidate>;

  abstract updateCandidate(tenantId: string, id: string, data: any): Promise<Candidate>;

  abstract hireCandidate(tenantId: string, candidateId: string): Promise<Employee>;

  abstract getPositions(tenantId: string, deptId?: string): Promise<Position[]>;

  abstract getPositionById(tenantId: string, id: string): Promise<Position | null>;

  abstract createPosition(tenantId: string, data: any): Promise<Position>;

  abstract updatePosition(tenantId: string, id: string, data: any): Promise<Position>;

  abstract getInterviews(tenantId: string, candidateId?: string): Promise<Interview[]>;

  abstract scheduleInterview(tenantId: string, data: any): Promise<Interview>;

  abstract getTalentLeads(tenantId: string, status?: string): Promise<TalentLead[]>;

  abstract createTalentLead(tenantId: string, data: any): Promise<TalentLead>;

  abstract getTalentLeadById(tenantId: string, id: string): Promise<TalentLead | null>;

  abstract updateTalentLead(tenantId: string, id: string, data: any): Promise<TalentLead>;

  abstract getComplianceDocuments(tenantId: string, employeeId?: string): Promise<ComplianceDocument[]>;

  abstract uploadComplianceDocument(tenantId: string, data: any): Promise<ComplianceDocument>;

  abstract getGlobalComplianceStatus(tenantId: string, status?: string): Promise<any>;

  abstract getBudgetScenarios(tenantId: string): Promise<BudgetScenario[]>;

  abstract createBudgetScenario(tenantId: string, data: any): Promise<BudgetScenario>;

  abstract getHeadcountPlans(tenantId: string, scenarioId: string): Promise<HeadcountPlan[]>;

  abstract updateHeadcountPlan(tenantId: string, id: string, data: any): Promise<HeadcountPlan>;

  abstract getExchangeRates(tenantId: string): Promise<ExchangeRate[]>;

  abstract getPayrollRuns(tenantId: string): Promise<PayrollRun[]>;

  abstract getPayrollLines(tenantId: string, runId: string): Promise<PayrollLine[]>;

  abstract getSuccessionPlans(tenantId: string): Promise<SuccessionPlan[]>;

  abstract createSuccessionPlan(tenantId: string, data: any): Promise<SuccessionPlan>;

  abstract addSuccessionCandidate(tenantId: string, data: any): Promise<SuccessionCandidate>;

  abstract getSkills(tenantId: string, category?: string): Promise<Skill[]>;

  abstract createSkill(tenantId: string, data: any): Promise<Skill>;

  abstract getEmployeeSkills(tenantId: string, employeeId: string): Promise<EmployeeSkill[]>;

  abstract addEmployeeSkill(tenantId: string, data: any): Promise<EmployeeSkill>;

  abstract findReplacementCandidates(tenantId: string, positionId: string): Promise<any[]>;

  abstract getBenefitPlans(tenantId: string): Promise<BenefitPlan[]>;

  abstract createBenefitPlan(tenantId: string, data: any): Promise<BenefitPlan>;

  abstract getEmployeeBenefits(tenantId: string, employeeId: string): Promise<EmployeeBenefit[]>;

  abstract enrollInBenefit(tenantId: string, data: any): Promise<EmployeeBenefit>;

  abstract getCareerPaths(tenantId: string): Promise<CareerPath[]>;

  abstract createCareerPath(tenantId: string, data: any): Promise<CareerPath>;

  abstract getMentorshipPairs(tenantId: string, employeeId: string): Promise<MentorshipPair[]>;

  abstract createMentorshipPair(tenantId: string, data: any): Promise<MentorshipPair>;

  abstract updatePositionJobPost(tenantId: string, positionId: string, data: any): Promise<any>;

  abstract updateInterviewStatus(tenantId: string, id: string, status: string): Promise<Interview>;

  abstract getPositionJobPost(tenantId: string, positionId: string): Promise<any>;

  abstract getPositionSkills(tenantId: string, positionId: string): Promise<PositionSkill[]>;

  abstract updatePositionSkill(tenantId: string, data: any): Promise<PositionSkill>;

  abstract getEmployeePerformanceHistory(tenantId: string, employeeId: string): Promise<PerformanceReview[]>;

  abstract getEmployeeGoals(tenantId: string, employeeId: string): Promise<PerformanceGoal[]>;

  abstract updatePerformanceGoal(tenantId: string, data: any): Promise<PerformanceGoal>;

  abstract getCompensation(tenantId: string, employeeId: string): Promise<Compensation | null>;

  abstract updateCompensation(tenantId: string, employeeId: string, data: any): Promise<Compensation>;

  abstract getGoalById(tenantId: string, id: string): Promise<PerformanceGoal | null>;

  abstract getTrainingProgramsBySkills(tenantId: string, skillIds: string[]): Promise<TrainingProgram[]>;

  abstract getEmployeeTrainingHistory(tenantId: string, employeeId: string): Promise<TrainingAssignment[]>;

  abstract enrollInTrainingProgram(tenantId: string, employeeId: string, programId: string): Promise<TrainingAssignment>;

  abstract getTrainingProgramById(tenantId: string, id: string): Promise<TrainingProgram | null>;

  abstract getTrainingPrograms(tenantId: string): Promise<any[]>;

  abstract createTrainingProgram(tenantId: string, data: any): Promise<any>;

  abstract getTrainingAssignments(tenantId: string): Promise<any[]>;

  abstract createTrainingAssignment(tenantId: string, data: any): Promise<any>;

  abstract updateTrainingAssignment(tenantId: string, id: string, data: any): Promise<any>;

  abstract getDepartmentBudgetData(tenantId: string, departmentId: string): Promise<any>;

  abstract getActualLaborCostHistory(tenantId: string, departmentId: string, monthLimit: number): Promise<any[]>;

  abstract getHolidays(tenantId: string): Promise<any[]>;

  abstract createHoliday(tenantId: string, data: any): Promise<any>;

  abstract getComplianceModules(tenantId: string): Promise<any[]>;

  abstract enableComplianceModule(tenantId: string, moduleKey: string, config?: any): Promise<any>;

  abstract getComplianceReports(tenantId: string): Promise<any[]>;

  abstract createComplianceReport(tenantId: string, data: any): Promise<any>;

  abstract getHeadcountTrend(tenantId: string): Promise<any[]>;

  abstract getTurnoverStats(tenantId: string): Promise<any>;

  abstract getDepartmentAnalytics(tenantId: string): Promise<any[]>;

  abstract getCompensationAnalytics(tenantId: string): Promise<any>;

  abstract getRetentionRiskData(tenantId: string): Promise<any[]>;

  abstract getEngagementMetrics(tenantId: string): Promise<any>;

  abstract findTalentBySkills(
    tenantId: string,
    skillIds: string[],
    limit?: number,
  ): Promise<any[]>;

  abstract verifyDocument(
    tenantId: string,
    documentId: string,
    verifiedBy: string,
    status: string,
    details?: any,
  ): Promise<ComplianceDocument>;

  abstract getSuccessionPlan(
    tenantId: string,
    positionId: string,
  ): Promise<SuccessionPlan | null>;

  abstract getBenchStrength(
    tenantId: string,
    departmentId?: string,
  ): Promise<any>;

  abstract updateEmployeeSkill(
    tenantId: string,
    data: any,
  ): Promise<EmployeeSkill>;
}
