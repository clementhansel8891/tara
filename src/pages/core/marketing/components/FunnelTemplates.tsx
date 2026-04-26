import React from "react";
import { 
  Layout, 
  MousePointer2, 
  Zap, 
  Target, 
  Flame, 
  Users, 
  ShoppingCart,
  ChevronRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TEMPLATES = [
  {
    id: "lead-magnet",
    name: "Classic Lead Magnet",
    description: "Free report or guide in exchange for contact info.",
    steps: ["Landing Page", "Thank You Page"],
    icon: Users,
    color: "text-blue-500",
    difficulty: "Easy"
  },
  {
    id: "vsl",
    name: "Video Sales Letter (VSL)",
    description: "High-conversion sales path driven by video content.",
    steps: ["VSL Page", "Checkout", "Upsell", "Thank You"],
    icon: Flame,
    color: "text-orange-500",
    difficulty: "Advanced"
  },
  {
    id: "webinar",
    name: "Automated Webinar",
    description: "Multi-touch registration and replay funnel.",
    steps: ["Reg Page", "Waiting Room", "Webinar Room", "Sales Page", "Thank You"],
    icon: Zap,
    color: "text-purple-500",
    difficulty: "Expert"
  },
  {
    id: "ecommerce",
    name: "E-commerce Flash Sale",
    description: "Optimized for quick physical product sales.",
    steps: ["Product Page", "Checkout", "Post-Purchase Upsell", "Receipt"],
    icon: ShoppingCart,
    color: "text-green-500",
    difficulty: "Medium"
  }
];

export default function FunnelTemplates({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {TEMPLATES.map((template) => (
        <Card 
          key={template.id} 
          className="group hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden"
          onClick={() => onSelect(template.id)}
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className={`h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
              <template.icon className={`h-5 w-5 ${template.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">{template.name}</CardTitle>
                <Badge variant="outline" className="text-[9px] py-0">{template.difficulty}</Badge>
              </div>
              <CardDescription className="text-[11px] leading-tight mt-1">{template.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
             <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium overflow-hidden whitespace-nowrap">
                {template.steps.map((step, i) => (
                   <React.Fragment key={step}>
                      <span>{step}</span>
                      {i < template.steps.length - 1 && <ChevronRight className="h-3 w-3 shrink-0" />}
                   </React.Fragment>
                ))}
             </div>
             <Button variant="ghost" size="sm" className="w-full mt-4 h-8 text-xs group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                Use Template
             </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
