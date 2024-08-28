import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { type JwtPayload, jwtDecode } from 'jwt-decode'
import type { Bindings, Variables } from './bindings'

/**
 * 本番用
 */
export const bearerAuth: MiddlewareHandler<{ Variables: Variables; Bindings: Bindings }> = async (c, next) => {
  const token: string | undefined = c.req.header('Authorization')
  // トークンがない場合は401
  if (token === undefined) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  const payload: JwtPayload | undefined = jwtDecode(token)
  // 正しくデコードできない場合は400
  if (payload === undefined || payload.exp === undefined) {
    throw new HTTPException(400, { message: 'Invalid Bearer Token format' })
  }
  // 有効期限が切れていれば401
  if (payload.exp < Date.now() / 1000) {
    throw new HTTPException(401, { message: 'The access token has expired' })
  }
  await next()
}
