export const validDate = (date: any): boolean => {
  const inValid =
    new Date(date).toString() === 'Invalid Date' || new Date(date).toString().includes('Invalid') || Number.isNaN(new Date(date).valueOf());
  return !inValid;
};

export const formatDate = (date: string) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return `${d.getDate()} - ${d.getMonth() + 1} - ${d.getFullYear()}`;
};


  export const formatDateHistory = (date: Date) => {
  return `${date.getDate()} - ${date.getMonth() + 1} - ${date.getFullYear()} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};