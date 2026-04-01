export function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T & { cancel: () => void } {
  let id: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: Parameters<T>) => {
    if (id !== undefined) clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => {
    if (id !== undefined) clearTimeout(id);
  };
  return debounced as T & { cancel: () => void };
}
