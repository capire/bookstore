export type CdsRequest = {
  params: Array<unknown>
  data: Record<string, unknown>
  user: { id: string }
  query: {
    SELECT: {
      columns?: unknown
      limit?: unknown
    }
  }
  reject: (code: number, message: string) => never
}

export type CdsMessage<T = Record<string, unknown>> = {
  event: string
  data: T
}

export type CdsService = {
  before: (event: string, entity: string, handler: (...args: any[]) => unknown) => void
  on: {
    (event: string, entity: string, handler: (...args: any[]) => unknown): void
    (event: string, handler: (...args: any[]) => unknown): void
  }
  after: (event: string, entity: string, handler: (...args: any[]) => unknown) => void
  prepend: (callback: (srv: CdsService) => void) => void
  read: (entity: string, columns?: unknown) => {
    limit: (limit?: unknown) => {
      where: (criteria: Record<string, unknown>) => unknown
    }
  }
  tx: (context: unknown) => {
    create: (entity: string) => {
      entries: (entry: unknown) => Promise<unknown>
    }
  }
  orderChanged: (product: unknown, quantity: unknown) => Promise<unknown>
}

export type CdsDatabase = {
  read: (entity: unknown, key: unknown, projection: (book: BookProjection) => unknown[]) => Promise<BookData>
}

export type BookProjection = {
  title: unknown
  price: unknown
  currency: (callback: (currency: { code: unknown }) => unknown) => unknown
}

export type BookData = {
  title: string
  price: number
  currency: { code: string }
}

export type BookEntity = unknown

export type BookId = string | number

export type OrderRequestData = {
  book: BookId | undefined
  quantity: number
}
