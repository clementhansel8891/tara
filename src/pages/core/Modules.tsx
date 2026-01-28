import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LicenseBadge } from "@/components/shared/LicenseBadge";
import { mockModules, Module } from "@/lib/mock-data";
import {
  ShoppingCart,
  Coffee,
  Package,
  Wifi,
  Camera,
  Calculator,
  Users,
  BarChart3,
  Settings,
  Crown,
  Lock,
} from "lucide-react";

const moduleIcons: Record<string, React.ReactNode> = {
  "pos-retail": <ShoppingCart className="h-6 w-6" />,
  "pos-cafe": <Coffee className="h-6 w-6" />,
  "inventory": <Package className="h-6 w-6" />,
  "iot-sensors": <Wifi className="h-6 w-6" />,
  "cctv": <Camera className="h-6 w-6" />,
  "accounting": <Calculator className="h-6 w-6" />,
  "hr": <Users className="h-6 w-6" />,
  "analytics": <BarChart3 className="h-6 w-6" />,
};

const Modules = () => {
  const [modules, setModules] = useState<Module[]>(mockModules);

  const toggleModule = (moduleId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId && m.license !== "expired") {
        return { ...m, enabled: !m.enabled };
      }
      return m;
    }));
  };

  const coreModules = modules.filter(m => ["pos-retail", "pos-cafe", "inventory"].includes(m.id));
  const addOnModules = modules.filter(m => !["pos-retail", "pos-cafe", "inventory"].includes(m.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Modules</h1>
        <p className="text-muted-foreground">Enable or disable system modules and manage licenses</p>
      </div>

      {/* Core Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Core Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreModules.map((module) => (
            <Card key={module.id} className={`relative overflow-hidden transition-all ${
              module.license === "expired" ? "opacity-60" : ""
            } ${module.enabled ? "ring-2 ring-primary" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${module.enabled ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {moduleIcons[module.id] || <Package className="h-6 w-6" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <LicenseBadge status={module.license} />
                    <Switch
                      checked={module.enabled}
                      onCheckedChange={() => toggleModule(module.id)}
                      disabled={module.license === "expired"}
                    />
                  </div>
                </div>
                <CardTitle className="mt-3">{module.name}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {module.enabled ? "Active" : "Disabled"}
                  </span>
                  {module.license === "expired" && (
                    <Button size="sm" variant="outline">
                      <Crown className="h-4 w-4 mr-1" />
                      Renew
                    </Button>
                  )}
                </div>
              </CardContent>
              {module.enabled && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div className="absolute top-3 -right-6 w-20 text-center text-xs font-medium bg-primary text-primary-foreground transform rotate-45">
                    ON
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Add-on Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Crown className="h-5 w-5 text-warning" />
          Add-on Modules
          <Badge variant="secondary" className="ml-2">Premium</Badge>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addOnModules.map((module) => (
            <Card key={module.id} className={`relative overflow-hidden transition-all ${
              module.license === "expired" ? "opacity-60" : ""
            } ${module.enabled ? "ring-2 ring-primary" : ""}`}>
              {module.license === "upgrade" && (
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-warning/10 pointer-events-none" />
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${
                    module.enabled ? "bg-primary text-primary-foreground" : 
                    module.license === "upgrade" ? "bg-warning/20 text-warning" : "bg-muted"
                  }`}>
                    {module.license === "upgrade" ? (
                      <Lock className="h-6 w-6" />
                    ) : (
                      moduleIcons[module.id] || <Package className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <LicenseBadge status={module.license} />
                    {module.license !== "upgrade" && (
                      <Switch
                        checked={module.enabled}
                        onCheckedChange={() => toggleModule(module.id)}
                        disabled={module.license === "expired"}
                      />
                    )}
                  </div>
                </div>
                <CardTitle className="mt-3">{module.name}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  {module.license === "upgrade" ? (
                    <Button size="sm" className="w-full bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70">
                      <Crown className="h-4 w-4 mr-1" />
                      Upgrade to Unlock
                    </Button>
                  ) : (
                    <>
                      <span className="text-muted-foreground">
                        {module.enabled ? "Active" : "Disabled"}
                      </span>
                      {module.license === "expired" && (
                        <Button size="sm" variant="outline">
                          <Crown className="h-4 w-4 mr-1" />
                          Renew
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
              {module.enabled && module.license !== "upgrade" && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div className="absolute top-3 -right-6 w-20 text-center text-xs font-medium bg-primary text-primary-foreground transform rotate-45">
                    ON
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Module Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Module Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">
                {modules.filter(m => m.enabled).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Modules</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-success">
                {modules.filter(m => m.license === "active").length}
              </p>
              <p className="text-sm text-muted-foreground">Licensed</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-warning">
                {modules.filter(m => m.license === "trial").length}
              </p>
              <p className="text-sm text-muted-foreground">Trial</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-muted-foreground">
                {modules.filter(m => m.license === "upgrade").length}
              </p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Modules;
