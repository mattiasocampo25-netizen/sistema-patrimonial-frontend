export const aniosDisponibles = () => {
  const actual = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, i) => String(actual - 5 + i));
};
