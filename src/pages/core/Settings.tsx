import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import {
  Building2,
  MapPin,
  Globe,
  Smartphone,
  Monitor,
  Shield,
  Database,
  RefreshCw,
  Lock,
  Save,
  Plus,
  Trash2,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { state, updateSettings } = useApp();
  const [businessProfile, setBusinessProfile] = useState({
    name: "Sample Business",
    legalName: "Sample Business Pte Ltd",
    taxId: "123-456-789",
    email: "contact@samplebusiness.com",
    phone: "+65 1234 5678",
    address: "123 Business Street, Singapore 123456",
    website: "www.samplebusiness.com",
    timezone: "Asia/Singapore",
    currency: "SGD",
  });

  const [branches] = useState([
    { id: "1", name: "Main Branch", address: "123 Main St", status: "active" },
    { id: "2", name: "Downtown", address: "456 Downtown Ave", status: "active" },
    { id: "3", name: "Airport", address: "Terminal 3", status: "inactive" },
  ]);

  const [devices] = useState([
    { id: "1", name: "POS Terminal 1", type: "tablet", branch: "Main Branch", lastSeen: "2 min ago", status: "online" },
    { id: "2", name: "POS Terminal 2", type: "tablet", branch: "Main Branch", lastSeen: "5 min ago", status: "online" },
    { id: "3", name: "Kitchen Display", type: "display", branch: "Main Branch", lastSeen: "1 min ago", status: "online" },
    { id: "4", name: "POS Terminal 3", type: "tablet", branch: "Downtown", lastSeen: "1 hour ago", status: "offline" },
  ]);

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your business configuration and preferences</p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="backup">Backup & Sync</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Basic information about your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={businessProfile.name}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal-name">Legal Name</Label>
                  <Input
                    id="legal-name"
                    value={businessProfile.legalName}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, legalName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID / Business Registration</Label>
                  <Input
                    id="tax-id"
                    value={businessProfile.taxId}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, taxId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessProfile.email}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={businessProfile.phone}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={businessProfile.website}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, website: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={businessProfile.address}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={businessProfile.timezone} onValueChange={(v) => setBusinessProfile({ ...businessProfile, timezone: v })}>
                    <SelectTrigger>
                      <Globe className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">Hong Kong (GMT+8)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={businessProfile.currency} onValueChange={(v) => setBusinessProfile({ ...businessProfile, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Branch Locations
                </CardTitle>
                <CardDescription>
                  Manage your business locations
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Branch
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${branch.status === "active" ? "bg-success/10" : "bg-muted"}`}>
                        <MapPin className={`h-5 w-5 ${branch.status === "active" ? "text-success" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">{branch.name}</h3>
                        <p className="text-sm text-muted-foreground">{branch.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={branch.status === "active" ? "default" : "secondary"}>
                        {branch.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Registered Devices
                </CardTitle>
                <CardDescription>
                  Manage POS terminals and displays
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Register Device
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${device.status === "online" ? "bg-success/10" : "bg-muted"}`}>
                        {device.type === "tablet" ? (
                          <Smartphone className={`h-5 w-5 ${device.status === "online" ? "text-success" : "text-muted-foreground"}`} />
                        ) : (
                          <Monitor className={`h-5 w-5 ${device.status === "online" ? "text-success" : "text-muted-foreground"}`} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{device.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {device.branch} • Last seen: {device.lastSeen}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${device.status === "online" ? "bg-success" : "bg-muted-foreground"}`} />
                      <span className="text-sm capitalize">{device.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup & Sync
              </CardTitle>
              <CardDescription>
                Manage data backup and synchronization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="font-medium">Auto Backup</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup data daily
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Last Backup</Label>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">backup_2024-01-15_08-00.zip</p>
                    <p className="text-sm text-muted-foreground">156 MB • January 15, 2024 at 8:00 AM</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
                <Button>
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 text-warning" />
                    <div>
                      <h3 className="font-medium">Remote Access</h3>
                      <p className="text-sm text-muted-foreground">
                        Access your dashboard from anywhere
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-warning border-warning">
                      Premium
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage access control and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Require PIN for sensitive actions</h3>
                    <p className="text-sm text-muted-foreground">
                      Require staff PIN for voids, refunds, and discounts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Auto-lock after inactivity</h3>
                    <p className="text-sm text-muted-foreground">
                      Lock POS terminals after 5 minutes of inactivity
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Log all transactions</h3>
                    <p className="text-sm text-muted-foreground">
                      Keep detailed audit trail of all actions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Select defaultValue="30">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
