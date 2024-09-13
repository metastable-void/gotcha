
function abs(a: bigint): bigint {
  return a < 0n ? -a : a;
}

function gcd(a: bigint, b: bigint): bigint {
  while (b != 0n) {
    [a, b] = [b, a % b];
  }
  return abs(a);
}

class Rational {
  #n: bigint;
  #d: bigint;

  public constructor(n: bigint, d: bigint = 1n) {
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

  public toString() {
    this.#canonicalize();
    if (this.#d == 1n) {
      return String(this.#n);
    }
    return `${this.#n}/${this.#d}`;
  }

  static readonly ZERO = new Rational(0n);
  static readonly ONE = new Rational(1n);

  static eq(a: Rational, b: Rational): boolean {
    a.#canonicalize();
    b.#canonicalize();
    return a.#n == b.#n && a.#d == b.#d;
  }

  static opposite(a: Rational): Rational {
    return new Rational(-a.#n, a.#d);
  }

  static reciprocal(a: Rational): Rational {
    if (a.#n == 0n) {
      throw new TypeError('Division by zero');
    }
    return new Rational(a.#d, a.#n);
  }

  static add(a: Rational, b: Rational): Rational {
    return new Rational(a.#n * b.#d + b.#n * a.#d, a.#d * b.#d);
  }

  static sub(a: Rational, b: Rational): Rational {
    return this.add(a, this.opposite(b));
  }

  static mul(a: Rational, b: Rational): Rational {
    return new Rational(a.#n * b.#n, a.#d * b.#d);
  }

  static div(a: Rational, b: Rational): Rational {
    return this.mul(a, this.reciprocal(b));
  }
}
