/* ----------------------------- Example generic ---------------------------- */
export class SomeClass {
    col;
    cast(query) {
        const q = query; // assignable
        void q;
    }
    async find(query) {
        return (await this.col.findOne(query)) ?? undefined;
    }
}
