const cds = require('@sap/cds')
const { GET, expect, defaults } = cds.test ('@capire/bookshop', '--with-mocks')

describe ('browse books', ()=>{

  beforeAll (()=> defaults.path = '/odata/v4/browse')

  it ('should allow fetching lists of books', async () => {
    const { data } = await GET`Books? $select=ID,title`
    expect (data.value) .to.deep.equal ([
      { ID: 201, title: 'Wuthering Heights' },
      { ID: 207, title: 'Jane Eyre' },
      { ID: 251, title: 'The Raven' },
      { ID: 252, title: 'Eleonora' },
      { ID: 271, title: 'Catweazle' },
    ])
  })


  it('serves $metadata documents in v4', async () => {
    const { headers, status, data } = await GET`$metadata`
    expect(status).to.equal(200)
    expect(headers).to.contain({ 'odata-version': '4.0' })
    expect(headers['content-type']).to.match(/application\/xml/)
    expect(data).to.contain('<EntitySet Name="Books" EntityType="CatalogService.Books">')
    expect(data).to.contain('<Annotation Term="Common.Label" String="Currency"/>')
  })

  it('serves Books?$expand=currency', async () => {
    const USD = { code: 'USD', name: 'US Dollar', descr: null, symbol: '$' }
    const { data } = await GET`Books ${{
      params: { $search: 'Po', $select: `title,author,genre`, $expand:`currency` },
    }}`
    expect(data.value).to.containSubset([
      { ID: 251, title: 'The Raven', author: 'Edgar Allan Poe', genre:'Mystery', currency:USD },
      { ID: 252, title: 'Eleonora', author: 'Edgar Allan Poe', genre:'Romance', currency:USD },
    ])
  })

  it('serves Books?$select=currency/code', async () => {
    const { data } = await GET`Books ${{
      params: { $search: 'Po', $select: `title,author,genre,currency/code` },
    }}`
    expect(data.value).to.containSubset([
      { ID: 251, title: 'The Raven', author: 'Edgar Allan Poe', genre:'Mystery', currency_code:'USD' },
      { ID: 252, title: 'Eleonora', author: 'Edgar Allan Poe', genre:'Romance', currency_code:'USD' },
    ])
  })

  it('supports $search in multiple fields', async () => {
    const { data } = await GET`Books ${{
      params: { $search: 'Po', $select: `title,author` },
    }}`
    expect(data.value).to.containSubset([
      { ID: 201, title: 'Wuthering Heights', author: 'Emily Brontë' },
      { ID: 207, title: 'Jane Eyre', author: 'Charlotte Brontë' },
      { ID: 251, title: 'The Raven', author: 'Edgar Allan Poe' },
      { ID: 252, title: 'Eleonora', author: 'Edgar Allan Poe' },
    ])
  })

  it('supports $select', async () => {
    const { data } = await GET(`Books`, {
      params: { $select: `ID,title` },
    })
    expect(data.value).to.containSubset([
      { ID: 201, title: 'Wuthering Heights' },
      { ID: 207, title: 'Jane Eyre' },
      { ID: 251, title: 'The Raven' },
      { ID: 252, title: 'Eleonora' },
      { ID: 271, title: 'Catweazle' },
    ])
  })

  it('supports $value requests', async () => {
    const { data } = await GET`Books/201/stock/$value`
    expect(data).to.equal(12)
  })

  it('supports $top/$skip paging', async () => {
    const { data: p1 } = await GET`Books?$select=title&$top=3`
    expect(p1.value).to.containSubset([
      { ID: 201, title: 'Wuthering Heights' },
      { ID: 207, title: 'Jane Eyre' },
      { ID: 251, title: 'The Raven' },
    ])
    const { data: p2 } = await GET`Books?$select=title&$skip=3`
    expect(p2.value).to.containSubset([
      { ID: 252, title: 'Eleonora' },
      { ID: 271, title: 'Catweazle' },
    ])
  })

})

describe ('AdminService', () => {

  beforeAll (()=> {
    defaults.auth = { username: 'alice' }
    defaults.path = '/admin'
  })

  it('supports $expand', async () => {
    const { data } = await GET(`Authors`, {
      params: {
        $select: `name`,
        $expand: `books($select=title)`,
      },
    })
    expect(data.value).to.containSubset([
      { name: 'Emily Brontë', books: [{ title: 'Wuthering Heights' }] },
      { name: 'Charlotte Brontë', books: [{ title: 'Jane Eyre' }] },
      { name: 'Edgar Allan Poe', books: [{ title: 'The Raven' }, { title: 'Eleonora' }] },
      { name: 'Richard Carpenter', books: [{ title: 'Catweazle' }] },
    ])
  })

})
