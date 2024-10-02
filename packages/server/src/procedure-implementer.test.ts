import { ContractProcedure } from '@orpc/contract'
import { z } from 'zod'
import { type Meta, type Procedure, initORPC, isProcedure } from '.'
import { ProcedureImplementer } from './procedure-implementer'

const p1 = new ContractProcedure({
  InputSchema: undefined,
  OutputSchema: undefined,
  method: undefined,
  path: undefined,
})
const implementer1 = new ProcedureImplementer<
  { auth: boolean },
  typeof p1,
  undefined
>({ contract: p1 })

const schema1 = z.object({ id: z.string() })
const schema2 = z.object({ name: z.string() })

const p2 = new ContractProcedure({
  InputSchema: schema1,
  OutputSchema: schema2,
  method: 'GET',
  path: '/test',
})

const implementer2 = new ProcedureImplementer<
  { auth: boolean },
  typeof p2,
  undefined
>({ contract: p2 })

describe('use middleware', () => {
  it('infer types', () => {
    const i = implementer1
      .use((input, context, meta) => {
        expectTypeOf(input).toEqualTypeOf<unknown>()
        expectTypeOf(context).toEqualTypeOf<{ auth: boolean }>()
        expectTypeOf(meta).toEqualTypeOf<Meta<unknown>>()

        return {
          context: {
            userId: '1',
          },
        }
      })
      .use((input, context, meta) => {
        expectTypeOf(input).toEqualTypeOf<unknown>()
        expectTypeOf(context).toEqualTypeOf<
          { userId: string } & { auth: boolean }
        >()
        expectTypeOf(meta).toEqualTypeOf<Meta<unknown>>()
      })

    expectTypeOf(i).toEqualTypeOf<
      ProcedureImplementer<{ auth: boolean }, typeof p1, { userId: string }>
    >()
  })

  it('map middleware input', () => {
    // @ts-expect-error mismatch input
    implementer2.use((input: { postId: string }) => {
      return { context: { a: 'a' } }
    })

    implementer2.use(
      (input: { postId: string }) => {
        return { context: { a: 'a' } }
      },
      // @ts-expect-error mismatch input
      (input) => ({ postId: 12455 }),
    )

    implementer2.use(
      (input: { postId: string }) => {},
      (input) => ({ postId: '12455' }),
    )

    const i = implementer2.use(
      (input: { id: number }) => {
        return {
          context: {
            userIdd: '1',
          },
        }
      },
      (input) => ({ id: Number.parseInt(input.id) }),
    )

    expectTypeOf(i).toEqualTypeOf<
      ProcedureImplementer<{ auth: boolean }, typeof p2, { userIdd: string }>
    >()
  })
})

describe('output schema', () => {
  it('auto infer output schema if output schema is not specified', async () => {
    const sr = initORPC.handler(() => ({ a: 1 }))

    const result = await sr.__p.handler({}, undefined, {
      method: 'GET',
      path: '/',
    } as any)

    expectTypeOf(result).toEqualTypeOf<{ a: number }>()
  })

  it('not infer output schema if output schema is specified', async () => {
    const srb1 = new ProcedureImplementer({
      contract: new ContractProcedure({
        OutputSchema: z.unknown(),
      }),
    })

    const sr = srb1.handler(() => ({ b: 1 }))

    const result = await sr.__p.handler({}, {}, {
      method: 'GET',
      path: '/',
    } as any)

    expectTypeOf(result).toEqualTypeOf<unknown>()
  })
})

describe('handler', () => {
  it('infer types', () => {
    const handler = implementer1.handler((input, context, meta) => {
      expectTypeOf(input).toEqualTypeOf<unknown>()
      expectTypeOf(context).toEqualTypeOf<{ auth: boolean }>()
      expectTypeOf(meta).toEqualTypeOf<Meta<unknown>>()

      return {
        name: 'dinwwwh',
      }
    })

    expectTypeOf(handler).toEqualTypeOf<
      Procedure<{ auth: boolean }, typeof p1, undefined, { name: string }>
    >()
    expect(isProcedure(handler)).toBe(true)

    implementer2.handler((input, context, meta) => {
      expectTypeOf(input).toEqualTypeOf<{ id: string }>()
      expectTypeOf(context).toEqualTypeOf<{ auth: boolean }>()
      expectTypeOf(meta).toEqualTypeOf<Meta<unknown>>()

      return {
        name: 'dinwwwh',
      }
    })

    // @ts-expect-error mismatch output
    implementer2.handler(() => {})
  })

  it('combine middlewares', () => {
    const mid1 = () => {
      return {
        context: {
          userId: '1',
        },
      }
    }

    const mid2 = () => {}

    const handler = implementer2
      .use(mid1)
      .use(mid2)
      .handler((input, context, meta) => {
        expectTypeOf(input).toEqualTypeOf<{ id: string }>()
        expectTypeOf(context).toEqualTypeOf<
          { auth: boolean } & { userId: string }
        >()
        expectTypeOf(meta).toEqualTypeOf<Meta<unknown>>()

        return {
          name: 'dinwwwh',
        }
      })

    expectTypeOf(handler).toEqualTypeOf<
      Procedure<
        { auth: boolean },
        typeof p2,
        { userId: string },
        { name: string }
      >
    >()

    expect(handler.__p.middlewares).toEqual([mid1, mid2])
  })
})
