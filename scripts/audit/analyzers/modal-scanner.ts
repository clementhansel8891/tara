/**
 * Modal Scanner
 *
 * Recursively scans all `.tsx`/`.ts` files to find every modal / dialog
 * instance in the codebase. Detects:
 *
 *  - Import statements for `Dialog`, `AlertDialog`, `Sheet`, `Drawer`,
 *    `Modal`, `Popover` from `@radix-ui/*` or `src/components/ui/*`
 *  - JSX usage of `<DialogContent>`, `<SheetContent>`, `<DrawerContent>`,
 *    `<AlertDialogContent>`, `<DrawerContent>`, `<PopoverContent>` etc.
 *  - Trigger elements (`DialogTrigger`, `SheetTrigger`, state-controlled
 *    `open` props)
 *
 * For each modal it classifies:
 *   hasForm, hasSubmitHandler, submitClassification,
 *   hasValidation, hasCancelHandler
 *
 * Results are written to `audit-results/static/modals.json`.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as ts from 'typescript';

import { MODULE_REGISTRY, type ModalInstance, type Classification } from '../types/audit-types.js';
import { parseSourceFile, visitNodes, getLineNumber } from '../utils/ast-parser.js';
import { walkFiles } from '../utils/file-walker.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Modal component names we care about (root component names). */
const MODAL_ROOT_NAMES = new Set([
  'Dialog',
  'AlertDialog',
  'Sheet',
  'Drawer',
  'Modal',
  'Popover',
]);

/**
 * Content sub-components that definitively mark a usage as a modal content
 * block. Keyed to their root modal type.
 */
const CONTENT_TAG_TO_TYPE: Record<string, ModalInstance['modalType']> = {
  DialogContent: 'Dialog',
  AlertDialogContent: 'AlertDialog',
  SheetContent: 'Sheet',
  DrawerContent: 'Drawer',
  ModalContent: 'Dialog',
  PopoverContent: 'Popover',
};

/** Trigger sub-components. */
const TRIGGER_TAGS = new Set([
  'DialogTrigger',
  'AlertDialogTrigger',
  'SheetTrigger',
  'DrawerTrigger',
  'PopoverTrigger',
]);

/** Tag names that indicate a form is present inside the modal. */
const FORM_TAGS = new Set(['form', 'Form']);

/** Input-like tags that also indicate the presence of a form. */
const INPUT_TAGS = new Set([
  'Input',
  'input',
  'Textarea',
  'textarea',
  'Select',
  'Checkbox',
  'RadioGroup',
  'Switch',
  'DatePicker',
  'TimePicker',
  'NumberInput',
  'FormField',
  'FormItem',
  'FormControl',
]);

/** Tag names for submit buttons. */
const SUBMIT_TAGS = new Set(['Button', 'button']);

/** Prop names that look like submit handlers on a button. */
const SUBMIT_HANDLER_PROPS = new Set(['onClick', 'onSubmit']);

/** Prop names / tag names used to cancel / close a modal. */
const CANCEL_TAGS = new Set([
  'DialogClose',
  'AlertDialogCancel',
  'SheetClose',
  'DrawerClose',
  'PopoverClose',
]);

/** Validation-related imports / identifiers. */
const VALIDATION_IDENTIFIERS = new Set([
  'useForm',
  'useZodForm',
  'zodResolver',
  'yupResolver',
  'joiResolver',
  'register',
  'handleSubmit',
  'formState',
  'Controller',
  'FormProvider',
]);

/** Stub-like handler body patterns (same heuristics as StubDetector). */
const STUB_PATTERNS = [
  /^\s*$/, // empty
  /^\(\s*\)\s*=>\s*\{\s*\}$/, // () => {}
  /^\(\s*\)\s*=>\s*\{\s*\/\/\s*(TODO|FIXME|HACK|PLACEHOLDER)/i,
  /^(toast|console\.log|alert)\(/,
  /^\w+\s*=>\s*\{\s*\}$/, // x => {}
];

// Packages whose imports indicate modal usage
const MODAL_SOURCE_PREFIXES = ['@radix-ui/', 'src/components/ui/'];

/** Glob patterns to scan. */
const SCAN_PATTERNS = [
  'src/pages/**/*.{ts,tsx}',
  'src/components/**/*.{ts,tsx}',
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildId(filePath: string, lineNumber: number, type: string): string {
  return crypto
    .createHash('sha256')
    .update(`${filePath}:${lineNumber}:${type}`)
    .digest('hex')
    .slice(0, 16);
}

function resolveModuleInfo(
  relFilePath: string
): { layer: string; parentPage: string } {
  const normalised = relFilePath.replace(/\\/g, '/');

  for (const [moduleName, config] of Object.entries(MODULE_REGISTRY)) {
    for (const pagePath of config.pagePaths) {
      if (normalised.startsWith(pagePath) || normalised === pagePath) {
        return { layer: config.layer, parentPage: `/${moduleName}` };
      }
    }
  }

  const match = normalised.match(/^src\/(?:pages|components)\/([^/]+)/);
  return {
    layer: match ? match[1] : 'unknown',
    parentPage: match ? `/${match[1]}` : '/',
  };
}

/**
 * Determine if a handler body looks like a stub.
 */
function isStubBody(body: string): boolean {
  const trimmed = body.trim();
  return STUB_PATTERNS.some((p) => p.test(trimmed));
}

/**
 * Classify the submit handler body using the same rough rules as StubDetector.
 * Returns a simplified Classification appropriate for ModalInstance.
 */
function classifySubmitBody(body: string): Classification {
  if (!body || isStubBody(body)) return 'stub';

  // Calls API-ish things — mutation, fetch, axios, service call
  const hasApiCall =
    /\b(fetch|axios|mutate|mutation|post|put|patch|delete|apiClient|api\.|service\.)\b/.test(body);

  const hasResponseHandling =
    /\b(then|onSuccess|catch|onError|setState|set[A-Z]|dispatch|refetch|invalidate|router\.push|navigate|toast\.(success|error))\b/.test(body);

  if (hasApiCall && hasResponseHandling) return 'fully_functional';
  if (hasApiCall && !hasResponseHandling) return 'partially_working';

  // Non-empty, non-stub, but no clear API call
  return 'needs_dynamic_verification';
}

// ---------------------------------------------------------------------------
// Per-file analysis
// ---------------------------------------------------------------------------

/**
 * Check whether a file imports any modal-related components from the
 * supported sources.
 */
function fileHasModalImports(sourceFile: ts.SourceFile): boolean {
  let found = false;

  visitNodes(sourceFile, (node) => {
    if (found) return;
    if (!ts.isImportDeclaration(node)) return;

    const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
    const isModalSource = MODAL_SOURCE_PREFIXES.some((prefix) =>
      moduleSpecifier.startsWith(prefix)
    );
    if (!isModalSource) return;

    // Check if the imported names include any modal-root names
    const namedBindings = node.importClause?.namedBindings;
    if (!namedBindings) return;

    if (ts.isNamedImports(namedBindings)) {
      for (const element of namedBindings.elements) {
        const imported = element.propertyName?.text ?? element.name.text;
        if (MODAL_ROOT_NAMES.has(imported) || imported.startsWith('Dialog') ||
            imported.startsWith('Sheet') || imported.startsWith('Drawer') ||
            imported.startsWith('AlertDialog') || imported.startsWith('Popover')) {
          found = true;
          return;
        }
      }
    }
  });

  return found;
}

interface ModalContext {
  contentTag: string;
  modalType: ModalInstance['modalType'];
  lineNumber: number;
  /** AST node of the JsxElement wrapping this content block */
  node: ts.Node;
}

/**
 * Walk the AST and collect all JSX nodes that correspond to modal content
 * blocks (DialogContent, SheetContent, etc.).
 */
function collectModalContextNodes(
  sourceFile: ts.SourceFile
): ModalContext[] {
  const results: ModalContext[] = [];

  visitNodes(sourceFile, (node) => {
    if (
      node.kind !== ts.SyntaxKind.JsxOpeningElement &&
      node.kind !== ts.SyntaxKind.JsxSelfClosingElement
    ) {
      return;
    }

    const jsxNode = node as ts.JsxOpeningElement | ts.JsxSelfClosingElement;
    let tagName: string;
    try {
      tagName = jsxNode.tagName.getText(sourceFile);
    } catch {
      return;
    }

    // Strip member expression prefix (e.g., "Dialog.Content" → "DialogContent" handled via mapping)
    const simpleTag = tagName.replace(/\./g, '');

    const modalType = CONTENT_TAG_TO_TYPE[simpleTag] ?? CONTENT_TAG_TO_TYPE[tagName];
    if (!modalType) return;

    const lineNumber = getLineNumber(sourceFile, jsxNode);

    // Walk up to find the enclosing JsxElement (which wraps the full modal block)
    let enclosing: ts.Node = node;
    while (
      enclosing.parent &&
      enclosing.parent.kind !== ts.SyntaxKind.JsxElement &&
      enclosing.parent.kind !== ts.SyntaxKind.JsxFragment &&
      enclosing.parent.kind !== ts.SyntaxKind.SourceFile
    ) {
      enclosing = enclosing.parent;
    }

    // Use the JsxElement parent if available, otherwise the content node itself
    const contextNode =
      enclosing.kind === ts.SyntaxKind.JsxElement ? enclosing : node;

    results.push({ contentTag: tagName, modalType, lineNumber, node: contextNode });
  });

  return results;
}

/**
 * Analyse the subtree rooted at `contextNode` to determine the modal's
 * characteristics: hasForm, hasSubmitHandler, submitClassification,
 * hasValidation, hasCancelHandler.
 *
 * Also determines the triggerElement by scanning the parent scope for a
 * matching Trigger component or an `open` state controller.
 */
function analyseModalSubtree(
  contextNode: ts.Node,
  sourceFile: ts.SourceFile,
  fullFileText: string
): {
  hasForm: boolean;
  hasSubmitHandler: boolean;
  submitClassification: Classification;
  hasValidation: boolean;
  hasCancelHandler: boolean;
  triggerElement: string;
} {
  let hasForm = false;
  let hasSubmitHandler = false;
  let submitClassification: Classification = 'stub';
  let hasValidation = false;
  let hasCancelHandler = false;

  // Collect all tag names and handler bodies inside the modal subtree
  const submitHandlerBodies: string[] = [];

  visitNodes(contextNode, (node) => {
    if (
      node.kind !== ts.SyntaxKind.JsxOpeningElement &&
      node.kind !== ts.SyntaxKind.JsxSelfClosingElement
    ) {
      return;
    }

    const jsxNode = node as ts.JsxOpeningElement | ts.JsxSelfClosingElement;
    let tagName: string;
    try {
      tagName = jsxNode.tagName.getText(sourceFile);
    } catch {
      return;
    }

    const simpleTag = tagName.split('.').pop() ?? tagName;

    // Form detection
    if (FORM_TAGS.has(simpleTag) || FORM_TAGS.has(tagName)) {
      hasForm = true;
      // Check for onSubmit handler on the form element
      for (const attr of jsxNode.attributes.properties) {
        if (attr.kind !== ts.SyntaxKind.JsxAttribute) continue;
        const jsxAttr = attr as ts.JsxAttribute;
        const attrName = jsxAttr.name.getText(sourceFile);
        if (attrName === 'onSubmit' && jsxAttr.initializer) {
          hasSubmitHandler = true;
          let body = '';
          if (jsxAttr.initializer.kind === ts.SyntaxKind.JsxExpression) {
            const expr = (jsxAttr.initializer as ts.JsxExpression).expression;
            body = expr ? expr.getText(sourceFile) : '';
          }
          if (body) submitHandlerBodies.push(body);
        }
      }
    }

    // Input detection (implies a form)
    if (INPUT_TAGS.has(simpleTag) || INPUT_TAGS.has(tagName)) {
      hasForm = true;
    }

    // Cancel detection
    if (CANCEL_TAGS.has(simpleTag) || CANCEL_TAGS.has(tagName)) {
      hasCancelHandler = true;
    }

    // Submit button detection: <Button type="submit"> or <Button onClick={handler}>
    if (SUBMIT_TAGS.has(simpleTag) || SUBMIT_TAGS.has(tagName)) {
      const attrs = jsxNode.attributes.properties;
      let isSubmitType = false;
      let handlerBody = '';

      for (const attr of attrs) {
        if (attr.kind !== ts.SyntaxKind.JsxAttribute) continue;
        const jsxAttr = attr as ts.JsxAttribute;
        const attrName = jsxAttr.name.getText(sourceFile);

        if (attrName === 'type') {
          const val = jsxAttr.initializer
            ? jsxAttr.initializer.getText(sourceFile)
            : '';
          if (val.includes('submit')) isSubmitType = true;
        }

        if (SUBMIT_HANDLER_PROPS.has(attrName) && jsxAttr.initializer) {
          if (jsxAttr.initializer.kind === ts.SyntaxKind.JsxExpression) {
            const expr = (jsxAttr.initializer as ts.JsxExpression).expression;
            handlerBody = expr ? expr.getText(sourceFile) : '';
          }
        }
      }

      if (isSubmitType || handlerBody) {
        hasSubmitHandler = true;
        if (handlerBody) submitHandlerBodies.push(handlerBody);
      }
    }

    // Validation detection via component names (FormField, Controller, etc.)
    if (VALIDATION_IDENTIFIERS.has(simpleTag) || VALIDATION_IDENTIFIERS.has(tagName)) {
      hasValidation = true;
    }
  });

  // Check for validation via hooks in the broader file scope around this modal
  // (useForm, zodResolver, etc. are typically called at component level, not inside JSX)
  if (!hasValidation) {
    const fileSection = fullFileText;
    for (const ident of VALIDATION_IDENTIFIERS) {
      if (fileSection.includes(ident + '(') || fileSection.includes(ident + ' ')) {
        hasValidation = true;
        break;
      }
    }
  }

  // Determine submit classification from all collected handler bodies
  if (submitHandlerBodies.length > 0) {
    // Use the "best" classification among all submit handlers found
    let best: Classification = 'stub';
    for (const body of submitHandlerBodies) {
      const c = classifySubmitBody(body);
      if (c === 'fully_functional') { best = c; break; }
      if (c === 'partially_working' && best !== 'fully_functional') best = c;
      if (c === 'needs_dynamic_verification' && best === 'stub') best = c;
    }
    submitClassification = best;
  } else if (hasSubmitHandler) {
    submitClassification = 'needs_dynamic_verification';
  } else {
    submitClassification = 'stub';
  }

  // --- Trigger element resolution ---
  // Walk up from the contextNode to find a sibling trigger or an `open` prop
  let triggerElement = '<unknown>';

  // Look for a Trigger sibling within the same JsxElement parent
  const parent = contextNode.parent;
  if (parent && parent.kind === ts.SyntaxKind.JsxElement) {
    const jsxParent = parent as ts.JsxElement;
    for (const child of jsxParent.children) {
      if (child.kind !== ts.SyntaxKind.JsxElement &&
          child.kind !== ts.SyntaxKind.JsxSelfClosingElement) continue;

      let childTag = '';
      try {
        if (child.kind === ts.SyntaxKind.JsxElement) {
          childTag = (child as ts.JsxElement).openingElement.tagName.getText(sourceFile);
        } else {
          childTag = (child as ts.JsxSelfClosingElement).tagName.getText(sourceFile);
        }
      } catch {
        continue;
      }

      const simpleChild = childTag.split('.').pop() ?? childTag;
      if (TRIGGER_TAGS.has(simpleChild) || TRIGGER_TAGS.has(childTag)) {
        triggerElement = childTag;
        break;
      }
    }

    // If no named trigger, check for `open` / `onOpenChange` on the root element
    if (triggerElement === '<unknown>') {
      const openingEl = jsxParent.openingElement;
      for (const attr of openingEl.attributes.properties) {
        if (attr.kind !== ts.SyntaxKind.JsxAttribute) continue;
        const attrName = (attr as ts.JsxAttribute).name.getText(sourceFile);
        if (attrName === 'open' || attrName === 'onOpenChange') {
          triggerElement = 'state-controlled';
          break;
        }
      }
    }
  }

  // Fallback: scan the broader file for Trigger usage near this line
  if (triggerElement === '<unknown>') {
    const linePos = contextNode.getStart(sourceFile);
    const nearbyText = fullFileText.slice(
      Math.max(0, linePos - 500),
      Math.min(fullFileText.length, linePos + 500)
    );
    for (const t of TRIGGER_TAGS) {
      if (nearbyText.includes(`<${t}`) || nearbyText.includes(`<${t} `)) {
        triggerElement = t;
        break;
      }
    }
    if (triggerElement === '<unknown>' && nearbyText.includes('open=')) {
      triggerElement = 'state-controlled';
    }
  }

  return {
    hasForm,
    hasSubmitHandler,
    submitClassification,
    hasValidation,
    hasCancelHandler,
    triggerElement,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scan all `.tsx`/`.ts` files under `src/pages/` and `src/components/` in
 * `rootDir`, find every modal / dialog instance, classify it, and write
 * results to `audit-results/static/modals.json`.
 *
 * @param rootDir - Absolute path to the project root directory.
 * @returns       - Array of `ModalInstance` objects found.
 */
export async function scanModals(rootDir: string): Promise<ModalInstance[]> {
  // 1. Discover source files
  const files = await walkFiles(rootDir, SCAN_PATTERNS);

  process.stderr.write(
    `[modal-scanner] Scanning ${files.length} files for modal usage…\n`
  );

  const modals: ModalInstance[] = [];

  // 2. Analyse each file
  for (const absolutePath of files) {
    let sourceFile: ts.SourceFile;
    try {
      sourceFile = parseSourceFile(absolutePath);
    } catch {
      // Skip files that fail to parse
      continue;
    }

    const fullFileText = sourceFile.getFullText();

    // Quick short-circuit: skip files with no modal-relevant content
    const hasModalKeyword =
      [...MODAL_ROOT_NAMES].some((n) => fullFileText.includes(n)) ||
      Object.keys(CONTENT_TAG_TO_TYPE).some((t) => fullFileText.includes(t));
    if (!hasModalKeyword) continue;

    // Also skip files that don't import from supported sources
    // (relaxed: some projects re-export, so we accept files that use the
    // content tags regardless of import source)
    const relFilePath = path
      .relative(rootDir, absolutePath)
      .replace(/\\/g, '/');

    const { layer, parentPage } = resolveModuleInfo(relFilePath);

    // 3. Collect all modal content blocks in this file
    const contexts = collectModalContextNodes(sourceFile);

    for (const ctx of contexts) {
      const analysis = analyseModalSubtree(ctx.node, sourceFile, fullFileText);

      const id = buildId(relFilePath, ctx.lineNumber, ctx.modalType);

      modals.push({
        id,
        filePath: relFilePath,
        lineNumber: ctx.lineNumber,
        modalType: ctx.modalType,
        triggerElement: analysis.triggerElement,
        hasForm: analysis.hasForm,
        hasSubmitHandler: analysis.hasSubmitHandler,
        submitClassification: analysis.submitClassification,
        hasValidation: analysis.hasValidation,
        hasCancelHandler: analysis.hasCancelHandler,
        parentPage,
        layer,
      });
    }
  }

  // 4. Write results
  const outputDir = path.join(rootDir, 'audit-results', 'static');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'modals.json');
  await fs.writeFile(outputPath, JSON.stringify(modals, null, 2), 'utf-8');

  process.stderr.write(
    `[modal-scanner] Found ${modals.length} modal instances → ${outputPath}\n`
  );

  return modals;
}
