export declare class Matrix {
    #private;
    private constructor();
    static fromFloatValues(columnCount: number, rowCount: number, values: Iterable<number>): Matrix;
    static fromRationalValues(columnCount: number, rowCount: number, numeratorValues: Iterable<number>, denominatorValues?: Iterable<number> | null): Matrix;
    swapRows(i1: number, i2: number): void;
    addRows(toRow: number, fromRow: number, nFactor?: number, dFactor?: number): void;
    multiplyRow(row: number, nFactor?: number, dFactor?: number): void;
    performRowReductionByStep(): Generator<void, number>;
    get(row: number, column: number): number;
    toString(): string;
}
