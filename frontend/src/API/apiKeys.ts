import axiosInstance from '@/utils/axios';

interface CreateAPIKeyParams {
  name: string;
  expiresAt?: Date;
}

interface APIKeyResponse {
  id: string;
  name: string;
  expiresAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  isActive: boolean;
}

interface CreateAPIKeyResponse {
  key: string;
  keyData: APIKeyResponse;
}

export const apiKeysAPI = {
  list: async (): Promise<APIKeyResponse[]> => {
    const response = await axiosInstance.get('/users/api-keys');
    return response.data.data;
  },

  create: async (params: CreateAPIKeyParams): Promise<CreateAPIKeyResponse> => {
    const response = await axiosInstance.post('/users/api-keys', params);
    return response.data.data;
  },

  update: async (keyId: string, name: string): Promise<APIKeyResponse> => {
    const response = await axiosInstance.patch(`/users/api-keys/${keyId}`, { name });
    return response.data.data;
  },

  revoke: async (keyId: string): Promise<void> => {
    await axiosInstance.delete(`/users/api-keys/${keyId}`);
  }
};
