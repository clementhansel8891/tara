import React from "react";
import { Globe, ShoppingBag, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CredentialField } from "./SharedUI";

interface ManageConnectorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channelType: string;
  channelName: string;
  setChannelName: (val: string) => void;
  syncFreq: string;
  setSyncFreq: (val: string) => void;
  marketplaceApiKey: string;
  setMarketplaceApiKey: (val: string) => void;
  marketplaceApiSecret: string;
  setMarketplaceApiSecret: (val: string) => void;
  isProcessing: boolean;
  handleCreateChannel: () => void;
  generatedCreds: {
    connectorId: string;
    apiKey: string; // Gateway Key
    channelId: string;
    clientId: string;
    clientSecret: string; // Storefront Secret
  } | null;
  session: any;
  branchIds: string[];
  gatewayUrl: string;
  copyCredential: (value: string, label: string) => void;
}

export const ManageConnectorDialog = ({
  isOpen,
  onOpenChange,
  channelType,
  channelName,
  setChannelName,
  syncFreq,
  setSyncFreq,
  marketplaceApiKey,
  setMarketplaceApiKey,
  marketplaceApiSecret,
  setMarketplaceApiSecret,
  isProcessing,
  handleCreateChannel,
  generatedCreds,
  session,
  branchIds,
  gatewayUrl,
  copyCredential,
}: ManageConnectorDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 p-8 text-white">
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            {channelType === "OWNED" ? (
              <Globe className="w-6 h-6 text-indigo-400" />
            ) : (
              <ShoppingBag className="w-6 h-6 text-emerald-400" />
            )}
            {channelType === "OWNED" ? "Provision Headless Store" : "Connect Marketplace"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium italic mt-2">
            {channelType === "OWNED"
              ? "Generate distinct client and gateway credentials for your storefront."
              : "Authorize Zenvix to manage products and orders on this external channel."}
          </DialogDescription>
        </div>

        <div className="p-8 space-y-6 flex-1 overflow-y-auto">
          {generatedCreds ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-800 text-sm">
                    Channel Provisioned Successfully
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    Copy these credentials. They will not be shown again.
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <CredentialField
                  label="Tenant ID"
                  value={session.tenantId}
                  tooltip="Tenant ID identifies the business tenant inside Zenvix. This must match the Tenant ID configured in your storefront."
                  helperText="Company scope."
                  copyable
                  onCopy={() => copyCredential(session.tenantId, "Tenant ID")}
                />
                <CredentialField
                  label="Branch IDs"
                  value={branchIds.join(", ")}
                  tooltip="Branch IDs identify the physical stores or branches this ecommerce channel belongs to."
                  helperText="Linked fulfillment branches."
                  copyable
                  onCopy={() => copyCredential(branchIds.join(", "), "Branch IDs")}
                />
                <CredentialField
                  label="Connector"
                  value={channelName}
                  tooltip="Connector identifies this ecommerce storefront connection."
                  helperText="Website label."
                  copyable
                  onCopy={() => copyCredential(channelName, "Connector")}
                />
                <CredentialField
                  label="Gateway URL"
                  value={gatewayUrl}
                  tooltip="Gateway URL is the endpoint your storefront posts events to."
                  helperText="Public API Gateway."
                  copyable
                  onCopy={() => copyCredential(gatewayUrl, "Gateway URL")}
                />
                <Separator className="my-2" />
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 px-1">
                  Secure Credentials
                </div>
                <CredentialField
                  label="Storefront Client ID"
                  value={generatedCreds.clientId}
                  tooltip="Storefront Client ID is the unique identifier for this specific channel."
                  helperText="Paste into storefront 'Client ID'."
                  copyable
                  onCopy={() => copyCredential(generatedCreds.clientId, "Storefront Client ID")}
                />
                <CredentialField
                  label="Storefront Client Secret"
                  value={generatedCreds.clientSecret}
                  tooltip="Storefront Client Secret used to authenticate the Client ID."
                  helperText="Paste into storefront 'Client Secret'."
                  copyable
                  onCopy={() => copyCredential(generatedCreds.clientSecret, "Storefront Client Secret")}
                />
                <CredentialField
                  label="Gateway API Key"
                  value={generatedCreds.apiKey}
                  tooltip="Gateway API Key provides top-level access to the retail gateway. Separate from the Client Secret for enhanced security."
                  helperText="Paste into storefront 'API Key'."
                  copyable
                  onCopy={() => copyCredential(generatedCreds.apiKey, "Gateway API Key")}
                />
                <Separator className="my-2" />
                <CredentialField
                  label="Channel Record ID"
                  value={generatedCreds.channelId}
                  tooltip="Internal Zenvix identifier for this record."
                  helperText="System reference only."
                  copyable
                  onCopy={() => copyCredential(generatedCreds.channelId, "Channel Record ID")}
                />

                <div className="text-[10px] text-amber-600 font-black flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  Keep these secrets secure. They provide critical access to your store data.
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="w-full h-12 rounded-xl font-bold bg-slate-900 text-white"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Channel Name</Label>
                <Input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="h-12 rounded-xl font-bold"
                  placeholder={
                    channelType === "OWNED"
                      ? "e.g. My Flagship Website"
                      : "e.g. Tokopedia Official"
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Channel Type</Label>
                  <div className="h-12 flex items-center px-4 bg-slate-50 rounded-xl font-bold text-sm text-slate-500 border border-slate-200">
                    {channelType}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">
                    Sync Frequency
                  </Label>
                  <Select value={syncFreq} onValueChange={setSyncFreq}>
                    <SelectTrigger className="h-12 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5min">5 Minutes</SelectItem>
                      <SelectItem value="15min">15 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {channelType === "MARKETPLACE" && (
                <>
                  <Separator className="my-2" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-xs font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Enter your marketplace API credentials below.</span>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-slate-400">
                        API Key / Shop ID
                      </Label>
                      <Input
                        value={marketplaceApiKey}
                        onChange={(e) => setMarketplaceApiKey(e.target.value)}
                        className="h-12 rounded-xl font-bold"
                        type="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-slate-400">
                        API Secret
                      </Label>
                      <Input
                        value={marketplaceApiSecret}
                        onChange={(e) => setMarketplaceApiSecret(e.target.value)}
                        className="h-12 rounded-xl font-bold"
                        type="password"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleCreateChannel}
                  disabled={isProcessing || !channelName}
                  className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black italic uppercase tracking-widest shadow-xl"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Processing...
                    </>
                  ) : channelType === "OWNED" ? (
                    "Generate Storefront Keys"
                  ) : (
                    "Authenticate & Connect"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
