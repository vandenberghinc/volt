// Generate a random number between x and y.
Number.random = function (x, y) {
    if (typeof x !== 'number' || typeof y !== 'number' || x >= y) {
        throw new Error('Invalid input. x and y must be numbers, and x should be less than y.');
    }
    return Math.floor(Math.random() * (y - x + 1)) + x;
};
export {};
