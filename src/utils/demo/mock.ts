import { DEMO_USER } from "./demoUser";
import { encryptValue } from "@/utils/crypto";

export { DEMO_USER };

function randomId(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type Row = Record<string, unknown>;

type Tables = {
  keys: Row[];
  profiles: Row[];
  key_shares: Row[];
  audit_log: Row[];
  key_dismissals: Row[];
  email_reminders: Row[];
};

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function seed(): Tables {
  const now = new Date().toISOString();
  const k1 = randomId();
  const k2 = randomId();
  const k3 = randomId();
  const k4 = randomId();
  const k5 = randomId();
  const teammateId = "22222222-2222-2222-2222-222222222222";

  return {
    profiles: [
      { id: DEMO_USER.id, email: DEMO_USER.email, created_at: now },
      { id: teammateId, email: "teammate@keep.app", created_at: now },
    ],
    keys: [
      {
        id: k5,
        user_id: teammateId,
        name: "Team Analytics",
        value_encrypted: encryptValue("demo-analytics-read-only"),
        notes: "A sample key shared with view-only access.",
        category: "Analytics",
        tags: ["shared"],
        expires_at: null,
        last_viewed_at: null,
        created_at: daysFromNow(-10),
        updated_at: daysFromNow(-10),
      },
      {
        id: k1,
        user_id: DEMO_USER.id,
        name: "OpenAI Production",
        value_encrypted: encryptValue("sk-demo-openai-7f3k9d2m4p8q1w6e"),
        notes: "Main production key. Rotate every 90 days.",
        category: "AI",
        tags: ["production", "gpt"],
        expires_at: daysFromNow(45),
        last_viewed_at: daysFromNow(-2),
        created_at: daysFromNow(-30),
        updated_at: daysFromNow(-2),
      },
      {
        id: k2,
        user_id: DEMO_USER.id,
        name: "Stripe Secret Key",
        value_encrypted: encryptValue("sk_live_demo_4x8n2m6b1v9c3z5a"),
        notes: "Live mode billing.",
        category: "Payments",
        tags: ["production", "billing"],
        expires_at: daysFromNow(10),
        last_viewed_at: null,
        created_at: daysFromNow(-60),
        updated_at: daysFromNow(-14),
      },
      {
        id: k3,
        user_id: DEMO_USER.id,
        name: "Resend Transactional",
        value_encrypted: encryptValue("re_demo_9p7q2w4e6r8t1y3u"),
        notes: null,
        category: "Email",
        tags: ["transactional"],
        expires_at: daysFromNow(-3),
        last_viewed_at: daysFromNow(-10),
        created_at: daysFromNow(-90),
        updated_at: daysFromNow(-30),
      },
      {
        id: k4,
        user_id: DEMO_USER.id,
        name: "GitHub Personal Token",
        value_encrypted: encryptValue("ghp_demo_2a4b6c8d0e1f3g5h"),
        notes: "CI deploys for side projects.",
        category: "Dev",
        tags: ["ci", "personal"],
        expires_at: null,
        last_viewed_at: daysFromNow(-1),
        created_at: daysFromNow(-15),
        updated_at: daysFromNow(-1),
      },
    ],
    key_shares: [
      {
        id: randomId(),
        key_id: k5,
        owner_id: teammateId,
        user_id: DEMO_USER.id,
        permission: "view",
        created_at: now,
        updated_at: now,
      },
      {
        id: randomId(),
        key_id: k1,
        owner_id: DEMO_USER.id,
        user_id: teammateId,
        permission: "view",
        created_at: daysFromNow(-20),
        updated_at: daysFromNow(-20),
      },
    ],
    audit_log: [
      {
        key_name: "OpenAI Production",
        actor_email: DEMO_USER.email,
        id: 1,
        key_id: k1,
        actor_id: DEMO_USER.id,
        action: "edit",
        created_at: daysFromNow(-2),
      },
      {
        key_name: "GitHub Personal Token",
        actor_email: DEMO_USER.email,
        id: 2,
        key_id: k4,
        actor_id: DEMO_USER.id,
        action: "view",
        created_at: daysFromNow(-1),
      },
      {
        key_name: "Stripe Secret Key",
        actor_email: DEMO_USER.email,
        id: 3,
        key_id: k2,
        actor_id: DEMO_USER.id,
        action: "share",
        created_at: daysFromNow(-20),
      },
      {
        key_name: "OpenAI Production",
        actor_email: DEMO_USER.email,
        id: 4,
        key_id: k1,
        actor_id: DEMO_USER.id,
        action: "copy",
        created_at: daysFromNow(-5),
      },
    ],
    key_dismissals: [],
    email_reminders: [],
  };
}

// Keep the demo DB on globalThis so it survives Next.js dev-server HMR.
const g = globalThis as typeof globalThis & {
  __keepDemoDb?: Tables;
  __keepDemoAuditId?: number;
};

export function getDb(): Tables {
  if (!g.__keepDemoDb) {
    g.__keepDemoDb = seed();
    g.__keepDemoAuditId = 1000;
  }
  return g.__keepDemoDb;
}

type Filter = (row: Row) => boolean;

type Order = { column: string; ascending: boolean };

function recordDemoEvent(key: Row, action: string) {
  getDb().audit_log.push({
    id: (g.__keepDemoAuditId = (g.__keepDemoAuditId ?? 1000) + 1),
    key_id: action === "delete" ? null : key.id,
    key_name: key.name,
    owner_id: key.user_id,
    actor_id: DEMO_USER.id,
    actor_email: DEMO_USER.email,
    action,
    created_at: new Date().toISOString(),
  });
}

type QueryResult = {
  data: Row[] | Row | null;
  error: { message: string } | null;
  count: number | null;
};

class MockQueryBuilder implements PromiseLike<QueryResult> {
  private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: Row | Row[] = {};
  private selectCols = "*";
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private limitN: number | null = null;
  private single = false;
  private countExact = false;
  private headOnly = false;
  private conflictCols: string[] = [];
  private ignoreDuplicates = false;

  constructor(private table: keyof Tables) {}

  select(cols?: string, opts?: { count?: string; head?: boolean }) {
    if (cols) this.selectCols = cols;
    if (opts?.count) this.countExact = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }

  insert(rows: Row | Row[]) {
    this.mode = "insert";
    this.payload = rows;
    return this;
  }

  update(patch: Row) {
    this.mode = "update";
    this.payload = patch;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  upsert(
    rows: Row | Row[],
    opts?: { onConflict?: string; ignoreDuplicates?: boolean },
  ) {
    this.mode = "upsert";
    this.payload = rows;
    this.conflictCols = (opts?.onConflict ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    this.ignoreDuplicates = opts?.ignoreDuplicates ?? false;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((r) => r[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((r) => values.includes(r[column]));
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push(
      (r) => r[column] != null && String(r[column]) > String(value),
    );
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: opts?.ascending !== false });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  maybeSingle() {
    this.single = true;
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private rows(): Row[] {
    return getDb()[this.table];
  }

  private matchesConflict(a: Row, b: Row): boolean {
    return this.conflictCols.every((c) => a[c] === b[c]);
  }

  private applyJoins(row: Row): Row {
    const clone = { ...row };
    // key_shares -> profiles!inner(email)
    if (this.table === "key_shares" && this.selectCols.includes("profiles")) {
      const profile = getDb().profiles.find((p) => p.id === row.user_id);
      clone.profiles = profile ? [{ email: profile.email }] : [];
    }
    // audit_log -> keys!left(name)
    if (this.table === "audit_log" && this.selectCols.includes("keys")) {
      const key = getDb().keys.find((k) => k.id === row.key_id);
      clone.keys = key ? { name: key.name } : null;
    }
    return clone;
  }

  private pickColumns(row: Row): Row {
    if (this.selectCols.trim() === "*") return row;
    const cols: Row = {};
    for (const part of this.selectCols.split(",")) {
      const name = part.trim();
      if (!name) continue;
      if (name.includes("(")) {
        const rel = name.split(/[!(]/)[0].trim();
        if (rel in row) cols[rel] = row[rel];
        continue;
      }
      if (name in row) cols[name] = row[name];
    }
    return cols;
  }

  private execute(): QueryResult {
    if (this.mode === "insert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload];
      for (const row of list) {
        const newRow = { ...row };
        if (newRow.id === undefined) {
          newRow.id =
            this.table === "audit_log"
              ? (g.__keepDemoAuditId = (g.__keepDemoAuditId ?? 1000) + 1)
              : randomId();
        }
        this.rows().push(newRow);
        if (this.table === "keys") recordDemoEvent(newRow, "create");
      }
      return { data: null, error: null, count: null };
    }

    if (this.mode === "update") {
      for (const row of this.rows()) {
        if (this.filters.every((f) => f(row))) {
          Object.assign(row, this.payload);
          if (this.table === "keys") recordDemoEvent(row, "edit");
          if (this.table === "key_shares") {
            const key = getDb().keys.find((key) => key.id === row.key_id);
            if (key) recordDemoEvent(key, "share");
          }
        }
      }
      return { data: null, error: null, count: null };
    }

    if (this.mode === "delete") {
      const removed = this.rows().filter((r) =>
        this.filters.every((f) => f(r)),
      );
      for (const row of removed) {
        if (this.table === "keys") {
          recordDemoEvent(row, "delete");
          for (const event of getDb().audit_log)
            if (event.key_id === row.id) event.key_id = null;
          getDb().key_shares = getDb().key_shares.filter(
            (share) => share.key_id !== row.id,
          );
        }
        if (this.table === "key_shares") {
          const key = getDb().keys.find((key) => key.id === row.key_id);
          if (key) recordDemoEvent(key, "revoke");
        }
      }
      const keep = this.rows().filter((r) => !this.filters.every((f) => f(r)));
      getDb()[this.table] = keep;
      return { data: null, error: null, count: null };
    }

    if (this.mode === "upsert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload];
      for (const row of list) {
        if (this.table === "key_shares") {
          const key = getDb().keys.find((key) => key.id === row.key_id);
          if (key) recordDemoEvent(key, "share");
        }
        const existing = this.rows().find(
          (r) => this.conflictCols.length > 0 && this.matchesConflict(r, row),
        );
        if (existing) {
          if (!this.ignoreDuplicates) Object.assign(existing, row);
        } else {
          const newRow = { ...row };
          if (newRow.id === undefined) {
            newRow.id =
              this.table === "audit_log"
                ? (g.__keepDemoAuditId = (g.__keepDemoAuditId ?? 1000) + 1)
                : randomId();
          }
          this.rows().push(newRow);
        }
      }
      return { data: null, error: null, count: null };
    }

    // select
    let rows = this.rows().filter((r) => this.filters.every((f) => f(r)));
    if (this.countExact && this.headOnly) {
      return { data: null, error: null, count: rows.length };
    }
    for (const o of this.orders) {
      rows = [...rows].sort((a, b) => {
        const av = a[o.column];
        const bv = b[o.column];
        if (av === bv) return 0;
        const cmp =
          av == null
            ? 1
            : bv == null
              ? -1
              : typeof av === "number" && typeof bv === "number"
                ? av - bv
                : String(av) < String(bv)
                  ? -1
                  : 1;
        return o.ascending ? cmp : -cmp;
      });
    }
    if (this.limitN !== null) rows = rows.slice(0, this.limitN);
    const data = rows.map((r) => this.pickColumns(this.applyJoins(r)));
    if (this.single) {
      return { data: data[0] ?? null, error: null, count: null };
    }
    return { data, error: null, count: this.countExact ? data.length : null };
  }
}

const mockServerAuth = {
  async getUser() {
    return { data: { user: DEMO_USER }, error: null };
  },
  async signOut() {
    return { error: null };
  },
  async exchangeCodeForSession() {
    return { error: null };
  },
};

export function createMockServerClient() {
  return {
    auth: mockServerAuth,
    from: (table: string) => new MockQueryBuilder(table as keyof Tables),
    async rpc(name: string, args: Record<string, string>) {
      const key = getDb().keys.find((key) => key.id === args.p_key_id);
      if (!key) return { data: null, error: { message: "Key not found" } };
      if (name === "find_share_recipient") {
        if (key.user_id !== DEMO_USER.id)
          return { data: null, error: { message: "Key not found" } };
        return {
          data:
            getDb().profiles.find(
              (profile) =>
                String(profile.email).toLowerCase() ===
                args.p_email.trim().toLowerCase(),
            )?.id ?? null,
          error: null,
        };
      }
      if (name === "record_key_access") {
        const access =
          key.user_id === DEMO_USER.id ||
          getDb().key_shares.some(
            (share) =>
              share.key_id === key.id && share.user_id === DEMO_USER.id,
          );
        if (!access || !["view", "copy"].includes(args.p_action))
          return { data: null, error: { message: "Key not found" } };
        const count = getDb().audit_log.filter(
          (event) =>
            event.actor_id === DEMO_USER.id &&
            ["view", "copy"].includes(String(event.action)) &&
            new Date(String(event.created_at)).getTime() > Date.now() - 60_000,
        ).length;
        if (count >= 20)
          return {
            data: null,
            error: {
              message: "Rate limit exceeded. Please try again in a minute.",
            },
          };
        if (key.expires_at && new Date(String(key.expires_at)) <= new Date())
          return { data: null, error: { message: "This key has expired" } };
        recordDemoEvent(key, args.p_action);
        if (args.p_action === "view")
          key.last_viewed_at = new Date().toISOString();
        return { data: null, error: null };
      }
      return { data: null, error: { message: "Unsupported demo operation" } };
    },
  };
}
