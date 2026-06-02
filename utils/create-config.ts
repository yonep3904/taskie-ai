import type { PickOptional } from "@/types/ts";

export type DefaultConfig<T extends object> = PickOptional<T>;

/**
 * Create a complete configuration object by merging the provided config with default values.
 * This function takes a partial configuration object and a set of default values, and returns a new object that contains all required properties.
 * If a property is missing in the provided config, the default value will be used. If a property is present in the provided config, it will override the default value.
 * @template T The type of the configuration object
 * @param config The partial configuration object provided by the user
 * @param defaults The default configuration values to use for any missing properties.
 * @returns A complete configuration object that includes all required properties, with user-provided values taking precedence over defaults
 * @example
 * type Config = { id: string; name?: string };
 * const config: Config = { id: "123" };
 * const defaults: DefaultConfig<Config> = { name: "default name" };
 * const completeConfig = createConfig(config, defaults);
 * // completeConfig is { id: "123", name: "default name" }, and has type Required<Config>
 */
export function createConfig<T extends object>(
  config: T,
  defaults: DefaultConfig<T>,
): Required<T> {
  return { ...defaults, ...config } as Required<T>;
}
