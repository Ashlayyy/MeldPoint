/**
 * Anonymize a MeldPoint MongoDB so it can be shared publicly.
 *
 * IDs, foreign keys, volgnummers, and other identifiers are never changed.
 * Names, emails, IPs, free text, and secrets are replaced with deterministic fakes
 * so the same person/email always maps to the same replacement.
 *
 * Usage (from backend/):
 *   npx tsx scripts/anonymize-db.ts --dry-run
 *   npx tsx scripts/anonymize-db.ts --uri="mongodb+srv://..." --dry-run
 *   npx tsx scripts/anonymize-db.ts --uri="mongodb+srv://..." --confirm
 *
 * Default URI: DATABASE_URL_DEV, then DATABASE_URL from backend/.env
 */

import '../src/config/loadEnv';
import mongoose from 'mongoose';

const FIRST_NAMES = [
  'Alex',
  'Sam',
  'Jordan',
  'Taylor',
  'Casey',
  'Riley',
  'Morgan',
  'Quinn',
  'Avery',
  'Jamie',
  'Robin',
  'Cameron',
  'Drew',
  'Elliot',
  'Finley',
  'Harper',
  'Kai',
  'Logan',
  'Noah',
  'Parker'
];

const LAST_NAMES = [
  'Baker',
  'Reed',
  'Hayes',
  'Brooks',
  'Coleman',
  'Foster',
  'Griffin',
  'Hughes',
  'Ivers',
  'Jenkins',
  'Keller',
  'Lambert',
  'Morris',
  'Nolan',
  'Owens',
  'Porter',
  'Quinn',
  'Russell',
  'Sutton',
  'Turner'
];

const ID_KEY =
  /^(id|_id|.*(?:[Ii][Dd]s?|ID)|VolgNummer|NumberID|jti|deviceId|trackingId|messageId|githubId|sessionId|correlationID|fileKey)$/;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

type Replacements = {
  names: Map<string, string>;
  emails: Map<string, string>;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const uriArg = args.find((arg) => arg.startsWith('--uri='))?.slice('--uri='.length);
  return {
    uri: uriArg || process.env.DATABASE_URL_DEV || process.env.DATABASE_URL || '',
    dryRun: !args.includes('--confirm'),
    confirm: args.includes('--confirm')
  };
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function idKey(value: unknown): string {
  return String(value ?? '');
}

function pick<T>(items: T[], h: number, shift = 0): T {
  const index = (h >>> shift) % items.length;
  return items[index];
}

function fakeName(seed: string): string {
  const h = hash(seed);
  return `${pick(FIRST_NAMES, h)} ${pick(LAST_NAMES, h, 8)}`;
}

function uniqueLabel(prefix: string, seed: string): string {
  return `${prefix} ${hash(seed).toString(16)}`;
}

function fakeEmail(seed: string): string {
  return `user.${hash(seed).toString(16)}@example.com`;
}

function fakeIp(seed: string): string {
  const h = hash(seed);
  return `203.0.113.${h % 254}`;
}

function fakeText(label: string, seed: string): string {
  return `[Anonymized ${label} ${hash(seed).toString(16).slice(0, 6)}]`;
}

function shouldKeepKey(key: string): boolean {
  return ID_KEY.test(key);
}

function applyKnownReplacements(text: string, replacements: Replacements): string {
  let result = text;
  replacements.emails.forEach((fake, original) => {
    if (original) {
      result = result.split(original).join(fake);
    }
  });
  replacements.names.forEach((fake, original) => {
    if (original && original.length > 2) {
      result = result.split(original).join(fake);
    }
  });
  result = result.replace(EMAIL_RE, (match) => replacements.emails.get(match) || fakeEmail(match));
  return result;
}

function anonymizeValue(value: unknown, key: string, seed: string, replacements: Replacements): unknown {
  if (value == null) {
    return value;
  }
  if (value instanceof mongoose.Types.ObjectId || value instanceof Date) {
    return value;
  }
  if (shouldKeepKey(key)) {
    return value;
  }
  if (typeof value === 'string') {
    const replaced = applyKnownReplacements(value, replacements);
    if (key.toLowerCase().includes('email')) {
      return replacements.emails.get(value) || fakeEmail(seed + value);
    }
    if (key.toLowerCase().includes('ip')) {
      return fakeIp(seed + value);
    }
    if (/(name|naam|title|titel)/i.test(key) && value === replaced) {
      return fakeName(seed + value);
    }
    if (replaced !== value) {
      return replaced;
    }
    if (value.length < 3) {
      return value;
    }
    return fakeText(key, seed + value);
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => anonymizeValue(item, key, `${seed}:${index}`, replacements));
  }
  if (typeof value === 'object') {
    const next: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
      next[childKey] = anonymizeValue(childValue, childKey, `${seed}:${childKey}`, replacements);
    });
    return next;
  }
  return value;
}

async function bulkUpdate(
  collection: mongoose.mongo.Collection,
  docs: Array<{ _id: unknown; update: Record<string, unknown> }>,
  dryRun: boolean
): Promise<number> {
  if (docs.length === 0) {
    return 0;
  }
  if (dryRun) {
    return docs.length;
  }
  const result = await collection.bulkWrite(
    docs.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: doc.update }
      }
    })),
    { ordered: false }
  );
  return result.modifiedCount;
}

async function loadUsers(db: mongoose.mongo.Db, replacements: Replacements) {
  const users = db.collection('User');
  const cursor = users.find({});
  let index = 0;
  const updates: Array<{ _id: unknown; update: Record<string, unknown> }> = [];

  for await (const user of cursor) {
    index += 1;
    const seed = idKey(user._id);
    const name = fakeName(seed);
    const email = fakeEmail(seed);
    if (typeof user.Name === 'string') {
      replacements.names.set(user.Name, name);
    }
    if (typeof user.Email === 'string') {
      replacements.emails.set(user.Email, email);
    }
    updates.push({
      _id: user._id,
      update: {
        Name: name,
        Email: email,
        MicrosoftId: user.MicrosoftId ? `ms-anon-${seed}` : user.MicrosoftId
      }
    });
  }

  return { updates, count: index };
}

async function anonymizeCollection(
  db: mongoose.mongo.Db,
  name: string,
  fieldMap: Record<string, (doc: Record<string, unknown>, seed: string, replacements: Replacements) => unknown>,
  replacements: Replacements,
  dryRun: boolean
) {
  const collection = db.collection(name);
  if (!(await collection.findOne({}))) {
    console.log(`  skip ${name} (empty or missing)`);
    return 0;
  }

  const updates: Array<{ _id: unknown; update: Record<string, unknown> }> = [];
  for await (const doc of collection.find({})) {
    const seed = idKey(doc._id);
    const update: Record<string, unknown> = {};
    Object.entries(fieldMap).forEach(([field, mapper]) => {
      if (doc[field] !== undefined && doc[field] !== null) {
        update[field] = mapper(doc as Record<string, unknown>, seed, replacements);
      }
    });
    if (Object.keys(update).length > 0) {
      updates.push({ _id: doc._id, update });
    }
  }

  const changed = await bulkUpdate(collection, updates, dryRun);
  console.log(`  ${name}: ${updates.length} documents ${dryRun ? 'would be updated' : `updated (${changed} modified)`}`);
  return updates.length;
}

async function deleteSecrets(db: mongoose.mongo.Db, dryRun: boolean) {
  const secretCollections = ['Token', 'LoginAttempt', 'sessions'];
  for (const name of secretCollections) {
    const collection = db.collection(name);
    const count = await collection.countDocuments();
    if (count === 0) {
      continue;
    }
    if (!dryRun) {
      await collection.deleteMany({});
    }
    console.log(`  ${name}: ${count} documents ${dryRun ? 'would be deleted' : 'deleted'}`);
  }
}

async function main() {
  const { uri, dryRun, confirm } = parseArgs();

  if (!uri) {
    throw new Error('No Mongo URI. Pass --uri=... or set DATABASE_URL_DEV / DATABASE_URL.');
  }

  console.log(dryRun ? 'DRY RUN — no writes. Pass --confirm to apply.' : 'WRITING anonymized data.');
  if (!dryRun && !confirm) {
    throw new Error('Refusing to write without --confirm');
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Mongo connection has no database');
  }

  console.log(`Connected to ${db.databaseName}`);
  const replacements: Replacements = { names: new Map(), emails: new Map() };

  console.log('Users');
  const { updates: userUpdates } = await loadUsers(db, replacements);
  const userChanged = await bulkUpdate(db.collection('User'), userUpdates, dryRun);
  console.log(`  User: ${userUpdates.length} documents ${dryRun ? 'would be updated' : `updated (${userChanged} modified)`}`);

  const text =
    (field: string) => (doc: Record<string, unknown>, seed: string, replacements: Replacements) =>
      anonymizeValue(doc[field], field, seed, replacements);

  console.log('People and org');
  await anonymizeCollection(
    db,
    'Department',
    {
      name: (_doc, seed) => uniqueLabel('Department', seed),
      description: text('description')
    },
    replacements,
    dryRun
  );
  await anonymizeCollection(
    db,
    'Projectleider',
    { Name: (_doc, seed) => uniqueLabel('Project lead', seed) },
    replacements,
    dryRun
  );
  await anonymizeCollection(
    db,
    'Project',
    {
      ProjectNaam: text('ProjectNaam'),
      ProjectLocatie: text('ProjectLocatie'),
      Beschrijving: text('Beschrijving')
    },
    replacements,
    dryRun
  );
  await anonymizeCollection(
    db,
    'UserDevice',
    { deviceName: text('deviceName') },
    replacements,
    dryRun
  );
  await anonymizeCollection(db, 'LoginHistory', { ipAddress: text('ipAddress') }, replacements, dryRun);

  console.log('Meldingen');
  await anonymizeCollection(
    db,
    'Melding',
    {
      Obstakel: text('Obstakel'),
      Samenvatting: text('Samenvatting'),
      Title: text('Title'),
      Category: text('Category')
    },
    replacements,
    dryRun
  );
  await anonymizeCollection(db, 'Idee', { Idee: text('Idee') }, replacements, dryRun);
  await anonymizeCollection(db, 'Correctief', { Oplossing: text('Oplossing') }, replacements, dryRun);
  await anonymizeCollection(
    db,
    'Preventief',
    {
      Title: text('Title'),
      Kernoorzaak: text('Kernoorzaak'),
      Why: text('Why'),
      Conclusie: text('Conclusie'),
      Smart: text('Smart'),
      Strategie: text('Strategie'),
      TodoItems: text('TodoItems'),
      ActJSON: text('ActJSON'),
      Documentation: text('Documentation'),
      Monitoring: text('Monitoring'),
      Responsible: text('Responsible'),
      FailureAnalysis: text('FailureAnalysis'),
      NewPDCAPlanning: text('NewPDCAPlanning')
    },
    replacements,
    dryRun
  );

  console.log('Chat, tasks, notifications');
  await anonymizeCollection(db, 'Message', { content: text('content') }, replacements, dryRun);
  await anonymizeCollection(
    db,
    'tasks',
    { message: text('message'), data: text('data'), metadata: text('metadata') },
    replacements,
    dryRun
  );
  await anonymizeCollection(
    db,
    'Notification',
    { message: text('message'), data: text('data') },
    replacements,
    dryRun
  );

  console.log('Logs and history');
  await anonymizeCollection(
    db,
    'SystemLog',
    {
      userEmail: text('userEmail'),
      userName: text('userName'),
      ipAddress: text('ipAddress'),
      previousState: text('previousState'),
      newState: text('newState'),
      requestBody: text('requestBody'),
      metadata: text('metadata'),
      errorMessage: text('errorMessage'),
      errorStack: text('errorStack')
    },
    replacements,
    dryRun
  );
  await anonymizeCollection(
    db,
    'PermissionLog',
    { userEmail: text('userEmail'), userName: text('userName'), metadata: text('metadata') },
    replacements,
    dryRun
  );
  await anonymizeCollection(
    db,
    'user_activity',
    { ipAddress: text('ipAddress'), metadata: text('metadata') },
    replacements,
    dryRun
  );
  await anonymizeCollection(
    db,
    'version_histories',
    { oldVersion: text('oldVersion'), newVersion: text('newVersion'), changes: text('changes') },
    replacements,
    dryRun
  );
  await anonymizeCollection(
    db,
    'GitHubIssue',
    {
      title: text('title'),
      body: text('body'),
      userName: text('userName'),
      userEmail: text('userEmail'),
      assignee: text('assignee'),
      metadata: text('metadata')
    },
    replacements,
    dryRun
  );
  await anonymizeCollection(
    db,
    'api_key',
    {
      name: text('name'),
      key: (doc, seed) => `anon_key_${hash(seed + String(doc.key ?? '')).toString(16)}`
    },
    replacements,
    dryRun
  );
  await anonymizeCollection(db, 'api_key_usage_log', { ipAddress: text('ipAddress') }, replacements, dryRun);
  await anonymizeCollection(db, 'Backup', { createdBy: text('createdBy'), fileName: text('fileName') }, replacements, dryRun);

  console.log('Secrets');
  await deleteSecrets(db, dryRun);

  await mongoose.disconnect();
  console.log(dryRun ? 'Dry run finished. Re-run with --confirm to write.' : 'Anonymization finished.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
