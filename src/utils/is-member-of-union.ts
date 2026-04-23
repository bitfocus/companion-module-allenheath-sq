import type { Equal, Expect, IsNever } from 'type-testing'

/** Determine whether `U` is a union with `T` as a member of it. */
export type IsMemberOfUnion<T, U> = IsNever<T> extends true ? false : Equal<Extract<U, T>, T>

type assert_FalseMemberOfTrueOrFalse = Expect<Equal<IsMemberOfUnion<false, true | false>, true>>

type assert_FalseMemberOfBoolean = Expect<Equal<IsMemberOfUnion<false, boolean>, true>>

type assert_TrueMemberOfFalse = Expect<Equal<IsMemberOfUnion<true, false>, false>>
type assert_TrueMemberOfTrue = Expect<Equal<IsMemberOfUnion<true, true>, true>>
type assert_TrueMemberOfBoolean = Expect<Equal<IsMemberOfUnion<true, boolean>, true>>

// While `boolean` decays into `true | false`, `number` doesn't similarly decay.
type assert_ConstNumMemberOfNumber = Expect<Equal<IsMemberOfUnion<3, number>, false>>

type assert_CBParamNarrowMemberOfCBParamWide = Expect<
	Equal<IsMemberOfUnion<(x: false) => boolean, (y: boolean) => boolean>, false>
>

type assert_NeverMemberOfNever = Expect<Equal<IsMemberOfUnion<never, never>, false>>

type assert_NeverMemberOfAny = Expect<Equal<IsMemberOfUnion<never, any>, false>>

type assert_AnyMemberOfAny = Expect<Equal<IsMemberOfUnion<any, any>, true>>

type assert_NeverMemberMemberOfUnion = Expect<Equal<IsMemberOfUnion<never, 'a' | 'b' | 'c'>, false>>

type assert_SingleMemberMemberOfUnion = Expect<Equal<IsMemberOfUnion<'a', 'a' | 'b' | 'c'>, true>>

type assert_MultipleMemberMemberOfUnion = Expect<Equal<IsMemberOfUnion<'a' | 'b', 'a' | 'b' | 'c'>, true>>

type assert_SuperMemberOfUnion = Expect<Equal<IsMemberOfUnion<'a' | 'b' | 'c', 'a' | 'b'>, false>>
