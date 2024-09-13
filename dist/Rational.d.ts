declare function abs(a: bigint): bigint;
declare function gcd(a: bigint, b: bigint): bigint;
declare class Rational {
    #private;
    constructor(n: bigint, d?: bigint);
    toString(): string;
    static readonly ZERO: Rational;
    static readonly ONE: Rational;
    static eq(a: Rational, b: Rational): boolean;
    static opposite(a: Rational): Rational;
    static reciprocal(a: Rational): Rational;
    static add(a: Rational, b: Rational): Rational;
    static sub(a: Rational, b: Rational): Rational;
    static mul(a: Rational, b: Rational): Rational;
    static div(a: Rational, b: Rational): Rational;
}
