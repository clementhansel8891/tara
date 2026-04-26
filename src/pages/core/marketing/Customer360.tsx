import React from "react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  TrendingUp, 
  ShoppingCart, 
  MousePointer2, 
  MessageSquare,
  Clock,
  Calendar,
  Zap,
  Tag,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const TIMELINE_EVENTS = [
  { id: 1, type: 'email', title: 'Opened Summer Promo Email', date: '2 hours ago', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 2, type: 'web', title: 'Visited Pricing Page (3 mins)', date: '5 hours ago', icon: MousePointer2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 3, type: 'retail', title: 'Purchased Classic Jacket (Offline)', date: 'Yesterday', icon: ShoppingCart, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 4, type: 'chat', title: 'WhatsApp Inquiry: Size Guide', date: '2 days ago', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-600/10' },
  { id: 5, type: 'system', title: 'Scored High Intent (AI)', date: '3 days ago', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

export default function Customer360() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header: Identity & Core Stats */}
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-2xl">
                <AvatarFallback className="bg-indigo-500 text-white text-2xl font-bold">SJ</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Sarah Jenkins</h1>
                  <Badge className="bg-indigo-500 hover:bg-indigo-600">VIP GOLD</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> sarah@enterprise.com</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> +1 (555) 012-3456</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> San Francisco, USA</span>
                </div>
              </div>
              <div className="hidden md:flex gap-2">
                <Button variant="outline">Edit Profile</Button>
                <Button>Create Task</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full lg:w-80 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Behavioral IQ</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <div className="text-5xl font-black text-indigo-500 mb-1">87</div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Growth Score</p>
              <div className="mt-4 space-y-1">
                <Progress value={87} className="h-2" />
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-green-500 flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> +12% MoM</span>
                  <span className="text-slate-400 text-[9px] uppercase">High Intent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Financials & Attribution */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[
               { label: 'LTV (Estimated)', val: '$4,280', color: 'text-indigo-600', sub: 'Last 12 months' },
               { label: 'Purchases', val: '14', color: 'text-slate-900', sub: 'Offline + Online' },
               { label: 'Email CTR', val: '24.2%', color: 'text-green-500', sub: 'High engagement' },
             ].map((stat, i) => (
               <Card key={i}>
                  <CardContent className="p-4">
                     <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{stat.label}</p>
                     <p className={cn("text-2xl font-bold", stat.color)}>{stat.val}</p>
                     <p className="text-[10px] text-slate-500 mt-1">{stat.sub}</p>
                  </CardContent>
               </Card>
             ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unified Activity Timeline</CardTitle>
              <CardDescription>Omnichannel interactions across Marketing, Sales, and Retail.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {TIMELINE_EVENTS.map((event) => (
                  <div key={event.id} className="relative pl-12">
                    <div className={cn("absolute left-0 top-0 h-9 w-9 rounded-full flex items-center justify-center border-4 border-background shadow-sm z-10", event.bg)}>
                      <event.icon className={cn("h-4 w-4", event.color)} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{event.title}</h4>
                        <span className="text-[10px] font-medium text-slate-400">{event.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Interaction via {event.type.toUpperCase()} Channel</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-6 text-xs text-slate-400">View All 142 Events</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Segmentation & CRM */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Segmentation Tags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100">Power Buyer</Badge>
              <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100">Eco-Conscious</Badge>
              <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100">Webinar Attendee</Badge>
              <Badge variant="secondary">Early Adopter</Badge>
              <Badge variant="secondary">Tech Enthusiast</Badge>
              <Button variant="outline" size="sm" className="h-6 w-6 rounded-full p-0"><Zap className="h-3 w-3" /></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle className="text-sm font-bold uppercase tracking-wider">CRM Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Industry</span>
                     <span className="font-semibold">Retail & Apparel</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Employee Band</span>
                     <span className="font-semibold">500-1,000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Assigned Owner</span>
                     <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-slate-200" />
                        <span className="font-semibold">Mark Thompson</span>
                     </div>
                  </div>
               </div>
               <Separator />
               <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Recent Notes</p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-[11px] leading-relaxed text-slate-600 italic">
                     "Sarah mentioned interest in our Q4 enterprise tier. High potential for upsell."
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white overflow-hidden border-0">
             <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                   <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                      <Zap className="h-5 w-5 text-white" />
                   </div>
                   <div>
                      <h4 className="font-bold text-sm">Next AI Action</h4>
                      <p className="text-[10px] text-slate-400">Powered by Zenvix Intelligence</p>
                   </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                   "High probability of churn if no contact in 7 days. Recommend sending <strong>Loyalty Reward</strong> coupon via SMS."
                </p>
                <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white border-0 h-9 text-xs font-bold">Deploy Recommendation</Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
