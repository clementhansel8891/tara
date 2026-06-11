// ─── Violation records ────────────────────────────────────────────

export interface ContrastViolation {
  selector: string;
  textColor: string;           // e.g. "rgb(59, 130, 246)"
  bgColor: string;             // e.g. "rgb(255, 255, 255)"
  contrastRatio: number;       // e.g. 2.4
  threshold: number;           // 4.5 or 3.0
  textType: "normal" | "large";
  pass: boolean;
}

export interface HardcodedViolation {
  tagName: string;
  violatingClass: string;      // e.g. "bg-emerald-600"
  recommendedToken: string;    // e.g. "bg-success"
}

export interface ScreenshotResult {
  pixelDiffPct: number;
  verdict: "DARK_MODE_WORKS" | "DARK_MODE_BROKEN";
}

export interface TokenViolation {
  token: string;               // e.g. "--background"
  resolvedValue: string;       // e.g. "225 60% 3%" or "" if missing
  luminance?: number;          // computed when token is --background
  compliant: "yes" | "no";
  critical: boolean;
}

// ─── Per-page layer results ────────────────────────────────────────

export interface LayerAResult {
  light: ContrastViolation[];
  dark: ContrastViolation[];
  error?: string;
}

export interface LayerBResult {
  violations: HardcodedViolation[];
  error?: string;
}

export interface LayerCResult {
  screenshot: ScreenshotResult | null;
  error?: string;
}

export interface LayerDResult {
  light: TokenViolation[];
  dark: TokenViolation[];
  error?: string;
}

// ─── Page registry entry ───────────────────────────────────────────

export interface PageEntry {
  route: string;   // e.g. "/core/finance/ledger"
  name: string;    // slug for file names, e.g. "core-finance-ledger"
  group: "core" | "retail-management" | "retail-operational";
}

// ─── Top-level report structure ────────────────────────────────────

export interface PageReport {
  pageName: string;
  route: string;
  layerA: LayerAResult;
  layerB: LayerBResult;
  layerC: LayerCResult;
  layerD: LayerDResult;
}

export interface ColorReport {
  generatedAt: string;          // ISO 8601
  totalPages: number;
  pages: PageReport[];
}
