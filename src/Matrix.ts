
export class Matrix {
  static readonly #TOKEN: unique symbol = Symbol('TOKEN');

  static #isValidSize(n: number): boolean {
    return Object.is(n, n >>> 0);
  }

  static #repeat(n: number, count: number): Float64Array {
    // n = Number(n);
    // count = Math.trunc(count);
    if (count < 0) {
      throw new RangeError('Invalid array length');
    }
    return Float64Array.from(function *() {
      for (let i = 0; i < count; i++) {
        yield n;
      }
    }());
  }

  static #gcd(a: number, b: number): number {
    a |= 0;
    b |= 0;
    while (b != 0) {
      [a, b] = [b, a % b];
    }
    return Math.abs(a);
  }

  readonly #columnCount: number;
  readonly #rowCount: number;
  readonly #entryCount: number;

  readonly #numerators: Float64Array;
  readonly #denominators: Float64Array;

  readonly #exactMode: boolean;

  private constructor(token: symbol, columnCount: number, rowCount: number, entryCount: number, numerators: Float64Array, denominators: Float64Array, exactMode: boolean) {
    if (token != Matrix.#TOKEN) {
      throw new Error('Invalid access');
    }

    this.#columnCount = columnCount;
    this.#rowCount = rowCount;
    this.#entryCount = entryCount;
    this.#numerators = numerators;
    this.#denominators = denominators;
    this.#exactMode = exactMode;
  }

  public static fromFloatValues(columnCount: number, rowCount: number, values: Iterable<number>): Matrix {
    if (!Matrix.#isValidSize(columnCount) || !Matrix.#isValidSize(rowCount)) {
      throw new RangeError('Invalid matrix size');
    }
    const entryCount = columnCount * rowCount;
    const numerators = Float64Array.from(values);
    if (numerators.length != entryCount) {
      throw new RangeError('Mismatched number of entries');
    }
    const denominators = Matrix.#repeat(1, entryCount);
    return new Matrix(Matrix.#TOKEN, columnCount, rowCount, entryCount, numerators, denominators, false);
  }

  public static fromRationalValues(columnCount: number, rowCount: number, numeratorValues: Iterable<number>, denominatorValues: Iterable<number> | null = null): Matrix {
    if (!Matrix.#isValidSize(columnCount) || !Matrix.#isValidSize(rowCount)) {
      throw new RangeError('Invalid matrix size');
    }
    const entryCount = columnCount * rowCount;
    const numerators = Float64Array.from(numeratorValues, (n) => (n | 0));
    if (numerators.length != entryCount) {
      throw new RangeError('Mismatched number of entries');
    }
    const denominators = denominatorValues == null ? Matrix.#repeat(1, entryCount) : Float64Array.from(denominatorValues, (n) => {
      n = n >>> 0;
      if (n <= 0) {
        throw new RangeError('Division by zero');
      }
      return n;
    });
    if (denominators.length != entryCount) {
      throw new RangeError('Mismatched number of entries');
    }
    return new Matrix(Matrix.#TOKEN, columnCount, rowCount, entryCount, numerators, denominators, true);
  }

  #checkRowIndexRange(row: number) {
    if (!Matrix.#isValidSize(row)) {
      throw new TypeError('Invalid index');
    }
    if (row < this.#rowCount) return;
    throw new RangeError('Row index in invalid range');
  }

  #checkColumnIndexRange(column: number) {
    if (!Matrix.#isValidSize(column)) {
      throw new TypeError('Invalid index');
    }
    if (column < this.#columnCount) return;
    throw new RangeError('Column index in invalid range');
  }

  #num(row: number, column: number): number {
    return this.#numerators[row * this.#columnCount + column]!;
  }

  #den(row: number, column: number): number {
    return this.#denominators[row * this.#columnCount + column]!;
  }

  public swapRows(i1: number, i2: number) {
    this.#checkRowIndexRange(i1);
    this.#checkRowIndexRange(i2);
    const start1 = i1 * this.#columnCount;
    const start2 = i2 * this.#columnCount;
    const numeratorRowCopy = this.#numerators.slice(start1, start1 + this.#columnCount);
    this.#numerators.copyWithin(start1, start2, start2 + this.#columnCount);
    this.#numerators.set(numeratorRowCopy, start2);
    if (this.#exactMode) {
      const denominatorRowCopy = this.#denominators.slice(start1, start1 + this.#columnCount);
      this.#denominators.copyWithin(start1, start2, start2 + this.#columnCount);
      this.#denominators.set(denominatorRowCopy, start2);
    }
  }

  public addRows(toRow: number, fromRow: number, nFactor: number = 1, dFactor: number = 1) {
    this.#checkRowIndexRange(toRow);
    this.#checkRowIndexRange(fromRow);
    const toStart = toRow * this.#columnCount;
    const fromStart = fromRow * this.#columnCount;
    if (this.#exactMode) {
      for (let j = 0; j < this.#columnCount; j++) {
        const n = (this.#num(toRow, j) * this.#den(fromRow, j) + this.#num(fromRow, j) * this.#den(toRow, j)) * nFactor;
        const d = this.#den(toRow, j) * this.#den(fromRow, j) * dFactor;
        const a = Matrix.#gcd(n, d);
        this.#numerators[toStart + j] = a > 1 ? n / a : n;
        this.#denominators[toStart + j] = a > 1 ? d / a : d;
      }
    } else {
      for (let j = 0; j < this.#columnCount; j++) {
        this.#numerators[toStart + j]! += this.#numerators[fromStart + j]! * nFactor / dFactor;
      }
    }
  }

  public multiplyRow(row: number, nFactor: number = 1, dFactor: number = 1) {
    this.#checkRowIndexRange(row);
    const start = row * this.#columnCount;
    if (this.#exactMode) {
      for (let j = 0; j < this.#columnCount; j++) {
        const n = nFactor * this.#num(row, j);
        const d = dFactor * this.#den(row, j);
        const a = Matrix.#gcd(n, d);
        this.#numerators[start + j] = a > 1 ? n / a : n;
        this.#denominators[start + j] = a > 1 ? d / a : d;
      }
    } else {
      for (let j = 0; j < this.#columnCount; j++) {
        this.#numerators[start + j]! = this.#numerators[start + j]! * nFactor / dFactor;
      }
    }
  }

  public *performRowReductionByStep(): Generator<void, number> {
    let rank = 0;
    for (let row = 0; row < this.#rowCount; row++) {

      for (let j = row; j < this.#columnCount; j++) {
        let i;
        for (i = row; i < this.#rowCount; i++) {
          if (this.#numerators[i * this.#columnCount + j]) {
            rank++;
            break;
          }
        }

        if (i == this.#rowCount) {
          continue;
        } else if (i > row) {
          this.swapRows(i, row);
          yield;
        }

        {
          const n = this.#numerators[row * this.#columnCount + j]!;
          const d = this.#denominators[row * this.#columnCount + j]!;
          if (n != 0) {
            this.multiplyRow(row, d, n);
          }
        }
        for (i = 0; i < this.#rowCount; i++) {
          if (i == row) continue;
          const n = this.#numerators[i * this.#columnCount + j]!;
          const d = this.#denominators[i * this.#columnCount + j]!;
          if (n != 0) {
            this.addRows(i, row, -n, d);
            yield;
          }
        }

        break;
      }
    }
    return rank;
  }

  public get(row: number, column: number): number {
    this.#checkRowIndexRange(row);
    this.#checkColumnIndexRange(column);
    if (this.#exactMode) {
      return this.#num(row, column) / this.#den(row, column);
    } else {
      return this.#num(row, column);
    }
  }

  public toString(): string {
    let result = '';
    for (let i = 0; i < this.#rowCount; i++) {
      result += '[';
      for (let j = 0; j < this.#columnCount; j++) {
        if (j != 0) result += ' ';
        result += this.get(i, j).toFixed(2);
      }
      result += ']\n';
    }
    return result;
  }
}
