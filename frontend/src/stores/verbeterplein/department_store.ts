import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Department } from '@/API/department';
import { GetAllDepartments, GetDepartmentById, CreateDepartment, UpdateDepartment, DeleteDepartment } from '@/API/department';
import { useNotificationStore } from './notification_store';
import i18n from '@/main';
const t = i18n.global.t;

export const useDepartmentStore = defineStore('department', () => {
  const departments = ref<Department[]>([]);
  const currentDepartment = ref<Department | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);
  const notification = useNotificationStore();

  async function fetchDepartments() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await GetAllDepartments();
      if (response.status === 200) {
        departments.value = response.data;
      } else {
        throw new Error(JSON.stringify(response));
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch departments';
      notification.error({ message: t('errors.fetch_error', { error: err }) });
    } finally {
      isLoading.value = false;
    }
  }

  function clearDepartments() {
    departments.value = [];
    error.value = null;
  }

  async function getDepartmentById(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await GetDepartmentById(id);
      if (response.status === 200) {
        currentDepartment.value = response.data;
        return response.data;
      } else {
        throw new Error(JSON.stringify(response));
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch department';
      notification.error({ message: t('errors.fetch_error', { error: err }) });
    } finally {
      isLoading.value = false;
    }
  }

  async function createDepartment(data: { name: string; description?: string }) {
    notification.promise({
      message: t('admin.departments.creating')
    });
    isLoading.value = true;
    error.value = null;
    try {
      const response = await CreateDepartment(data);
      if (response.status === 201) {
        await fetchDepartments();
        notification.resolvePromise({ message: t('admin.departments.created') });
        return response.data;
      } else {
        throw new Error(JSON.stringify(response));
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create department';
      notification.rejectPromise({ message: t('errors.save_error', { error: err }) });
    } finally {
      isLoading.value = false;
    }
  }

  async function updateDepartment(id: string, data: { name?: string; description?: string }) {
    isLoading.value = true;
    error.value = null;
    notification.promise({
      message: t('admin.departments.updating')
    });
    try {
      const response = await UpdateDepartment(id, data);
      if (response.status === 200) {
        await fetchDepartments();
        notification.resolvePromise({ message: t('admin.departments.updated') });
        return response.data;
      } else {
        throw new Error(JSON.stringify(response));
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update department';
      notification.rejectPromise({ message: t('errors.save_error', { error: err }) });
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteDepartment(id: string) {
    isLoading.value = true;
    error.value = null;
    notification.promise({
      message: t('admin.departments.deleting')
    });
    try {
      const response = await DeleteDepartment(id);
      if (response.status === 200) {
        await fetchDepartments();
        notification.resolvePromise({ message: t('admin.departments.deleted') });
        return response.data;
      } else {
        throw new Error(JSON.stringify(response));
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete department';
      notification.rejectPromise({ message: t('errors.delete_error', { error: err }) });
    } finally {
      isLoading.value = false;
    }
  }

  async function initializeData() {
    if (initialized.value) return;
    await fetchDepartments();
    initialized.value = true;
  }

  return {
    departments,
    currentDepartment,
    isLoading,
    error,
    initialized,
    fetchDepartments,
    clearDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    initializeData
  };
});
