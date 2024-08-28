import { HTTPMethod } from '@/enums/method'
import { Type } from '@/enums/type'
import { UnitType } from '@/enums/unit'
import { ArraySchema } from '@/models/array.dto'
import { HistorySchema } from '@/models/history.dto'
import { ObjectSchema } from '@/models/object.dto'
import type { Bindings, Variables } from '@/utils/bindings'
import { History } from '@/utils/call_api'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import { ResultSchema } from '../models/result.dto'

export const app = new Hono<{ Variables: Variables; Bindings: Bindings }>()

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  in: 'header',
  description: 'Bearer token'
})

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/chat',
    tags: ['チャット履歴'],
    security: [{ Bearer: [] }],
    summary: '一覧取得',
    description: 'チャット履歴の一覧を取得します.',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: ArraySchema(HistorySchema)
          }
        },
        type: 'application/json',
        description: 'チャット履歴一覧'
      }
    }
  }),
  async (c) => {
    return c.json(await History.find_all(c))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/chat/{chat_id}',
    tags: ['チャット履歴'],
    security: [{ Bearer: [] }],
    summary: '詳細取得',
    description: '指定されたチャット履歴詳細を取得します.',
    request: {
      params: z.object({
        chat_id: z.string().openapi({
          description: 'チャットID',
          example: '66ccf9cd77f02135092952cf'
        })
      })
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: ObjectSchema(HistorySchema)
          }
        },
        type: 'application/json',
        description: 'チャット履歴詳細'
      }
    }
  }),
  async (c) => {
    const { chat_id } = c.req.valid('param')
    return c.json(await History.find(c, chat_id))
  }
)

const description: string = Object.entries(UnitType)
  .map(([k, v]) => `${k}: \`${v}\``)
  .join('\n\n')

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    path: '/chat',
    tags: ['チャット履歴'],
    security: [{ Bearer: [] }],
    description: 'チャット履歴を作成します.',
    summary: '作成',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              type: z.nativeEnum(Type).openapi({
                description: '現在は`unit`のみ対応しています'
              }),
              unit_id: z.nativeEnum(UnitType).openapi({
                description: description
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
            schema: ObjectSchema(HistorySchema)
          }
        },
        type: 'application/json',
        description: 'チャット履歴'
      }
    }
  }),
  async (c) => {
    const { type, unit_id } = c.req.valid('json')
    return c.json(await History.create(c, type, unit_id))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.DELETE,
    path: '/chat',
    tags: ['チャット履歴'],
    security: [{ Bearer: [] }],
    summary: '一括削除',
    description: '全てのチャット履歴を削除します.',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: ResultSchema
          }
        },
        type: 'application/json',
        description: 'リザルト'
      }
    }
  }),
  async (c) => {
    const chat_ids: string[] = (await History.find_all(c)).data.map((v) => v._id)
    return c.json(await History.remove(c, chat_ids))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.DELETE,
    path: '/chat/{chat_id}',
    tags: ['チャット履歴'],
    security: [{ Bearer: [] }],
    summary: '削除',
    description: '指定されたチャット履歴を削除します.',
    request: {
      params: z.object({
        chat_id: z.string().openapi({
          description: 'チャットID',
          example: '66ccf9cd77f02135092952cf'
        })
      })
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: ResultSchema
          }
        },
        type: 'application/json',
        description: 'リザルト'
      }
    }
  }),
  async (c) => {
    const { chat_id } = c.req.valid('param')
    return c.json(await History.remove(c, [chat_id]))
  }
)
