// Devuelve una copia con el elemento movido una posición arriba (-1) o abajo (1),
// o null si no se puede mover. Se usa para reescribir posiciones 0..n-1.
export function reorder<T extends { id: string }>(items: T[], id: string, direction: -1 | 1) {
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return null;
  const copy = [...items];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}
