const cds = require('@sap/cds')

module.exports = async function registerCatalogOrders({ CatalogService, OrdersService, db, Books }) {
  const orderData = req => ({
    book: req.params?.[0]?.ID ?? req.data.book,
    quantity: Number(req.data.quantity ?? 1)
  })

  const ensureAvailableStock = async req => {
    const { book, quantity } = orderData(req)
    if (!book) return req.reject(400, 'Missing book')
    if (!Number.isInteger(quantity) || quantity < 1) return req.reject(400, 'quantity has to be 1 or more')

    const bookInStock = await SELECT.one.from(Books, b => b.stock).where({ ID: book })
    if (!bookInStock) return req.reject(404, `Book #${book} does not exist`)
    if (bookInStock.stock < quantity) return req.reject(409, `${quantity} exceeds stock for book #${book}`)

    req.data.quantity = quantity
  }

  const createOrder = async (req, book, quantity = 1) => {
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
      Items: [{ product: { ID: `${book}` }, title, price, quantity }],
      buyer,
      createdBy: buyer,
      currency
    })
  }

  CatalogService.before('order', 'Books', ensureAvailableStock)
  CatalogService.on('order', 'Books', async req => {
    const { book, quantity } = orderData(req)
    return createOrder(req, book, quantity)
  })
}
