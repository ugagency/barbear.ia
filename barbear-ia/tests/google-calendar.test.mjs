import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const nodeRequire = createRequire(import.meta.url)
const testDirectory = path.dirname(fileURLToPath(import.meta.url))

// Run the actual TypeScript modules with an in-memory database and HTTP Google responses.
function load(name, overrides = {}) {
  const file = path.join(testDirectory, '../src/lib/google-calendar', name + '.ts')
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const compiled = { exports: {} }
  const customRequire = (id) => Object.hasOwn(overrides, id) ? overrides[id] : id.startsWith('./') ? load(id.slice(2), overrides) : nodeRequire(id)
  vm.runInThisContext('(function(require,module,exports){' + source + '\n})', { filename: file })(customRequire, compiled, compiled.exports)
  return compiled.exports
}

process.env.GOOGLE_CALENDAR_TOKEN_KEY = 'ab'.repeat(32)
process.env.GOOGLE_CALENDAR_CLIENT_ID = 'test-client'
process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'test-secret'
process.env.GOOGLE_CALENDAR_REDIRECT_URI = 'https://example.test/api/google-calendar/callback'
const crypto = load('crypto')
const client = load('client')

function fixture() {
  const connection = { barbeiro_id: 'barber', barbearia_id: 'shop', calendar_id: 'test@calendar', refresh_token_encrypted: crypto.encrypt('refresh'), lock_token: null, locked_until: null }
  const job = { barbeiro_id: 'barber', agendamento_id: 'appointment', revision: 'v1', deleted: false, attempts: 0, next_attempt_at: new Date(0).toISOString(), payload: { id: 'appointment', cliente_id: 'client', status: 'agendado', servico: 'Corte', inicio_at: '2026-11-01T12:00:00Z', fim_at: '2026-11-01T12:30:00Z' } }
  const tables = { google_calendar_connections: [connection], google_calendar_jobs: [job], clientes: [{ id: 'client', barbearia_id: 'shop', nome: 'Ana' }] }
  const db = { from(table) {
    let op = 'select', patch, filters = []
    const builder = {
      select() { return this }, update(p) { op = 'update'; patch = p; return this }, delete() { op = 'delete'; return this },
      eq(k,v) { filters.push(row => row[k] === v); return this },
      lte(k,v) { filters.push(row => row[k] <= v); return this },
      or() { filters.push(row => !row.locked_until || Date.parse(row.locked_until) < Date.now()); return this },
      order() { return this }, limit() { return this },
      maybeSingle() { return this.run().then(r => ({ ...r, data: r.data[0] ?? null })) },
      then(resolve, reject) { return this.run().then(resolve, reject) },
      async run() {
        const found = tables[table].filter(row => filters.every(f => f(row)))
        if (op === 'update') found.forEach(row => Object.assign(row, patch))
        if (op === 'delete') tables[table] = tables[table].filter(row => !found.includes(row))
        return { data: JSON.parse(JSON.stringify(found)), error: null }
      },
    }
    return builder
  } }
  return { connection, job, tables, sync: load('sync', { '@/lib/supabase/admin': { supabaseAdmin: db } }) }
}

function mockGoogle(t, handler) {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options })
    if (url === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'access' })
    return handler(url, options, calls)
  })
  return calls
}

test('token encryption detects tampering and never stores plaintext', () => {
  const sealed = crypto.encrypt('private-refresh-token')
  assert.equal(crypto.decrypt(sealed), 'private-refresh-token')
  assert.ok(!sealed.includes('private-refresh-token'))
  const bytes = Buffer.from(sealed, 'base64url'); bytes[bytes.length - 1] ^= 1
  assert.throws(() => crypto.decrypt(bytes.toString('base64url')))
})
test('Google event IDs and payload preserve dates and omit sensitive fields', () => {
  assert.match(client.eventId('a'), /^[0-9a-v]{5,1024}$/)
  assert.equal(client.eventId('a'), client.eventId('a'))
  assert.notEqual(client.eventId('a'), client.eventId('b'))
  const event = client.eventPayload({ id:'a', servico:'Corte', inicio_at:'2026-11-01T12:00:00Z', fim_at:'2026-11-01T12:30:00Z', telefone:'secret-phone', observacoes:'private-note' }, 'Ana')
  assert.equal(event.start.dateTime, '2026-11-01T12:00:00Z')
  assert.equal(event.end.dateTime, '2026-11-01T12:30:00Z')
  assert.equal(event.status, 'confirmed')
  assert.ok(!JSON.stringify(event).includes('private-note'))
  assert.ok(!JSON.stringify(event).includes('secret-phone'))
})
test('first send creates event, drains queue and releases lease', async t => {
  const f = fixture()
  const calls = mockGoogle(t, (_, init) => new Response(null, { status: init.method === 'PUT' ? 404 : 200 }))
  assert.equal((await f.sync.syncBarber('barber')).processed, 1)
  assert.equal(f.tables.google_calendar_jobs.length, 0)
  assert.equal(f.connection.lock_token, null)
  assert.deepEqual(calls.slice(1).map(c => c.options.method), ['PUT','POST'])
  assert.equal(JSON.parse(calls.at(-1).options.body).id, client.eventId('appointment'))
  t.mock.restoreAll()
})
test('an insert that already succeeded is retried with same ID', async t => {
  const f = fixture(); let count = 0
  mockGoogle(t, () => new Response(null, { status: [404,409,200][count++] }))
  assert.equal((await f.sync.syncBarber('barber')).processed, 1)
  assert.equal(count, 3)
  t.mock.restoreAll()
})
test('rescheduling uses update with exact new timestamps', async t => {
  const f = fixture(); f.job.payload.inicio_at = '2026-11-02T13:00:00Z'
  const calls = mockGoogle(t, () => new Response(null, { status: 200 }))
  await f.sync.syncBarber('barber')
  assert.equal(calls[1].options.method, 'PUT')
  assert.equal(JSON.parse(calls[1].options.body).start.dateTime, '2026-11-02T13:00:00Z')
  t.mock.restoreAll()
})
test('canceling an event that never reached Google is idempotent', async t => {
  const f = fixture(); f.job.payload.status = 'cancelado'
  const calls = mockGoogle(t, () => new Response(null, { status: 404 }))
  assert.equal((await f.sync.syncBarber('barber')).processed, 1)
  assert.equal(calls[1].options.method, 'PATCH')
  t.mock.restoreAll()
})
test('429 retains the job with backoff and visible failure state', async t => {
  const f = fixture()
  mockGoogle(t, () => new Response(null, { status: 429 }))
  assert.equal((await f.sync.syncBarber('barber')).failed, true)
  assert.equal(f.job.attempts, 1)
  assert.ok(Date.parse(f.job.next_attempt_at) > Date.now())
  assert.ok(f.connection.last_error)
  assert.equal(f.connection.lock_token, null)
  t.mock.restoreAll()
})
test('a concurrent revision is not removed by the older successful send', async t => {
  const f = fixture()
  mockGoogle(t, () => { f.job.revision = 'v2'; return new Response(null, { status: 200 }) })
  await f.sync.syncBarber('barber')
  assert.equal(f.tables.google_calendar_jobs.length, 1)
  assert.equal(f.tables.google_calendar_jobs[0].revision, 'v2')
  t.mock.restoreAll()
})
test('an active lease prevents a second worker from sending', async t => {
  const f = fixture(); f.connection.lock_token = 'other'; f.connection.locked_until = new Date(Date.now()+60000).toISOString()
  const calls = mockGoogle(t, () => { throw new Error('must not call') })
  assert.equal((await f.sync.syncBarber('barber')).busy, true)
  assert.equal(calls.length, 0)
  t.mock.restoreAll()
})
