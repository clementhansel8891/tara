import { Badge } from "@/components/ui/badge";

type ApprovalStatusBadgeProps = {
  status: string;
};

export function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  const upper = status.toUpperCase();
  const tone =
    upper === "APPROVED" || upper === "SUCCESS" || upper === "HEALTHY"
      ? "default"
      : upper === "REJECTED" || upper === "FAILED" || upper === "CRITICAL"
        ? "destructive"
        : upper === "PENDING" || upper === "WARN" || upper === "MEDIUM"
          ? "secondary"
          : "outline";
  return <Badge variant={tone}>{upper}</Badge>;
}

export default ApprovalStatusBadge;
