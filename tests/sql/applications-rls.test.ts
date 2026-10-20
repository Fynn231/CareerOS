import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20261015000000_create_applications.sql"),
  "utf8",
);

type DbRow = Record<string, unknown>;
type DbError = { code?: string; constraint?: string; message?: string };

const errorCode = (error: unknown): string | undefined =>
  (error as DbError | undefined)?.code;
const errorConstraint = (error: unknown): string | undefined =>
  (error as DbError | undefined)?.constraint;

async function createFixture() {
  const db = new PGlite();
  await db.exec("CREATE SCHEMA auth;");
  await db.exec("CREATE TABLE auth.users (id uuid primary key);");
  await db.exec(`
    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  `);
  await db.exec("CREATE ROLE anon NOLOGIN;");
  await db.exec("CREATE ROLE authenticated NOLOGIN;");
  await db.exec(migration);

  await db.query("INSERT INTO auth.users (id) VALUES ($1), ($2)", [
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222",
  ]);
  return db;
}

async function assertOwnershipPreserved(db: PGlite) {
  const ownerA = "11111111-1111-1111-1111-111111111111";
  const ownerB = "22222222-2222-2222-2222-222222222222";
  await db.exec("RESET ROLE; RESET request.jwt.claim.sub;");
  const inserted = await db.query<DbRow>(
    "INSERT INTO public.applications (owner_id, company, role, stage, notes, posting_url, applied_date) VALUES ($1, 'Ownership Corp', 'Engineer', 'saved', 'original', 'https://example.com/job', '2026-09-15') RETURNING *",
    [ownerA],
  );
  const original = inserted.rows[0];
  try {
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${ownerA}';`);
    await expect(db.query("UPDATE public.applications SET owner_id = $1 WHERE id = $2", [ownerB, original.id])).rejects.toMatchObject({ code: "42501" });
    const readback = await db.query<DbRow>("SELECT * FROM public.applications WHERE id = $1", [original.id]);
    expect(readback.rows).toEqual([original]);
    expect(readback.rows[0].owner_id).toBe(ownerA);
    await db.exec(`SET request.jwt.claim.sub = '${ownerB}';`);
    const hidden = await db.query("SELECT * FROM public.applications WHERE id = $1", [original.id]);
    expect(hidden.rows).toEqual([]);
  } finally {
    await db.exec("RESET ROLE; RESET request.jwt.claim.sub;");
  }
}

describe("applications RLS (in-memory PGlite, not hosted verification)", () => {
  let db: PGlite;

  const asRole = async (role: "anon" | "authenticated", subject?: string) => {
    await db.exec("RESET ROLE;");
    await db.exec(`SET ROLE ${role};`);
    if (subject) {
      await db.exec(`SET request.jwt.claim.sub = '${subject}';`);
    } else {
      await db.exec("RESET request.jwt.claim.sub;");
    }
  };

  const resetRole = async () => {
    await db.exec("RESET ROLE;");
    await db.exec("RESET request.jwt.claim.sub;");
  };

  const expectConstraint = async (sql: string, sqlState: string, constraint?: string) => {
    let error: unknown;
    try {
      await db.exec(sql);
    } catch (caught) {
      error = caught;
    }
    expect(error, `expected ${sql}`).toBeTruthy();
    expect(errorCode(error)).toBe(sqlState);
    if (constraint) expect(errorConstraint(error)).toBe(constraint);
    return error as DbError;
  };

  const expectPrivilege = async (sql: string) => {
    let error: unknown;
    try {
      await db.exec(sql);
    } catch (caught) {
      error = caught;
    }
    expect(error, `expected privilege denial: ${sql}`).toBeTruthy();
    expect(errorCode(error)).toBe("42501");
    return error as DbError;
  };

  beforeAll(async () => { db = await createFixture(); });
  afterAll(async () => { await db?.close(); });

  it("allows an owner to insert, select, update, and delete a valid application", async () => {
    const owner = "11111111-1111-1111-1111-111111111111";
    await asRole("authenticated", owner);
    await db.query(
      `INSERT INTO public.applications (owner_id, company, role, stage, notes, posting_url, applied_date, updated_at)
       VALUES ($1, 'A Corp', 'Engineer', 'applied', 'note', 'https://example.com/job', '2026-09-15', now() - interval '10 minutes')`,
      [owner],
    );

    const selected = await db.query<DbRow>(
      "SELECT company, stage FROM public.applications WHERE owner_id = $1",
      [owner],
    );
    expect(selected.rows).toHaveLength(1);

    const before = await db.query<DbRow>(
      "SELECT updated_at FROM public.applications WHERE owner_id = $1",
      [owner],
    );
    await db.query("SELECT pg_sleep(0.01)");
    await db.query(
      "UPDATE public.applications SET notes = 'updated' WHERE owner_id = $1",
      [owner],
    );
    const after = await db.query<DbRow>(
      "SELECT notes, updated_at FROM public.applications WHERE owner_id = $1",
      [owner],
    );
    expect(String((after.rows[0] as DbRow).notes)).toBe("updated");
    expect(String((after.rows[0] as DbRow).updated_at)).not.toBe(
      String((before.rows[0] as DbRow).updated_at),
    );

    await db.query("DELETE FROM public.applications WHERE owner_id = $1", [owner]);
    const afterDelete = await db.query<DbRow>(
      "SELECT id FROM public.applications WHERE owner_id = $1",
      [owner],
    );
    expect(afterDelete.rows).toHaveLength(0);

    await resetRole();
  });

  it("rejects invalid stage, empty company, and invalid URL", async () => {
    const owner = "11111111-1111-1111-1111-111111111111";
    await asRole("authenticated", owner);

    await expectConstraint(
      `INSERT INTO public.applications (owner_id, company, role, stage) VALUES ('${owner}', '', 'Engineer', 'saved')`,
      "23514",
      "applications_company_check",
    );
    await expectConstraint(
      `INSERT INTO public.applications (owner_id, company, role, stage) VALUES ('${owner}', 'A Corp', 'Engineer', 'invalid')`,
      "23514",
      "applications_stage_check",
    );
    await expectConstraint(
      `INSERT INTO public.applications (owner_id, company, role, stage, posting_url) VALUES ('${owner}', 'A Corp', 'Engineer', 'saved', 'ftp://example.com')`,
      "23514",
      "applications_posting_url_check",
    );
    await expectConstraint(
      `INSERT INTO public.applications (owner_id, company, role, stage, posting_url) VALUES ('${owner}', 'A Corp', 'Engineer', 'saved', 'https://')`,
      "23514",
      "applications_posting_url_check",
    );
    let longUrlError: unknown;
    try {
      const tooLong = "https://example.com/" + "a".repeat(2030);
      await db.query(
        `INSERT INTO public.applications (owner_id, company, role, stage, posting_url) VALUES ($1, 'A Corp', 'Engineer', 'saved', $2)`,
        [owner, tooLong],
      );
    } catch (caught) {
      longUrlError = caught;
    }
    expect(longUrlError).toBeTruthy();
    expect(errorCode(longUrlError)).toBe("23514");
    expect(errorConstraint(longUrlError)).toBe("applications_posting_url_check");

    await resetRole();
  });

  it("denies anonymous select, insert, update, and delete", async () => {
    const owner = "11111111-1111-1111-1111-111111111111";
    await asRole("authenticated", owner);
    await db.query(
      "INSERT INTO public.applications (owner_id, company, role, stage) VALUES ($1, 'A Corp', 'Engineer', 'saved')",
      [owner],
    );
    await resetRole();

    await asRole("anon");
    await expectPrivilege("SELECT id FROM public.applications");
    await expectPrivilege(
      "INSERT INTO public.applications (owner_id, company, role, stage) VALUES ('11111111-1111-1111-1111-111111111111', 'A', 'R', 'saved')",
    );
    await expectPrivilege("UPDATE public.applications SET company = 'X' WHERE true");
    await expectPrivilege("DELETE FROM public.applications WHERE true");
    await resetRole();
  });

  it("prevents owner B from reading, updating, or deleting owner A data", async () => {
    const ownerA = "11111111-1111-1111-1111-111111111111";
    const ownerB = "22222222-2222-2222-2222-222222222222";
    await asRole("authenticated", ownerA);
    const inserted = await db.query<DbRow>(
      "INSERT INTO public.applications (owner_id, company, role, stage, notes) VALUES ($1, 'Isolation Corp', 'Engineer', 'saved', 'original') RETURNING *",
      [ownerA],
    );
    const original = inserted.rows[0];
    await resetRole();

    await asRole("authenticated", ownerB);
    const selected = await db.query<DbRow>("SELECT * FROM public.applications WHERE id = $1", [original.id]);
    expect(selected.rows).toHaveLength(0);

    const update = await db.query(
      "UPDATE public.applications SET notes = 'stolen' WHERE id = $1 RETURNING id",
      [original.id],
    );
    expect(update.rows).toHaveLength(0);

    const removed = await db.query(
      "DELETE FROM public.applications WHERE id = $1 RETURNING id",
      [original.id],
    );
    expect(removed.rows).toHaveLength(0);
    await resetRole();

    await asRole("authenticated", ownerA);
    const unchanged = await db.query<DbRow>(
      "SELECT * FROM public.applications WHERE id = $1",
      [original.id],
    );
    expect(unchanged.rows).toEqual([original]);
    expect(unchanged.rows[0].owner_id).toBe(ownerA);
    await resetRole();
  });

  it("prevents owner reassignment by exact fixture ID", async () => {
    await assertOwnershipPreserved(db);
  });

  it("rejects B inserting a forged A owner ID with SQLSTATE 42501", async () => {
    await asRole("authenticated", "22222222-2222-2222-2222-222222222222");
    try {
      await expectPrivilege("INSERT INTO public.applications (owner_id, company, role, stage) VALUES ('11111111-1111-1111-1111-111111111111', 'Forged Corp', 'Engineer', 'saved')");
    } finally {
      await resetRole();
    }
  });

  it("detects relaxed UPDATE WITH CHECK in an independent in-memory PGlite fixture", async () => {
    const relaxed = await createFixture();
    try {
      // SELECT also checks UPDATE's new row; relax it only here to isolate WITH CHECK.
      await relaxed.exec('ALTER POLICY applications_select_own ON public.applications USING (true)');
      await relaxed.exec('ALTER POLICY applications_update_own ON public.applications WITH CHECK (true)');
      await expect(assertOwnershipPreserved(relaxed)).rejects.toThrow("instead of rejecting");
    } finally {
      await relaxed.close();
    }
  });
});
