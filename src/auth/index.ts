import { HTTPMethod } from '@/enums/method'
import { LoginSchema } from '@/models/login.dto'
import type { Bindings } from '@/utils/bindings'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import type { Context } from 'hono'

export const app = new Hono<{ Bindings: Bindings }>()

// スケジュールで定期的に更新する
const login = async (c: Context<{ Bindings: Bindings }>, email: string, password: string): Promise<LoginSchema> => {
  const url: URL = new URL('/auth/local', 'https://api.wow.wrtn.ai')
  const response = await (
    await fetch(url.href, {
      method: HTTPMethod.POST,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    })
  ).json()
  return LoginSchema.parse(response)
}

const refresh = async (c: Context<{ Bindings: Bindings }>, refreshToken: string): Promise<LoginSchema> => {
  const url: URL = new URL('/auth/refresh', 'https://api.wow.wrtn.ai')
  const response = await (
    await fetch(url.href, {
      method: HTTPMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        Refresh: refreshToken
      }
    })
  ).json()
  return LoginSchema.parse(response)
}

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    path: '/local',
    tags: ['認証'],
    summary: 'ログイン',
    description: 'メールアドレスとパスワードでログインします. 一時間の有効期限を持つアクセストークンとリフレッシュトークンが返ります.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              email: z.string().email().openapi({
                description: 'メールアドレス'
              }),
              password: z.string().openapi({
                description: 'パスワード'
              })
            })
          }
        }
      }
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: LoginSchema
          }
        },
        type: 'application/json',
        description: '認証情報'
      }
    }
  }),
  async (c) => {
    const { email, password } = c.req.valid('json')
    return c.json(await login(c, email, password))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    path: '/refresh',
    tags: ['認証'],
    summary: '更新',
    description: 'リフレッシュトークンを使ってアクセストークンを更新します.',
    request: {
      headers: z.object({
        refresh: z.string().openapi({
          description: 'リフレッシュトークン'
        })
      })
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: LoginSchema
          }
        },
        type: 'application/json',
        description: '認証情報'
      }
    }
  }),
  async (c) => {
    const refreshToken: string = c.req.valid('header').refresh
    return c.json(await refresh(c, refreshToken))
  }
)
