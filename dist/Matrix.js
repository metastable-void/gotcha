var _a;
export class Matrix {
    static #TOKEN = Symbol('TOKEN');
    static #isValidSize(n) {
        return Object.is(n, n >>> 0);
    }
    static #repeat(n, count) {
        // n = Number(n);
        // count = Math.trunc(count);
        if (count < 0) {
            throw new RangeError('Invalid array length');
        }
        return Float64Array.from(function* () {
            for (let i = 0; i < count; i++) {
                yield n;
            }
        }());
    }
    static #gcd(a, b) {
        a |= 0;
        b |= 0;
        while (b != 0) {
            [a, b] = [b, a % b];
        }
        return Math.abs(a);
    }
    #columnCount;
    #rowCount;
    #entryCount;
    #numerators;
    #denominators;
    #exactMode;
    constructor(token, columnCount, rowCount, entryCount, numerators, denominators, exactMode) {
        if (token != _a.#TOKEN) {
            throw new Error('Invalid access');
        }
        this.#columnCount = columnCount;
        this.#rowCount = rowCount;
        this.#entryCount = entryCount;
        this.#numerators = numerators;
        this.#denominators = denominators;
        this.#exactMode = exactMode;
    }
    static fromFloatValues(columnCount, rowCount, values) {
        if (!_a.#isValidSize(columnCount) || !_a.#isValidSize(rowCount)) {
            throw new RangeError('Invalid matrix size');
        }
        const entryCount = columnCount * rowCount;
        const numerators = Float64Array.from(values);
        if (numerators.length != entryCount) {
            throw new RangeError('Mismatched number of entries');
        }
        const denominators = _a.#repeat(1, entryCount);
        return new _a(_a.#TOKEN, columnCount, rowCount, entryCount, numerators, denominators, false);
    }
    static fromRationalValues(columnCount, rowCount, numeratorValues, denominatorValues = null) {
        if (!_a.#isValidSize(columnCount) || !_a.#isValidSize(rowCount)) {
            throw new RangeError('Invalid matrix size');
        }
        const entryCount = columnCount * rowCount;
        const numerators = Float64Array.from(numeratorValues, (n) => (n | 0));
        if (numerators.length != entryCount) {
            throw new RangeError('Mismatched number of entries');
        }
        const denominators = denominatorValues == null ? _a.#repeat(1, entryCount) : Float64Array.from(denominatorValues, (n) => {
            n = n >>> 0;
            if (n <= 0) {
                throw new RangeError('Division by zero');
            }
            return n;
        });
        if (denominators.length != entryCount) {
            throw new RangeError('Mismatched number of entries');
        }
        return new _a(_a.#TOKEN, columnCount, rowCount, entryCount, numerators, denominators, true);
    }
    #checkRowIndexRange(row) {
        if (!_a.#isValidSize(row)) {
            throw new TypeError('Invalid index');
        }
        if (row < this.#rowCount)
            return;
        throw new RangeError('Row index in invalid range');
    }
    #checkColumnIndexRange(column) {
        if (!_a.#isValidSize(column)) {
            throw new TypeError('Invalid index');
        }
        if (column < this.#columnCount)
            return;
        throw new RangeError('Column index in invalid range');
    }
    #num(row, column) {
        return this.#numerators[row * this.#columnCount + column];
    }
    #den(row, column) {
        return this.#denominators[row * this.#columnCount + column];
    }
    swapRows(i1, i2) {
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
    addRows(toRow, fromRow, nFactor = 1, dFactor = 1) {
        this.#checkRowIndexRange(toRow);
        this.#checkRowIndexRange(fromRow);
        const toStart = toRow * this.#columnCount;
        const fromStart = fromRow * this.#columnCount;
        if (this.#exactMode) {
            for (let j = 0; j < this.#columnCount; j++) {
                const n = (this.#num(toRow, j) * this.#den(fromRow, j) + this.#num(fromRow, j) * this.#den(toRow, j)) * nFactor;
                const d = this.#den(toRow, j) * this.#den(fromRow, j) * dFactor;
                const a = _a.#gcd(n, d);
                this.#numerators[toStart + j] = a > 1 ? n / a : n;
                this.#denominators[toStart + j] = a > 1 ? d / a : d;
            }
        }
        else {
            for (let j = 0; j < this.#columnCount; j++) {
                this.#numerators[toStart + j] += this.#numerators[fromStart + j] * nFactor / dFactor;
            }
        }
    }
    multiplyRow(row, nFactor = 1, dFactor = 1) {
        this.#checkRowIndexRange(row);
        const start = row * this.#columnCount;
        if (this.#exactMode) {
            for (let j = 0; j < this.#columnCount; j++) {
                const n = nFactor * this.#num(row, j);
                const d = dFactor * this.#den(row, j);
                const a = _a.#gcd(n, d);
                this.#numerators[start + j] = a > 1 ? n / a : n;
                this.#denominators[start + j] = a > 1 ? d / a : d;
            }
        }
        else {
            for (let j = 0; j < this.#columnCount; j++) {
                this.#numerators[start + j] = this.#numerators[start + j] * nFactor / dFactor;
            }
        }
    }
    *performRowReductionByStep() {
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
                }
                else if (i > row) {
                    this.swapRows(i, row);
                    yield;
                }
                {
                    const n = this.#numerators[row * this.#columnCount + j];
                    const d = this.#denominators[row * this.#columnCount + j];
                    if (n != 0) {
                        this.multiplyRow(row, d, n);
                    }
                }
                for (i = 0; i < this.#rowCount; i++) {
                    if (i == row)
                        continue;
                    const n = this.#numerators[i * this.#columnCount + j];
                    const d = this.#denominators[i * this.#columnCount + j];
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
    get(row, column) {
        this.#checkRowIndexRange(row);
        this.#checkColumnIndexRange(column);
        if (this.#exactMode) {
            return this.#num(row, column) / this.#den(row, column);
        }
        else {
            return this.#num(row, column);
        }
    }
    toString() {
        let result = '';
        for (let i = 0; i < this.#rowCount; i++) {
            result += '[';
            for (let j = 0; j < this.#columnCount; j++) {
                if (j != 0)
                    result += ' ';
                result += this.get(i, j).toFixed(2);
            }
            result += ']\n';
        }
        return result;
    }
}
_a = Matrix;
//# sourceMappingURL=Matrix.js.map