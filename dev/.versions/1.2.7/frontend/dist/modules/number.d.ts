declare global {
    interface NumberConstructor {
        /**
         * Generates a random integer between x and y, inclusive.
         * @param x The lower bound.
         * @param y The upper bound.
         * @returns A random integer between x and y.
         */
        random(x: number, y: number): number;
    }
}
export {};
