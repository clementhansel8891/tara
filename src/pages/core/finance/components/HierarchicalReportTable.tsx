import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportNode {
  accountCode: string;
  accountName: string;
  level: number;
  balance: number;
  isGroup: boolean;
  children?: ReportNode[];
}

interface HierarchicalReportTableProps {
  data: ReportNode[];
  title: string;
}

const ReportRow: React.FC<{ node: ReportNode; isExpanded: boolean; onToggle: () => void }> = ({
  node,
  isExpanded,
  onToggle,
}) => {
  return (
    <tr
      className={cn(
        "group border-b transition-colors hover:bg-muted/50",
        node.isGroup ? "bg-muted/30 font-semibold" : "bg-background"
      )}
    >
      <td className="p-3" style={{ paddingLeft: `${node.level * 1.5 + 0.75}rem` }}>
        <div className="flex items-center gap-2">
          {node.isGroup ? (
            <button
              onClick={onToggle}
              className="flex h-5 w-5 items-center justify-center rounded-sm hover:bg-muted"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <span className="text-muted-foreground">{node.accountCode}</span>
          <span>{node.accountName}</span>
        </div>
      </td>
      <td className={cn("p-3 text-right", node.balance < 0 ? "text-destructive" : "")}>
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(node.balance)}
      </td>
    </tr>
  );
};

const RecursiveRows: React.FC<{ node: ReportNode }> = ({ node }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <ReportRow
        node={node}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />
      {isExpanded && node.children?.map((child) => (
        <RecursiveRows key={child.accountCode} node={child} />
      ))}
    </>
  );
};

export const HierarchicalReportTable: React.FC<HierarchicalReportTableProps> = ({ data, title }) => {
  return (
    <div className="rounded-md border">
      <div className="bg-muted px-4 py-2 font-medium">{title}</div>
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3 text-left">Account</th>
            <th className="p-3 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.map((root) => (
            <RecursiveRows key={root.accountCode} node={root} />
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={2} className="p-8 text-center text-muted-foreground">
                No report data available for the selected period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
