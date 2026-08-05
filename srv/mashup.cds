////////////////////////////////////////////////////////////////////////////
//
//    Enhancing bookshop with Reviews and Orders provided through
//    respective reuse packages and services
//


//
//  Extend Books with access to Reviews and average ratings
//
using { ReviewsService.AverageRatings } from '@capire/reviews';
using { sap.capire.bookshop.Books } from '@capire/bookshop';
using { sap.capire.reviews.Reviews } from '@capire/bookshop';
using { CatalogService } from '@capire/bookshop';

extend service CatalogService with {
  @cds.persistence.skip
  entity _Reviews as projection on Reviews;
}

extend Books with {
  rating  : type of AverageRatings:rating; // average rating
  reviews : Association to many Reviews on reviews.subject = $self.ID;
}

//
//  Extend Orders with Books as Products
//
using { sap.capire.orders.Orders } from '@capire/orders';
extend Orders:Items with {
  book : Association to Books on product.ID = book.ID
}

// Ensure models from all imported packages are loaded
using from '@capire/orders/app/fiori';
using from '@capire/data-viewer';
using from '@capire/common';


// Restrict admin access to AdminService
annotate AdminService with @requires:'admin';
