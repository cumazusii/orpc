import { createRouterHandler, initORPC } from '@orpc/server'
import { fetchHandler } from '@orpc/server/fetch'
import { z } from 'zod'
import { createProcedureClient } from './procedure'

describe('createProcedureClient', () => {
  const orpc = initORPC
  const schema = z.object({
    value: z.string(),
  })
  const ping = orpc.input(schema).handler((_, __, { path }) => path)
  const router = orpc.router({
    ping,
    nested: {
      ping,
    },
  })
  const handler = createRouterHandler({
    router,
  })
  const orpcFetch: typeof fetch = async (...args) => {
    const request = new Request(...args)
    return await fetchHandler({
      prefix: '/orpc',
      request,
      handler,
      context: {},
    })
  }

  it('types', () => {
    const schema = z.object({
      value: z.string(),
    })
    const client = createProcedureClient<
      typeof schema,
      undefined,
      { age: number }
    >({} as any)

    expectTypeOf(client).toEqualTypeOf<
      (input: { value: string }) => Promise<{ age: number }>
    >()

    const client2 = createProcedureClient<
      undefined,
      typeof schema,
      { value: string }
    >({} as any)

    expectTypeOf(client2).toEqualTypeOf<
      (input: unknown) => Promise<{ value: string }>
    >()
  })

  it('simple', async () => {
    const client = createProcedureClient({
      baseURL: 'http://localhost:3000/orpc',
      fetch: orpcFetch,
      path: ['ping'],
    })

    const result = await client({ value: 'hello' })

    expect(result).toEqual(['ping'])

    const client2 = createProcedureClient({
      baseURL: 'http://localhost:3000/orpc',
      fetch: orpcFetch,
      path: ['nested', 'ping'],
    })

    const result2 = await client2({ value: 'hello' })

    expect(result2).toEqual(['nested', 'ping'])
  })

  it('on known error', () => {
    const client = createProcedureClient({
      baseURL: 'http://localhost:3000/orpc',
      fetch: orpcFetch,
      path: ['ping'],
    })

    expect(client({ value: 1234 })).rejects.toThrowError(
      'Validation input failed',
    )
  })

  it('on unknown error', () => {
    const orpcFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({}), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const client = createProcedureClient({
      baseURL: 'http://localhost:3000/orpc',
      fetch: orpcFetch,
      path: ['ping'],
    })

    expect(client({ value: 'hello' })).rejects.toThrowError(
      'Internal server error',
    )
  })
})
