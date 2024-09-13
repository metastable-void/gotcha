"use strict";
function abs(a) {
    return a < 0n ? -a : a;
}
function gcd(a, b) {
    while (b != 0n) {
        [a, b] = [b, a % b];
    }
    return abs(a);
}
class Rational {
    #n;
    #d;
    constructor(n, d = 1n) {
        if (d <= 0n) {
            throw new TypeError('Invalid denominator');
        }
        this.#n = n;
        this.#d = d;
        this.#canonicalize();
    }
    #canonicalize() {
        const a = gcd(this.#n, this.#d);
        if (a >= 1n) {
            this.#n = this.#n / a;
            this.#d = this.#d / a;
        }
    }
    toString() {
        this.#canonicalize();
        if (this.#d == 1n) {
            return String(this.#n);
        }
        return `${this.#n}/${this.#d}`;
    }
    static ZERO = new Rational(0n);
    static ONE = new Rational(1n);
    static eq(a, b) {
        a.#canonicalize();
        b.#canonicalize();
        return a.#n == b.#n && a.#d == b.#d;
    }
    static opposite(a) {
        return new Rational(-a.#n, a.#d);
    }
    static reciprocal(a) {
        if (a.#n == 0n) {
            throw new TypeError('Division by zero');
        }
        return new Rational(a.#d, a.#n);
    }
    static add(a, b) {
        return new Rational(a.#n * b.#d + b.#n * a.#d, a.#d * b.#d);
    }
    static sub(a, b) {
        return this.add(a, this.opposite(b));
    }
    static mul(a, b) {
        return new Rational(a.#n * b.#n, a.#d * b.#d);
    }
    static div(a, b) {
        return this.mul(a, this.reciprocal(b));
    }
}
//# sourceMappingURL=Rational.js.map