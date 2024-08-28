import { OpenAPIHono as Hono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'

import { HTTPException } from 'hono/http-exception'
import { app as auth } from './auth'
import { app as be } from './be'
import { app as chat } from './chat'
import { bearerAuth } from './utils/auth.middleware'
import type { Bindings } from './utils/bindings'
import { reference, specification } from './utils/openapi'

const app = new Hono<{ Bindings: Bindings }>()

app.use(logger())
app.use(csrf())
app.use(cors())
app.use('/api/*', bearerAuth)
app.doc('/specification', specification)
app.get('/docs', apiReference(reference))
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ message: error.message }, error.status)
  }
  return c.json({ message: JSON.parse(error.message) }, 500)
})

app.route('auth', auth)
app.route('api/be', be)
app.route('api/chat', chat)

export default {
  port: 3000,
  fetch: app.fetch,
}
