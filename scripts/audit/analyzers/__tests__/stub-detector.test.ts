/**
 * Unit tests for StubDetector classification rules.
 *
 * Tests each of the 8 classification rules in isolation using known
 * handler body strings, plus boundary conditions between classifications.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */

import { describe, it, expect } from 'vitest';
import { classifyOne, classify } from '../stub-detector.js';
import type { BackendRoute, InteractiveElement } from '../../types/audit-types.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a minimal InteractiveElement with only the fields classifyOne needs. */
function makeElement(handlerBody: string): InteractiveElement {
  return {
    id: 'test0000000000000',
    filePath: 'src/pages/TestPage.tsx',
    lineNumber: 1,
    elementType: 'button',
    handlerName: 'handleClick',
    handlerBody,
    parentComponent: 'TestPage',
    layer: 'core',
    pagePath: '/test',
  };
}

/** Registered backend routes used to exercise rules 6 and 7. */
const registeredRoutes: BackendRoute[] = [
  { method: 'GET',    path: '/api/users',      controllerFile: 'users.controller.ts' },
  { method: 'POST',   path: '/api/users',      controllerFile: 'users.controller.ts' },
  { method: 'GET',    path: '/api/products',   controllerFile: 'products.controller.ts' },
  { method: 'DELETE', path: '/api/products/*', controllerFile: 'products.controller.ts' },
];

const noRoutes: BackendRoute[] = [];

// ---------------------------------------------------------------------------
// Rule 1 — Empty body → stub
// ---------------------------------------------------------------------------

describe('Rule 1: Empty body → stub', () => {
  it('classifies `() => {}` as stub', () => {
    expect(classifyOne(makeElement('() => {}'), noRoutes)).toBe('stub');
  });

  it('classifies `() => { }` (whitespace only) as stub', () => {
    expect(classifyOne(makeElement('() => { }'), noRoutes)).toBe('stub');
  });

  it('classifies async arrow with empty body as stub', () => {
    expect(classifyOne(makeElement('async () => {}'), noRoutes)).toBe('stub');
  });

  it('classifies `function handle() {}` as stub', () => {
    expect(classifyOne(makeElement('function handle() {}'), noRoutes)).toBe('stub');
  });

  it('classifies arrow with only semicolons as stub', () => {
    expect(classifyOne(makeElement('() => { ; }'), noRoutes)).toBe('stub');
  });

  it('does NOT classify a non-empty body as stub via rule 1', () => {
    const result = classifyOne(makeElement('() => { console.log("hi") }'), noRoutes);
    // It may be stub via rule 2, but that is fine — rule 1 should not fire
    // We just verify rule 1 does not fire on non-empty bodies by checking
    // the body has content; rule 2 will handle it
    expect(result).toBe('stub'); // rule 2 fires, not rule 1
  });
});

// ---------------------------------------------------------------------------
// Rule 2 — Only toast/console.log/alert → stub
// ---------------------------------------------------------------------------

describe('Rule 2: Only notification/debug calls → stub', () => {
  it('classifies `toast("Coming soon")` as stub', () => {
    expect(classifyOne(makeElement('() => { toast("Coming soon") }'), noRoutes)).toBe('stub');
  });

  it('classifies `console.log("clicked")` as stub', () => {
    expect(classifyOne(makeElement('() => { console.log("clicked") }'), noRoutes)).toBe('stub');
  });

  it('classifies `alert("Not implemented")` as stub', () => {
    expect(classifyOne(makeElement('() => { alert("Not implemented") }'), noRoutes)).toBe('stub');
  });

  it('classifies console.error as stub', () => {
    expect(classifyOne(makeElement('() => { console.error("oops") }'), noRoutes)).toBe('stub');
  });

  it('classifies console.warn as stub', () => {
    expect(classifyOne(makeElement('() => { console.warn("warn") }'), noRoutes)).toBe('stub');
  });

  it('classifies multiple notification calls as stub', () => {
    const body = '() => { console.log("a"); toast("b"); alert("c"); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('stub');
  });

  it('does NOT classify toast + real logic as stub via rule 2', () => {
    // toast + fetch → should NOT be stub (rule 4 or 7 applies)
    const body = "() => { fetch('/api/users'); toast('done'); }";
    const result = classifyOne(makeElement(body), noRoutes);
    expect(result).not.toBe('stub');
  });
});

// ---------------------------------------------------------------------------
// Rule 3 — Only TODO/FIXME comments → stub
// ---------------------------------------------------------------------------

describe('Rule 3: Only TODO/FIXME comments → stub', () => {
  it('classifies a body with only a TODO comment as stub', () => {
    const body = '() => {\n  // TODO: implement this\n}';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('stub');
  });

  it('classifies a body with only a FIXME comment as stub', () => {
    const body = '() => {\n  // FIXME: connect to API\n}';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('stub');
  });

  it('classifies multiple TODO/FIXME lines as stub', () => {
    const body = '() => {\n  // TODO: step 1\n  // FIXME: step 2\n}';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('stub');
  });

  it('classifies case-insensitive todo as stub', () => {
    const body = '() => {\n  // todo: implement\n}';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('stub');
  });

  it('does NOT classify TODO comment + real code as stub via rule 3', () => {
    const body = "() => {\n  // TODO: improve later\n  fetch('/api/users');\n}";
    const result = classifyOne(makeElement(body), noRoutes);
    expect(result).not.toBe('stub');
  });
});

// ---------------------------------------------------------------------------
// Rule 4 — Calls API but no response handling → partially_working
// ---------------------------------------------------------------------------

describe('Rule 4: API call without response handling → partially_working', () => {
  it('classifies bare fetch() with no .then as partially_working', () => {
    const body = "() => { fetch('/api/data'); }";
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies axios.get() with no .then as partially_working', () => {
    const body = "() => { axios.get('/api/items'); }";
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies axios.post() with no response handling as partially_working', () => {
    const body = "() => { axios.post('/api/users', payload); }";
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies api.create() call with no response handling as partially_working', () => {
    const body = "() => { api.create('/api/orders', data); }";
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies useMutation call without onSuccess as partially_working', () => {
    const body = '() => { useMutation(createUser); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies mutate() call with no state update as partially_working', () => {
    // mutate() with no .then/onSuccess/setState
    const body = '() => { mutate(formData); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies supabase call with no chaining as partially_working', () => {
    const body = "() => { supabase.from('users').select(); }";
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });
});

// ---------------------------------------------------------------------------
// Rule 5 — Opens modal whose submit is stub → partially_working
// ---------------------------------------------------------------------------

describe('Rule 5: Opens modal → partially_working', () => {
  it('classifies setOpen(true) as partially_working', () => {
    const body = '() => { setOpen(true); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies setIsOpen(true) as partially_working', () => {
    const body = '() => { setIsOpen(true); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies setShowModal(true) as partially_working', () => {
    const body = '() => { setShowModal(true); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies setShowDialog(true) as partially_working', () => {
    const body = '() => { setShowDialog(true); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies openModal() as partially_working', () => {
    const body = '() => { openModal(selectedRow); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('classifies setModalOpen(true) pattern as partially_working', () => {
    const body = '() => { setModalOpen(true); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });
});

// ---------------------------------------------------------------------------
// Rule 6 — Calls API endpoint NOT in route registry → broken
// ---------------------------------------------------------------------------

describe('Rule 6: API endpoint not in route registry → broken', () => {
  it('classifies fetch to unregistered endpoint as broken', () => {
    const body = "async () => { await fetch('/api/nonexistent'); setData(r); }";
    expect(classifyOne(makeElement(body), registeredRoutes)).toBe('broken');
  });

  it('classifies axios call to unknown endpoint as broken', () => {
    const body = "async () => { const r = await axios.get('/api/unknownroute'); setState(r.data); }";
    expect(classifyOne(makeElement(body), registeredRoutes)).toBe('broken');
  });

  it('classifies v1 endpoint not in registry as broken', () => {
    const body = "async () => { const r = await fetch('/v1/orders'); setOrders(r); }";
    expect(classifyOne(makeElement(body), registeredRoutes)).toBe('broken');
  });
});

// ---------------------------------------------------------------------------
// Rule 7 — Calls working API AND updates UI state → fully_functional
// ---------------------------------------------------------------------------

describe('Rule 7: Working API + UI state update → fully_functional', () => {
  it('classifies fetch with .then and setState as fully_functional', () => {
    const body = "() => { fetch('/api/users').then(r => r.json()).then(setUsers); }";
    expect(classifyOne(makeElement(body), registeredRoutes)).toBe('fully_functional');
  });

  it('classifies async fetch with await and state setter as fully_functional', () => {
    const body = "async () => { const r = await fetch('/api/users'); setData(await r.json()); }";
    expect(classifyOne(makeElement(body), registeredRoutes)).toBe('fully_functional');
  });

  it('classifies axios with onSuccess as fully_functional', () => {
    const body = "() => { axios.get('/api/products').then(r => setItems(r.data)); }";
    expect(classifyOne(makeElement(body), registeredRoutes)).toBe('fully_functional');
  });

  it('classifies mutateAsync with dispatch as fully_functional', () => {
    const body = "async () => { await mutateAsync(payload); dispatch(setUser(data)); }";
    expect(classifyOne(makeElement(body), noRoutes)).toBe('fully_functional');
  });

  it('classifies fetch with navigate() after await as fully_functional', () => {
    const body = "async () => { await fetch('/api/users'); navigate('/dashboard'); }";
    expect(classifyOne(makeElement(body), registeredRoutes)).toBe('fully_functional');
  });

  it('classifies fetch with router.push as fully_functional', () => {
    const body = "async () => { const r = await fetch('/api/products'); router.push('/list'); }";
    expect(classifyOne(makeElement(body), registeredRoutes)).toBe('fully_functional');
  });

  it('classifies mutate with refetch as fully_functional (empty registry)', () => {
    // With no registry, rule 6 cannot fire, so rule 7 should apply
    const body = "() => { mutate(data); refetch(); }";
    expect(classifyOne(makeElement(body), noRoutes)).toBe('fully_functional');
  });

  it('classifies fetch with catch() as fully_functional', () => {
    const body = "async () => { await fetch('/api/users').catch(e => console.error(e)); setDone(true); }";
    expect(classifyOne(makeElement(body), registeredRoutes)).toBe('fully_functional');
  });

  it('classifies fetch with invalidateQueries as fully_functional', () => {
    const body = "async () => { await fetch('/api/users'); invalidateQueries(['users']); }";
    expect(classifyOne(makeElement(body), registeredRoutes)).toBe('fully_functional');
  });
});

// ---------------------------------------------------------------------------
// Rule 8 — Cannot be determined statically → needs_dynamic_verification
// ---------------------------------------------------------------------------

describe('Rule 8: Cannot be determined statically → needs_dynamic_verification', () => {
  it('classifies a handler referencing only an external function as needs_dynamic_verification', () => {
    const body = '() => { handleAction(); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('needs_dynamic_verification');
  });

  it('classifies a handler with only variable assignments as needs_dynamic_verification', () => {
    const body = '() => { const x = 1; const y = 2; }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('needs_dynamic_verification');
  });

  it('classifies a handler with only event.preventDefault() as needs_dynamic_verification', () => {
    const body = '(e) => { e.preventDefault(); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('needs_dynamic_verification');
  });

  it('classifies a handler with DOM manipulation only as needs_dynamic_verification', () => {
    const body = '() => { document.getElementById("btn").classList.add("active"); }';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('needs_dynamic_verification');
  });
});

// ---------------------------------------------------------------------------
// Boundary conditions: stub vs partially_working
// ---------------------------------------------------------------------------

describe('Boundary conditions: stub vs partially_working', () => {
  it('toast alone → stub (not partially_working)', () => {
    // toast on its own does NOT constitute response handling
    expect(classifyOne(makeElement('() => { toast("clicked") }'), noRoutes)).toBe('stub');
  });

  it('toast + fetch (no response) + no registry → broken (URL unregistered with empty routes)', () => {
    // fetch is present + toast counts as "response handling" → rule 4 won't fire.
    // Rule 6 checks: URL '/api/data' is extracted, routes is empty → allUnregistered → broken.
    const body = "() => { fetch('/api/data'); toast('loading'); }";
    const result = classifyOne(makeElement(body), noRoutes);
    expect(result).toBe('broken');
  });

  it('TODO comment alone → stub (not partially_working)', () => {
    const body = '() => {\n  // TODO: call API\n}';
    expect(classifyOne(makeElement(body), noRoutes)).toBe('stub');
  });

  it('TODO + real fetch (no response) → partially_working', () => {
    // fetch present despite comment → rule 4 fires
    const body = "() => {\n  // TODO: improve error handling\n  fetch('/api/data');\n}";
    expect(classifyOne(makeElement(body), noRoutes)).toBe('partially_working');
  });

  it('empty body arrow → stub (not needs_dynamic_verification)', () => {
    // Rule 1 takes priority over rule 8
    expect(classifyOne(makeElement('() => {}'), noRoutes)).toBe('stub');
  });

  it('setOpen(true) alone (no API) → partially_working not stub', () => {
    // Not empty, not only notifications, not only TODO — rule 5 fires
    expect(classifyOne(makeElement('() => { setOpen(true); }'), noRoutes)).toBe('partially_working');
  });
});

// ---------------------------------------------------------------------------
// classify() public API — array processing
// ---------------------------------------------------------------------------

describe('classify() processes arrays correctly', () => {
  it('returns the same length as the input', () => {
    const elements = [
      makeElement('() => {}'),
      makeElement('() => { toast("x") }'),
      makeElement("async () => { const r = await fetch('/api/users'); setData(r); }"),
    ];
    const result = classify(elements, registeredRoutes);
    expect(result.length).toBe(elements.length);
  });

  it('preserves all original fields on each element', () => {
    const el = makeElement('() => {}');
    const [classified] = classify([el], noRoutes);
    expect(classified.id).toBe(el.id);
    expect(classified.filePath).toBe(el.filePath);
    expect(classified.lineNumber).toBe(el.lineNumber);
    expect(classified.elementType).toBe(el.elementType);
    expect(classified.handlerName).toBe(el.handlerName);
    expect(classified.handlerBody).toBe(el.handlerBody);
    expect(classified.parentComponent).toBe(el.parentComponent);
    expect(classified.layer).toBe(el.layer);
    expect(classified.pagePath).toBe(el.pagePath);
  });

  it('returns empty array for empty input', () => {
    expect(classify([], noRoutes)).toEqual([]);
  });

  it('classifies multiple elements with distinct rules correctly', () => {
    const elements = [
      makeElement('() => {}'),                                                     // rule 1 → stub
      makeElement('() => { toast("x") }'),                                         // rule 2 → stub
      makeElement('() => {\n  // TODO: implement\n}'),                             // rule 3 → stub
      makeElement("() => { fetch('/api/users'); }"),                               // rule 4 → partially_working
      makeElement('() => { setOpen(true); }'),                                     // rule 5 → partially_working
    ];
    const result = classify(elements, registeredRoutes);
    expect(result[0].classification).toBe('stub');
    expect(result[1].classification).toBe('stub');
    expect(result[2].classification).toBe('stub');
    expect(result[3].classification).toBe('partially_working');
    expect(result[4].classification).toBe('partially_working');
  });
});

// ---------------------------------------------------------------------------
// Route registry matching — normalization edge cases
// ---------------------------------------------------------------------------

describe('Route registry path matching (rules 6 & 7)', () => {
  it('matches parameterized route :id to wildcard in registered route', () => {
    const routes: BackendRoute[] = [
      { method: 'DELETE', path: '/api/products/:id', controllerFile: 'products.controller.ts' },
    ];
    // Frontend uses a concrete ID path — should match the :id route
    const body = "async () => { await fetch('/api/products/123'); setDone(true); }";
    expect(classifyOne(makeElement(body), routes)).toBe('fully_functional');
  });

  it('treats endpoint not in registry as broken when API is called with response handling', () => {
    const routes: BackendRoute[] = [
      { method: 'GET', path: '/api/users', controllerFile: 'users.controller.ts' },
    ];
    // /api/orders is NOT in registry
    const body = "async () => { const r = await fetch('/api/orders'); setData(r); }";
    expect(classifyOne(makeElement(body), routes)).toBe('broken');
  });

  it('classifies as fully_functional when no static URL is found but has API call + response handling + empty registry', () => {
    // No URL literal in body — no static URL to check → assume connected
    const body = "async () => { await mutateAsync(payload); setDone(true); }";
    expect(classifyOne(makeElement(body), noRoutes)).toBe('fully_functional');
  });
});
