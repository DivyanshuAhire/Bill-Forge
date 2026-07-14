export const formatDDMMYYYY = (input: any): string => {
  const d = new Date(input ?? Date.now());
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export default formatDDMMYYYY;
