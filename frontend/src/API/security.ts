import axios from '@/utils/axios';

interface DeviceRegistrationData {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  currentlyActive: boolean;
}

export async function RegisterDevice(data: DeviceRegistrationData) {
  if (!data) throw new Error('Device data is required');
  const response = await axios.post('/security/register-device', data);
  return {
    status: response.status,
    data: response.data.data
  };
}
