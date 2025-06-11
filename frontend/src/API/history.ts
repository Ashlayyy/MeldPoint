import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

export async function GetHistoryByIds(meldingId?: string, preventiefId?: string, correctiefId?: string) {
  // Build cache key based on provided IDs
  const cacheKey = `history-${meldingId}-${preventiefId}-${correctiefId}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  // Build URL with query parameters
  const url = new URL(`${import.meta.env.VITE_API_URL}/systemLog/melding/${meldingId}/${preventiefId}/${correctiefId}/history`);

  try {
    const response = await axios.get<any>(url.toString());

    // Cache the response for 2 minutes
    cacheService.set(cacheKey, response.data.data, { ttl: 2 * 60 * 1000 });

    return { status: response.status, data: response.data.data };
  } catch (error: any) {
    if (error.status === 404) {
      return []; // Return empty array if no history found
    }
    console.error(error);
    throw error;
  }
}

export async function GetHistory(meldingId: string, preventiefId?: string, correctiefId?: string): Promise<any> {
  const ids = [
    meldingId,
    preventiefId || undefined,
    correctiefId || undefined
  ]
  return GetHistoryByIds(...ids);
}
