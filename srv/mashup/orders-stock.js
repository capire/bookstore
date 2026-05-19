module.exports = async function registerOrdersStock({ OrdersService, Books }) {
  OrdersService.on('OrderChanged', msg => {
    console.debug('> received:', msg.event, msg.data) // eslint-disable-line no-console
    const { product, deltaQuantity } = msg.data
    return UPDATE(Books)
      .where('ID =', product)
      .and('stock >=', deltaQuantity)
      .set('stock -=', deltaQuantity)
  })
}
