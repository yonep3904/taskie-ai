type OptionalKeys<T extends object> = {
  // biome-ignore lint/complexity/noBannedTypes: 可読性向上・TypeScript の慣習に従うため
  [K in keyof T]: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type PickOptional<T extends object> = Pick<T, OptionalKeys<T>>;
