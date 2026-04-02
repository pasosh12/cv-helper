export function debounce<T extends (...args: unknown[]) => unknown>(func: T, timeout = 300) {
  let timer: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    let result: unknown;

    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);

    return result;
  };
}
