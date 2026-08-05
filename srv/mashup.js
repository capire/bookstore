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
  const { Reviews } = cds.entities ('sap.capire.reviews')

  CatalogService.prepend (() => CatalogService.on ('READ', '_Reviews', async (req) => {
    req.error(451, 'Cross-service data access not allowed')
  }))

  CatalogService.prepend (() => CatalogService.on ('READ', 'Books', async (req, next) => {
    if(!req.params[0]?.ID) return next()
    const [{ID}] = req.params,
      { columns, limit } = req.query.SELECT

    const isWildcard = !columns || columns[0] === '*' || columns[0]?.ref?.[0] === '*'
    let _columns = isWildcard ? Object.keys(Books.elements).filter(x=>x!='reviews') : columns.filter(x=>x.ref!='reviews')
    const books = await SELECT.from(Books,ID).columns(_columns).limit(limit)
    if (!books) return books

    const wantReviews = isWildcard || columns.some(x=>x.ref=='reviews')
    if(wantReviews) {
      let reviewColumns = columns?.filter(X => Reviews.elements[X.ref?.[0]])
      if(!reviewColumns?.length) reviewColumns = ['*']
      books.reviews = await ReviewsService.read('Reviews')
        .where({ subject: `${ID}` })
        .columns(reviewColumns)
    }
    return books
  }))

  CatalogService.prepend (() => CatalogService.on ('READ', 'Books/reviews', async (req, next) => {
    if(!req.params[0]?.ID) return next()
    const [{ID}] = req.params,
      { columns, limit } = req.query.SELECT

    return ReviewsService.read('Reviews')
      .where({ subject: `${ID}` })
      .columns(columns)
      .limit(limit)

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
