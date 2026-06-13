// Feature: hr-module-stabilization, Property 5: Multi-write operations are atomic
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { AtomicOperationService } from "./atomic-operation.service";

/**
 * Property 5: Multi-write operations are atomic
 * Validates: Requirements 4.1, 4.2, 4.4, 7.5, 7.6, 10.2, 10.3, 10.4, 11.2
 *
 * For any HR operation that performs more than one database write — repository
 * writes, audit logs, and domain events — injecting a failure at ANY write point
 * leaves the database unchanged: no record, audit log, or domain event persists.
 *
 * Strategy (per design Testing Strategy "Isolation & atomicity"): use a mockable
 * transaction/repository boundary. We fake `PrismaService.$transaction` so the
 * callback runs against a fake `tx` that stages every write. The transaction only
 * commits the staged writes to the persistent store when the callback resolves; if
 * the callback throws, the staged writes are discarded (rollback) and the error is
 * re-thrown. We then generate a random number of writes and a random failing write
 * index and assert: when a write throws, `run` rejects and NOTHING is committed.
 */

/** A persistent store standing in for the live database. */
class FakeDatabase {
  committed: Array<Record<string, unknown>> = [];
}

/** The kinds of writes an Atomic_Operation can enrol. */
type WriteKind = "repo" | "audit" | "event";

/**
 * Build a fake PrismaService whose `$transaction` mimics an interactive
 * transaction: staged writes flush to the persistent store on success and are
 * discarded on any thrown error.
 */
function makeFakePrisma(db: FakeDatabase) {
  return {
    async $transaction<T>(
      cb: (tx: any) => Promise<T>,
      _options?: unknown,
    ): Promise<T> {
      // Each transaction gets its own staging buffer. Repo writes, audit logs,
      // and events all push here via the shared `tx` so they share one unit.
      const staging: Array<Record<string, unknown>> = [];
      const tx = {
        __staging: staging,
        recordWrite(record: Record<string, unknown>) {
          staging.push(record);
        },
      };
      const result = await cb(tx); // throws -> staging never flushed (rollback)
      db.committed.push(...staging); // commit only on success
      return result;
    },
  } as any;
}

/** Fake AuditService.log(params, tx): enrols the audit log in the passed tx. */
function makeFakeAudit() {
  return {
    log: async (_params: any, tx: any) => {
      tx.recordWrite({ kind: "audit" });
      return { ok: true };
    },
  } as any;
}

/** Fake EventBusService.publish(event, tx): enrols the event in the passed tx. */
function makeFakeEventBus() {
  return {
    publish: async (_event: any, tx: any) => {
      tx.recordWrite({ kind: "event" });
      return { ok: true };
    },
  } as any;
}

describe("Property 5: Multi-write operations are atomic", () => {
  it("never partially persists: a failure at any write point rolls back every write", async () => {
    await fc.assert(
      fc.asyncProperty(
        // A multi-write operation: a sequence of writes, each of a given kind.
        fc.array(fc.constantFrom<WriteKind>("repo", "audit", "event"), {
          minLength: 2,
          maxLength: 10,
        }),
        // Where the failure is injected: an index, or null for the success path.
        fc.option(fc.nat({ max: 9 }), { nil: null }),
        async (writeKinds, rawFailIndex) => {
          const numWrites = writeKinds.length;
          // A failure is only injected when the index lands within the sequence.
          const failIndex =
            rawFailIndex !== null && rawFailIndex < numWrites
              ? rawFailIndex
              : null;

          const db = new FakeDatabase();
          const svc = new AtomicOperationService(
            makeFakePrisma(db),
            makeFakeAudit(),
            makeFakeEventBus(),
          );

          // The operation body performs each write through the shared tx-bound
          // helpers, throwing exactly at the injected failure point.
          const work = async ({ tx, audit, publish }: any) => {
            for (let i = 0; i < numWrites; i++) {
              if (failIndex !== null && i === failIndex) {
                throw new Error(`injected failure at write ${i}`);
              }
              switch (writeKinds[i]) {
                case "repo":
                  tx.recordWrite({ kind: "repo", i });
                  break;
                case "audit":
                  await audit({
                    tenant_id: "t1",
                    user_id: "u1",
                    module: "HR",
                    action: "CREATE",
                    entity_type: "TEST",
                    entity_id: `e${i}`,
                  });
                  break;
                case "event":
                  await publish({
                    event_type: "hr.test.v1",
                    tenant_id: "t1",
                    entity_id: `e${i}`,
                    entity_type: "TEST",
                    source_module: "HR",
                    user_id: "u1",
                    payload: {},
                  });
                  break;
              }
            }
            return "committed";
          };

          if (failIndex !== null) {
            // A write threw: the operation must reject and commit NOTHING.
            await expect(svc.run(work)).rejects.toThrow(
              `injected failure at write ${failIndex}`,
            );
            expect(db.committed).toEqual([]);
          } else {
            // No failure: the whole operation commits exactly its writes.
            await expect(svc.run(work)).resolves.toBe("committed");
            expect(db.committed).toHaveLength(numWrites);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it("rolls back when the failing write is an audit/event (not just a repo write)", async () => {
    // Concrete example: repo write succeeds, then the audit log throws.
    const db = new FakeDatabase();
    const throwingAudit = {
      log: async () => {
        throw new Error("audit write failed");
      },
    } as any;
    const svc = new AtomicOperationService(
      makeFakePrisma(db),
      throwingAudit,
      makeFakeEventBus(),
    );

    await expect(
      svc.run(async ({ tx, audit }: any) => {
        tx.recordWrite({ kind: "repo", i: 0 });
        await audit({ tenant_id: "t1" });
        return "committed";
      }),
    ).rejects.toThrow("audit write failed");
    expect(db.committed).toEqual([]);
  });

  it("commits all writes together when no failure is injected", async () => {
    const db = new FakeDatabase();
    const svc = new AtomicOperationService(
      makeFakePrisma(db),
      makeFakeAudit(),
      makeFakeEventBus(),
    );

    await expect(
      svc.run(async ({ tx, audit, publish }: any) => {
        tx.recordWrite({ kind: "repo", i: 0 });
        await audit({ tenant_id: "t1" });
        await publish({ event_type: "hr.test.v1" });
        return "committed";
      }),
    ).resolves.toBe("committed");
    expect(db.committed).toHaveLength(3);
  });
});
