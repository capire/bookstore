const cds = require('@sap/cds')

if (!cds.env.production) cds.once('bootstrap', app => {
  app.serve('/bookshop').from('@capire/bookshop', 'app/vue')
  app.serve('/reviews').from('@capire/reviews', 'app/vue')
  app.serve('/orders').from('@capire/orders', 'app/orders')
})
