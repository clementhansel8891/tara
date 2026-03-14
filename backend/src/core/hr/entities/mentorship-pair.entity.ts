export class MentorshipPair {
  id: string;
  tenantId: string;
  mentorId: string;
  menteeId: string;
  status: string; // ACTIVE, COMPLETED, TERMINATED
  startDate: Date;
  endDate?: Date;
  focusSkills: string[];
  createdAt: Date;
  updatedAt: Date;

  mentor?: any;
  mentee?: any;
}
