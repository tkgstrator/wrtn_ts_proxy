import { HTTPMethod } from '@/enums/method'
import { Model } from '@/enums/model'
import { Platform } from '@/enums/platform'
import { ObjectSchema } from '@/models/object.dto'
import { PromptSchema } from '@/models/prompt.dto'
import type { Bindings, Variables } from '@/utils/bindings'
import { Chat } from '@/utils/call_api'
import { OpenAPIHono as Hono, createRoute, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { streamSSE } from 'hono/streaming'
import { type JwtPayload, jwtDecode } from 'jwt-decode'

export const app = new Hono<{ Variables: Variables; Bindings: Bindings }>()

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  in: 'header',
  description: 'Bearer token'
})

app.openapi(
  createRoute({
    method: HTTPMethod.POST,
    path: '/{chat_id}',
    tags: ['チャット'],
    security: [{ Bearer: [] }],
    summary: '送信',
    description: '指定されたチャットにメッセージを送信します. AIが生成したメッセージは受信されません.',
    request: {
      params: z.object({
        chat_id: z.string().openapi({
          description: 'チャットID',
          example: '66ccf9cd77f02135092952cf'
        })
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              message: z.string().openapi({
                description: 'メッセージ'
              }),
              reroll: z.boolean().default(false).openapi({
                description: '再生成'
              }),
              images: z.array(z.string()).default([]).openapi({
                description: '画像'
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
            schema: ObjectSchema(PromptSchema)
          }
        },
        description: 'リザルト'
      }
    }
  }),
  async (c) => {
    const { chat_id } = c.req.valid('param')
    const params = c.req.valid('json')
    return c.json(await Chat.send(c, chat_id, params))
  }
)

app.openapi(
  createRoute({
    method: HTTPMethod.GET,
    path: '/{chat_id}/{message_id}',
    tags: ['チャット'],
    security: [{ Bearer: [] }],
    summary: '受信',
    description: 'AIが生成したメッセージを受信します. 最新のメッセージのみ取得できます.',
    request: {
      params: z.object({
        chat_id: z.string().openapi({
          description: 'チャットID',
          example: '66ccf9cd77f02135092952cf'
        }),
        message_id: z.string().openapi({
          description: 'メッセージID',
          example: '66ccf9d1be49ce7eea2be950'
        })
      })
    },
    responses: {
      200: {
        type: 'text/event-stream',
        description: 'Server-Sent Events'
      }
    }
  }),
  async (c) => {
    const token: string | undefined = c.req.header('Authorization')
    if (token === undefined) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }
    const payload: any | undefined = jwtDecode(token)
    if (payload === undefined || payload.email === undefined) {
      throw new HTTPException(400, { message: 'Invalid Bearer Token format' })
    }
    const { chat_id, message_id } = c.req.valid('param')
    const response: Response = await Chat.receive(c, chat_id, message_id, {
      model: Model.GPT_4O_MINI,
      platform: Platform.WEB,
      user: payload.email
    })
    if (!response.body) {
      throw new HTTPException(404, { message: 'Not Found' })
    }
    const reader = response.body.getReader()
    const decoder: TextDecoder = new TextDecoder()

    return streamSSE(c, async (stream) => {
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        buffer += decoder.decode(value)
        let boundaryIndex = 0
        // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
        while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
          const completeEvent = buffer.slice(0, boundaryIndex)
          buffer = buffer.slice(boundaryIndex + 2)

          if (completeEvent.trim()) {
            await stream.writeSSE({ data: completeEvent.replace(/data: /g, '') })
          }
        }
      }
    })
  }
)
