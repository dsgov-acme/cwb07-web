/**
 * Stringify model to JSON with sorted keys to maintain consistent string representation no matter the order of keys
 */
export function stringifyModel(model: unknown): string {
  if (!model || !Object.keys(model).length) return '';

  const obj = model as object;
  const allKeys = new Set<string>();
  JSON.stringify(obj, (key, value) => {
    allKeys.add(key);

    return value;
  });

  return JSON.stringify(obj, Array.from(allKeys).sort());
}
