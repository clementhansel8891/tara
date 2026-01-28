import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockTasks, mockIncidents, generateId, Task, Incident } from "@/lib/mock-data";
import { Plus, Search, Filter, Clock, AlertTriangle, CheckCircle2, Circle } from "lucide-react";

const Operations = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [searchQuery, setSearchQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);

  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", assignedTo: "" });
  const [newIncident, setNewIncident] = useState({ title: "", description: "", priority: "medium", location: "" });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = taskFilter === "all" || task.status === taskFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredIncidents = incidents.filter(incident =>
    incident.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTask = () => {
    const task: Task = {
      id: generateId(),
      title: newTask.title,
      description: newTask.description,
      status: "pending",
      priority: newTask.priority as "low" | "medium" | "high",
      assignedTo: newTask.assignedTo,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setTasks([task, ...tasks]);
    setNewTask({ title: "", description: "", priority: "medium", assignedTo: "" });
    setIsTaskDialogOpen(false);
  };

  const handleAddIncident = () => {
    const incident: Incident = {
      id: generateId(),
      title: newIncident.title,
      description: newIncident.description,
      type: 'other',
      status: "open",
      priority: newIncident.priority as "low" | "medium" | "high" | "critical",
      reportedBy: "Current User",
      reportedAt: new Date().toISOString(),
      location: newIncident.location,
      createdAt: new Date().toISOString(),
    };
    setIncidents([incident, ...incidents]);
    setNewIncident({ title: "", description: "", priority: "medium", location: "" });
    setIsIncidentDialogOpen(false);
  };

  const updateTaskStatus = (taskId: string, status: Task["status"]) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const updateIncidentStatus = (incidentId: string, status: Incident["status"]) => {
    setIncidents(incidents.map(i => i.id === incidentId ? { ...i, status } : i));
  };

  const getTaskIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "in-progress": return <Clock className="h-4 w-4 text-warning" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operations</h1>
          <p className="text-muted-foreground">Manage tasks and track incidents</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Title</Label>
                  <Input
                    id="task-title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Describe the task"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigned-to">Assign To</Label>
                    <Input
                      id="assigned-to"
                      value={newTask.assignedTo}
                      onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                      placeholder="Staff name"
                    />
                  </div>
                </div>
                <Button onClick={handleAddTask} className="w-full" disabled={!newTask.title}>
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Incident</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="incident-title">Title</Label>
                  <Input
                    id="incident-title"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                    placeholder="Brief incident description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident-description">Details</Label>
                  <Textarea
                    id="incident-description"
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    placeholder="Provide detailed information"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newIncident.priority} onValueChange={(v) => setNewIncident({ ...newIncident, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newIncident.location}
                      onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                      placeholder="Where it happened"
                    />
                  </div>
                </div>
                <Button onClick={handleAddIncident} className="w-full" disabled={!newIncident.title}>
                  Submit Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks and incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={taskFilter} onValueChange={setTaskFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="incidents">Incidents ({filteredIncidents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tasks found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => updateTaskStatus(task.id, task.status === "completed" ? "pending" : "completed")}
                        className="mt-1"
                      >
                        {getTaskIcon(task.status)}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </h3>
                          <StatusBadge status={task.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {task.assignedTo && <span>Assigned to: {task.assignedTo}</span>}
                          {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                          <StatusBadge status={task.priority} />
                        </div>
                      </div>
                      <Select
                        value={task.status}
                        onValueChange={(v) => updateTaskStatus(task.id, v as Task["status"])}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No incidents reported</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map((incident) => (
                <Card key={incident.id} className={`border-l-4 ${
                  incident.priority === "critical" ? "border-l-destructive" :
                  incident.priority === "high" ? "border-l-warning" :
                  "border-l-muted"
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${
                            incident.priority === "critical" ? "text-destructive" :
                            incident.priority === "high" ? "text-warning" :
                            "text-muted-foreground"
                          }`} />
                          <h3 className="font-medium">{incident.title}</h3>
                          <StatusBadge status={incident.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{incident.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Reported by: {incident.reportedBy}</span>
                          {incident.location && <span>Location: {incident.location}</span>}
                          <span>{new Date(incident.reportedAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <Select
                        value={incident.status}
                        onValueChange={(v) => updateIncidentStatus(incident.id, v as Incident["status"])}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Operations;
