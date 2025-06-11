import axios from '@/utils/axios';

export interface TeamResponse {
  success: boolean;
  data: string[];
}

export async function GetTeamMembers(userId: string) {
  const response = await axios.get<TeamResponse>(`${import.meta.env.VITE_API_URL}/user/${userId}/involved`);
  return { status: response.status, data: response.data.data };
} 