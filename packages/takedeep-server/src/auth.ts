import { randomBytes } from "node:crypto"
import { cfg } from "./config"

export function token() {
  return randomBytes(32).toString("hex")
}

export function code() {
  return randomBytes(4).toString("hex").toUpperCase()
}

export function id() {
  return randomBytes(16).toString("hex")
}

export async function hash(password: string) {
  return Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 })
}

export async function verify(password: string, hash: string) {
  return Bun.password.verify(password, hash)
}

export function dashSession(data: { userId: string; email: string }) {
  const payload = JSON.stringify({ ...data, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  const sig = sign(payload)
  return `${Buffer.from(payload).toString("base64url")}.${sig}`
}

export function parseDashSession(cookie: string | undefined) {
  if (!cookie) return undefined
  const [body, sig] = cookie.split(".")
  if (!body || !sig || sign(Buffer.from(body, "base64url").toString()) !== sig) return undefined
  const data = JSON.parse(Buffer.from(body, "base64url").toString()) as { userId: string; email: string; exp: number }
  if (data.exp < Date.now()) return undefined
  return data
}

function sign(payload: string) {
  return Bun.CryptoHasher.hash("sha256", `${cfg.jwtSecret}:${payload}`, "hex")
}

export function bearer(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) return undefined
  return header.slice(7).trim()
}
