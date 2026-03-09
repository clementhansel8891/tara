import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, RefreshCw, Copy, CheckCircle2, Info, Code2 } from "lucide-react";
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

type FrameworkConfig = {
  label: string;
  description: string;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
    hint?: string;
    readOnly?: boolean;
  }[];
  snippet?: (settings: Record<string, string>, clientId: string) => string;
};

const FRAMEWORK_CONFIGS: Record<string, FrameworkConfig> = {
  vite: {
    label: "Vite",
    description:
      "Popular AI-assisted frontend framework. Uses CORS API key for secure cross-origin access.",
    fields: [
      {
        key: "apiBaseUrl",
        label: "API Base URL",
        placeholder:
          "https://api.yourdomain.com or leave blank to use Zenvix Gateway",
        hint: "The base URL your Vite app will call. Defaults to the Zenvix API gateway.",
      },
      {
        key: "corsOrigin",
        label: "CORS Origin Whitelist",
        placeholder: "https://myapp.vercel.app, http://localhost:5173",
        hint: "Comma-separated list of allowed origins. Include localhost for dev.",
      },
    ],
    snippet: (settings, clientId) => `// vite.config.ts — Zenvix Integration
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api/zenvix': {
        target: '${settings.apiBaseUrl || "https://gateway.zenvix.io"}',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api\\/zenvix/, ''),
        headers: {
          'x-client-id': '${clientId}',
          'x-channel-type': 'HEADLESS_VITE',
        }
      }
    }
  }
})

// .env
VITE_ZENVIX_CLIENT_ID=${clientId}
VITE_ZENVIX_API_BASE=${settings.apiBaseUrl || "https://gateway.zenvix.io"}`,
  },
  "next-js": {
    label: "Next.js",
    description:
      "Connect a Next.js storefront or app router project to Zenvix.",
    fields: [
      {
        key: "apiBaseUrl",
        label: "API Base URL",
        placeholder: "https://api.yourdomain.com",
      },
      {
        key: "corsOrigin",
        label: "Allowed Origin",
        placeholder: "https://mystore.vercel.app",
      },
    ],
    snippet: (settings, clientId) => `// .env.local — Zenvix Integration
NEXT_PUBLIC_ZENVIX_CLIENT_ID=${clientId}
ZENVIX_API_BASE=${settings.apiBaseUrl || "https://gateway.zenvix.io"}

// lib/zenvixClient.ts
export const zenvixFetch = (path: string, init?: RequestInit) =>
  fetch(\`\${process.env.ZENVIX_API_BASE}\${path}\`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': process.env.NEXT_PUBLIC_ZENVIX_CLIENT_ID!,
      ...init?.headers,
    },
  });`,
  },
  nuxt: {
    label: "Nuxt",
    description:
      "Connect a Nuxt 3 storefront to Zenvix via the built-in $fetch composable.",
    fields: [
      {
        key: "apiBaseUrl",
        label: "API Base URL",
        placeholder: "https://api.yourdomain.com",
      },
      {
        key: "corsOrigin",
        label: "Allowed Origin",
        placeholder: "https://mystore.netlify.app",
      },
    ],
    snippet: (settings, clientId) => `// .env — Zenvix Integration
ZENVIX_CLIENT_ID=${clientId}
ZENVIX_API_BASE=${settings.apiBaseUrl || "https://gateway.zenvix.io"}

// plugins/zenvix.ts
export default defineNuxtPlugin(() => {
  const api = $fetch.create({
    baseURL: useRuntimeConfig().public.zenvixApiBase,
    headers: { 'x-client-id': useRuntimeConfig().public.zenvixClientId },
  });
  return { provide: { zenvix: api } };
});`,
  },
  "react-native": {
    label: "React Native (Mobile)",
    description: "Connect your React Native iOS/Android app to Zenvix.",
    fields: [
      {
        key: "appBundleId",
        label: "App Bundle ID",
        placeholder: "com.yourcompany.app",
        hint: "Must match the ID in App Store Connect / Play Console",
      },
      {
        key: "platform",
        label: "Target Platform",
        placeholder: "ios, android, or both",
      },
    ],
    snippet: (_settings, clientId) => `// zenvixConfig.ts — React Native
export const ZENVIX_CONFIG = {
  clientId: '${clientId}',
  apiBase: 'https://gateway.zenvix.io',
  channelType: 'HEADLESS_MOBILE',
};

// Usage in fetch calls:
fetch(\`\${ZENVIX_CONFIG.apiBase}/products\`, {
  headers: {
    'x-client-id': ZENVIX_CONFIG.clientId,
    'x-channel-type': ZENVIX_CONFIG.channelType,
  }
});`,
  },
  flutter: {
    label: "Flutter (Mobile)",
    description:
      "Connect your Flutter app to Zenvix using the Dart HTTP client.",
    fields: [
      {
        key: "packageName",
        label: "Package Name",
        placeholder: "com.yourcompany.app",
      },
    ],
    snippet: (_settings, clientId) => `// lib/services/zenvix_client.dart
class ZenvixClient {
  static const String _clientId = '${clientId}';
  static const String _baseUrl = 'https://gateway.zenvix.io';

  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'x-client-id': _clientId,
    'x-channel-type': 'HEADLESS_MOBILE',
  };
}`,
  },
  custom: {
    label: "Custom",
    description: "Connect any custom frontend or API consumer.",
    fields: [
      {
        key: "apiBaseUrl",
        label: "API Base URL",
        placeholder: "https://api.yourdomain.com",
      },
      {
        key: "authHeaderName",
        label: "Auth Header Name",
        placeholder: "X-Api-Key or Authorization",
      },
      {
        key: "corsOrigin",
        label: "Allowed Origin (optional)",
        placeholder: "https://myapp.com",
      },
    ],
    snippet: (_settings, clientId) => `// Generic HTTP integration
// Include this header in every request:
Headers: {
  'x-client-id': '${clientId}',
  'x-channel-type': 'HEADLESS_CUSTOM'
}`,
  },
};

export const HeadlessSettingsPanel: React.FC<Props> = ({
  channel,
  session,
  onUpdated,
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);

  const platform = channel.adapterType ?? "custom";
  const config = FRAMEWORK_CONFIGS[platform] ?? FRAMEWORK_CONFIGS["custom"];
  // The clientId is conceptually the channel id for headless — real value comes from credentials
  const clientId = (channel as { clientId?: string }).clientId ?? channel.id;

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
      setShowSnippet(true);
      onUpdated();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const snippet = config.snippet?.(fields, clientId) ?? "";

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Framework header */}
      <div className="space-y-1">
        <h3 className="font-black italic text-slate-900 text-base">
          {config.label} Integration
        </h3>
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {config.fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {f.label}
            </Label>
            <Input
              type={f.type ?? "text"}
              value={fields[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              readOnly={f.readOnly}
              className={cn(
                "h-11 rounded-xl font-bold text-sm",
                f.readOnly && "bg-slate-50 text-slate-500 cursor-not-allowed",
              )}
            />
            {f.hint && (
              <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400 italic">
                <Info className="w-3 h-3 shrink-0" /> {f.hint}
              </p>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-11 rounded-xl font-black italic bg-slate-900 gap-2"
      >
        {isSaving ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isSaving ? "Saving…" : "Save & Generate Snippet"}
      </Button>

      {/* Integration snippet */}
      {(showSnippet || Object.keys(fields).length > 0) && snippet && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Code2 className="w-3.5 h-3.5" /> Integration Snippet
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy All
                </>
              )}
            </button>
          </div>
          <pre className="rounded-xl bg-slate-900 text-emerald-400 text-[10px] font-mono p-4 overflow-x-auto whitespace-pre leading-relaxed">
            {snippet}
          </pre>
        </div>
      )}
    </div>
  );
};
