const cds = require ('@sap/cds')


// Add routes to UIs from imported packages
if (!cds.env.production) cds.once ('bootstrap', (app) => {
  app.serve ('/bookshop') .from ('@capire/bookshop','app/vue')
  app.serve ('/reviews') .from ('@capire/reviews','app/vue')
  app.serve ('/orders') .from('@capire/orders','app/orders')
})


// Mashing up bookshop services with required services...
cds.once ('served', async ()=>{

  const CatalogService = await cds.connect.to ('CatalogService')
  const ReviewsService = await cds.connect.to ('ReviewsService')
  const OrdersService = await cds.connect.to ('OrdersService')
  const db = await cds.connect.to ('db')

  // reflect entity definitions used below...
  const { Books } = cds.entities ('sap.capire.bookshop')

  //
  // Delegate requests to read reviews to the ReviewsService
  // Note: prepend is neccessary to intercept generic default handler
  //
  CatalogService.prepend (srv => srv.on ('READ', 'Books', async (req,next) => {
    console.debug ('> delegating request to ReviewsService') // eslint-disable-line no-console
    let result = await next()
    const asArray = Array.isArray(result) ? result : [result]
    if (!asArray.length) return result
    let bookIDs = asArray.map(x => `'${x.ID}'`) 
    let query = `/Reviews?$apply=filter(subject in (${bookIDs}))/groupby((subject),aggregate($count as reviews))`
    let reviewCounts = await ReviewsService.get(query)
    let mapped = {}
    reviewCounts.forEach(x => mapped[x.subject]=x.reviews)
    asArray.forEach(x=>x.reviews = mapped[String(x.ID)] ?? null)
    return result
  }))

  //
  // Create an order with the OrdersService when CatalogService signals a new order
  //
  CatalogService.before ('submitOrder', async (req) => {
    const { book, quantity, buyer = req.user.id } = req.data
    const { title, price, currency } = await db.read (Books, book, b => { b.title, b.price, b.currency(c => c.code) })
    await OrdersService.create ('Orders').entries({
      OrderNo: 'Order at '+ (new Date).toLocaleString(),
      Items: [{ product:{ID:`${book}`}, title, price, quantity }],
      buyer, createdBy: buyer, currency
    })
  })

  //
  // Update Books' average ratings when ReviewsService signals updated reviews
  //
  ReviewsService.on ('AverageRatings.Changed', (msg) => {
    console.debug ('> received:', msg.event, msg.data) // eslint-disable-line no-console
    const { subject, reviews, rating } = msg.data
    return UPDATE (Books, subject) .with ({ reviews, rating })
  })

  //
  // Reduce stock of ordered books for orders are created from Orders admin UI
  //
  OrdersService.on ('OrderChanged', (msg) => {
    console.debug ('> received:', msg.event, msg.data) // eslint-disable-line no-console
    const { product, deltaQuantity } = msg.data
    return UPDATE (Books) .where ('ID =', product)
    .and ('stock >=', deltaQuantity)
    .set ('stock -=', deltaQuantity)
  })
})
