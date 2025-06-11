import { isAxiosError } from 'axios';
import axios from '@/utils/axios';

interface UploadResponse {
    url: string;
}

export const uploadScreenshot = async (file: File) => {
    const formData = new FormData();
    formData.append('screenshot', file);

    try {
        const response = await axios.post('/screenshot', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Upload error details:', error);
        throw error;
    }
}; 