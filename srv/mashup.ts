const cds = require('@sap/cds')
require('./mashup/local-routes')


// Mashing up bookshop services with required services...
cds.once('served', async () => {

  const CatalogService = await cds.connect.to('CatalogService')
  const ReviewsService = await cds.connect.to('ReviewsService')
  const OrdersService = await cds.connect.to('OrdersService')
  const db = await cds.connect.to('db')

  // reflect entity definitions used below...
  const { Books } = cds.entities('sap.capire.bookshop')

  await require('./mashup/catalog-reviews')({ CatalogService, ReviewsService, Books })
  await require('./mashup/catalog-orders')({ CatalogService, OrdersService, db, Books })
  await require('./mashup/orders-events')({ OrdersService })
  await require('./mashup/orders-stock')({ OrdersService, Books })
})
