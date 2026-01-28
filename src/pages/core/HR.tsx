import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  UserPlus,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Award,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';

// Mock HR data
const employees = [
  { id: 1, name: 'John Smith', role: 'Store Manager', department: 'Operations', status: 'active', email: 'john@opscore.com', phone: '+1 234 567 890', hireDate: '2022-03-15', salary: 55000 },
  { id: 2, name: 'Sarah Johnson', role: 'Shift Supervisor', department: 'POS Retail', status: 'active', email: 'sarah@opscore.com', phone: '+1 234 567 891', hireDate: '2022-06-20', salary: 42000 },
  { id: 3, name: 'Michael Chen', role: 'Barista', department: 'POS Cafe', status: 'active', email: 'michael@opscore.com', phone: '+1 234 567 892', hireDate: '2023-01-10', salary: 32000 },
  { id: 4, name: 'Emily Davis', role: 'Cashier', department: 'POS Retail', status: 'on-leave', email: 'emily@opscore.com', phone: '+1 234 567 893', hireDate: '2023-04-05', salary: 30000 },
  { id: 5, name: 'David Wilson', role: 'Kitchen Staff', department: 'POS Cafe', status: 'active', email: 'david@opscore.com', phone: '+1 234 567 894', hireDate: '2023-08-12', salary: 28000 },
];

const leaveRequests = [
  { id: 1, employee: 'Emily Davis', type: 'Annual Leave', startDate: '2024-01-25', endDate: '2024-01-30', status: 'pending', days: 5 },
  { id: 2, employee: 'Michael Chen', type: 'Sick Leave', startDate: '2024-01-22', endDate: '2024-01-23', status: 'approved', days: 2 },
  { id: 3, employee: 'Sarah Johnson', type: 'Personal', startDate: '2024-02-01', endDate: '2024-02-02', status: 'pending', days: 2 },
];

const payrollSummary = {
  totalPayroll: 187000,
  paidThisMonth: 156000,
  pending: 31000,
  nextPayday: '2024-01-31',
};

export default function HR() {
  const [activeTab, setActiveTab] = useState('employees');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Human Resources</h1>
          <p className="text-muted-foreground">Employee management and payroll</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold">{employees.filter(e => e.status === 'on-leave').length}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Calendar className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payroll</p>
                <p className="text-2xl font-bold">{formatCurrency(payrollSummary.totalPayroll)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{leaveRequests.filter(l => l.status === 'pending').length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <Card>
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {filteredEmployees.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{emp.name}</h4>
                          <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                            {emp.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{emp.role}</p>
                        <p className="text-xs text-muted-foreground">{emp.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {emp.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {emp.phone}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(emp.salary)}/yr</p>
                        <p className="text-sm text-muted-foreground">Since {emp.hireDate}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Tracking</CardTitle>
              <CardDescription>Daily attendance records synced from POS systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Attendance data is synced from POS shift records</p>
                <p className="text-sm mt-2">View detailed attendance reports in the Reports module</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaveRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{req.employee}</p>
                        <p className="text-sm text-muted-foreground">{req.type} • {req.days} days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{req.startDate} - {req.endDate}</p>
                      <Badge variant={req.status === 'approved' ? 'default' : req.status === 'pending' ? 'secondary' : 'destructive'}>
                        {req.status}
                      </Badge>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Reject</Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold">{formatCurrency(payrollSummary.totalPayroll)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Paid This Month</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(payrollSummary.paidThisMonth)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Next Payday</p>
                <p className="text-2xl font-bold">{payrollSummary.nextPayday}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Payroll Processing</CardTitle>
              <CardDescription>Manage salary payments and deductions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Payroll processing integrates with Finance module</p>
                <Button className="mt-4">Process Payroll</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
