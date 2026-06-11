/**
 * Node.js-side report helpers for the UI Color Consistency Test Suite.
 *
 * All file I/O is wrapped in try/catch — errors are logged to console and
 * never rethrown, so a report-write failure never aborts the test run.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import * as fs from "fs";
import * as path from "path";

import type {
  ColorReport,
  LayerAResult,
  LayerBResult,
  LayerCResult,
  LayerDResult,
  PageEntry,
  PageReport,
} from "./color-report-types";

// ─── initPageReport ──────────────────────────────────────────────────────────

/**
 * Returns a blank `PageReport` for the given page entry.
 * All layer arrays are initialised to empty; `screenshot` is `null`.
 *
 * Requirement 6.2
 */
export function initPageReport(entry: PageEntry): PageReport {
  const layerA: LayerAResult = { light: [], dark: [] };
  const layerB: LayerBResult = { violations: [] };
  const layerC: LayerCResult = { screenshot: null };
  const layerD: LayerDResult = { light: [], dark: [] };

  return {
    pageName: entry.name,
    route: entry.route,
    layerA,
    layerB,
    layerC,
    layerD,
  };
}

// ─── ensureDirectories ────────────────────────────────────────────────────────

/**
 * Creates `<outDir>/screenshots/light/` and `<outDir>/screenshots/dark/`
 * if they do not already exist (uses `recursive: true` so the call is
 * idempotent).
 *
 * Requirement 6.6
 */
export function ensureDirectories(outDir: string): void {
  fs.mkdirSync(path.join(outDir, "screenshots", "light"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "screenshots", "dark"), { recursive: true });
}

// ─── writeReportJSON ──────────────────────────────────────────────────────────

/**
 * Serialises `report` as pretty-printed JSON and writes it to
 * `<outDir>/ui-color-report.json`.
 *
 * On any filesystem error the function logs to console and returns normally —
 * it never rethrows.
 *
 * Requirement 6.1, 6.5
 */
export async function writeReportJSON(
  report: ColorReport,
  outDir: string
): Promise<void> {
  const filePath = path.join(outDir, "ui-color-report.json");
  try {
    const json = JSON.stringify(report, null, 2);
    await fs.promises.writeFile(filePath, json, "utf-8");
  } catch (err) {
    console.error("[Report] Failed to write ui-color-report.json:", err);
  }
}

// ─── writeReportHTML ─────────────────────────────────────────────────────────

/**
 * Generates a self-contained HTML summary from `report` and writes it to
 * `<outDir>/ui-color-summary.html`.
 *
 * The page includes:
 *   - Title "UI Color Consistency Report"
 *   - Generated timestamp
 *   - Summary table: Page | Layer A Light | Layer A Dark | Layer B |
 *                     Layer C Verdict | Layer D Light | Layer D Dark | Errors
 *   - Inline CSS for readability
 *
 * On any filesystem error the function logs to console and returns normally —
 * it never rethrows.
 *
 * Requirements 6.3, 6.5
 */
export async function writeReportHTML(
  report: ColorReport,
  outDir: string
): Promise<void> {
  const filePath = path.join(outDir, "ui-color-summary.html");
  try {
    const rows = report.pages
      .map((page) => {
        const layerALightViolations = page.layerA.light.filter(
          (v) => !v.pass
        ).length;
        const layerADarkViolations = page.layerA.dark.filter(
          (v) => !v.pass
        ).length;
        const layerBViolations = page.layerB.violations.length;
        const layerCVerdict = page.layerC.screenshot
          ? page.layerC.screenshot.verdict
          : "N/A";
        const layerDLightViolations = page.layerD.light.filter(
          (v) => v.compliant === "no"
        ).length;
        const layerDDarkViolations = page.layerD.dark.filter(
          (v) => v.compliant === "no"
        ).length;

        const errors = [
          page.layerA.error,
          page.layerB.error,
          page.layerC.error,
          page.layerD.error,
        ]
          .filter(Boolean)
          .join("; ");

        const verdictClass =
          layerCVerdict === "DARK_MODE_BROKEN"
            ? "verdict-broken"
            : layerCVerdict === "DARK_MODE_WORKS"
            ? "verdict-works"
            : "";

        const hasViolations =
          layerALightViolations > 0 ||
          layerADarkViolations > 0 ||
          layerBViolations > 0 ||
          layerDLightViolations > 0 ||
          layerDDarkViolations > 0;

        const rowClass = hasViolations ? "row-violation" : errors ? "row-error" : "";

        return `
      <tr class="${rowClass}">
        <td class="page-name">${escapeHtml(page.pageName)}<br/><span class="route">${escapeHtml(page.route)}</span></td>
        <td class="${layerALightViolations > 0 ? "cell-fail" : "cell-pass"}">${layerALightViolations}</td>
        <td class="${layerADarkViolations > 0 ? "cell-fail" : "cell-pass"}">${layerADarkViolations}</td>
        <td class="${layerBViolations > 0 ? "cell-fail" : "cell-pass"}">${layerBViolations}</td>
        <td class="${verdictClass}">${escapeHtml(layerCVerdict)}</td>
        <td class="${layerDLightViolations > 0 ? "cell-fail" : "cell-pass"}">${layerDLightViolations}</td>
        <td class="${layerDDarkViolations > 0 ? "cell-fail" : "cell-pass"}">${layerDDarkViolations}</td>
        <td class="cell-error">${escapeHtml(errors)}</td>
      </tr>`;
      })
      .join("\n");

    const totalLayerALight = report.pages.reduce(
      (sum, p) => sum + p.layerA.light.filter((v) => !v.pass).length,
      0
    );
    const totalLayerADark = report.pages.reduce(
      (sum, p) => sum + p.layerA.dark.filter((v) => !v.pass).length,
      0
    );
    const totalLayerB = report.pages.reduce(
      (sum, p) => sum + p.layerB.violations.length,
      0
    );
    const totalLayerDLight = report.pages.reduce(
      (sum, p) => sum + p.layerD.light.filter((v) => v.compliant === "no").length,
      0
    );
    const totalLayerDDark = report.pages.reduce(
      (sum, p) => sum + p.layerD.dark.filter((v) => v.compliant === "no").length,
      0
    );
    const brokenPages = report.pages.filter(
      (p) => p.layerC.screenshot?.verdict === "DARK_MODE_BROKEN"
    ).length;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UI Color Consistency Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      color: #1a1a2e;
      background: #f8f9fa;
      padding: 24px;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .meta {
      color: #6c757d;
      font-size: 12px;
      margin-bottom: 24px;
    }

    .summary-cards {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .card {
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 12px 20px;
      min-width: 140px;
    }

    .card-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6c757d;
      margin-bottom: 4px;
    }

    .card-value {
      font-size: 28px;
      font-weight: 700;
    }

    .card-value.ok { color: #198754; }
    .card-value.warn { color: #dc3545; }

    .table-wrapper {
      overflow-x: auto;
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead th {
      background: #343a40;
      color: #fff;
      padding: 10px 14px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    tbody tr:nth-child(even) { background: #f8f9fa; }
    tbody tr:hover { background: #e9ecef; }

    td {
      padding: 8px 14px;
      border-bottom: 1px solid #dee2e6;
      vertical-align: top;
    }

    .page-name { font-weight: 600; min-width: 160px; }
    .route { font-weight: 400; color: #6c757d; font-size: 11px; }

    .cell-pass { color: #198754; text-align: center; }
    .cell-fail { color: #dc3545; font-weight: 700; text-align: center; }
    .cell-error { color: #856404; font-size: 12px; max-width: 240px; word-break: break-word; }

    .verdict-works { color: #198754; font-weight: 600; text-align: center; }
    .verdict-broken { color: #dc3545; font-weight: 700; text-align: center; }

    .row-violation td { background: #fff5f5; }
    .row-error td { background: #fffbea; }

    tfoot td {
      font-weight: 700;
      background: #e9ecef;
      border-top: 2px solid #adb5bd;
      padding: 10px 14px;
    }
  </style>
</head>
<body>
  <h1>UI Color Consistency Report</h1>
  <p class="meta">
    Generated: ${escapeHtml(report.generatedAt || new Date().toISOString())} &nbsp;|&nbsp;
    Pages audited: ${report.totalPages}
  </p>

  <div class="summary-cards">
    <div class="card">
      <div class="card-label">Layer A Light Violations</div>
      <div class="card-value ${totalLayerALight > 0 ? "warn" : "ok"}">${totalLayerALight}</div>
    </div>
    <div class="card">
      <div class="card-label">Layer A Dark Violations</div>
      <div class="card-value ${totalLayerADark > 0 ? "warn" : "ok"}">${totalLayerADark}</div>
    </div>
    <div class="card">
      <div class="card-label">Layer B Violations</div>
      <div class="card-value ${totalLayerB > 0 ? "warn" : "ok"}">${totalLayerB}</div>
    </div>
    <div class="card">
      <div class="card-label">Dark Mode Broken</div>
      <div class="card-value ${brokenPages > 0 ? "warn" : "ok"}">${brokenPages}</div>
    </div>
    <div class="card">
      <div class="card-label">Layer D Light Violations</div>
      <div class="card-value ${totalLayerDLight > 0 ? "warn" : "ok"}">${totalLayerDLight}</div>
    </div>
    <div class="card">
      <div class="card-label">Layer D Dark Violations</div>
      <div class="card-value ${totalLayerDDark > 0 ? "warn" : "ok"}">${totalLayerDDark}</div>
    </div>
  </div>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Page</th>
          <th>Layer A Light Violations</th>
          <th>Layer A Dark Violations</th>
          <th>Layer B Violations</th>
          <th>Layer C Verdict</th>
          <th>Layer D Light Violations</th>
          <th>Layer D Dark Violations</th>
          <th>Errors</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr>
          <td>Totals (${report.pages.length} pages)</td>
          <td style="text-align:center">${totalLayerALight}</td>
          <td style="text-align:center">${totalLayerADark}</td>
          <td style="text-align:center">${totalLayerB}</td>
          <td style="text-align:center">${brokenPages} broken</td>
          <td style="text-align:center">${totalLayerDLight}</td>
          <td style="text-align:center">${totalLayerDDark}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</body>
</html>`;

    await fs.promises.writeFile(filePath, html, "utf-8");
  } catch (err) {
    console.error("[Report] Failed to write ui-color-summary.html:", err);
  }
}

// ─── printConsoleSummary ──────────────────────────────────────────────────────

/**
 * Logs a console table with total violation counts per layer per page.
 * Uses `console.table` for readability.
 *
 * Requirement 6.4
 */
export function printConsoleSummary(report: ColorReport): void {
  console.log("\n─── UI Color Consistency Report Summary ───────────────────");

  const tableData = report.pages.map((page) => ({
    Page: page.pageName,
    Route: page.route,
    "LayerA Light": page.layerA.light.filter((v) => !v.pass).length,
    "LayerA Dark": page.layerA.dark.filter((v) => !v.pass).length,
    "LayerB Violations": page.layerB.violations.length,
    "LayerC Verdict": page.layerC.screenshot?.verdict ?? "N/A",
    "LayerD Light": page.layerD.light.filter((v) => v.compliant === "no").length,
    "LayerD Dark": page.layerD.dark.filter((v) => v.compliant === "no").length,
    Errors: [
      page.layerA.error,
      page.layerB.error,
      page.layerC.error,
      page.layerD.error,
    ]
      .filter(Boolean)
      .join("; "),
  }));

  console.table(tableData);
  console.log("───────────────────────────────────────────────────────────\n");
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Escapes HTML special characters to prevent XSS in the generated report.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
