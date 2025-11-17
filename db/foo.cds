using { extensible } from './xt';

/** 
 * For own entities, e.g., Foo, the extensible aspect can be applied like this:
 */
entity Foo : extensible {
  key ID : UUID;
  bar : String;
}
