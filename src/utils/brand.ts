declare const __brand: unique symbol

type Brand<B> = { [__brand]: B }

/**
 * Define a "branded" version of type `T`, that is distinguishable from plain
 * old `T` and from other branded versions that don't share the same brand `B`.
 */
export type Branded<T, B> = T & Brand<B>
