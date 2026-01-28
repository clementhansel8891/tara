import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart,
  Camera,
  Wifi,
  Calculator,
  CreditCard,
  Mail,
  MessageSquare,
  Cloud,
  CheckCircle2,
  XCircle,
  Settings,
  ExternalLink,
  Lock,
  Zap,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "error" | "locked";
  category: "pos" | "monitoring" | "accounting" | "communication" | "payment";
  lastSync?: string;
  isPremium?: boolean;
}

const initialIntegrations: Integration[] = [
  {
    id: "pos-sync",
    name: "POS Sync",
    description: "Real-time synchronization with POS terminals",
    icon: <ShoppingCart className="h-6 w-6" />,
    status: "connected",
    category: "pos",
    lastSync: "2 minutes ago",
  },
  {
    id: "cctv",
    name: "CCTV System",
    description: "Security camera integration and monitoring",
    icon: <Camera className="h-6 w-6" />,
    status: "connected",
    category: "monitoring",
    lastSync: "Live",
  },
  {
    id: "iot-sensors",
    name: "IoT Sensors",
    description: "Temperature, humidity, and motion sensors",
    icon: <Wifi className="h-6 w-6" />,
    status: "disconnected",
    category: "monitoring",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Accounting and financial reporting",
    icon: <Calculator className="h-6 w-6" />,
    status: "locked",
    category: "accounting",
    isPremium: true,
  },
  {
    id: "xero",
    name: "Xero",
    description: "Cloud accounting software integration",
    icon: <Cloud className="h-6 w-6" />,
    status: "locked",
    category: "accounting",
    isPremium: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Online payment processing",
    icon: <CreditCard className="h-6 w-6" />,
    status: "connected",
    category: "payment",
    lastSync: "Real-time",
  },
  {
    id: "email",
    name: "Email Notifications",
    description: "Automated email alerts and reports",
    icon: <Mail className="h-6 w-6" />,
    status: "connected",
    category: "communication",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Customer notifications via WhatsApp",
    icon: <MessageSquare className="h-6 w-6" />,
    status: "error",
    category: "communication",
  },
];

const Integrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const toggleIntegration = (id: string) => {
    setIntegrations(integrations.map(i => {
      if (i.id === id && i.status !== "locked") {
        return {
          ...i,
          status: i.status === "connected" ? "disconnected" : "connected",
          lastSync: i.status === "disconnected" ? "Just now" : undefined,
        };
      }
      return i;
    }));
  };

  const getStatusBadge = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case "locked":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Lock className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        );
    }
  };

  const getCategoryLabel = (category: Integration["category"]) => {
    switch (category) {
      case "pos": return "Point of Sale";
      case "monitoring": return "Monitoring";
      case "accounting": return "Accounting";
      case "communication": return "Communication";
      case "payment": return "Payment";
    }
  };

  const categories = ["pos", "monitoring", "payment", "communication", "accounting"] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground">Connect third-party services and manage data sync</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Sync All
          </Button>
        </div>
      </div>

      {/* Connection Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-success">
              {integrations.filter(i => i.status === "connected").length}
            </p>
            <p className="text-sm text-muted-foreground">Connected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-muted-foreground">
              {integrations.filter(i => i.status === "disconnected").length}
            </p>
            <p className="text-sm text-muted-foreground">Disconnected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-destructive">
              {integrations.filter(i => i.status === "error").length}
            </p>
            <p className="text-sm text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-warning">
              {integrations.filter(i => i.status === "locked").length}
            </p>
            <p className="text-sm text-muted-foreground">Premium</p>
          </CardContent>
        </Card>
      </div>

      {/* Integrations by Category */}
      {categories.map(category => {
        const categoryIntegrations = integrations.filter(i => i.category === category);
        if (categoryIntegrations.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold">{getCategoryLabel(category)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryIntegrations.map((integration) => (
                <Card
                  key={integration.id}
                  className={`transition-all ${
                    integration.status === "locked" ? "opacity-75" : ""
                  } ${integration.status === "error" ? "border-destructive/50" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        integration.status === "connected" ? "bg-primary/10 text-primary" :
                        integration.status === "error" ? "bg-destructive/10 text-destructive" :
                        integration.status === "locked" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {integration.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-medium">{integration.name}</h3>
                          {getStatusBadge(integration.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {integration.description}
                        </p>
                        {integration.lastSync && integration.status === "connected" && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Last sync: {integration.lastSync}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      {integration.status === "locked" ? (
                        <Button size="sm" variant="outline" className="w-full">
                          <Lock className="h-4 w-4 mr-2" />
                          Upgrade to Connect
                        </Button>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={integration.status === "connected"}
                              onCheckedChange={() => toggleIntegration(integration.id)}
                            />
                            <span className="text-sm">
                              {integration.status === "connected" ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedIntegration(integration)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  {integration.icon}
                                  {integration.name} Settings
                                </DialogTitle>
                                <DialogDescription>
                                  Configure your {integration.name} integration
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label>API Key</Label>
                                  <Input
                                    type="password"
                                    placeholder="Enter API key"
                                    defaultValue="••••••••••••••••"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Webhook URL</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      readOnly
                                      value={`https://api.example.com/webhooks/${integration.id}`}
                                    />
                                    <Button variant="outline" size="icon">
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                  <div>
                                    <p className="font-medium">Auto-sync</p>
                                    <p className="text-sm text-muted-foreground">
                                      Sync data every 5 minutes
                                    </p>
                                  </div>
                                  <Switch defaultChecked />
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" className="flex-1">
                                    Test Connection
                                  </Button>
                                  <Button className="flex-1">Save Changes</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Integrations;
