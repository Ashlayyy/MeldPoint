import axios from '@/utils/axios';

export async function UploadFile(formdata: any) {
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/migration/upload`, formdata);
  return response;
}
