import axios from '@/utils/axios';

// Debug logger
const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Backup API]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Backup API Error]', ...args);
    }
  }
};

export function CreateBackup(onProgress: (data: any) => void) {
  debug.log('Creating backup...');
  let buffer = '';

  return axios.post(
    `${import.meta.env.VITE_API_URL}/backup/create`,
    {},
    {
      responseType: 'stream',
      headers: {
        Accept: 'text/event-stream'
      },
      onDownloadProgress: (progressEvent) => {
        const chunk = progressEvent.event.target.responseText.substring(buffer.length);
        buffer += chunk;

        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.replace('data: ', '').trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                debug.log('Parsed progress:', data);
                onProgress(data);
              }
            } catch (error) {
              debug.error('Error parsing chunk:', error);
            }
          }
        }
      },
      // Disable axios response transformations
      transformResponse: [(data) => data]
    }
  );
}

export async function ListBackups() {
  debug.log('Listing backups...');
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/backup/list`);
    debug.log('List backups response:', response);
    return { status: response.status, data: response.data.data };
  } catch (error) {
    debug.error('Error listing backups:', error);
    throw error;
  }
}

export async function DownloadBackup(id: string) {
  debug.log('Downloading backup:', id);
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/backup/download/${id}`);
    debug.log('Download backup response:', response);
    return { status: response.status, data: response.data };
  } catch (error) {
    debug.error('Error downloading backup:', error);
    throw error;
  }
}

export async function DeleteBackup(id: string) {
  debug.log('Deleting backup:', id);
  try {
    const response = await axios.delete(`${import.meta.env.VITE_API_URL}/backup/${id}`);
    debug.log('Delete backup response:', response);
    return { status: response.status, data: response.data };
  } catch (error) {
    debug.error('Error deleting backup:', error);
    throw error;
  }
}

export async function RestoreBackup(id: string) {
  debug.log('Restoring backup:', id);
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/backup/restore/${id}`,
      {},
      {
        responseType: 'stream',
        headers: {
          Accept: 'text/event-stream'
        }
      }
    );
    debug.log('Restore backup response:', response);
    return response;
  } catch (error) {
    debug.error('Error restoring backup:', error);
    throw error;
  }
}

export async function UploadBackup(file: File) {
  debug.log('Uploading backup file:', file.name);
  try {
    const formData = new FormData();
    formData.append('backup', file);

    const response = await axios.post(`${import.meta.env.VITE_API_URL}/backup/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    debug.log('Upload backup response:', response);
    return { status: response.status, data: response.data };
  } catch (error) {
    debug.error('Error uploading backup:', error);
    throw error;
  }
}
