/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

export async function GetAllPreventief() {
  const cacheKey = 'preventief-list';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/preventief`);
  cacheService.set(cacheKey, response.data.data, { ttl: 2 * 60 * 1000 });
  return { status: response.status, data: response.data.data };
}

export async function GetPreventiefById(id: string) {
  if (!id) throw new Error('ID is required');

  const cacheKey = `preventief-${id}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/preventief/${id}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 }); // 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function CreatePreventief(data: any) {
  if (!data) throw new Error('Data is required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/preventief`, data);
  return { status: response.status, data: response.data.data };
}

export async function UpdatePreventief(id: string, data: any) {
  if (!id) throw new Error('ID is required');
  if (!data) throw new Error('Data is required');
  
  try {
    const response = await axios.patch(`${import.meta.env.VITE_API_URL}/preventief/${id}`, { data });
    cacheService.remove(`preventief-${id}`);
    
    if (response.status === 200) {
      return { status: response.status, data: response.data.data };
    } else {
      throw new Error(JSON.stringify(response));
    }
  } catch (error) {
    throw error;
  }
}

export async function AddTeamlid(meldingID: string, teamlidID: string) {
  if (!meldingID || !teamlidID) throw new Error('Both meldingID and teamlidID are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/preventief/teamleden/${meldingID}/${teamlidID}`);
  cacheService.remove(`preventief-${meldingID}`);
  return { status: response.status, data: response.data.data };
}

export async function ReWriteTeamleden(meldingID: string, teamleden: string[]) {
  if (!meldingID || !teamleden) throw new Error('Both meldingID and teamleden are required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/preventief/teamleden/${meldingID}/rewrite`, { teamleden });
  return { status: response.status, data: response.data.data };
}

export async function RemoveTeamlid(meldingID: string, teamlidID: string) {
  if (!meldingID || !teamlidID) throw new Error('Both meldingID and teamlidID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/preventief/teamleden/${meldingID}/${teamlidID}`);
  cacheService.remove(`preventief-${meldingID}`);
  return { status: response.status, data: response.data.data };
}

export async function AddCorrespondence(meldingID: string, correspondence: any) {
  if (!meldingID || !correspondence) throw new Error('Both meldingID and correspondence are required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/preventief/correspondence/${meldingID}`, { correspondence });
  cacheService.remove(`preventief-${meldingID}`);
  return { status: response.status, data: response.data.data };
}

export async function RemoveCorrespondence(preventiefID: string, correspondenceID: string) {
  if (!preventiefID || !correspondenceID) throw new Error('Both preventiefID and correspondenceID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/preventief/correspondence/${preventiefID}/${correspondenceID}`);
  cacheService.remove(`preventief-${preventiefID}`);
  return { status: response.status, data: response.data.data };
}
