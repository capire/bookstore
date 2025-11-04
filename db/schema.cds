using { sap.capire.bookshop.Books } from '@capire/bookshop';
using { extensible } from './extensibility';

/**
 * Make Books extensible with pre-defined extension fields.
 */
extend Books with extensible;

/** 
 * For own entities, e.g., Foo, the extensible aspect can be applied like this:
 */
entity Foo : extensible {
  key ID : UUID;
  bar : String;
}
