module.exports = async function registerOrdersEvents({ OrdersService }) {
  const emitOrderChanged = async order => {
    const items = order.Items ?? []
    await Promise.all(items.map(item => {
      const product = item.product_ID ?? item.product?.ID
      return OrdersService.orderChanged(product, item.quantity)
    }))
  }

  OrdersService.after('CREATE', 'OrdersNoDraft', emitOrderChanged)
}
