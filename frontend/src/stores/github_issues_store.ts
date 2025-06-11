import { defineStore, storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { GetIssues, GetIssueStats, UpdateIssueStatus, type GitHubIssue, type IssueFilters } from '@/API/github';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useAuthStore } from '@/stores/auth';

export const useGithubIssuesStore = defineStore('githubIssues', () => {
  const { t } = useI18n();
  const notificationStore = useNotificationStore();
  const authStore = useAuthStore();

  const issues = ref<any[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const issueStats = ref<{ state: string; _count: number }[]>([]);
  const filters = ref<IssueFilters>({
    state: 'open',
    type: undefined,
    search: '',
    labels: '',
    page: 1,
    limit: 50,
    sortBy: 'state',
    sortOrder: 'asc'
  });
  const selectedIssue = ref<any | null>(null);
  const closingIssue = ref(false);
  const statsLoading = ref(false);

  const totalPages = computed(() => Math.ceil(total.value / (filters.value.limit || 10)));

  async function fetchIssues() {
    loading.value = true;
    try {
      const response = await GetIssues(filters.value);
      console.log('API Response for GetIssues (response.data):', response);

      if (response && response.data && response.meta) {
        issues.value = response.data;
        total.value = response.meta.total;
      } else {
        console.error('Unexpected structure in GetIssues response (after type update):', response);
        issues.value = [];
        total.value = 0;
      }
    } catch (error) {
      console.error('Failed to load issues:', error);
      notificationStore.error({
        title: t('admin.github.issues.load_error_title') || 'Error Loading Issues',
        message: t('admin.github.issues.load_error_message') || 'Could not fetch issues from the server.'
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats() {
    statsLoading.value = true;
    try {
      const response = await GetIssueStats();
      console.log('API Response for GetIssueStats (response.data):', response);

      if (response && response.data) {
        const openCount = response.data.open || 0;
        const closedCount = response.data.closed || 0;
        issueStats.value = [
          { state: 'open', _count: openCount },
          { state: 'closed', _count: closedCount }
        ];
      } else {
        console.error('Unexpected structure in GetIssueStats response:', response);
        issueStats.value = [];
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      statsLoading.value = false;
    }
  }

  function updateFilters(newFilters: Partial<IssueFilters>) {
    let changed = false;
    const currentFilters = filters.value;
    const updatedFilters = { ...currentFilters };

    if (newFilters.page !== undefined && newFilters.page !== currentFilters.page) {
      updatedFilters.page = newFilters.page;
      changed = true;
    }
    if (newFilters.limit !== undefined && newFilters.limit !== currentFilters.limit) {
      updatedFilters.limit = newFilters.limit;
      changed = true;
    }
    if (newFilters.sortBy !== undefined && newFilters.sortBy !== currentFilters.sortBy) {
      updatedFilters.sortBy = newFilters.sortBy;
      changed = true;
    }
    if (newFilters.sortOrder !== undefined && newFilters.sortOrder !== currentFilters.sortOrder) {
      updatedFilters.sortOrder = newFilters.sortOrder;
      changed = true;
    }

    if (changed) {
      console.log('updateFilters: Changes detected, fetching...', newFilters);
      filters.value = updatedFilters;
      fetchIssues();
    } else {
      console.log('updateFilters: No changes detected, skipping fetch.', newFilters);
    }
  }

  function applyFilters(newFilters: Pick<IssueFilters, 'state' | 'labels' | 'search'>) {
    let changed = false;
    const currentFilters = filters.value;
    const newState = newFilters.state || 'all';
    const newLabels = newFilters.labels;
    const newSearch = newFilters.search;

    if (newState !== currentFilters.state) changed = true;
    if (newLabels !== currentFilters.labels) changed = true;
    if (newSearch !== currentFilters.search) changed = true;
    // Also consider it a change if the page needs resetting
    if (currentFilters.page !== 1) changed = true;

    if (changed) {
      console.log('applyFilters: Changes detected or page reset needed, fetching...', newFilters);
      filters.value = {
        ...currentFilters,
        state: newState,
        labels: newLabels,
        search: newSearch,
        page: 1 // Reset page to 1
      };
      fetchIssues();
    } else {
      console.log('applyFilters: No changes detected and page already 1, skipping fetch.', newFilters);
    }
  }

  function setSelectedIssue(issue: GitHubIssue | null) {
    selectedIssue.value = issue;
  }

  async function updateIssueStatus(
    issueId: string,
    status: 'open' | 'closed',
    options?: { reason?: string; comment?: string }
  ): Promise<boolean> {
    try {
      await UpdateIssueStatus(issueId, status, options);
      notificationStore.info({
        title: t(`admin.github.issues.${status}_success_title`) || `Issue ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: t(`admin.github.issues.${status}_success_message`) || `Issue status updated successfully.`
      });
      await Promise.all([fetchIssues(), fetchStats()]);
      return true;
    } catch (error) {
      console.error(`Failed to update issue status to ${status}:`, error);
      notificationStore.error({
        title: t(`admin.github.issues.${status}_error_title`) || 'Status Update Error',
        message: t(`admin.github.issues.${status}_error_message`) || `Could not update issue status.`
      });
      return false;
    }
  }

  async function closeIssue(issueId: string, reason: string, comment: string): Promise<boolean> {
    closingIssue.value = true;
    notificationStore.promise({
      title: t('admin.github.issues.closing_title') || 'Closing Issue',
      message: t('admin.github.issues.closing_message') || 'Attempting to close the issue...'
    });

    try {
      const closeComment = `
 Melding afgesloten door ${authStore.user?.Name || authStore.user?.Email}.
 Reden: ${reason}
 Bericht: ${comment}`;
      const success = await updateIssueStatus(issueId, 'closed', { reason: reason, comment: closeComment });

      if (success) {
        notificationStore.resolvePromise({
          title: t('admin.github.issues.close_success_title') || 'Issue Closed',
          message: t('admin.github.issues.close_success_message') || 'The issue has been successfully closed.'
        });
        setSelectedIssue(null);
        return true;
      } else {
        throw new Error('UpdateIssueStatus failed');
      }
    } catch (error) {
      notificationStore.rejectPromise({
        title: t('admin.github.issues.close_error_title') || 'Error Closing Issue',
        message: t('admin.github.issues.close_error_message') || 'There was an error closing the issue.'
      });
      return false;
    } finally {
      closingIssue.value = false;
    }
  }

  async function reopenIssue(issueId: string): Promise<boolean> {
    const reopenComment = `Issue reopened by ${authStore.user?.Name || authStore.user?.Email}`;
    const success = await updateIssueStatus(issueId, 'open', { comment: reopenComment });
    if (success) {
      setSelectedIssue(null);
    }
    return success;
  }

  return {
    issues,
    total,
    loading,
    issueStats,
    filters,
    selectedIssue,
    closingIssue,
    statsLoading,
    totalPages,
    fetchIssues,
    fetchStats,
    updateFilters,
    applyFilters,
    setSelectedIssue,
    updateIssueStatus,
    closeIssue,
    reopenIssue
  };
});
