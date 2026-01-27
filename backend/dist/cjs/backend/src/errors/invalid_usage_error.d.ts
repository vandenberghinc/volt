/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh.
 */
/**
 * An invalid usage error.
 * This only extends the base Error class.
 * By default this class will be shown as an internal server error when caused inside an endpoint callback.
 *
 * @nav Errors
 * @docs
 */
export declare class InvalidUsageError extends Error {
    /**
     * The reason code for the invalid usage error, e.g. `bad_ttl`
     * or `invalid_filter`.
     *
     * Could be used to detect specific issues with the request,
     */
    reason?: string;
    /** The optional param/attr/field that was invalid. */
    field?: string;
    /** An optional error that caused the invalid usage error. */
    cause?: unknown;
    /** Construct an invalid usage error. */
    constructor(opts: {
        /** The error message. */
        message: string;
        /** The optional param/attr/field that was invalid. */
        field?: string;
        /**
         * The reason code for the invalid usage error, e.g. `bad_ttl`
         * or `invalid_filter`.
         *
         * Could be used to detect specific issues with the request,
         */
        reason?: string;
        /** An optional error that caused the invalid usage error. */
        cause?: unknown;
    });
}
