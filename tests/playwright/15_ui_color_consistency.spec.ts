/**
 * 15_ui_color_consistency.spec.ts — UI Color Consistency Audit
 * ════════════════════════════════════════════════════════════
 * Four-layer audit of the live application across all 45 pages:
 *   Layer A — Contrast Ratio Check (WCAG AA)
 *   Layer B — Hardcoded Color Class Audit
 *   Layer C — Screenshot Comparison (light vs. dark)
 *   Layer D — Theme Token Compliance
 *
 * This suite acts as a continuous audit tool: it never aborts on violations,
 * always produces its full artifact set, and uses expect.soft() to mark
 * individual failing tests without stopping the run.
 *
 * Requirements: 1.1–1.6, 2.1–2.7, 3.1–3.5, 4.1–4.7, 5.1–5.7, 6.1–6.6,
 *               7.1–7.4, 8.1–8.4
 */

import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { decode as decodePNG } from "fast-png";
import { PAGES } from "./utils/color-pages";
import { initPageReport, ensureDirectories, writeReportJSON, writeReportHTML, printConsoleSummary } from "./utils/color-report-helpers";
import { computePixelDiffPct, classifyDarkMode } from "./utils/color-helpers";
import type { ColorReport } from "./utils/color-report-types";

// ─── Auth ─────────────────────────────────────────────────────────────────────

test.use({ storageState: "tests/playwright/.auth/user.json" });

// ─── Module-level report accumulator ─────────────────────────────────────────
// Safe to use as shared state because workers: 1 in playwright.config.ts
// guarantees sequential execution across all describe blocks.

const report: ColorReport = {
  generatedAt: "",
  totalPages: PAGES.length,
  pages: [],
};

// ─── Layer A — Contrast Ratio Check ──────────────────────────────────────────
//
// Visits every page in light mode, runs WCAG AA contrast evaluation, then
// toggles dark mode and re-runs. Results are stored in the shared `report`
// accumulator. Violations are soft-asserted so the run continues.
//
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5,
//               2.6, 2.7, 7.1, 7.2, 8.1, 8.2, 8.3, 8.4

test.describe("Layer A — Contrast Ratio Check", () => {
  test.setTimeout(600_000); // 10 minutes — 45 pages × 2 modes × ~5s/page
  test("all pages: WCAG AA contrast audit", async ({ page }) => {
    for (const entry of PAGES) {
      const pageReport = initPageReport(entry);

      // ── Navigate ────────────────────────────────────────────────────────────
      try {
        await page.goto(entry.route, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        await page.waitForTimeout(1500);
      } catch (navErr) {
        const msg = `Navigation failed: ${navErr}`;
        pageReport.layerA.error = msg;
        report.pages.push(pageReport);
        continue;
      }

      // ── Light mode contrast scan ─────────────────────────────────────────
      try {
        const lightViolations = await page.evaluate(() => {
          // ── Inline helpers — FULLY SELF-CONTAINED, no Node.js closures ──

          function toLinear(channel: number): number {
            const s = channel / 255;
            return s <= 0.04045
              ? s / 12.92
              : Math.pow((s + 0.055) / 1.055, 2.4);
          }

          function computeRelativeLuminance(
            r: number,
            g: number,
            b: number
          ): number {
            return (
              0.2126 * toLinear(r) +
              0.7152 * toLinear(g) +
              0.0722 * toLinear(b)
            );
          }

          function contrastRatio(l1: number, l2: number): number {
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          }

          function parseRGB(
            cssColor: string
          ): { r: number; g: number; b: number } | null {
            const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!m) return null;
            return { r: +m[1], g: +m[2], b: +m[3] };
          }

          function getEffectiveBgColor(el: Element): string {
            let node: Element | null = el;
            while (node && node !== document.documentElement) {
              const bg = window.getComputedStyle(node).backgroundColor;
              const rgba = bg.match(
                /rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?/
              );
              if (rgba) {
                const alpha =
                  rgba[4] !== undefined ? parseFloat(rgba[4]) : 1;
                if (alpha > 0.05) return bg;
              }
              node = node.parentElement;
            }
            return "rgb(255, 255, 255)"; // fallback: assume white
          }

          function isDecorativeEl(el: Element): boolean {
            if (el.getAttribute("aria-hidden") === "true") return true;
            if (el.closest("[aria-hidden='true']")) return true;
            const role = el.getAttribute("role");
            if (role === "presentation") return true;
            if (
              role === "img" &&
              !el.getAttribute("aria-label") &&
              !el.getAttribute("aria-labelledby")
            )
              return true;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return true;
            const style = window.getComputedStyle(el);
            if (parseFloat(style.opacity) === 0) return true;
            return false;
          }

          function isLargeTextEl(el: Element): boolean {
            const style = window.getComputedStyle(el);
            const size = parseFloat(style.fontSize);
            const weight = parseInt(style.fontWeight, 10) || 400;
            return size >= 18 || (size >= 14 && weight >= 700);
          }

          const INTERACTIVE_SELECTOR = [
            "button",
            "a",
            "input",
            "label",
            "select",
            "textarea",
            "[role='button']",
            "[role='link']",
            "[role='checkbox']",
            "[role='radio']",
            "[role='tab']",
            "[role='menuitem']",
            "td",
            "th",
            "span",
            "p",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "li",
            "dt",
            "dd",
            "[class*='badge']",
            "[class*='status']",
          ].join(",");

          // ── Scanner loop ────────────────────────────────────────────────

          type ContrastResult = {
            selector: string;
            textColor: string;
            bgColor: string;
            contrastRatio: number;
            threshold: number;
            textType: "normal" | "large";
            pass: boolean;
          };

          const results: ContrastResult[] = [];
          const elements = document.querySelectorAll(INTERACTIVE_SELECTOR);

          for (const el of elements) {
            if (isDecorativeEl(el)) continue;

            // Only process elements with a direct text node
            const hasText = Array.from(el.childNodes).some(
              (n) =>
                n.nodeType === Node.TEXT_NODE &&
                (n.textContent ?? "").trim().length > 0
            );
            if (!hasText) continue;

            const style = window.getComputedStyle(el);
            const textColorStr = style.color;
            const bgColorStr = getEffectiveBgColor(el);
            const tc = parseRGB(textColorStr);
            const bc = parseRGB(bgColorStr);
            if (!tc || !bc) continue;

            const tl = computeRelativeLuminance(tc.r, tc.g, tc.b);
            const bl = computeRelativeLuminance(bc.r, bc.g, bc.b);
            const ratio = contrastRatio(tl, bl);
            const large = isLargeTextEl(el);
            const threshold = large ? 3.0 : 4.5;

            if (ratio < threshold) {
              const selector = el.id
                ? `#${el.id}`
                : `${el.tagName.toLowerCase()}${
                    el.className && typeof el.className === "string"
                      ? "." +
                        el.className
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .join(".")
                      : ""
                  }`;

              results.push({
                selector,
                textColor: textColorStr,
                bgColor: bgColorStr,
                contrastRatio: Math.round(ratio * 100) / 100,
                threshold,
                textType: large ? "large" : "normal",
                pass: false,
              });
            }
          }

          return results;
        });

        pageReport.layerA.light = lightViolations;

        // Soft-assert each violation so the run continues
        for (const violation of lightViolations) {
          expect
            .soft(
              violation.pass,
              `[Layer A / light] ${entry.name} — contrast ${violation.contrastRatio} < ${violation.threshold} on ${violation.selector}`
            )
            .toBe(true);
        }
      } catch (err) {
        pageReport.layerA.error = `Light mode scan failed: ${err}`;
      }

      // ── Toggle dark mode ─────────────────────────────────────────────────
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });

      // ── Dark mode contrast scan ──────────────────────────────────────────
      try {
        const darkViolations = await page.evaluate(() => {
          // ── Inline helpers — identical to light mode block ───────────────

          function toLinear(channel: number): number {
            const s = channel / 255;
            return s <= 0.04045
              ? s / 12.92
              : Math.pow((s + 0.055) / 1.055, 2.4);
          }

          function computeRelativeLuminance(
            r: number,
            g: number,
            b: number
          ): number {
            return (
              0.2126 * toLinear(r) +
              0.7152 * toLinear(g) +
              0.0722 * toLinear(b)
            );
          }

          function contrastRatio(l1: number, l2: number): number {
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          }

          function parseRGB(
            cssColor: string
          ): { r: number; g: number; b: number } | null {
            const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!m) return null;
            return { r: +m[1], g: +m[2], b: +m[3] };
          }

          function getEffectiveBgColor(el: Element): string {
            let node: Element | null = el;
            while (node && node !== document.documentElement) {
              const bg = window.getComputedStyle(node).backgroundColor;
              const rgba = bg.match(
                /rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?/
              );
              if (rgba) {
                const alpha =
                  rgba[4] !== undefined ? parseFloat(rgba[4]) : 1;
                if (alpha > 0.05) return bg;
              }
              node = node.parentElement;
            }
            return "rgb(255, 255, 255)";
          }

          function isDecorativeEl(el: Element): boolean {
            if (el.getAttribute("aria-hidden") === "true") return true;
            if (el.closest("[aria-hidden='true']")) return true;
            const role = el.getAttribute("role");
            if (role === "presentation") return true;
            if (
              role === "img" &&
              !el.getAttribute("aria-label") &&
              !el.getAttribute("aria-labelledby")
            )
              return true;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return true;
            const style = window.getComputedStyle(el);
            if (parseFloat(style.opacity) === 0) return true;
            return false;
          }

          function isLargeTextEl(el: Element): boolean {
            const style = window.getComputedStyle(el);
            const size = parseFloat(style.fontSize);
            const weight = parseInt(style.fontWeight, 10) || 400;
            return size >= 18 || (size >= 14 && weight >= 700);
          }

          const INTERACTIVE_SELECTOR = [
            "button",
            "a",
            "input",
            "label",
            "select",
            "textarea",
            "[role='button']",
            "[role='link']",
            "[role='checkbox']",
            "[role='radio']",
            "[role='tab']",
            "[role='menuitem']",
            "td",
            "th",
            "span",
            "p",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "li",
            "dt",
            "dd",
            "[class*='badge']",
            "[class*='status']",
          ].join(",");

          type ContrastResult = {
            selector: string;
            textColor: string;
            bgColor: string;
            contrastRatio: number;
            threshold: number;
            textType: "normal" | "large";
            pass: boolean;
          };

          const results: ContrastResult[] = [];
          const elements = document.querySelectorAll(INTERACTIVE_SELECTOR);

          for (const el of elements) {
            if (isDecorativeEl(el)) continue;

            const hasText = Array.from(el.childNodes).some(
              (n) =>
                n.nodeType === Node.TEXT_NODE &&
                (n.textContent ?? "").trim().length > 0
            );
            if (!hasText) continue;

            const style = window.getComputedStyle(el);
            const textColorStr = style.color;
            const bgColorStr = getEffectiveBgColor(el);
            const tc = parseRGB(textColorStr);
            const bc = parseRGB(bgColorStr);
            if (!tc || !bc) continue;

            const tl = computeRelativeLuminance(tc.r, tc.g, tc.b);
            const bl = computeRelativeLuminance(bc.r, bc.g, bc.b);
            const ratio = contrastRatio(tl, bl);
            const large = isLargeTextEl(el);
            const threshold = large ? 3.0 : 4.5;

            if (ratio < threshold) {
              const selector = el.id
                ? `#${el.id}`
                : `${el.tagName.toLowerCase()}${
                    el.className && typeof el.className === "string"
                      ? "." +
                        el.className
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .join(".")
                      : ""
                  }`;

              results.push({
                selector,
                textColor: textColorStr,
                bgColor: bgColorStr,
                contrastRatio: Math.round(ratio * 100) / 100,
                threshold,
                textType: large ? "large" : "normal",
                pass: false,
              });
            }
          }

          return results;
        });

        pageReport.layerA.dark = darkViolations;

        for (const violation of darkViolations) {
          expect
            .soft(
              violation.pass,
              `[Layer A / dark] ${entry.name} — contrast ${violation.contrastRatio} < ${violation.threshold} on ${violation.selector}`
            )
            .toBe(true);
        }
      } catch (err) {
        const existing = pageReport.layerA.error;
        pageReport.layerA.error = existing
          ? `${existing}; Dark mode scan failed: ${err}`
          : `Dark mode scan failed: ${err}`;
      }

      // ── Restore light mode ───────────────────────────────────────────────
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
      });

      report.pages.push(pageReport);
    }

    // Write Layer A results to disk immediately — module state resets between tests
    const outDir = path.join(process.cwd(), "color-audit");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, "layer-a.json"),
      JSON.stringify(report.pages, null, 2),
      "utf-8"
    );
    console.log(`[Layer A] Written ${report.pages.length} page results to color-audit/layer-a.json`);
  });
});

// ─── Layer B — Hardcoded Color Class Audit ────────────────────────────────────
//
// Visits every page in light mode and scans the rendered DOM for Tailwind color
// classes that bypass the design token system (e.g. bg-blue-500, text-red-600).
// Class names are mode-independent, so a single light-mode pass per page suffices.
//
// Requirements: 1.1, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2

test.describe("Layer B — Hardcoded Color Class Audit", () => {
  test.setTimeout(600_000); // 10 minutes — 45 pages
  test("all pages: hardcoded Tailwind class scan", async ({ page }) => {
    for (const entry of PAGES) {
      const pageReport = initPageReport(entry);

      // ── Navigate (light mode) ──────────────────────────────────────────────
      try {
        await page.goto(entry.route, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        await page.waitForTimeout(1500);
      } catch (navErr) {
        pageReport.layerB.error = `Navigation failed: ${navErr}`;
        report.pages.push(pageReport);
        continue;
      }

      // ── Hardcoded class scan ───────────────────────────────────────────────
      try {
        const violations = await page.evaluate(() => {
          // ── Inline constants — FULLY SELF-CONTAINED, no Node.js closures ──

          const PALETTE_COLORS = new Set([
            "blue",
            "red",
            "green",
            "emerald",
            "rose",
            "amber",
            "violet",
            "purple",
            "orange",
            "yellow",
            "gray",
            "zinc",
            "neutral",
            "stone",
            "cyan",
            "teal",
            "lime",
            "pink",
            "fuchsia",
            "sky",
            "indigo",
          ]);

          // Suppress unused-variable warning — PALETTE_COLORS is used implicitly
          // via the character class in HARDCODED_RE; we keep the Set here so
          // the design intent is clear and maintainable.
          void PALETTE_COLORS;

          const HARDCODED_RE =
            /^(text|bg|border)-(blue|red|green|emerald|rose|amber|violet|purple|orange|yellow|gray|zinc|neutral|stone|cyan|teal|lime|pink|fuchsia|sky|indigo)-(\d{1,3})$/;

          const TOKEN_MAP: Record<string, string> = {
            "bg-blue": "bg-primary",
            "bg-emerald": "bg-success",
            "bg-red": "bg-destructive",
            "bg-amber": "bg-warning",
            "bg-cyan": "bg-info",
            "bg-indigo": "bg-primary",
            "bg-violet": "bg-primary",
            "bg-purple": "bg-primary",
            "bg-gray": "bg-muted",
            "bg-zinc": "bg-muted",
            "bg-neutral": "bg-muted",
            "bg-stone": "bg-muted",
            "text-blue": "text-primary",
            "text-emerald": "text-success (via CSS var)",
            "text-red": "text-destructive",
            "text-amber": "text-warning (via CSS var)",
            "text-gray": "text-muted-foreground",
            "text-zinc": "text-muted-foreground",
            "text-neutral": "text-muted-foreground",
            "border-blue": "border-primary",
            "border-gray": "border-border",
            "border-zinc": "border-border",
          };

          function suggestToken(prefix: string, color: string): string {
            return TOKEN_MAP[`${prefix}-${color}`] ?? `${prefix}-[design-token]`;
          }

          // ── Scanner loop ──────────────────────────────────────────────────

          type HardcodedViolation = {
            tagName: string;
            violatingClass: string;
            recommendedToken: string;
          };

          const results: HardcodedViolation[] = [];
          const all = document.querySelectorAll("*");

          for (const el of all) {
            for (const cls of el.classList) {
              const m = cls.match(HARDCODED_RE);
              if (m) {
                results.push({
                  tagName: el.tagName.toLowerCase(),
                  violatingClass: cls,
                  recommendedToken: suggestToken(m[1], m[2]),
                });
              }
            }
          }

          return results;
        });

        pageReport.layerB.violations = violations;

        // Soft-assert per page so the run continues even with violations
        expect
          .soft(
            violations.length,
            `[Layer B] ${entry.name} — ${violations.length} hardcoded color class violation(s) found`
          )
          .toBe(0);
      } catch (err) {
        pageReport.layerB.error = `Hardcoded class scan failed: ${err}`;
      }

      report.pages.push(pageReport);
    }

    // Write Layer B results to disk immediately
    const outDir = path.join(process.cwd(), "color-audit");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, "layer-b.json"),
      JSON.stringify(report.pages, null, 2),
      "utf-8"
    );
    console.log(`[Layer B] Written ${report.pages.length} page results to color-audit/layer-b.json`);
  });
});

// ─── Layer C — Screenshot Comparison ─────────────────────────────────────────
//
// Visits every page in light mode, captures a full-page PNG, then toggles dark
// mode and captures again. The two buffers are compared pixel-by-pixel on the
// Node.js side using fast-png + computePixelDiffPct. The verdict is emitted as
// a console.warn() for DARK_MODE_BROKEN (not expect.soft) per the design.
//
// Requirements: 1.1, 1.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.6, 7.1, 7.2

test.describe("Layer C — Screenshot Comparison", () => {
  test.setTimeout(900_000); // 15 minutes — 45 pages × 2 screenshots + PNG decoding
  test("all pages: light vs dark pixel diff", async ({ page }) => {
    // Output directory — write to color-audit/ at workspace root (outside
    // playwright-report/ which gets wiped by Playwright's HTML reporter)
    const outDir = path.join(process.cwd(), "color-audit");

    // Guarantee screenshot directories exist before the page loop
    ensureDirectories(outDir);

    for (const entry of PAGES) {
      const pageReport = initPageReport(entry);

      // ── Navigate (light mode) ────────────────────────────────────────────
      try {
        await page.goto(entry.route, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        await page.waitForTimeout(1500);
      } catch (navErr) {
        pageReport.layerC.error = `Navigation failed: ${navErr}`;
        report.pages.push(pageReport);
        continue;
      }

      // ── Screenshot capture & pixel diff ─────────────────────────────────
      try {
        // Light mode screenshot
        const lightBuffer = await page.screenshot({ fullPage: true });
        fs.writeFileSync(
          path.join(outDir, "screenshots", "light", entry.name + ".png"),
          lightBuffer
        );

        // Toggle to dark mode
        await page.evaluate(() => {
          document.documentElement.classList.add("dark");
        });

        // Dark mode screenshot
        const darkBuffer = await page.screenshot({ fullPage: true });
        fs.writeFileSync(
          path.join(outDir, "screenshots", "dark", entry.name + ".png"),
          darkBuffer
        );

        // Restore light mode
        await page.evaluate(() => {
          document.documentElement.classList.remove("dark");
        });

        // Decode both PNGs on the Node.js side via fast-png
        const lightImg = decodePNG(lightBuffer);
        const darkImg = decodePNG(darkBuffer);

        // If dimensions differ, computePixelDiffPct will return 100 via its
        // length-mismatch guard — no special case needed here.
        const channels =
          lightImg.data.length / (lightImg.width * lightImg.height);

        // fast-png returns a typed array (Uint8Array or Uint16Array).
        // computePixelDiffPct accepts Uint8Array | number[], so pass directly.
        const pct = computePixelDiffPct(
          lightImg.data as Uint8Array,
          darkImg.data as Uint8Array,
          lightImg.width,
          lightImg.height,
          channels
        );

        const verdict = classifyDarkMode(pct);

        pageReport.layerC.screenshot = {
          pixelDiffPct: pct,
          verdict,
        };

        // Requirement 4.7 — DARK_MODE_BROKEN is a warning, not a test failure
        if (verdict === "DARK_MODE_BROKEN") {
          console.warn(
            `[Layer C] DARK_MODE_BROKEN — ${entry.name}: pixel diff ${pct.toFixed(2)}% ≤ 5% threshold`
          );
        }
      } catch (err) {
        pageReport.layerC.error = `Screenshot comparison failed: ${err}`;
      }

      report.pages.push(pageReport);
    }

    // Write Layer C results to disk immediately
    const layerCOutDir = path.join(process.cwd(), "color-audit");
    fs.mkdirSync(layerCOutDir, { recursive: true });
    fs.writeFileSync(
      path.join(layerCOutDir, "layer-c.json"),
      JSON.stringify(report.pages, null, 2),
      "utf-8"
    );
    console.log(`[Layer C] Written ${report.pages.length} page results to color-audit/layer-c.json`);
  });
});

// ─── Layer D — Theme Token Compliance ────────────────────────────────────────
//
// Visits every page in light mode, evaluates six design tokens via
// getComputedStyle, then toggles dark mode and re-evaluates. Critical token
// violations (--background, --foreground, --primary) are soft-asserted as test
// failures; non-critical violations (--card, --border, --muted-foreground) emit
// console.warn() only.
//
// Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.1, 7.2

test.describe("Layer D — Theme Token Compliance", () => {
  test.setTimeout(600_000); // 10 minutes — 45 pages × 2 modes
  test("all pages: design token resolution", async ({ page }) => {
    for (const entry of PAGES) {
      const pageReport = initPageReport(entry);

      // ── Navigate (light mode) ─────────────────────────────────────────────
      try {
        await page.goto(entry.route, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        await page.waitForTimeout(1500);
      } catch (navErr) {
        const msg = `Navigation failed: ${navErr}`;
        pageReport.layerD.error = msg;
        report.pages.push(pageReport);
        continue;
      }

      // ── Light mode token evaluation ───────────────────────────────────────
      try {
        const lightViolations = await page.evaluate((mode) => {
          // ── Inline constants and helpers — FULLY SELF-CONTAINED ───────────

          const TOKENS_TO_CHECK = [
            "--background",
            "--foreground",
            "--primary",
            "--card",
            "--border",
            "--muted-foreground",
          ];
          const CRITICAL_TOKENS = new Set([
            "--background",
            "--foreground",
            "--primary",
          ]);

          function hslToRGB(
            h: number,
            s: number,
            l: number
          ): { r: number; g: number; b: number } {
            const sn = s / 100;
            const ln = l / 100;
            const a = sn * Math.min(ln, 1 - ln);
            const f = (n: number) => {
              const k = (n + h / 30) % 12;
              return ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            };
            return {
              r: Math.round(f(0) * 255),
              g: Math.round(f(8) * 255),
              b: Math.round(f(4) * 255),
            };
          }

          function computeLuminanceFromHSL(hslStr: string): number | null {
            const parts = hslStr.trim().split(/\s+/);
            if (parts.length < 3) return null;
            const h = parseFloat(parts[0]);
            const s = parseFloat(parts[1]);
            const l = parseFloat(parts[2]);
            if (isNaN(h) || isNaN(s) || isNaN(l)) return null;
            const { r, g, b } = hslToRGB(h, s, l);
            const toLinear = (c: number) => {
              const sv = c / 255;
              return sv <= 0.04045
                ? sv / 12.92
                : Math.pow((sv + 0.055) / 1.055, 2.4);
            };
            return (
              0.2126 * toLinear(r) +
              0.7152 * toLinear(g) +
              0.0722 * toLinear(b)
            );
          }

          // ── Token resolution loop ─────────────────────────────────────────

          type TokenViolation = {
            token: string;
            resolvedValue: string;
            luminance?: number;
            compliant: "yes" | "no";
            critical: boolean;
          };

          const root = document.documentElement;
          const computed = window.getComputedStyle(root);
          const results: TokenViolation[] = [];

          for (const token of TOKENS_TO_CHECK) {
            const value = computed.getPropertyValue(token).trim();
            const missing = !value || value === "";

            const violation: TokenViolation = {
              token,
              resolvedValue: value,
              compliant: "yes",
              critical: CRITICAL_TOKENS.has(token),
            };

            if (missing) {
              violation.compliant = "no";
              results.push(violation);
              continue;
            }

            if (token === "--background") {
              const lum = computeLuminanceFromHSL(value);
              violation.luminance = lum ?? undefined;
              if (mode === "dark" && lum !== null && lum >= 0.2) {
                violation.compliant = "no"; // background too light for dark mode
              } else if (mode === "light" && lum !== null && lum <= 0.8) {
                violation.compliant = "no"; // background too dark for light mode
              }
            }

            if (violation.compliant === "no") results.push(violation);
          }

          return results;
        }, "light");

        pageReport.layerD.light = lightViolations;

        // Critical violations → soft-assert test failure; non-critical → warn
        for (const violation of lightViolations) {
          if (violation.critical) {
            expect
              .soft(
                violation.compliant,
                `[Layer D / light] ${entry.name} — critical token ${violation.token} non-compliant (value: "${violation.resolvedValue}")`
              )
              .toBe("yes");
          } else {
            console.warn(
              `[Layer D / light] ${entry.name} — non-critical token ${violation.token} non-compliant (value: "${violation.resolvedValue}")`
            );
          }
        }
      } catch (err) {
        pageReport.layerD.error = `Light mode token scan failed: ${err}`;
      }

      // ── Toggle dark mode ──────────────────────────────────────────────────
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });

      // ── Dark mode token evaluation ────────────────────────────────────────
      try {
        const darkViolations = await page.evaluate((mode) => {
          // ── Inline constants and helpers — FULLY SELF-CONTAINED ───────────

          const TOKENS_TO_CHECK = [
            "--background",
            "--foreground",
            "--primary",
            "--card",
            "--border",
            "--muted-foreground",
          ];
          const CRITICAL_TOKENS = new Set([
            "--background",
            "--foreground",
            "--primary",
          ]);

          function hslToRGB(
            h: number,
            s: number,
            l: number
          ): { r: number; g: number; b: number } {
            const sn = s / 100;
            const ln = l / 100;
            const a = sn * Math.min(ln, 1 - ln);
            const f = (n: number) => {
              const k = (n + h / 30) % 12;
              return ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            };
            return {
              r: Math.round(f(0) * 255),
              g: Math.round(f(8) * 255),
              b: Math.round(f(4) * 255),
            };
          }

          function computeLuminanceFromHSL(hslStr: string): number | null {
            const parts = hslStr.trim().split(/\s+/);
            if (parts.length < 3) return null;
            const h = parseFloat(parts[0]);
            const s = parseFloat(parts[1]);
            const l = parseFloat(parts[2]);
            if (isNaN(h) || isNaN(s) || isNaN(l)) return null;
            const { r, g, b } = hslToRGB(h, s, l);
            const toLinear = (c: number) => {
              const sv = c / 255;
              return sv <= 0.04045
                ? sv / 12.92
                : Math.pow((sv + 0.055) / 1.055, 2.4);
            };
            return (
              0.2126 * toLinear(r) +
              0.7152 * toLinear(g) +
              0.0722 * toLinear(b)
            );
          }

          // ── Token resolution loop ─────────────────────────────────────────

          type TokenViolation = {
            token: string;
            resolvedValue: string;
            luminance?: number;
            compliant: "yes" | "no";
            critical: boolean;
          };

          const root = document.documentElement;
          const computed = window.getComputedStyle(root);
          const results: TokenViolation[] = [];

          for (const token of TOKENS_TO_CHECK) {
            const value = computed.getPropertyValue(token).trim();
            const missing = !value || value === "";

            const violation: TokenViolation = {
              token,
              resolvedValue: value,
              compliant: "yes",
              critical: CRITICAL_TOKENS.has(token),
            };

            if (missing) {
              violation.compliant = "no";
              results.push(violation);
              continue;
            }

            if (token === "--background") {
              const lum = computeLuminanceFromHSL(value);
              violation.luminance = lum ?? undefined;
              if (mode === "dark" && lum !== null && lum >= 0.2) {
                violation.compliant = "no"; // background too light for dark mode
              } else if (mode === "light" && lum !== null && lum <= 0.8) {
                violation.compliant = "no"; // background too dark for light mode
              }
            }

            if (violation.compliant === "no") results.push(violation);
          }

          return results;
        }, "dark");

        pageReport.layerD.dark = darkViolations;

        // Critical violations → soft-assert test failure; non-critical → warn
        for (const violation of darkViolations) {
          if (violation.critical) {
            expect
              .soft(
                violation.compliant,
                `[Layer D / dark] ${entry.name} — critical token ${violation.token} non-compliant (value: "${violation.resolvedValue}")`
              )
              .toBe("yes");
          } else {
            console.warn(
              `[Layer D / dark] ${entry.name} — non-critical token ${violation.token} non-compliant (value: "${violation.resolvedValue}")`
            );
          }
        }
      } catch (err) {
        const existing = pageReport.layerD.error;
        pageReport.layerD.error = existing
          ? `${existing}; Dark mode token scan failed: ${err}`
          : `Dark mode token scan failed: ${err}`;
      }

      // ── Restore light mode ────────────────────────────────────────────────
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
      });

      report.pages.push(pageReport);
    }

    // Write Layer D results to disk immediately
    const layerDOutDir = path.join(process.cwd(), "color-audit");
    fs.mkdirSync(layerDOutDir, { recursive: true });
    fs.writeFileSync(
      path.join(layerDOutDir, "layer-d.json"),
      JSON.stringify(report.pages, null, 2),
      "utf-8"
    );
    console.log(`[Layer D] Written ${report.pages.length} page results to color-audit/layer-d.json`);
  });
});

// ─── Report Generation ────────────────────────────────────────────────────────
//
// Writes the accumulated report to JSON and HTML after all layers have run.
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.4

test.describe("Report Generation", () => {
  test("write JSON and HTML artifacts", async () => {
    const outDir = path.join(process.cwd(), "color-audit");
    fs.mkdirSync(outDir, { recursive: true });

    // ── Read per-layer JSON files written by each layer test ───────────────
    // Module-level state resets between tests when a test fails, so each
    // layer writes its own results to disk. We merge from disk here.
    const layerFiles = ["layer-a.json", "layer-b.json", "layer-c.json", "layer-d.json"];
    const merged = new Map<string, typeof report.pages[0]>();

    for (const fileName of layerFiles) {
      const filePath = path.join(outDir, fileName);
      if (!fs.existsSync(filePath)) {
        console.warn(`[Report] Missing ${fileName} — layer may have failed`);
        continue;
      }
      const layerPages: typeof report.pages = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`[Report] Loaded ${layerPages.length} entries from ${fileName}`);

      for (const pr of layerPages) {
        if (!merged.has(pr.pageName)) {
          merged.set(pr.pageName, { ...pr });
        } else {
          const existing = merged.get(pr.pageName)!;
          if (pr.layerA.light.length > 0 || pr.layerA.dark.length > 0 || pr.layerA.error) {
            existing.layerA = pr.layerA;
          }
          if (pr.layerB.violations.length > 0 || pr.layerB.error) {
            existing.layerB = pr.layerB;
          }
          if (pr.layerC.screenshot !== null || pr.layerC.error) {
            existing.layerC = pr.layerC;
          }
          if (pr.layerD.light.length > 0 || pr.layerD.dark.length > 0 || pr.layerD.error) {
            existing.layerD = pr.layerD;
          }
        }
      }
    }

    const finalReport = {
      generatedAt: new Date().toISOString(),
      totalPages: PAGES.length,
      pages: Array.from(merged.values()),
    };

    console.log(`[Report] Merged ${finalReport.pages.length} pages from ${merged.size} unique names`);

    const jsonPath = path.join(outDir, "ui-color-report.json");
    fs.writeFileSync(jsonPath, JSON.stringify(finalReport, null, 2), "utf-8");
    console.log(`[Report] JSON written → ${jsonPath}`);

    await writeReportHTML(finalReport, outDir);
    console.log(`[Report] HTML written → ${path.join(outDir, "ui-color-summary.html")}`);

    printConsoleSummary(finalReport);
  });
});
