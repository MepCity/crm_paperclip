import { createHash } from "node:crypto";

/** Frozen clock for "last 90 days" and "last 12 months" filters. */
export const EPOCH_MS = Date.UTC(2022, 0, 1);
export const AS_OF_MS = Date.UTC(2026, 0, 1);
export const AS_OF_ISO = "2026-01-01T00:00:00.000Z";
export const DAY_MS = 86_400_000;
export const WINDOW_90_START_ISO = new Date(AS_OF_MS - 90 * DAY_MS).toISOString();
export const WINDOW_12_START_ISO = "2025-01-01T00:00:00.000Z";

/** Planted search tokens. Consonant clusters do not occur in generated words. */
export const SEARCH_TERMS = {
  common3: "xqz",
  rare3: "qjk",
  common8: "commonwd",
  rare8: "zzrarexx",
  prefixWord: "alphaone",
  /** Matches about one row in three. Too common for a tsvector index. */
  prefixQuery: "alpha:*",
  /** Prefix of the rare 8-character token. Selective enough to use the tsvector index. */
  prefixSelective: "zzrare:*",
} as const;

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "website"
  | "picklist"
  | "boolean"
  | "integer"
  | "decimal"
  | "datetime"
  | "date"
  | "textarea"
  | "lookup";

export type FieldDef = {
  key: string;
  type: FieldType;
  required?: boolean;
  /** Picklist width. */
  cardinality?: number;
  /** Fraction present. Defaults to 0.6 (about 40% empty). */
  fill?: number;
};

export const LEAD_FIELDS: readonly FieldDef[] = [
  { key: "last_name", type: "text", required: true },
  { key: "first_name", type: "text" },
  { key: "company", type: "text" },
  { key: "designation", type: "text" },
  { key: "city", type: "text" },
  { key: "street", type: "text" },
  { key: "zip_code", type: "text" },
  { key: "fax", type: "text" },
  { key: "skype_id", type: "text" },
  { key: "twitter", type: "text" },
  { key: "cf_text_1", type: "text" },
  { key: "cf_text_2", type: "text" },
  { key: "cf_text_3", type: "text" },
  { key: "cf_text_4", type: "text" },
  { key: "cf_text_5", type: "text" },
  { key: "cf_text_6", type: "text" },
  { key: "email", type: "email" },
  { key: "cf_email_1", type: "email" },
  { key: "phone", type: "phone" },
  { key: "cf_phone_1", type: "phone" },
  { key: "website", type: "website" },
  { key: "lead_status", type: "picklist", cardinality: 9 },
  { key: "lead_source", type: "picklist", cardinality: 17 },
  { key: "industry", type: "picklist", cardinality: 19 },
  { key: "rating", type: "picklist", cardinality: 6 },
  { key: "salutation", type: "picklist", cardinality: 6 },
  { key: "country", type: "picklist", cardinality: 248 },
  { key: "state", type: "picklist", cardinality: 4000 },
  { key: "cf_pick_1", type: "picklist", cardinality: 4 },
  { key: "email_opt_out", type: "boolean", required: true },
  { key: "converted", type: "boolean" },
  { key: "cf_bool_1", type: "boolean" },
  { key: "no_of_employees", type: "integer" },
  { key: "cf_int_1", type: "integer" },
  { key: "annual_revenue", type: "decimal" },
  { key: "cf_decimal_1", type: "decimal" },
  { key: "last_activity_time", type: "datetime" },
  { key: "cf_datetime_1", type: "datetime" },
  { key: "cf_datetime_2", type: "datetime" },
  { key: "cf_datetime_3", type: "datetime" },
  { key: "cf_datetime_4", type: "datetime" },
  { key: "cf_date_1", type: "date" },
  { key: "cf_date_2", type: "date" },
  { key: "description", type: "textarea", fill: 0.7 },
  { key: "cf_lookup_1", type: "lookup" },
  { key: "cf_lookup_2", type: "lookup" },
];

export const CONTACT_KEYS = ["last_name", "first_name", "email", "phone", "company"] as const;

/** Fields filtered, sorted, or grouped by the measured scenarios. */
export const INDEXED_LEAD_KEYS = [
  "lead_status",
  "company",
  "cf_datetime_1",
  "annual_revenue",
  "email_opt_out",
  "last_name",
  "industry",
  "rating",
  "country",
  "lead_source",
  "cf_lookup_1",
] as const;

const SEARCHABLE_TYPES = new Set<FieldType>([
  "text",
  "email",
  "phone",
  "website",
  "picklist",
  "textarea",
]);

export function fieldByKey(key: string): FieldDef {
  const field = LEAD_FIELDS.find((item) => item.key === key);
  if (!field) throw new Error(`unknown field ${key}`);
  return field;
}

export function fieldId(key: string): number {
  const index = LEAD_FIELDS.findIndex((item) => item.key === key);
  if (index < 0) throw new Error(`unknown field ${key}`);
  return index + 1;
}

export function contactFields(): FieldDef[] {
  return CONTACT_KEYS.map((key) => fieldByKey(key));
}

export type StoredValue = {
  key: string;
  fieldId: number;
  /** JSON literal (number, boolean, or quoted string). */
  json: string;
  text: string | null;
  num: string | null;
  bool: boolean | null;
  /** Timestamptz input for datetimes and for dates at UTC midnight. */
  ts: string | null;
  /** Typed column value for the per-module table. */
  column: string | number | boolean | null;
};

export type GeneratedRecord = {
  id: string;
  organizationId: string;
  moduleId: string;
  ownerId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
  name: string;
  search: string;
  dataJson: string;
  fields: Record<string, StoredValue>;
};

export type Universe = {
  seed: number;
  orgA: string;
  orgB: string;
  moduleLeads: string;
  moduleContacts: string;
  usersA: string[];
  usersB: string[];
};

export type Scale = {
  leadsA: number;
  contactsA: number;
  leadsB: number;
};

type Rng = () => number;

export function scaleCounts(rows: number): Scale {
  if (!Number.isInteger(rows) || rows < 1) throw new Error("--rows must be a positive integer");
  return {
    leadsA: rows,
    contactsA: Math.max(1, Math.round(rows * 0.25)),
    leadsB: Math.max(1, Math.round(rows * 0.25)),
  };
}

export function universe(seed: number): Universe {
  const users = Array.from({ length: 20 }, (_, index) => stableUuid(seed, `user-${index}`));
  return {
    seed,
    orgA: stableUuid(seed, "org-a"),
    orgB: stableUuid(seed, "org-b"),
    moduleLeads: stableUuid(seed, "module-leads"),
    moduleContacts: stableUuid(seed, "module-contacts"),
    usersA: users.slice(0, 10),
    usersB: users.slice(10),
  };
}

export function stableUuid(seed: number, label: string): string {
  const bytes = createHash("sha256").update(`${seed}:${label}`).digest().subarray(0, 16);
  const copy = Buffer.from(bytes);
  const b6 = copy[6] ?? 0;
  const b8 = copy[8] ?? 0;
  copy[6] = (b6 & 0x0f) | 0x40;
  copy[8] = (b8 & 0x3f) | 0x80;
  return formatUuid(copy);
}

export function uuidV7(timestampMs: number, seq: number): string {
  const bytes = Buffer.alloc(16);
  const ts = BigInt(timestampMs);
  bytes[0] = Number((ts >> 40n) & 0xffn);
  bytes[1] = Number((ts >> 32n) & 0xffn);
  bytes[2] = Number((ts >> 24n) & 0xffn);
  bytes[3] = Number((ts >> 16n) & 0xffn);
  bytes[4] = Number((ts >> 8n) & 0xffn);
  bytes[5] = Number(ts & 0xffn);
  const randA = seq & 0x0fff;
  bytes[6] = 0x70 | ((randA >> 8) & 0x0f);
  bytes[7] = randA & 0xff;
  const randB = BigInt(seq) * 0x9e3779b97f4a7c15n;
  bytes[8] = Number((randB >> 56n) & 0x3fn) | 0x80;
  bytes[9] = Number((randB >> 48n) & 0xffn);
  bytes[10] = Number((randB >> 40n) & 0xffn);
  bytes[11] = Number((randB >> 32n) & 0xffn);
  bytes[12] = Number((randB >> 24n) & 0xffn);
  bytes[13] = Number((randB >> 16n) & 0xffn);
  bytes[14] = Number((randB >> 8n) & 0xffn);
  bytes[15] = Number(randB & 0xffn);
  return formatUuid(bytes);
}

function formatUuid(bytes: Buffer): string {
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONS = "bcdfghjklmnpqrstvwxyz";
const VOWS = "aeiou";

function syllable(rng: Rng): string {
  const c1 = CONS[Math.floor(rng() * CONS.length)] ?? "b";
  const v = VOWS[Math.floor(rng() * VOWS.length)] ?? "a";
  if (rng() < 0.35) {
    const c2 = CONS[Math.floor(rng() * CONS.length)] ?? "d";
    return `${c1}${v}${c2}`;
  }
  return `${c1}${v}`;
}

function makeWord(rng: Rng, syllables: number): string {
  let word = "";
  for (let i = 0; i < syllables; i++) word += syllable(rng);
  return word;
}

const vocabCache = new Map<number, string[]>();

export function vocabulary(seed: number, size = 4096): string[] {
  const cached = vocabCache.get(seed);
  if (cached && cached.length >= size) return cached;
  const rng = mulberry32((seed ^ 0x51ed) >>> 0);
  const words: string[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (words.length < size) {
    guard += 1;
    if (guard > size * 20) throw new Error("vocabulary did not converge");
    const word = makeWord(rng, 2 + (words.length % 5 === 0 ? 1 : 0));
    if (word.length < 4 || seen.has(word)) continue;
    seen.add(word);
    words.push(word);
  }
  vocabCache.set(seed, words);
  return words;
}

function pickWord(rng: Rng, vocab: readonly string[]): string {
  const index = Math.min(vocab.length - 1, Math.floor(rng() * rng() * vocab.length));
  return vocab[index] ?? "word";
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

export function picklistValue(key: string, cardinality: number, index: number): string {
  const n = ((index % cardinality) + cardinality) % cardinality;
  return `${key}_${pad(n, String(cardinality - 1).length)}`;
}

function randomInstant(rng: Rng): string {
  const ms = EPOCH_MS + Math.floor(rng() * (AS_OF_MS - EPOCH_MS));
  return new Date(ms).toISOString();
}

function money(rng: Rng): string {
  const cents = Math.floor(rng() * 1_000_000_000);
  return (cents / 100).toFixed(2);
}

function stored(
  field: FieldDef,
  json: string,
  column: string | number | boolean,
  extra: Partial<StoredValue> = {},
): StoredValue {
  return {
    key: field.key,
    fieldId: fieldId(field.key),
    json,
    text: null,
    num: null,
    bool: null,
    ts: null,
    column,
    ...extra,
  };
}

function plantTokens(index: number): string[] {
  const tokens: string[] = [];
  if (index % 4 === 0) tokens.push(SEARCH_TERMS.common3);
  if (index % 5 === 0) tokens.push(SEARCH_TERMS.common8);
  if (index % 3 === 0) tokens.push(SEARCH_TERMS.prefixWord);
  if (index % 333 === 0) tokens.push(SEARCH_TERMS.rare3);
  if (index % 400 === 1) tokens.push(SEARCH_TERMS.rare8);
  return tokens;
}

/** Lower-cased name plus searchable field text, in field-list order. Empty fields are skipped. */
export function composeSearch(
  name: string,
  texts: Readonly<Record<string, string | null>>,
  defs: readonly FieldDef[] = LEAD_FIELDS,
): string {
  const parts = [name.toLowerCase()];
  for (const field of defs) {
    if (!SEARCHABLE_TYPES.has(field.type)) continue;
    const text = texts[field.key];
    if (!text) continue;
    parts.push(text.toLowerCase());
  }
  return parts.join(" ");
}

export function searchableLeadKeys(): readonly string[] {
  return LEAD_FIELDS.filter((field) => SEARCHABLE_TYPES.has(field.type)).map((field) => field.key);
}

function buildSearch(
  name: string,
  fields: Record<string, StoredValue>,
  defs: readonly FieldDef[],
): string {
  const texts: Record<string, string | null> = {};
  for (const field of defs) texts[field.key] = fields[field.key]?.text ?? null;
  return composeSearch(name, texts, defs);
}

function dataJson(defs: readonly FieldDef[], fields: Record<string, StoredValue>): string {
  const parts: string[] = [];
  for (const field of defs) {
    const value = fields[field.key];
    if (!value) continue;
    parts.push(`${JSON.stringify(field.key)}:${value.json}`);
  }
  return `{${parts.join(",")}}`;
}

export type GenerateOptions = {
  seed: number;
  scale: Scale;
  /** When false, record bodies are not kept (the sink already stored them). */
  retain?: boolean;
  onRecord?: (record: GeneratedRecord, kind: "contact" | "lead") => void;
};

export type GeneratedSets = {
  universe: Universe;
  contacts: GeneratedRecord[];
  leads: GeneratedRecord[];
  /** Non-deleted org A lead ids, in generation order. */
  orgALeadIds: string[];
  /** cf_lookup_1 usage on non-deleted org A leads. */
  lookupHits: Map<string, number>;
};

/**
 * Generates the three populations. Contacts are produced first so lead lookups
 * can reference their ids. The same records are loaded into every storage option.
 */
export function generateDataset(options: GenerateOptions): GeneratedSets {
  const world = universe(options.seed);
  const rng = mulberry32(options.seed >>> 0);
  const vocab = vocabulary(options.seed);
  const contacts: GeneratedRecord[] = [];
  const leads: GeneratedRecord[] = [];
  const orgALeadIds: string[] = [];
  const lookupHits = new Map<string, number>();
  let seq = 0;

  const retain = options.retain !== false;
  const emit = (record: GeneratedRecord, kind: "contact" | "lead", keep: GeneratedRecord[]) => {
    if (retain) keep.push(record);
    options.onRecord?.(record, kind);
  };

  const contactIds: string[] = [];
  for (let index = 0; index < options.scale.contactsA; index++) {
    seq += 1;
    const record = generateRecord({
      rng,
      vocab,
      world,
      seq,
      index,
      kind: "contact",
      orgId: world.orgA,
      moduleId: world.moduleContacts,
      users: world.usersA,
      contactIds: [],
    });
    contactIds.push(record.id);
    emit(record, "contact", contacts);
  }
  const leadJobs: Array<{ count: number; orgId: string; users: string[]; org: "a" | "b" }> = [
    { count: options.scale.leadsA, orgId: world.orgA, users: world.usersA, org: "a" },
    { count: options.scale.leadsB, orgId: world.orgB, users: world.usersB, org: "b" },
  ];
  for (const job of leadJobs) {
    for (let index = 0; index < job.count; index++) {
      seq += 1;
      const record = generateRecord({
        rng,
        vocab,
        world,
        seq,
        index,
        kind: "lead",
        orgId: job.orgId,
        moduleId: world.moduleLeads,
        users: job.users,
        contactIds,
      });
      emit(record, "lead", leads);
      if (job.org === "a" && record.deletedAt === null) {
        orgALeadIds.push(record.id);
        const lookup = record.fields.cf_lookup_1?.text;
        if (lookup) lookupHits.set(lookup, (lookupHits.get(lookup) ?? 0) + 1);
      }
    }
  }

  return { universe: world, contacts, leads, orgALeadIds, lookupHits };
}

type RecordInput = {
  rng: Rng;
  vocab: readonly string[];
  world: Universe;
  seq: number;
  index: number;
  kind: "contact" | "lead";
  orgId: string;
  moduleId: string;
  users: string[];
  contactIds: readonly string[];
};

function userAt(users: string[], rng: Rng): string {
  const picked = users[Math.floor(rng() * users.length)];
  if (!picked) throw new Error("user pool is empty");
  return picked;
}

function generateRecord(input: RecordInput): GeneratedRecord {
  const { rng, index, kind } = input;
  const defs = kind === "lead" ? LEAD_FIELDS : contactFields();
  const fields: Record<string, StoredValue> = {};

  for (const field of defs) {
    const value = generateField(field, input);
    if (value) fields[field.key] = value;
  }

  if (kind === "lead") {
    const tokens = plantTokens(index);
    if (tokens.length > 0) {
      const key = "cf_text_6";
      const field = fieldByKey(key);
      const existing = fields[key];
      const text = existing?.text ? `${existing.text} ${tokens.join(" ")}` : tokens.join(" ");
      fields[key] = stored(field, JSON.stringify(text), text, { text });
    }
  }

  const lastName = fields.last_name?.text;
  if (!lastName) throw new Error("last_name is required");
  const createdMs = EPOCH_MS + Math.floor(rng() * (AS_OF_MS - EPOCH_MS));
  const updatedMs = Math.min(AS_OF_MS, createdMs + Math.floor(rng() * 90 * DAY_MS));
  const deleted = rng() < 0.02;

  return {
    id: uuidV7(createdMs, input.seq),
    organizationId: input.orgId,
    moduleId: input.moduleId,
    ownerId: userAt(input.users, rng),
    createdBy: userAt(input.users, rng),
    updatedBy: userAt(input.users, rng),
    createdAt: new Date(createdMs).toISOString(),
    updatedAt: new Date(updatedMs).toISOString(),
    deletedAt: deleted ? new Date(updatedMs).toISOString() : null,
    version: 1,
    name: lastName,
    search: buildSearch(lastName, fields, defs),
    dataJson: dataJson(defs, fields),
    fields,
  };
}

function generateField(field: FieldDef, input: RecordInput): StoredValue | null {
  const { rng, vocab, index, kind } = input;
  if (field.key === "email_opt_out") {
    const value = rng() < 0.1;
    return stored(field, value ? "true" : "false", value, { bool: value });
  }
  const fill = field.fill ?? 0.6;
  if (!field.required && rng() >= fill) return null;

  switch (field.type) {
    case "text": {
      const text =
        field.key === "company"
          ? `Company ${pad(index, 6)}`
          : field.key === "street"
            ? `${1 + Math.floor(rng() * 400)} ${pickWord(rng, vocab)} st`
            : field.key === "zip_code"
              ? pad(Math.floor(rng() * 100_000), 5)
              : field.key === "skype_id"
                ? `skype${pad(index, 6)}`
                : field.key === "twitter"
                  ? `@u${pad(index, 6)}`
                  : Array.from({ length: 1 + Math.floor(rng() * 3) }, () =>
                      pickWord(rng, vocab),
                    ).join(" ");
      return stored(field, JSON.stringify(text), text, { text });
    }
    case "email": {
      const text = `user${pad(index, 6)}@example.test`;
      return stored(field, JSON.stringify(text), text, { text });
    }
    case "phone": {
      const text = `+1${pad(Math.floor(rng() * 10_000_000_000), 10)}`;
      return stored(field, JSON.stringify(text), text, { text });
    }
    case "website": {
      const text = `https://example.test/${pad(index, 6)}`;
      return stored(field, JSON.stringify(text), text, { text });
    }
    case "picklist": {
      const cardinality = field.cardinality ?? 1;
      const text = picklistValue(field.key, cardinality, Math.floor(rng() * cardinality));
      return stored(field, JSON.stringify(text), text, { text });
    }
    case "boolean": {
      const value = rng() < 0.5;
      return stored(field, value ? "true" : "false", value, { bool: value });
    }
    case "integer": {
      const value = 1 + Math.floor(rng() * 100_000);
      return stored(field, String(value), value, { num: String(value) });
    }
    case "decimal": {
      const text = money(rng);
      return stored(field, text, text, { num: text });
    }
    case "datetime": {
      const text = randomInstant(rng);
      return stored(field, JSON.stringify(text), text, { text, ts: text });
    }
    case "date": {
      const text = randomInstant(rng).slice(0, 10);
      return stored(field, JSON.stringify(text), text, { text, ts: `${text}T00:00:00.000Z` });
    }
    case "textarea": {
      const target = 200 + Math.floor(rng() * 201);
      let text = "";
      while (text.length < target) {
        text += `${text.length > 0 ? " " : ""}${pickWord(rng, vocab)}`;
      }
      text = text.slice(0, target);
      return stored(field, JSON.stringify(text), text, { text });
    }
    case "lookup": {
      if (kind !== "lead" || input.contactIds.length === 0) return null;
      const contactId = input.contactIds[Math.floor(rng() * input.contactIds.length)];
      if (!contactId) return null;
      return stored(field, JSON.stringify(contactId), contactId, { text: contactId });
    }
    default:
      return null;
  }
}

/** A dense lead used by the write benchmark. Same logical row for every option. */
export function syntheticLead(world: Universe, seq: number): GeneratedRecord {
  const rng = mulberry32((world.seed + seq) >>> 0);
  const vocab = vocabulary(world.seed);
  return generateRecord({
    rng,
    vocab,
    world,
    seq,
    index: seq,
    kind: "lead",
    orgId: world.orgA,
    moduleId: world.moduleLeads,
    users: world.usersA,
    contactIds: [],
  });
}
