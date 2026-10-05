/**
 * Convert snake_case string literal type to camelCase
 * "display_order" → "displayOrder"
 * "image_url"     → "imageUrl"
 * "is_available"  → "isAvailable"
 */
export type SnakeToCamel<S extends string> =
    S extends `${infer Head}_${infer Char}${infer Tail}`
        ? `${Head}${Uppercase<Char>}${SnakeToCamel<Tail>}`
        : S;

/**
 * Recursively convert all keys of T from snake_case to camelCase.
 * Handles nested objects and arrays automatically.
 * Date instances are preserved as-is.
 */
export type ToCamelCase<T> = T extends Date
    ? T
    : T extends Array<infer U>
      ? Array<ToCamelCase<U>>
      : T extends object
        ? {
              [K in keyof T as SnakeToCamel<K & string>]: ToCamelCase<T[K]>;
          }
        : T;
