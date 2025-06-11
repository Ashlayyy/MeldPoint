import axios from '@/utils/axios';

export async function UpdateArchiveBatch(id: string[], archived: boolean) {
  const data = { ids: id, archived: archived }; 
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/batch/archive`, data);
  return { status: response.status };
}
