import { Injectable, Logger } from "@nestjs/common";
import { IHRRepository } from "./repositories/hr.repository.interface";

@Injectable()
export class TotalRewardsService {
  private readonly logger = new Logger(TotalRewardsService.name);

  constructor(private readonly repository: IHRRepository) {}

  async calculateTotalRewards(tenantId: string, employeeId: string) {
    this.logger.log(`Calculating total rewards for employee ${employeeId}`);
    
    // 1. Get Base Salary
    const employee = await this.repository.getEmployeeById(tenantId, employeeId);
    if (!employee) throw new Error("Employee not found");
    
    const baseSalary = employee.baseSalary || 0;
    
    // 2. Get active benefits and calculate employer portion
    const enrollments = await this.repository.getEmployeeBenefits(tenantId, employeeId);
    const activeBenefits = enrollments.filter(e => e.status === "ACTIVE");
    
    const totalBenefitValue = activeBenefits.reduce((sum, e) => {
      const plan = e.plan;
      if (!plan) return sum;
      
      // If frequency is monthly, annualize it
      const multiplier = plan.frequency === "MONTHLY" ? 12 : 1;
      return sum + (plan.employerContribution * multiplier);
    }, 0);

    return {
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      baseSalary,
      totalBenefitValue,
      totalRewards: baseSalary + totalBenefitValue,
      currency: employee.currency || "USD",
      breakdown: [
        { label: "Base Salary", value: baseSalary, category: "Cash" },
        ...activeBenefits.map(e => ({
          label: e.plan?.name || "Benefit",
          value: (e.plan?.employerContribution || 0) * (e.plan?.frequency === "MONTHLY" ? 12 : 1),
          category: "Non-Cash"
        }))
      ]
    };
  }

  async getRecommendedBenefits(tenantId: string, employeeId: string) {
    this.logger.log(`Generating benefit recommendations for ${employeeId}`);
    
    const allPlans = await this.repository.getBenefitPlans(tenantId);
    const currentBenefits = await this.repository.getEmployeeBenefits(tenantId, employeeId);
    const currentPlanIds = currentBenefits.map(b => b.planId);
    
    // Suggest plans employee isn't yet enrolled in
    return allPlans.filter(p => !currentPlanIds.includes(p.id));
  }
}
