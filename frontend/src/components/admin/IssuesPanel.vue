<!-- Admin panel for GitHub issues -->
<template>
  <div class="issues-panel">
    <div class="header">
      <h2>GitHub Issues Management</h2>
      <div class="stats">
        <div v-for="stat in issueStats" :key="stat.state" class="stat-item">
          <span class="label">{{ stat.state }}</span>
          <span class="count">{{ stat._count }}</span>
        </div>
      </div>
    </div>

    <div class="filters">
      <v-select v-model="filters.state" :items="['all', 'open', 'closed']" label="Status" class="filter-item" />
      <v-select v-model="filters.priority" :items="['high', 'medium', 'low']" label="Priority" clearable class="filter-item" />
      <v-select v-model="filters.type" :items="['bug', 'feature', 'documentation']" label="Type" clearable class="filter-item" />
      <v-text-field v-model="filters.search" label="Search" prepend-inner-icon="mdi-magnify" class="filter-item" />
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" class="filter-item"> Date Range </v-btn>
        </template>
        <v-date-picker v-model="dateRange" range @update:model-value="updateDateRange" />
      </v-menu>
    </div>

    <v-data-table
      :headers="headers"
      :items="issues"
      :loading="loading"
      :items-per-page="filters.limit"
      :page="filters.page"
      :total="total"
      @update:page="updatePage"
    >
      <template v-slot:item.state="{ item }">
        <v-chip :color="item.state === 'open' ? 'green' : 'grey'" small>
          {{ item.state }}
        </v-chip>
      </template>

      <template v-slot:item.priority="{ item }">
        <v-chip :color="getPriorityColor(item.priority)" small>
          {{ item.priority || 'none' }}
        </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn icon small @click="toggleIssueStatus(item)" :title="item.state === 'open' ? 'Close Issue' : 'Reopen Issue'">
          <v-icon>
            {{ item.state === 'open' ? 'mdi-close-circle' : 'mdi-refresh' }}
          </v-icon>
        </v-btn>
        <v-btn icon small @click="openIssueUrl(item.url)" title="View on GitHub">
          <v-icon>mdi-github</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { GetIssues, GetIssueStats, UpdateIssueStatus } from '@/API/github';
import type { GitHubIssue, IssueFilters } from '@/API/github';
import { useSocket } from '../../composables/useSocket';

interface IssueStats {
  state: string;
  _count: number;
}

const socket = useSocket();

const issues = ref<GitHubIssue[]>([]);
const total = ref(0);
const loading = ref(true);
const issueStats = ref<IssueStats[]>([]);
const dateRange = ref<string[]>([]);

const filters = ref<IssueFilters>({
  state: 'all',
  priority: undefined,
  type: undefined,
  search: '',
  page: 1,
  limit: 10
});

const headers = [
  { title: 'Number', key: 'number' },
  { title: 'Title', key: 'title' },
  { title: 'State', key: 'state' },
  { title: 'Priority', key: 'priority' },
  { title: 'Type', key: 'type' },
  { title: 'Created By', key: 'userName' },
  { title: 'Created At', key: 'createdAt' },
  { title: 'Actions', key: 'actions' }
];

// Load issues with current filters
const loadIssues = async () => {
  loading.value = true;
  try {
    const response = await GetIssues(filters.value);
    issues.value = response.issues;
    total.value = response.total;
  } catch (error) {
    console.error('Failed to load issues:', error);
  } finally {
    loading.value = false;
  }
};

// Load issue statistics
const loadStats = async () => {
  try {
    issueStats.value = await GetIssueStats();
  } catch (error) {
    console.error('Failed to load issue stats:', error);
  }
};

// Update page
const updatePage = (page: number) => {
  filters.value.page = page;
};

// Update date range
const updateDateRange = (range: string[]) => {
  if (range[0] && range[1]) {
    filters.value.startDate = range[0];
    filters.value.endDate = range[1];
  }
};

// Toggle issue status
const toggleIssueStatus = async (issue: GitHubIssue) => {
  try {
    await UpdateIssueStatus(issue.id, issue.state === 'open' ? 'closed' : 'open');
    await loadIssues();
    await loadStats();
  } catch (error) {
    console.error('Failed to update issue status:', error);
  }
};

// Get priority color
const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high':
      return 'red';
    case 'medium':
      return 'orange';
    case 'low':
      return 'green';
    default:
      return 'grey';
  }
};

// Open issue URL
const openIssueUrl = (url: string) => {
  window.open(url, '_blank');
};

// Watch for filter changes
watch(
  filters,
  () => {
    loadIssues();
  },
  { deep: true }
);

// Socket events
onMounted(() => {
  loadIssues();
  loadStats();

  socket.on('issue:created', () => {
    loadIssues();
    loadStats();
  });

  socket.on('issue:updated', () => {
    loadIssues();
    loadStats();
  });
});
</script>

<style scoped>
.issues-panel {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: var(--v-surface-variant);
  border-radius: 8px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.filter-item {
  min-width: 150px;
}
</style>
