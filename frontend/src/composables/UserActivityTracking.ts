import { ref, onMounted, onUnmounted } from 'vue';
import axios from '@/utils/axios';
import { useRouter } from 'vue-router';

export function useActivityTracking() {
  const router = useRouter();
  const sessionStartTime = ref(Date.now());

  const trackActivity = async (action: string, feature: string, metadata?: Record<string, any>) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/analytics/activity`, {
        action,
        feature,
        metadata
      });
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  };

  onMounted(() => {
    trackActivity('PAGE_VIEW', router.currentRoute.value.name as string, {
      path: router.currentRoute.value.path,
      startTime: new Date().toISOString()
    });
  });

  onUnmounted(() => {
    const duration = Date.now() - sessionStartTime.value;
    trackActivity('PAGE_EXIT', router.currentRoute.value.name as string, {
      path: router.currentRoute.value.path,
      duration,
      endTime: new Date().toISOString()
    });
  });

  return {
    trackActivity
  };
}
