<!-- User's GitHub issues view -->
<template>
  <div class="my-issues">
    <div class="header">
      <h2>My GitHub Issues</h2>
      <div class="filters">
        <v-btn-toggle v-model="state" mandatory>
          <v-btn value="open" color="success">Open</v-btn>
          <v-btn value="closed" color="grey">Closed</v-btn>
        </v-btn-toggle>
      </div>
    </div>

    <v-card v-if="loading" class="loading-card">
      <v-card-text class="d-flex justify-center align-center">
        <v-progress-circular indeterminate />
      </v-card-text>
    </v-card>

    <template v-else>
      <div v-if="issues.length === 0" class="no-issues">
        <v-icon size="64" color="grey">mdi-alert-circle-outline</v-icon>
        <p>No {{ state }} issues found</p>
      </div>

      <div v-else class="issues-grid">
        <v-card v-for="issue in issues" :key="issue.id" class="issue-card" :class="{ closed: issue.state === 'closed' }">
          <v-card-title class="d-flex justify-space-between align-center">
            <div class="title-section">
              <span class="issue-number">#{{ issue.number }}</span>
              {{ issue.title }}
            </div>
            <v-chip :color="issue.priority ? getPriorityColor(issue.priority) : 'grey'" small class="ml-2">
              {{ issue.priority || 'No Priority' }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <div class="mb-2">
              <v-chip v-for="label in issue.labels" :key="label" small class="mr-1">
                {{ label }}
              </v-chip>
            </div>
            <p class="body-text">{{ truncateText(issue.body, 150) }}</p>
          </v-card-text>

          <v-card-actions>
            <v-btn variant="text" :href="issue.url" target="_blank" color="primary">
              View on GitHub
              <v-icon right>mdi-open-in-new</v-icon>
            </v-btn>
            <v-spacer />
            <v-chip small :color="issue.type === 'bug' ? 'error' : 'info'">
              {{ issue.type || 'Issue' }}
            </v-chip>
          </v-card-actions>

          <div class="card-footer">
            <span class="created-at"> Created {{ formatDate(issue.createdAt) }} </span>
            <span v-if="issue.closedAt" class="closed-at"> Closed {{ formatDate(issue.closedAt) }} </span>
          </div>
        </v-card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { GetMyIssues } from '@/API/github';
import type { GitHubIssue } from '@/API/github';
import { useSocket } from '../../composables/useSocket';
import { format } from 'date-fns';

const socket = useSocket();
const issues = ref<GitHubIssue[]>([]);
const loading = ref(true);
const state = ref('open');

// Load user's issues
const loadIssues = async () => {
  loading.value = true;
  try {
    issues.value = await GetMyIssues(state.value);
  } catch (error) {
    console.error('Failed to load issues:', error);
  } finally {
    loading.value = false;
  }
};

// Format date
const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy');
};

// Truncate text
const truncateText = (text: string, length: number) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Get priority color
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'grey';
  }
};

// Watch for state changes
watch(state, () => {
  loadIssues();
});

// Socket events
onMounted(() => {
  loadIssues();

  socket.on('issue:created', () => {
    loadIssues();
  });

  socket.on('issue:updated', () => {
    loadIssues();
  });
});
</script>

<style scoped>
.my-issues {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.loading-card {
  height: 200px;
}

.no-issues {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--v-medium-emphasis-opacity);
}

.issues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.issue-card {
  position: relative;
  transition: transform 0.2s;
}

.issue-card:hover {
  transform: translateY(-2px);
}

.issue-card.closed {
  opacity: 0.7;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
}

.issue-number {
  color: var(--v-medium-emphasis-opacity);
  font-size: 0.9rem;
}

.body-text {
  color: var(--v-medium-emphasis-opacity);
  font-size: 0.9rem;
  line-height: 1.4;
}

.card-footer {
  padding: 8px 16px;
  background: var(--v-surface-variant);
  font-size: 0.8rem;
  color: var(--v-medium-emphasis-opacity);
  display: flex;
  justify-content: space-between;
}
</style>
