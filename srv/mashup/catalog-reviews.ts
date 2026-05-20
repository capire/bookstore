import type { BookEntity, CdsMessage, CdsRequest, CdsService } from './types'

type CatalogReviewsContext = {
  CatalogService: CdsService
  ReviewsService: CdsService
  Books: BookEntity
}

type AverageRatingsChanged = {
  subject: string
  reviews: number
  rating: number
}

module.exports = async function registerCatalogReviews({ CatalogService, ReviewsService, Books }: CatalogReviewsContext) {
  CatalogService.prepend(srv => srv.on('READ', 'Books/reviews', (req: CdsRequest) => {
    console.debug('> delegating request to ReviewsService') // eslint-disable-line no-console
    const [id] = req.params
    const { columns, limit } = req.query.SELECT
    return ReviewsService.read('Reviews', columns).limit(limit).where({ subject: String(id) })
  }))

  ReviewsService.on('AverageRatings.Changed', (msg: CdsMessage<AverageRatingsChanged>) => {
    console.debug('> received:', msg.event, msg.data) // eslint-disable-line no-console
    const { subject, reviews, rating } = msg.data
    return UPDATE(Books, subject).with({ reviews, rating })
  })
}
