type ParamValue = string | string[] | undefined;

export function routeParam(value: ParamValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export function routeParams<T extends Record<string, ParamValue>>(params: T): { [K in keyof T]: string } {
  const result = {} as { [K in keyof T]: string };
  (Object.keys(params) as (keyof T)[]).forEach((key) => {
    result[key] = routeParam(params[key]);
  });
  return result;
}
