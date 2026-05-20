const cds = require('@sap/cds')

type ExpressApp = {
  serve: (path: string) => {
    from: (moduleName: string, packagePath: string) => void
  }
}

if (!cds.env.production) cds.once('bootstrap', (app: ExpressApp) => {
  app.serve('/bookshop').from('@capire/bookshop', 'app/vue')
  app.serve('/reviews').from('@capire/reviews', 'app/vue')
  app.serve('/orders').from('@capire/orders', 'app/orders')
})
