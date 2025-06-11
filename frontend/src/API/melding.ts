/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

export async function GetAllReports(forced: boolean = false) {
  const cacheKey = 'all-reports';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData && !forced) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/melding`);
  cacheService.set(cacheKey, response.data.data, { ttl: 60 * 1000 }); // Cache for 60 seconds
  return { status: response.status, data: response.data.data };
}

export async function GetReportById(id: string, forced: boolean = false) {
  if (!id) throw new Error('ID is required');

  const cacheKey = `report-${id}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData && !forced) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/melding/${id}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 }); // Cache for 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function GetReportByVolgnummer(volgnummer: string, forced: boolean = false) {
  if (!volgnummer) throw new Error('Volgnummer is required');

  const cacheKey = `report-${volgnummer}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData && !forced) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/melding/volgnummer/${volgnummer}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 }); // Cache for 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function CreateReport(data: any) {
  if (!data) throw new Error('Data is required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/melding`, data);
  return { status: response.status, data: response.data.data };
}

export async function UpdateReport(id: string, data: any) {
  if (!id || !data) throw new Error('ID and data are required');
  console.log("A2- UpdateReport from Mleding.ts going to happen");
  console.log("data", data);
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/melding/${id}`, data);
  return { status: response.status, data: response.data };
}

export async function AddCloneID(meldingID: string, cloneID: string) {
  if (!meldingID || !cloneID) throw new Error('Both meldingID and cloneID are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/melding/clone/${meldingID}/${cloneID}`);
  return { status: response.status, data: response.data.data };
}

export async function RemoveCloneID(meldingID: string, cloneID: string) {
  if (!meldingID || !cloneID) throw new Error('Both meldingID and cloneID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/melding/clone/${meldingID}/${cloneID}`);
  return { status: response.status, data: response.data.data };
}

export async function AddCorrespondence(meldingID: string, correspondence: any) {
  if (!meldingID || !correspondence) throw new Error('Both meldingID and correspondence are required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/melding/correspondence/${meldingID}`, { correspondence });
  return { status: response.status, data: response.data.data };
}

export async function RemoveCorrespondence(meldingID: string, correspondenceID: string) {
  if (!meldingID || !correspondenceID) throw new Error('Both meldingID and correspondenceID are required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/melding/correspondence/${meldingID}/${correspondenceID}`);
  return { status: response.status, data: response.data.data };
}

export async function DeleteFile(fileKey: string) {
  if (!fileKey) throw new Error('FileKey is required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/melding/deleteFile/${fileKey}`);
  return { status: response.status, data: response.data.data };
}

export async function SetCorrespondence(meldingID: string, correspondenceIDs: string[]) {
  if (!meldingID || !correspondenceIDs) throw new Error('Both meldingID and correspondenceIDs are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/melding/correspondence/${meldingID}`, { correspondenceIDs });
  return { status: response.status, data: response.data.data };
}

export async function FindMeldingByPreventiefID(preventiefID: string) {
  if (!preventiefID) throw new Error('PreventiefID is required');
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/melding/preventief/${preventiefID}`);
  return { status: response.status, data: response.data.data };
}

export async function GetLengths() {
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/melding/fetch/lengths`);
  return { status: response.status, data: response.data.data };
}
