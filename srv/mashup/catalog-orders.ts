const cds = require('@sap/cds')

import type { BookEntity, BookId, CdsDatabase, CdsRequest, CdsService, OrderRequestData } from './types'

type CatalogOrdersContext = {
  CatalogService: CdsService
  OrdersService: CdsService
  db: CdsDatabase
  Books: BookEntity
}

module.exports = async function registerCatalogOrders({ CatalogService, OrdersService, db, Books }: CatalogOrdersContext) {
  const orderData = (req: CdsRequest): OrderRequestData => ({
    book: bookIdFrom(bookIdFromParams(req) ?? req.data.book),
    quantity: Number(req.data.quantity ?? 1)
  })

  const ensureAvailableStock = async (req: CdsRequest) => {
    const { book, quantity } = orderData(req)
    if (!book) return req.reject(400, 'Missing book')
    if (!Number.isInteger(quantity) || quantity < 1) return req.reject(400, 'quantity has to be 1 or more')

    const bookInStock = await (SELECT as any).one.from(Books, (b: { stock: number }) => b.stock).where({ ID: book })
    if (!bookInStock) return req.reject(404, `Book #${book} does not exist`)
    if (bookInStock.stock < quantity) return req.reject(409, `${quantity} exceeds stock for book #${book}`)

    req.data.quantity = quantity
  }

  const createOrder = async (req: CdsRequest, book: BookId | undefined, quantity = 1) => {
    const { buyer = req.user.id } = req.data
    if (!book) return req.reject(400, 'Missing book')

    const { title, price, currency } = await db.read(Books, book, b => [
      b.title,
      b.price,
      b.currency(c => c.code)
    ])

    const orders = OrdersService.tx({ user: cds.User.privileged })
    await orders.create('OrdersNoDraft').entries({
      OrderNo: 'Order at ' + new Date().toLocaleString(),
      Items: [{ product: { ID: String(book) }, title, price, quantity }],
      buyer,
      createdBy: buyer,
      currency
    })
  }

  CatalogService.before('order', 'Books', ensureAvailableStock)
  CatalogService.on('order', 'Books', async (req: CdsRequest) => {
    const { book, quantity } = orderData(req)
    return createOrder(req, book, quantity)
  })
}

function bookIdFromParams(req: CdsRequest): unknown {
  const [first] = req.params
  return typeof first === 'object' && first !== null && 'ID' in first ? first.ID : undefined
}

function bookIdFrom(value: unknown): BookId | undefined {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'ID' in value) return bookIdFrom(value.ID)
  return undefined
}
