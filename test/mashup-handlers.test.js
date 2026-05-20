require('tsx/cjs')
const cds = require('@sap/cds')
const { expect } = cds.test

describe('bookstore mashup handlers', () => {
  const originalSelect = Object.getOwnPropertyDescriptor(global, 'SELECT')
  const originalUpdate = Object.getOwnPropertyDescriptor(global, 'UPDATE')

  afterEach(() => {
    if (originalSelect) Object.defineProperty(global, 'SELECT', originalSelect)
    else delete global.SELECT

    if (originalUpdate) Object.defineProperty(global, 'UPDATE', originalUpdate)
    else delete global.UPDATE
  })

  it('validates stock and creates an order from the bound CatalogService action', async () => {
    const hooks = { before: {}, on: {} }
    const CatalogService = serviceMock(hooks)
    const Books = { name: 'Books' }
    const created = {}

    Object.defineProperty(global, 'SELECT', {
      configurable: true,
      value: {
        one: {
          from: (entity, projection) => ({
            where: criteria => {
              expect(entity).to.equal(Books)
              expect(projection({ stock: 'stock' })).to.equal('stock')
              expect(criteria).to.deep.equal({ ID: 201 })
              return { stock: 3 }
            }
          })
        }
      }
    })

    const db = {
      read: async (entity, book, projection) => {
        expect(entity).to.equal(Books)
        expect(book).to.equal(201)
        expect(projection(projectionBook()).map(column => column.ref)).to.deep.equal([
          ['title'],
          ['price'],
          ['currency']
        ])
        return { title: 'Wuthering Heights', price: 11.11, currency: { code: 'GBP' } }
      }
    }

    const OrdersService = {
      tx: context => {
        expect(context.user).to.equal(cds.User.privileged)
        return {
          create: entity => ({
            entries: entry => {
              created.entity = entity
              created.entry = entry
            }
          })
        }
      }
    }

    await require('../srv/mashup/catalog-orders.ts')({ CatalogService, OrdersService, db, Books })

    const req = requestMock({
      params: [{ ID: 201 }],
      data: { quantity: '2' },
      user: { id: 'alice' }
    })

    await hooks.before['order:Books'](req)
    await hooks.on['order:Books'](req)

    expect(req.data.quantity).to.equal(2)
    expect(created.entity).to.equal('OrdersNoDraft')
    expect(created.entry).to.deep.include({
      buyer: 'alice',
      createdBy: 'alice',
      currency: { code: 'GBP' }
    })
    expect(created.entry.Items).to.deep.equal([
      { product: { ID: '201' }, title: 'Wuthering Heights', price: 11.11, quantity: 2 }
    ])
  })

  it('rejects the bound order action if requested quantity exceeds stock', async () => {
    const hooks = { before: {}, on: {} }
    const CatalogService = serviceMock(hooks)

    Object.defineProperty(global, 'SELECT', {
      configurable: true,
      value: {
        one: {
          from: () => ({
            where: () => ({ stock: 1 })
          })
        }
      }
    })

    await require('../srv/mashup/catalog-orders.ts')({
      CatalogService,
      OrdersService: {},
      db: {},
      Books: { name: 'Books' }
    })

    const req = requestMock({
      params: [{ ID: 201 }],
      data: { quantity: 2 },
      user: { id: 'alice' }
    })

    await expect(hooks.before['order:Books'](req)).to.be.rejectedWith(/2 exceeds stock for book #201/)
  })

  it('delegates book reviews reads and applies average rating events', async () => {
    const hooks = { on: {} }
    const CatalogService = {
      prepend: callback => callback(serviceMock(hooks))
    }
    const reviewRead = { limit: () => reviewRead, where: criteria => ({ criteria }) }
    const ReviewsService = {
      read: (entity, columns) => {
        expect(entity).to.equal('Reviews')
        expect(columns).to.deep.equal(['rating'])
        return reviewRead
      },
      on: (event, handler) => {
        hooks.on[event] = handler
      }
    }

    const updates = []
    Object.defineProperty(global, 'UPDATE', {
      configurable: true,
      value: (entity, key) => ({
        with: values => {
          updates.push({ entity, key, values })
          return values
        }
      })
    })

    const Books = { name: 'Books' }
    await require('../srv/mashup/catalog-reviews.ts')({ CatalogService, ReviewsService, Books })

    const delegated = hooks.on['READ:Books/reviews']({
      params: [201],
      query: { SELECT: { columns: ['rating'], limit: { rows: { val: 5 } } } }
    })
    expect(delegated.criteria).to.deep.equal({ subject: '201' })

    hooks.on['AverageRatings.Changed']({
      event: 'AverageRatings.Changed',
      data: { subject: '201', reviews: 2, rating: 4.5 }
    })
    expect(updates).to.deep.equal([
      { entity: Books, key: '201', values: { reviews: 2, rating: 4.5 } }
    ])
  })

  it('emits OrderChanged events for created order items', async () => {
    const hooks = { after: {} }
    const emitted = []
    const OrdersService = {
      after: (event, entity, handler) => {
        hooks.after[`${event}:${entity}`] = handler
      },
      orderChanged: async (product, quantity) => {
        emitted.push({ product, quantity })
      }
    }

    await require('../srv/mashup/orders-events.ts')({ OrdersService })

    await hooks.after['CREATE:OrdersNoDraft']({
      Items: [
        { product_ID: 201, quantity: 2 },
        { product: { ID: 251 }, quantity: 1 }
      ]
    })

    expect(emitted).to.deep.equal([
      { product: 201, quantity: 2 },
      { product: 251, quantity: 1 }
    ])
  })

  it('reduces stock when an OrderChanged event is received', async () => {
    const hooks = { on: {} }
    const Books = { name: 'Books' }
    const update = {
      whereArgs: null,
      andArgs: null,
      setArg: null,
      where: function (...args) {
        this.whereArgs = args
        return this
      },
      and: function (...args) {
        this.andArgs = args
        return this
      },
      set: function (...args) {
        this.setArgs = args
        return this
      }
    }

    Object.defineProperty(global, 'UPDATE', {
      configurable: true,
      value: entity => {
        expect(entity).to.equal(Books)
        return update
      }
    })

    const OrdersService = serviceMock(hooks)
    await require('../srv/mashup/orders-stock.ts')({ OrdersService, Books })

    const result = hooks.on.OrderChanged({
      event: 'OrderChanged',
      data: { product: 201, deltaQuantity: 2 }
    })

    expect(result).to.equal(update)
    expect(update.whereArgs).to.deep.equal(['ID =', 201])
    expect(update.andArgs).to.deep.equal(['stock >=', 2])
    expect(update.setArgs).to.deep.equal(['stock -=', 2])
  })
})

function serviceMock(hooks) {
  return {
    before: (event, entity, handler) => {
      hooks.before[`${event}:${entity}`] = handler
    },
    on: (event, entity, handler) => {
      if (handler) hooks.on[`${event}:${entity}`] = handler
      else hooks.on[event] = entity
    },
    after: (event, entity, handler) => {
      hooks.after[`${event}:${entity}`] = handler
    }
  }
}

function requestMock({ params, data, user }) {
  return {
    params,
    data,
    user,
    reject: (code, message) => {
      const error = new Error(message)
      error.code = code
      throw error
    }
  }
}

function projectionBook() {
  return {
    title: { ref: ['title'] },
    price: { ref: ['price'] },
    currency: callback => ({ ref: ['currency'], expand: callback({ code: { ref: ['code'] } }) })
  }
}
