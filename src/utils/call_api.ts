import { HTTPMethod } from '@/enums/method'
import type { Model } from '@/enums/model'
import type { Platform } from '@/enums/platform'
import type { Type } from '@/enums/type'
import type { UnitType } from '@/enums/unit'
import { ArraySchema } from '@/models/array.dto'
import { ErrorSchema } from '@/models/error'
import { HistorySchema } from '@/models/history.dto'
import { LoginSchema } from '@/models/login.dto'
import { ObjectSchema } from '@/models/object.dto'
import { PromptSchema } from '@/models/prompt.dto'
import { ResultSchema } from '@/models/result.dto'
import type { Context, Env } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { StatusCode } from 'hono/utils/http-status'
import type { z } from 'zod'
import type { Bindings, Variables } from './bindings'

const call_api = async <T>(
  schama: z.Schema<T>,
  c: Context<{ Variables: Variables; Bindings: Bindings }>,
  params: {
    method: HTTPMethod
    hostname: string
    path: string
    params?: Record<string, string>
    body?: object
  }
): Promise<T> => {
  const url = new URL(params.path, params.hostname)
  if (params.params !== undefined) {
    for (const [key, value] of Object.entries(params.params)) {
      url.searchParams.append(key, value)
    }
  }
  const headers = {
    'Content-Type': 'application/json',
    Authorization: c.req.header('Authorization') || '',
    'Wrtn-Locale': 'ja-JP',
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.36'
  }
  const response = await fetch(url.href, {
    method: params.method,
    headers: headers,
    body: params.body === undefined ? undefined : JSON.stringify(params.body)
  })
  const data = await response.json()
  try {
    return schama.parse(data)
  } catch (e) {
    const error: ErrorSchema = ErrorSchema.parse(data)
    throw new HTTPException((error.status || error.statusCode || 400) as StatusCode, { message: error.message })
  }
}

export namespace History {
  /**
   * チャット履歴取得
   * @param c
   * @returns
   */
  export const find_all = async (c: Context<{ Variables: Variables; Bindings: Bindings }>): Promise<ArraySchema<typeof HistorySchema>> => {
    return call_api(ArraySchema(HistorySchema), c, {
      method: HTTPMethod.GET,
      hostname: 'https://api.wrtn.ai',
      path: '/be/chat'
    })
  }

  /**
   * チャット履歴詳細取得
   * @param c
   * @param chat_id
   * @returns
   */
  export const find = async (
    c: Context<{ Variables: Variables; Bindings: Bindings }>,
    chat_id: string
  ): Promise<ObjectSchema<typeof HistorySchema>> => {
    return call_api(ObjectSchema(HistorySchema), c, {
      method: HTTPMethod.GET,
      hostname: 'https://api.wrtn.ai',
      path: `/be/chat/${chat_id}`
    })
  }

  /**
   * チャット履歴作成
   * @param c
   * @param type
   * @param unit_id
   * @returns
   */
  export const create = async (
    c: Context<{ Variables: Variables; Bindings: Bindings }>,
    type: Type,
    unit_id: UnitType
  ): Promise<ObjectSchema<typeof HistorySchema>> => {
    return call_api(ObjectSchema(HistorySchema), c, {
      method: HTTPMethod.POST,
      hostname: 'https://api.wrtn.ai',
      path: '/be/chat',
      body: {
        type: type,
        unitId: unit_id
      }
    })
  }

  /**
   * チャット履歴削除
   * @param c
   * @param chat_ids
   * @returns
   */
  export const remove = async (c: Context<{ Variables: Variables; Bindings: Bindings }>, chat_ids: string[]): Promise<ResultSchema> => {
    return call_api(ResultSchema, c, {
      method: HTTPMethod.PUT,
      hostname: 'https://api.wrtn.ai',
      path: '/be/api/v2/chat/delete',
      body: {
        chatIds: chat_ids
      }
    })
  }
}

export namespace Auth {
  /**
   * ログイン
   * @param c
   * @returns
   */
  export const login = async (env: Env): Promise<LoginSchema> => {
    const url: URL = new URL('/auth/local', 'https://api.wow.wrtn.ai')
    const response = await (
      await fetch(url, {
        method: HTTPMethod.POST,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // @ts-ignore
          email: env.LOGIN_ID,
          // @ts-ignore
          password: env.PASSWORD
        })
      })
    ).json()
    const credential: LoginSchema = LoginSchema.parse(response)
    // @ts-ignore
    await env.WRTN_Config.put(env.LOGIN_ID, JSON.stringify(credential))
    return credential
  }
}

export namespace Chat {
  export const send = async (
    c: Context<{ Variables: Variables; Bindings: Bindings }>,
    chat_id: string,
    params: {
      message: string
      reroll: boolean
      images: string[]
    }
  ): Promise<ObjectSchema<typeof PromptSchema>> => {
    return call_api(ObjectSchema(PromptSchema), c, {
      method: HTTPMethod.POST,
      hostname: 'https://william.wow.wrtn.ai',
      path: `/chat/v3/${chat_id}/start`,
      body: {
        message: params.message,
        reroll: params.reroll,
        images: params.images
      }
    })
  }

  export const receive = async (
    c: Context<{ Variables: Variables; Bindings: Bindings }>,
    chat_id: string,
    message_id: string,
    params: {
      model: Model
      platform: Platform
      user: string
    }
  ): Promise<Response> => {
    const url: URL = new URL(`/chat/v3/${chat_id}/${message_id}`, 'https://william.wow.wrtn.ai')
    url.searchParams.append('model', params.model)
    url.searchParams.append('platform', params.platform)
    url.searchParams.append('user', params.user)
    const headers = {
      'Content-Type': 'application/json',
      Authorization: c.req.header('Authorization') || '',
      'Wrtn-Locale': 'ja-JP',
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.36'
    }
    return fetch(url, {
      method: HTTPMethod.GET,
      headers: headers
    })
  }
}
