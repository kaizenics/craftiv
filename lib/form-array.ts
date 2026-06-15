/**
 * Handlers for an id-keyed array edited through a value/onChange pair, shared by
 * the resume form sections (experience, education, ...). Each form keeps its own
 * `add` because the default item and insert position differ; update/remove/move
 * are identical everywhere and live here.
 */
export function createArrayHandlers<T extends { id: string }>(
  data: T[],
  onChange: (next: T[]) => void,
) {
  return {
    update<K extends keyof T>(id: string, field: K, value: T[K]) {
      onChange(data.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    },
    remove(id: string) {
      onChange(data.filter((row) => row.id !== id));
    },
    move(index: number, direction: "up" | "down") {
      const next = [...data];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= data.length) return;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      onChange(next);
    },
  };
}
