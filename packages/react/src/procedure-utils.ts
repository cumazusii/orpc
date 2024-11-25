import type { ProcedureClient } from '@orpc/client'
import type { Schema, SchemaInput, SchemaOutput } from '@orpc/contract'
import type { PartialOnUndefinedDeep, SetOptional } from '@orpc/shared'
import type {
  DefaultError,
  EnsureInfiniteQueryDataOptions,
  EnsureQueryDataOptions,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryState,
  SetDataOptions,
  Updater,
} from '@tanstack/react-query'
import type { SchemaInputForInfiniteQuery } from './types'
import { getQueryKeyFromPath } from './tanstack-key'

export interface ProcedureUtils<
  TInputSchema extends Schema,
  TOutputSchema extends Schema,
  THandlerOutput extends SchemaOutput<TOutputSchema>,
> {
  fetchQuery: (
    input: SchemaInput<TInputSchema>,
    options?: SetOptional<
      FetchQueryOptions<SchemaOutput<TOutputSchema, THandlerOutput>>,
      'queryKey' | 'queryFn'
    >,
  ) => Promise<SchemaOutput<TOutputSchema, THandlerOutput>>
  fetchInfiniteQuery: (
    options: PartialOnUndefinedDeep<
      SetOptional<
        FetchInfiniteQueryOptions<
          SchemaOutput<TOutputSchema, THandlerOutput>,
          DefaultError,
          SchemaOutput<TOutputSchema, THandlerOutput>,
          QueryKey,
          SchemaInput<TInputSchema>['cursor']
        >,
        'queryKey' | 'queryFn'
      > & {
        input: SchemaInputForInfiniteQuery<TInputSchema>
      }
    >,
  ) => Promise<
    InfiniteData<
      SchemaOutput<TOutputSchema, THandlerOutput>,
      SchemaInput<TInputSchema>['cursor']
    >
  >

  prefetchQuery: (
    input: SchemaInput<TInputSchema>,
    options?: SetOptional<
      FetchQueryOptions<SchemaOutput<TOutputSchema, THandlerOutput>>,
      'queryKey' | 'queryFn'
    >,
  ) => Promise<void>
  prefetchInfiniteQuery: (
    options: PartialOnUndefinedDeep<
      SetOptional<
        FetchInfiniteQueryOptions<
          SchemaOutput<TOutputSchema, THandlerOutput>,
          DefaultError,
          SchemaOutput<TOutputSchema, THandlerOutput>,
          QueryKey,
          SchemaInput<TInputSchema>['cursor']
        >,
        'queryKey' | 'queryFn'
      > & {
        input: SchemaInputForInfiniteQuery<TInputSchema>
      }
    >,
  ) => Promise<void>

  getQueryData: (
    input: SchemaInput<TInputSchema>,
  ) => SchemaOutput<TOutputSchema, THandlerOutput> | undefined
  getInfiniteQueryData: (
    input: SchemaInputForInfiniteQuery<TInputSchema>,
  ) => | InfiniteData<
    SchemaOutput<TOutputSchema, THandlerOutput>,
    SchemaInput<TInputSchema>['cursor']
  >
  | undefined

  ensureQueryData: (
    input: SchemaInput<TInputSchema>,
    options?: SetOptional<
      EnsureQueryDataOptions<SchemaOutput<TOutputSchema, THandlerOutput>>,
      'queryFn' | 'queryKey'
    >,
  ) => Promise<SchemaOutput<TOutputSchema, THandlerOutput>>
  ensureInfiniteQueryData: (
    options: PartialOnUndefinedDeep<
      SetOptional<
        EnsureInfiniteQueryDataOptions<
          SchemaOutput<TOutputSchema, THandlerOutput>,
          DefaultError,
          SchemaOutput<TOutputSchema, THandlerOutput>,
          QueryKey,
          SchemaInput<TInputSchema>['cursor']
        >,
        'queryKey' | 'queryFn'
      > & {
        input: SchemaInputForInfiniteQuery<TInputSchema>
      }
    >,
  ) => Promise<
    InfiniteData<
      SchemaOutput<TOutputSchema, THandlerOutput>,
      SchemaInput<TInputSchema>['cursor']
    >
  >

  getQueryState: (
    input: SchemaInput<TInputSchema>,
  ) => QueryState<SchemaOutput<TOutputSchema, THandlerOutput>> | undefined
  getInfiniteQueryState: (
    input: SchemaInputForInfiniteQuery<TInputSchema>,
  ) => | QueryState<
    InfiniteData<
      SchemaOutput<TOutputSchema, THandlerOutput>,
      SchemaInput<TInputSchema>['cursor']
    >
  >
  | undefined

  setQueryData: (
    input: SchemaInput<TInputSchema>,
    updater: Updater<
      SchemaOutput<TOutputSchema, THandlerOutput> | undefined,
      SchemaOutput<TOutputSchema, THandlerOutput> | undefined
    >,
    options?: SetDataOptions,
  ) => SchemaOutput<TOutputSchema, THandlerOutput> | undefined
  setInfiniteQueryData: (
    input: SchemaInputForInfiniteQuery<TInputSchema>,
    updater: Updater<
      | InfiniteData<
        SchemaOutput<TOutputSchema, THandlerOutput>,
        SchemaInput<TInputSchema>['cursor']
      >
      | undefined,
      | InfiniteData<
        SchemaOutput<TOutputSchema, THandlerOutput>,
        SchemaInput<TInputSchema>['cursor']
      >
      | undefined
    >,
    options?: SetDataOptions,
  ) => | InfiniteData<
    SchemaOutput<TOutputSchema, THandlerOutput>,
    SchemaInput<TInputSchema>['cursor']
  >
  | undefined
}

export interface CreateProcedureUtilsOptions<
  TInputSchema extends Schema = undefined,
  TOutputSchema extends Schema = undefined,
  THandlerOutput extends
  SchemaOutput<TOutputSchema> = SchemaOutput<TOutputSchema>,
> {
  client: ProcedureClient<TInputSchema, TOutputSchema, THandlerOutput>
  queryClient: QueryClient

  /**
   * The path of procedure on sever
   */
  path: string[]
}

export function createProcedureUtils<
  TInputSchema extends Schema,
  TOutputSchema extends Schema,
  THandlerOutput extends SchemaOutput<TOutputSchema>,
>(
  options: CreateProcedureUtilsOptions<
    TInputSchema,
    TOutputSchema,
    THandlerOutput
  >,
): ProcedureUtils<TInputSchema, TOutputSchema, THandlerOutput> {
  return {
    fetchQuery(input, options_) {
      return options.queryClient.fetchQuery({
        queryKey: getQueryKeyFromPath(options.path, { input, type: 'query' }),
        queryFn: () => options.client(input),
        ...options_,
      })
    },
    fetchInfiniteQuery(options_) {
      const { input, ...rest } = options_
      return options.queryClient.fetchInfiniteQuery({
        queryKey: getQueryKeyFromPath(options.path, {
          input,
          type: 'infinite',
        }),
        queryFn: ({ pageParam }) => {
          return options.client({ ...(input as any), pageParam } as any)
        },
        ...(rest as any),
      })
    },

    prefetchQuery(input, options_) {
      return options.queryClient.prefetchQuery({
        queryKey: getQueryKeyFromPath(options.path, {
          input,
          type: 'query',
        }),
        queryFn: () => options.client(input),
        ...options_,
      })
    },
    prefetchInfiniteQuery(options_) {
      const { input, ...rest } = options_
      return options.queryClient.prefetchInfiniteQuery({
        queryKey: getQueryKeyFromPath(options.path, {
          input,
          type: 'infinite',
        }),
        queryFn: ({ pageParam }) => {
          return options.client({ ...(input as any), cursor: pageParam } as any)
        },
        ...(rest as any),
      })
    },

    getQueryData(input) {
      return options.queryClient.getQueryData(
        getQueryKeyFromPath(options.path, {
          input,
          type: 'query',
        }),
      )
    },
    getInfiniteQueryData(input) {
      return options.queryClient.getQueryData(
        getQueryKeyFromPath(options.path, {
          input,
          type: 'infinite',
        }),
      )
    },

    ensureQueryData(input, options_) {
      return options.queryClient.ensureQueryData({
        queryKey: getQueryKeyFromPath(options.path, {
          input,
          type: 'query',
        }),
        queryFn: () => options.client(input),
        ...options_,
      })
    },
    ensureInfiniteQueryData(options_) {
      const { input, ...rest } = options_
      return options.queryClient.ensureInfiniteQueryData({
        queryKey: getQueryKeyFromPath(options.path, {
          input,
          type: 'infinite',
        }),
        queryFn: ({ pageParam }) => {
          return options.client({ ...(input as any), pageParam } as any)
        },
        ...(rest as any),
      })
    },

    getQueryState(input) {
      return options.queryClient.getQueryState(
        getQueryKeyFromPath(options.path, {
          input,
          type: 'query',
        }),
      )
    },
    getInfiniteQueryState(input) {
      return options.queryClient.getQueryState(
        getQueryKeyFromPath(options.path, {
          input,
          type: 'infinite',
        }),
      )
    },

    setQueryData(input, updater, options_) {
      return options.queryClient.setQueryData(
        getQueryKeyFromPath(options.path, {
          input,
          type: 'query',
        }),
        updater,
        options_,
      )
    },
    setInfiniteQueryData(input, updater, options_) {
      return options.queryClient.setQueryData(
        getQueryKeyFromPath(options.path, {
          input,
          type: 'infinite',
        }),
        updater,
        options_,
      )
    },
  }
}
