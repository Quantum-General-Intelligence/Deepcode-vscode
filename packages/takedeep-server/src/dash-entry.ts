import "./db"
import { dashApp } from "./dash"
import { cfg } from "./config"

const app = dashApp()
console.log(`[takedeep-dash] listening on :${cfg.dashPort} (${cfg.dashUrl})`)

export default {
  port: cfg.dashPort,
  fetch: app.fetch,
}
