const cds = require('@sap/cds')
const { expect } = cds.test ('@capire/reviews')
cds.User.default = cds.User.Privileged // hard core monkey patch

describe('cap/samples - Messaging', ()=>{

  it ('should bootstrap sqlite in-memory db', async()=>{
    await cds.delete `sap.capire.reviews.Reviews`
    expect (cds.model) .not.undefined
  })

  let ReviewsService
  it ('should serve ReviewsService', async()=>{
    ReviewsService = await cds.connect.to ('ReviewsService')
    expect (ReviewsService) .to.exist
  })

  let received=[], count=0
  it ('should add messaging event handlers', ()=>{
    ReviewsService.on('AverageRatings.Changed', (msg)=> received.push(msg))
  })

  it ('should add more messaging event handlers', ()=>{
    ReviewsService.on('AverageRatings.Changed', ()=> ++count)
  })

  it ('should add review', async ()=>{
    const review = { subject: '201', rating: 1 }
    const response = await ReviewsService.create ('Reviews', review)
    expect (response) .to.containSubset (review)
  })

  it ('should add more reviews', ()=> Promise.all ([
    ReviewsService.create ('Reviews', { subject: '201', reviewer: `Alice`, rating: 2 }),
    ReviewsService.create ('Reviews', { subject: '201', reviewer: `Bob`,   rating: 3 }),
    ReviewsService.create ('Reviews', { subject: '201', reviewer: `Carol`, rating: 4 }),
    ReviewsService.create ('Reviews', { subject: '201', reviewer: `Dave`,  rating: 5 }),
  ]))

  it ('should have received all messages', async()=> {
    await new Promise((done)=>setImmediate(done))
    expect(count).equals(received.length).equals(5)
    expect(received.map(m=>m.data)).to.deep.equal([
      { subject: '201', reviews: 1, rating: 1.0 },
      { subject: '201', reviews: 2, rating: 1.5 },
      { subject: '201', reviews: 3, rating: 2.0 },
      { subject: '201', reviews: 4, rating: 2.5 },
      { subject: '201', reviews: 5, rating: 3.0 },
    ])
  })
})
