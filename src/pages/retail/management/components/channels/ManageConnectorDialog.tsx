import React, { useState } from "react";
import {
  Globe,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  ShieldCheck,
  Zap,
  ArrowRight,
  Server,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CredentialField } from "../shared/SharedUI";
import { ecommerceHubService } from "@/core/services/retail/ecommerceHubService";
import type { RetailChannel } from "@/core/types/retail/retail";
import { useSession } from "@/core/security/session";
import { useToast } from "@/hooks/use-toast";

interface ManageConnectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  branchIds: string[];
  gatewayUrl: string;
  copyCredential: (value: string, label: string) => void;
}

export const ManageConnectorDialog = ({
  isOpen,
  onClose,
  onSuccess,
  branchIds,
  gatewayUrl,
  copyCredential,
}: ManageConnectorDialogProps) => {
  const session = useSession();
  const { toast } = useToast();

  // State
  const [step, setStep] = useState<"CONFIG" | "SUCCESS">("CONFIG");
  const [channelType, setChannelType] = useState<string>("OWNED");
  const [channelName, setChannelName] = useState("");
  const [syncFreq, setSyncFreq] = useState("15min");
  const [platform, setPlatform] = useState("custom");
  const [isProcessing, setIsProcessing] = useState(false);

  const [marketplaceApiKey, setMarketplaceApiKey] = useState("");
  const [marketplaceApiSecret, setMarketplaceApiSecret] = useState("");

  const [generatedCreds, setGeneratedCreds] = useState<{
    connectorId: string;
    apiKey: string;
    channelId: string;
    clientId: string;
    clientSecret: string;
  } | null>(null);

  const handleCreate = async () => {
    if (!channelName) {
      toast({
        title: "Missing Name",
        description: "Channel name is required.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);
    try {
      if (channelType === "OWNED") {
        const conn = await ecommerceHubService.createConnector(session, {
          name: channelName,
          platform: platform,
          domain: `${channelName.toLowerCase().replace(/\s+/g, "-")}.zenvix.io`,
          branchIds,
        });

        const ch = await ecommerceHubService.createChannel(session, {
          name: channelName,
          type: "OWNED",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          adapterType: platform.toUpperCase() as any,
          integrationCategory: "HEADLESS",
          syncFrequency: syncFreq,
          settings: { connectorId: conn.connector.id },
        });

        setGeneratedCreds({
          connectorId: conn.connector.id,
          apiKey: conn.plainApiKey,
          channelId: ch.channel.id,
          clientId: ch.plainClientId,
          clientSecret: ch.plainClientSecret,
        });
        setStep("SUCCESS");
      } else {
        await ecommerceHubService.createChannel(session, {
          name: channelName,
          type: "MARKETPLACE",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          adapterType: platform.toUpperCase() as any,
          integrationCategory: "PRESET",
          syncFrequency: syncFreq,
          settings: {
            apiKey: marketplaceApiKey,
            apiSecret: marketplaceApiSecret,
          },
        });
        toast({
          title: "Marketplace Linked",
          description: "Connection established successfully.",
        });
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Provisioning Failed",
        description: "Could not establish secure handshake.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep("CONFIG");
    setChannelName("");
    setGeneratedCreds(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl rounded-[3.5rem] p-0 overflow-hidden border-none shadow-[0_40px_100px_rgba(0,0,0,0.25)] flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 p-12 text-white relative overflow-hidden shrink-0">
          <Zap className="absolute -right-12 -top-12 w-64 h-64 opacity-10 text-blue-400" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <Badge className="bg-blue-500/20 text-blue-400 border-none font-black italic text-[9px] uppercase tracking-[0.2em] px-4 py-1 mb-4">
                Secure Channel Provisioning
              </Badge>
              <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                {step === "CONFIG" ? "New Digital Node" : "Deployment Status"}
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-slate-400 italic">
                {step === "CONFIG"
                  ? "Initialize a secure handshake between Zenvix and your external commerce storefront."
                  : "All secure keys have been issued. Critical data is now active in your vault."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-12 space-y-12 flex-1 overflow-y-auto bg-white">
          {step === "SUCCESS" && generatedCreds ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] p-8 flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-900/10">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-xl font-black italic text-emerald-900 uppercase italic">
                    Handshake Successful
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                    Credentials Issued • Vault Update Complete
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic flex items-center gap-3">
                    <Globe className="w-3 h-3" /> Gateway Identity
                  </div>
                  <div className="space-y-4">
                    <CredentialField
                      label="Tenant ID"
                      value={session.tenantId}
                      copyable
                    />
                    <CredentialField
                      label="Branch Scope"
                      value={branchIds.join(", ")}
                      copyable
                    />
                    <CredentialField
                      label="API Endpoint"
                      value={gatewayUrl}
                      copyable
                    />
                    <CredentialField
                      label="Gateway API Key"
                      value={generatedCreds.apiKey}
                      copyable
                      isMasked
                    />
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 italic flex items-center gap-3">
                    <Key className="w-3 h-3" /> Storefront Secrets
                  </div>
                  <div className="space-y-4">
                    <CredentialField
                      label="Client ID"
                      value={generatedCreds.clientId}
                      copyable
                    />
                    <CredentialField
                      label="Client Secret"
                      value={generatedCreds.clientSecret}
                      copyable
                      isMasked
                    />
                    <Separator className="my-4" />
                    <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-900 uppercase tracking-widest">
                        <AlertCircle className="w-4 h-4 text-indigo-500" />{" "}
                        Security Notice
                      </div>
                      <p className="text-[10px] font-bold text-indigo-600 leading-relaxed italic uppercase italic tracking-tighter">
                        Client secrets are only visible once. Ensure they are
                        safely stored in your application vault.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleClose}
                className="w-full h-20 rounded-[2rem] bg-slate-900 text-white font-black italic uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-[0.98] transition-transform"
              >
                CLOSE SESSION & HANDOVER
              </Button>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-8">
                <div
                  onClick={() => setChannelType("OWNED")}
                  className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer group ${channelType === "OWNED" ? "border-blue-600 bg-blue-50/30" : "border-slate-100 hover:border-slate-200"}`}
                >
                  <Globe
                    className={`w-10 h-10 mb-6 transition-transform ${channelType === "OWNED" ? "text-blue-600 scale-110" : "text-slate-300"}`}
                  />
                  <div
                    className={`text-lg font-black italic uppercase italic tracking-tighter ${channelType === "OWNED" ? "text-blue-900" : "text-slate-400"}`}
                  >
                    Headless API
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                    Next.js / Custom App
                  </div>
                </div>
                <div
                  onClick={() => setChannelType("MARKETPLACE")}
                  className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer group ${channelType === "MARKETPLACE" ? "border-emerald-600 bg-emerald-50/30" : "border-slate-100 hover:border-slate-200"}`}
                >
                  <ShoppingBag
                    className={`w-10 h-10 mb-6 transition-transform ${channelType === "MARKETPLACE" ? "text-emerald-600 scale-110" : "text-slate-300"}`}
                  />
                  <div
                    className={`text-lg font-black italic uppercase italic tracking-tighter ${channelType === "MARKETPLACE" ? "text-emerald-900" : "text-slate-400"}`}
                  >
                    Marketplace Hub
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                    Shopee / Tokopedia
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                    Core Specifications
                  </Label>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-2">
                      <Input
                        placeholder="Deployment Name (e.g. Flagship Store)"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        className="h-16 px-6 rounded-2xl bg-slate-50 border-none font-black italic text-lg text-slate-900 placeholder:text-slate-300 shadow-inner"
                      />
                    </div>
                    <Select value={syncFreq} onValueChange={setSyncFreq}>
                      <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none font-black italic uppercase text-[10px] tracking-widest text-slate-900 shadow-inner">
                        <SelectValue placeholder="Sync Pulse" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white">
                        <SelectItem
                          value="5min"
                          className="rounded-xl font-black italic uppercase text-[10px] py-4"
                        >
                          5m Pulse
                        </SelectItem>
                        <SelectItem
                          value="15min"
                          className="rounded-xl font-black italic uppercase text-[10px] py-4"
                        >
                          15m Pulse
                        </SelectItem>
                        <SelectItem
                          value="1h"
                          className="rounded-xl font-black italic uppercase text-[10px] py-4"
                        >
                          60m Pulse
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {channelType === "MARKETPLACE" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                      <ShieldCheck className="w-6 h-6 text-amber-500" />
                      <p className="text-[10px] font-bold text-amber-700 uppercase italic tracking-tighter">
                        External authorization required. Provide your platform
                        API secrets.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <Input
                        type="password"
                        placeholder="Marketplace API Key"
                        value={marketplaceApiKey}
                        onChange={(e) => setMarketplaceApiKey(e.target.value)}
                        className="h-16 px-6 rounded-2xl bg-slate-50 border-none font-mono text-sm text-slate-700 shadow-inner"
                      />
                      <Input
                        type="password"
                        placeholder="Marketplace Secret"
                        value={marketplaceApiSecret}
                        onChange={(e) =>
                          setMarketplaceApiSecret(e.target.value)
                        }
                        className="h-16 px-6 rounded-2xl bg-slate-50 border-none font-mono text-sm text-slate-700 shadow-inner"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreate}
                disabled={isProcessing || !channelName}
                className="w-full h-20 rounded-[2rem] bg-blue-600 text-white font-black italic uppercase tracking-[0.3em] text-xs shadow-2xl hover:bg-blue-700 hover:scale-[0.98] transition-all"
              >
                {isProcessing ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="flex items-center gap-3">
                    EXECUTE HANDSHAKE <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
