function logger(prefix: string) {
  return {
    error: (message: string | object | any[] | number) =>
      console.error(`[${prefix}]`, message),
    warn: (message: string | object | any[] | number) =>
      console.warn(`[${prefix}]`, message),
    info: (message: string | object | any[] | number) =>
      console.log(`[${prefix}]`, message),
  };
}

export const log = logger("EsEbCp");
