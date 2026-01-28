import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  Camera,
  Lock,
  Key,
  AlertTriangle,
  Users,
  Eye,
  Clock,
  MapPin,
  Activity,
  Bell,
  Search,
  CheckCircle,
  XCircle,
  Wifi,
} from 'lucide-react';

// Mock security data
const accessLogs = [
  { id: 1, user: 'John Smith', action: 'Login', location: 'Main Terminal', time: '09:30:15', status: 'success' },
  { id: 2, user: 'Sarah Johnson', action: 'Clock In', location: 'POS Retail', time: '09:15:00', status: 'success' },
  { id: 3, user: 'Unknown', action: 'Failed Login', location: 'Back Office', time: '09:05:22', status: 'failed' },
  { id: 4, user: 'Michael Chen', action: 'Clock In', location: 'POS Cafe', time: '08:55:00', status: 'success' },
  { id: 5, user: 'Emily Davis', action: 'Access Denied', location: 'Server Room', time: '08:45:12', status: 'failed' },
];

const cameras = [
  { id: 1, name: 'Main Entrance', location: 'Front', status: 'online', recording: true },
  { id: 2, name: 'Cash Register 1', location: 'Retail Floor', status: 'online', recording: true },
  { id: 3, name: 'Cash Register 2', location: 'Retail Floor', status: 'online', recording: true },
  { id: 4, name: 'Kitchen', location: 'Cafe', status: 'online', recording: true },
  { id: 5, name: 'Storage Room', location: 'Back', status: 'offline', recording: false },
  { id: 6, name: 'Back Exit', location: 'Back', status: 'online', recording: true },
];

const alerts = [
  { id: 1, type: 'warning', message: 'Multiple failed login attempts detected', time: '10 min ago', resolved: false },
  { id: 2, type: 'info', message: 'Camera 5 went offline', time: '25 min ago', resolved: false },
  { id: 3, type: 'success', message: 'Security scan completed - no issues found', time: '1 hour ago', resolved: true },
  { id: 4, type: 'warning', message: 'After-hours access detected', time: '2 hours ago', resolved: true },
];

const accessZones = [
  { name: 'Main Floor', level: 'Public', activeUsers: 12 },
  { name: 'Back Office', level: 'Staff', activeUsers: 3 },
  { name: 'Server Room', level: 'Admin', activeUsers: 0 },
  { name: 'Storage', level: 'Staff', activeUsers: 1 },
];

export default function Security() {
  const [activeTab, setActiveTab] = useState('overview');

  const onlineCameras = cameras.filter(c => c.status === 'online').length;
  const activeAlerts = alerts.filter(a => !a.resolved).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Security</h1>
          <p className="text-muted-foreground">Access control and surveillance monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            {activeAlerts} Alerts
          </Button>
          <Button>
            <Shield className="h-4 w-4 mr-2" />
            Security Report
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cameras Online</p>
                <p className="text-2xl font-bold">{onlineCameras}/{cameras.length}</p>
              </div>
              <Camera className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">16</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Access Points</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Lock className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-yellow-500">{activeAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold text-green-500">Secure</p>
              </div>
              <Shield className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cameras">Cameras</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Access Zones */}
            <Card>
              <CardHeader>
                <CardTitle>Access Zones</CardTitle>
                <CardDescription>Current occupancy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accessZones.map((zone) => (
                    <div key={zone.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{zone.name}</p>
                          <p className="text-xs text-muted-foreground">{zone.level} Access</p>
                        </div>
                      </div>
                      <Badge variant="outline">{zone.activeUsers} users</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 4).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-full ${
                        alert.type === 'warning' ? 'bg-yellow-500/10' : 
                        alert.type === 'success' ? 'bg-green-500/10' : 'bg-blue-500/10'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          alert.type === 'warning' ? 'text-yellow-500' : 
                          alert.type === 'success' ? 'text-green-500' : 'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                      {alert.resolved && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Camera Status */}
            <Card>
              <CardHeader>
                <CardTitle>Camera Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cameras.slice(0, 4).map((camera) => (
                    <div key={camera.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Camera className={`h-4 w-4 ${camera.status === 'online' ? 'text-green-500' : 'text-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium">{camera.name}</p>
                          <p className="text-xs text-muted-foreground">{camera.location}</p>
                        </div>
                      </div>
                      <Badge variant={camera.status === 'online' ? 'default' : 'destructive'}>
                        {camera.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Access Log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Access Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accessLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      {log.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{log.user}</p>
                        <p className="text-sm text-muted-foreground">{log.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{log.location}</p>
                      <p className="text-xs text-muted-foreground">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cameras" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>CCTV Cameras</CardTitle>
              <CardDescription>Surveillance system management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {cameras.map((camera) => (
                  <div key={camera.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{camera.name}</h4>
                        <div className="flex items-center gap-1">
                          <Wifi className={`h-4 w-4 ${camera.status === 'online' ? 'text-green-500' : 'text-red-500'}`} />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{camera.location}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${camera.recording ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
                          <span className="text-xs">{camera.recording ? 'Recording' : 'Not Recording'}</span>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Access Points</CardTitle>
                <CardDescription>Door and entry management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Main Entrance', 'Staff Entrance', 'Server Room', 'Storage'].map((door) => (
                    <div key={door} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{door}</p>
                          <p className="text-xs text-muted-foreground">Card + PIN Required</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">Locked</Badge>
                        <Button variant="outline" size="sm">Unlock</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Rules</CardTitle>
                <CardDescription>Time-based access control</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">After-hours lockdown</p>
                      <p className="text-sm text-muted-foreground">Lock all doors after 10 PM</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekend restrictions</p>
                      <p className="text-sm text-muted-foreground">Admin-only on weekends</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Visitor logging</p>
                      <p className="text-sm text-muted-foreground">Log all visitor access</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>Active and resolved security events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`flex items-center justify-between p-4 rounded-lg ${
                      alert.resolved ? 'bg-muted/50' : 'bg-yellow-500/5 border border-yellow-500/20'
                    }`}>
                      <div className="flex items-center gap-4">
                        <AlertTriangle className={`h-5 w-5 ${
                          alert.type === 'warning' ? 'text-yellow-500' : 
                          alert.type === 'success' ? 'text-green-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">{alert.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.resolved ? (
                          <Badge variant="secondary">Resolved</Badge>
                        ) : (
                          <>
                            <Button variant="outline" size="sm">Dismiss</Button>
                            <Button size="sm">Investigate</Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
