import "./db"
import { apiApp } from "./api"
import { cfg } from "./config"

const app = apiApp()
console.log(`[takedeep-api] listening on :${cfg.apiPort} (${cfg.apiUrl})`)

export default {
  port: cfg.apiPort,
  fetch: app.fetch,
}
