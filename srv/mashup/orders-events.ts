import type { CdsService } from './types'

type OrdersEventsContext = {
  OrdersService: CdsService
}

type OrderItem = {
  product_ID?: unknown
  product?: { ID?: unknown }
  quantity: unknown
}

type CreatedOrder = {
  Items?: OrderItem[]
}

module.exports = async function registerOrdersEvents({ OrdersService }: OrdersEventsContext) {
  const emitOrderChanged = async (order: CreatedOrder) => {
    const items = order.Items ?? []
    await Promise.all(items.map(item => {
      const product = item.product_ID ?? item.product?.ID
      return OrdersService.orderChanged(product, item.quantity)
    }))
  }

  OrdersService.after('CREATE', 'OrdersNoDraft', emitOrderChanged)
}
