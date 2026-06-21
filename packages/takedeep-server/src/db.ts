import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { cfg } from "./config"

const path = cfg.dbPath
mkdirSync(dirname(path), { recursive: true })

export const db = new Database(path)
db.exec("PRAGMA journal_mode = WAL")
db.exec("PRAGMA foreign_keys = ON")

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    stripe_customer_id TEXT,
    balance_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS api_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS device_codes (
    code TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    user_id TEXT REFERENCES users(id),
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

export type User = {
  id: string
  email: string
  name: string | null
  password_hash: string
  role: string
  stripe_customer_id: string | null
  balance_cents: number
  created_at: string
}

export function userByEmail(email: string) {
  return db.query<User, [string]>("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(email)
}

export function userById(id: string) {
  return db.query<User, [string]>("SELECT * FROM users WHERE id = ?").get(id)
}

export function userByToken(token: string) {
  return db
    .query<User, [string]>(
      `SELECT u.* FROM users u
       JOIN api_tokens t ON t.user_id = u.id
       WHERE t.token = ?`,
    )
    .get(token)
}

export function insertUser(row: {
  id: string
  email: string
  name?: string
  password_hash: string
  role?: string
  stripe_customer_id?: string
}) {
  db.query(
    `INSERT INTO users (id, email, name, password_hash, role, stripe_customer_id)
     VALUES ($id, $email, $name, $password_hash, $role, $stripe_customer_id)`,
  ).run({
    $id: row.id,
    $email: row.email.toLowerCase(),
    $name: row.name ?? null,
    $password_hash: row.password_hash,
    $role: row.role ?? "user",
    $stripe_customer_id: row.stripe_customer_id ?? null,
  })
}

export function insertToken(token: string, userId: string) {
  db.query("INSERT INTO api_tokens (token, user_id) VALUES (?, ?)").run(token, userId)
}

export function listUsers() {
  return db.query<User, []>("SELECT * FROM users ORDER BY created_at DESC").all()
}

export type DeviceCode = {
  code: string
  status: string
  user_id: string | null
  expires_at: number
  created_at: string
}

export function deviceByCode(code: string) {
  return db.query<DeviceCode, [string]>("SELECT * FROM device_codes WHERE code = ?").get(code)
}

export function insertDevice(code: string, expiresAt: number) {
  db.query("INSERT INTO device_codes (code, expires_at) VALUES (?, ?)").run(code, expiresAt)
}

export function approveDevice(code: string, userId: string) {
  db.query("UPDATE device_codes SET status = 'approved', user_id = ? WHERE code = ? AND status = 'pending'").run(
    userId,
    code,
  )
}

export function denyDevice(code: string) {
  db.query("UPDATE device_codes SET status = 'denied' WHERE code = ? AND status = 'pending'").run(code)
}

export function countUsers() {
  return db.query<{ n: number }, []>("SELECT COUNT(*) as n FROM users").get()?.n ?? 0
}
