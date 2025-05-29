/**
 * @author Daan van den Bergh
 * @copyright © 2022 - 2025 Daan van den Bergh. All rights reserved.
 *
 * @note FRONTEND - This file should also be accessable from the frontend.
 */
/** @docs
 *  @title Scheme
 *  @desc The scheme validation module
 */
export declare namespace Scheme {
    type SchemeType = string | Function | (string | Function)[];
    /** User facing root scheme object */
    type Scheme = {
        [field_name: string]: Scheme.SchemeOptions;
    };
    /** Scheme options. */
    interface SchemeOptions {
        type?: SchemeType;
        default?: any | ((obj: any) => any);
        def?: any | ((obj: any) => any);
        required?: boolean | ((attrs: any) => boolean);
        allow_empty?: boolean;
        min_length?: number;
        max_length?: number;
        alias?: string;
        verify?: (attr: any, attrs: any, key?: string | number) => string | void | null | undefined;
        callback?: (attr: any, attrs: any, key?: string | number) => string | void | null | undefined;
        postprocess?: (attr: any, parent_obj: any, key: string | number) => any;
        preprocess?: (attr: any, parent_obj: any, key: string | number) => any;
        scheme?: Record<string, SchemeOptions | string>;
        value_scheme?: SchemeOptions | string;
        enum?: any[];
        attrs?: Record<string, SchemeOptions | string>;
        attributes?: Record<string, SchemeOptions | string>;
        enumerate?: any[];
    }
    /** @docs
     *  @title value_type
     *  @desc Get a value type for error reporting
     */
    function value_type(value: any): string;
    function init_scheme_item(scheme_item: Scheme.SchemeOptions | string, scheme?: Record<string, string | Scheme.SchemeOptions>, scheme_key?: string): Scheme.SchemeOptions;
    /** @docs
     *  @title type_error_str
     *  @desc Generate a type error string
     */
    function type_error_str(scheme_item: Scheme.SchemeOptions, prefix?: string): string;
    /** Argument options for verify() */
    interface VerifyOptions<T extends object> {
        object: T;
        scheme?: Record<string, Scheme.SchemeOptions | string>;
        value_scheme?: Scheme.SchemeOptions | string | null;
        check_unknown?: boolean;
        parent?: string;
        error_prefix?: string;
        err_prefix?: string | null;
        throw_err?: boolean;
    }
    /** Verify response */
    interface VerifyResponse<T extends object> {
        error?: string;
        invalid_fields?: Record<string, string>;
        object?: T;
    }
    /** @docs:
     *  @title: Verify scheme
     *  @desc:
     *      Verify an object/array against a scheme
     *
     *      This function can also be used to verify array items. Pass the array in parameter `object` and pass a `AttributeScheme` object in parameter `scheme`.
     *  @param:
     *      @name: object
     *      @desc: The object parameters.
     *      @type: object
     *  @param:
     *      @name: scheme
     *      @desc:
     *          The object or array scheme.
     *      @type: Scheme
     *      @attribute:
     *          @name: [key]
     *          @desc: The matching parameter key from parameter `object`.
     *      @attribute:
     *          @name: property
     *          @desc:
     *              The parameter information. It can either be a string or an object.

     *              When the property is a string, then it will be assigned as to the parameter's type value.
     *          @type: string, AttributeScheme
     *          @attributes_type: AttributeScheme
     *          @attribute:
     *              @name: type
     *              @desc: The type(s) of the parameter.
     *              @type: string, array[string]
     *          @attribute:
     *              @name: def
     *              @type: any, function
     *              @desc:
     *                  The default value of the parameter.
     *                  A function may also be passed to this attribute to compute the default value. The function takes a single argument `object`, the parent object of the attribute that will be set. The returned value will be assigned to the missing attribute.
     *          @attribute:
     *              @name: required
     *              @desc:
     *                  A flag to indicate if the parameter is required. However, when attribute `def` is defined, the attribute is never required.
     *                  The type may also be an callback function which should return a boolean indicating the required flag. The callback takes arguments `(attrs)`, which is the parent attributes object of the attribute being checked.
     *              @type: boolean, function
     *              @def: true
     *          @attribute:
     *              @name: allow_empty
     *              @desc: By default empty strings are not allowed when one of the types is `string`, the allow empty flag can be set to `true` to disable this behaviour.
     *              @type: boolean
     *              @def: false
     *          @attribute:
     *              @name: min_length
     *              @desc: The minimum value length of arrays or strings.
     *              @type: number
     *              @required: false
     *          @attribute:
     *              @name: max_length
     *              @desc: The maximum value length of arrays or strings.
     *              @type: number
     *              @required: false
     *          @attribute:
     *              @name: alias
     *              @desc: When two attributes share the same value scheme you can refer to the value scheme of another attribute by assigning the alias attribute with the according attribute name.
     *              @type: string
     *              @required: false
     *          @attribute:
     *              @name: verify
     *              @desc:
     *                  A callback to check the parameter.
     *                  The callback takes arguments `(attr, attrs)` with the assigned attribute value and the parent attribute object.
     *                  However, when the `object` is an array the callback takes arguments `(attr, attrs, index)`.
     *                  The callback will only be executed when the parameter is defined, so not when it is undefined but set by attribute `def`.
     *                  An error can be caused by returning a string as an error description. This ensures errors are thrown in the same way.
     *              @type: function
     *          @attribute:
     *              @deprecated: true
     *              @name: callback
     *              @desc:
     *                  A callback to check the parameter.
     *                  The callback takes arguments `(attr, parent_obj, key)` with the assigned attribute value and the parent attribute object.
     *                  However, when the `object` is an array the callback takes arguments `(attr, parent_arr, index)`.
     *                  The callback will only be executed when the parameter is defined, so not when it is undefined but set by attribtue `def`.
     *                  An error can be caused by returning a string as an error description. This ensures errors are thrown in the same way.
     *              @type: function
     *          @attribute:
     *              @name: postprocess
     *              @desc:
     *                  A callback to post process the attribute's value. The returned value of the callback will be assigned to the attribute, unless the callback returns `undefined`.
     *                  The callback takes arguments `(attr, parent_obj, key)` with the assigned attribute value and the parent attribute object.
     *                  However, when the `object` is an array the callback takes arguments `(attr, parent_arr, index)`.
     *              @type: function
     *          @attribute:
     *              @name: preprocess
     *              @desc:
     *                  A callback to pre process the attribute's value before anyting else. The returned value of the callback will be assigned to the attribute, unless the callback returns `undefined`.
     *                  The callback takes arguments `(attr, parent_obj, key)` with the assigned attribute value and the parent attribute object.
     *                  However, when the `object` is an array the callback takes arguments `(attr, parent_arr, index)`.
     *              @type: function
     *          @attribute:
     *              @name: scheme
     *              @desc: The recursive `scheme` for when the parameter is an object, the `scheme` attribute follows the same rules as the main function's `scheme` parameter. However, when the object is an array, the scheme should be for an array item.
     *              @type: object
     *          @attribute:
     *              @name: value_scheme
     *              @desc: The universal `scheme` for object values, only used in arrays and raw objects.
     *              @type: object
     *          @attribute:
     *              @name: enum
     *              @desc: Validate that an object/array value is one of the enumerate items.
     *              @type: string[]
     *  @param:
     *      @name: check_unknown
     *      @desc: Throw an error when unknown attributes were passed.
     *      @type: boolean
     *  @param:
     *      @name: parent
     *      @desc: The error parent prefix.
     *      @type: string
     *  @param:
     *      @name: error_prefix
     *      @desc: The error prefix.
     *      @type: string
     *  @param:
     *      @name: throw_err
     *      @desc: Throw an error or return a response object.
     *      @type: boolean
     */
    function verify<T extends object>(opts: Omit<Scheme.VerifyOptions<T>, "throw_err"> & {
        throw_err: false;
    }): VerifyResponse<T>;
    function verify<T extends object>(opts: Omit<Scheme.VerifyOptions<T>, "throw_err"> & {
        throw_err?: true;
    }): T;
    /** @docs
     *  @title throw_undefined
     *  @desc Throw an error for undefined arguments
     */
    function throw_undefined(name: string | {
        name: string;
        type?: Scheme.SchemeType;
        throw_err?: boolean;
    }, type?: Scheme.SchemeType, throw_err?: boolean): string;
    /** @docs
     *  @title throw_invalid_type
     *  @desc Throw an error for invalid type arguments
     */
    function throw_invalid_type(name: string | {
        name: string;
        value: any;
        type?: Scheme.SchemeType;
        throw_err?: boolean;
    }, value?: any, type?: Scheme.SchemeType, throw_err?: boolean): string;
}
export { Scheme as scheme };
declare global {
    interface Error {
        json?: {
            error: string;
            invalid_fields: Record<string, string>;
            object: undefined;
        };
    }
}
export default Scheme;
