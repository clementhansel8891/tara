import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, ExternalLink, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  ecommerceHubService,
  type ChannelRecord,
} from "@/core/services/retail/ecommerceHubService";
import type { SessionContext } from "@/core/security/session";
import { cn } from "@/lib/utils";

interface Props {
  channel: ChannelRecord;
  session: SessionContext;
  onUpdated: () => void;
}

// Maps backend CHANNEL_ADAPTER_TYPES → PLATFORM_CONFIGS key
const BACKEND_TO_UI: Record<string, string> = {
  SHOPEE: "shopee",
  TOKOPEDIA: "tokopedia",
  LAZADA: "lazada",
  TIKTOK: "tiktok-shop",
  WOOCOMMERCE: "custom",
  SHOPIFY: "custom",
  BAMBUSILVER: "custom",
  CUSTOM: "custom",
};

type PlatformConfig = {
  label: string;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
    hint?: string;
  }[];
  docsUrl?: string;
};

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  shopee: {
    label: "Shopee",
    docsUrl: "https://open.shopee.com/documents",
    fields: [
      {
        key: "shopId",
        label: "Shop ID",
        placeholder: "e.g. 12345678",
        hint: "Found in Shopee Seller Centre → My Account",
      },
      { key: "partnerId", label: "Partner ID", placeholder: "e.g. 1001234" },
      {
        key: "partnerKey",
        label: "Partner Key",
        placeholder: "Your Shopee partner secret key",
        type: "password",
      },
      {
        key: "region",
        label: "Region",
        placeholder: "e.g. MY, SG, ID, TH, PH",
      },
      {
        key: "callbackUrl",
        label: "Webhook Callback URL",
        placeholder: "https://yourdomain.com/webhooks/shopee",
      },
    ],
  },
  tokopedia: {
    label: "Tokopedia",
    docsUrl: "https://developer.tokopedia.com",
    fields: [
      {
        key: "clientId",
        label: "Client ID",
        placeholder: "Your Tokopedia OAuth Client ID",
      },
      {
        key: "clientSecret",
        label: "Client Secret",
        placeholder: "Your Tokopedia OAuth secret",
        type: "password",
      },
      {
        key: "shopDomain",
        label: "Shop Domain",
        placeholder: "e.g. my-shop-name",
      },
      {
        key: "fsId",
        label: "Fulfillment Service ID (optional)",
        placeholder: "For Tokopedia Fulfilled stores",
      },
    ],
  },
  lazada: {
    label: "Lazada",
    docsUrl: "https://open.lazada.com",
    fields: [
      { key: "appKey", label: "App Key", placeholder: "Your Lazada App Key" },
      {
        key: "appSecret",
        label: "App Secret",
        placeholder: "Your Lazada App Secret",
        type: "password",
      },
      {
        key: "region",
        label: "Region",
        placeholder: "e.g. MY, SG, ID, TH, PH, VN",
      },
      { key: "sellerId", label: "Seller ID", placeholder: "e.g. 100123456" },
    ],
  },
  "tiktok-shop": {
    label: "TikTok Shop",
    docsUrl: "https://partner.tiktokshop.com",
    fields: [
      {
        key: "appKey",
        label: "App Key",
        placeholder: "Your TikTok Shop App Key",
      },
      {
        key: "appSecret",
        label: "App Secret",
        placeholder: "Your TikTok Shop App Secret",
        type: "password",
      },
      { key: "shopId", label: "Shop ID", placeholder: "Your TikTok Shop ID" },
      {
        key: "webhookSecret",
        label: "Webhook Secret",
        placeholder: "Used to verify incoming events",
        type: "password",
      },
    ],
  },
  custom: {
    label: "Custom Marketplace",
    fields: [
      {
        key: "apiBaseUrl",
        label: "API Base URL",
        placeholder: "https://api.yourmarketplace.com/v1",
      },
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "Your marketplace API key",
        type: "password",
      },
      {
        key: "customHeaders",
        label: "Custom Headers (JSON)",
        placeholder: '{"X-Store-ID": "123"}',
      },
      {
        key: "callbackUrl",
        label: "Webhook Callback URL",
        placeholder: "https://yourdomain.com/webhooks/custom",
      },
    ],
  },
};

export const MarketplaceSettingsPanel: React.FC<Props> = ({
  channel,
  session,
  onUpdated,
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});

  const platform =
    BACKEND_TO_UI[channel.adapterType ?? ""] ??
    channel.adapterType?.toLowerCase() ??
    "custom";
  const config = PLATFORM_CONFIGS[platform] ?? PLATFORM_CONFIGS["custom"];

  useEffect(() => {
    const saved = (channel.settings ?? {}) as Record<string, string>;
    setFields(saved);
  }, [channel.id, channel.settings]);

  const set = (key: string, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await ecommerceHubService.updateChannel(session, channel.id, {
        settings: fields,
      });
      toast({
        title: "Settings saved",
        description: `${config.label} integration updated.`,
      });
      onUpdated();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="font-black italic text-foreground text-base">
            {config.label} Settings
          </h3>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Platform-specific integration config
          </p>
        </div>
        {config.docsUrl && (
          <a
            href={config.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Docs
          </a>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {(Array.isArray(config.fields) ? config.fields : []).map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {f.label}
            </Label>
            <Input
              type={f.type ?? "text"}
              value={fields[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="h-11 rounded-xl font-bold text-sm"
            />
            {f.hint && (
              <p className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground italic">
                <Info className="w-3 h-3 shrink-0" /> {f.hint}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary">
        <Info className="w-4 h-4 text-primary shrink-0" />
        <p className="text-[11px] font-bold text-primary">
          Settings are encrypted at rest and only transmitted over HTTPS.
          Credentials are never logged.
        </p>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-11 rounded-xl font-black italic bg-secondary gap-2"
      >
        {isSaving ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isSaving ? "Saving…" : "Save Settings"}
      </Button>
    </div>
  );
};
