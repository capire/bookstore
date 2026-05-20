import type { BookEntity, CdsMessage, CdsService } from './types'

type OrdersStockContext = {
  OrdersService: CdsService
  Books: BookEntity
}

type OrderChanged = {
  product: unknown
  deltaQuantity: number
}

module.exports = async function registerOrdersStock({ OrdersService, Books }: OrdersStockContext) {
  OrdersService.on('OrderChanged', (msg: CdsMessage<OrderChanged>) => {
    console.debug('> received:', msg.event, msg.data) // eslint-disable-line no-console
    const { product, deltaQuantity } = msg.data
    return (UPDATE as any)(Books)
      .where('ID =', product)
      .and('stock >=', deltaQuantity)
      .set('stock -=', deltaQuantity)
  })
}
