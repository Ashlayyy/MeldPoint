<template>
  <div class="my-issues-admin">
    <div class="header-section mb-6">
      <h1 class="text-h5 font-weight-medium mb-2">{{ t('myIssues.title') }}</h1>
      <p class="text-subtitle-2 text-medium-emphasis">{{ t('myIssues.subtitle') }}</p>
    </div>

    <v-card v-if="loading" elevation="1" class="loading-card rounded-lg">
      <v-card-text class="d-flex justify-center align-center">
        <v-progress-circular indeterminate />
      </v-card-text>
    </v-card>

    <template v-else>
      <div v-if="issues?.length === 0" class="no-issues">
        <v-icon size="64" color="grey">mdi-alert-circle-outline</v-icon>
        <p>{{ t('myIssues.emptyState') }}</p>
      </div>

      <div v-else>
        <v-card v-for="issue in issues" :key="issue.id" class="issue-card mb-4" elevation="1" rounded="lg">
          <v-card-text>
            <div class="d-flex align-center flex-wrap gap-2 mb-2">
              <span class="issue-number text-medium-emphasis">#{{ issue.number }}</span>
              <v-chip size="small" :color="issue.state === 'open' ? 'error' : 'grey'" class="text-capitalize">
                {{ t(`myIssues.states.${issue.state}`) }}
              </v-chip>
              <template v-for="label in filteredLabels(issue.labels)" :key="label.name">
                <v-chip size="small" variant="outlined" :color="getLabelColor(label.color)" class="text-capitalize">
                  {{ label.name }}
                </v-chip>
              </template>
              <v-chip v-if="issue.comments && issue.comments.length > 0" size="x-small" prepend-icon="mdi-comment-outline">
                {{ issue.comments.length }}
              </v-chip>
            </div>

            <div class="title-section text-h6 mb-2">{{ issue.title }}</div>

            <p class="body-text mb-4">{{ truncateText(issue.body, 150) }}</p>

            <div class="d-flex align-center justify-space-between text-caption text-medium-emphasis">
              <div class="d-flex align-center gap-4">
                <span
                  >{{ t('myIssues.labels.created') }} {{ issue.created_at ? formatDate(issue.created_at) : t('myIssues.labels.na') }}</span
                >
                <span v-if="issue.closed_at">{{ t('myIssues.labels.closed') }} {{ formatDate(issue.closed_at) }}</span>
              </div>
              <v-btn variant="text" density="comfortable" color="primary" @click="openIssueDetails(issue)" class="text-none">
                {{ t('myIssues.buttons.viewDetails') }}
                <v-icon right size="small">mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </template>

    <v-dialog v-model="showDetails" max-width="800" scrollable>
      <v-card v-if="selectedIssue">
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <div class="d-flex align-center gap-2">
            <span class="issue-number text-medium-emphasis">#{{ selectedIssue.number }}</span>
            <span class="text-h6">{{ selectedIssue.title }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="showDetails = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <div class="d-flex align-center flex-wrap gap-2 mb-4">
            <v-chip size="small" :color="selectedIssue.state === 'open' ? 'error' : 'grey'" class="text-capitalize">
              {{ t(`myIssues.states.${selectedIssue.state}`) }}
            </v-chip>
            <template v-for="label in filteredLabels(selectedIssue.labels)" :key="label.name">
              <v-chip size="small" variant="outlined" :color="getLabelColor(label.color)" class="text-capitalize">
                {{ label.name }}
              </v-chip>
            </template>
            <v-spacer />
            <span class="text-caption text-medium-emphasis"
              >{{ t('myIssues.labels.created') }}
              {{ selectedIssue.created_at ? formatDate(selectedIssue.created_at) : t('myIssues.labels.na') }}</span
            >
          </div>

          <div class="description mb-6">
            <h4 class="text-subtitle-1 mb-2">{{ t('myIssues.details.description') }}</h4>
            <MarkdownRenderer :content="selectedIssue.body" />
          </div>

          <div v-if="selectedIssue.comments && selectedIssue.comments.length > 0" class="comments-section mb-6">
            <h4 class="text-subtitle-1 mb-4">{{ t('myIssues.details.commentsTitle', { count: selectedIssue.comments.length }) }}</h4>
            <v-divider class="mb-4" />
            <div v-for="(comment, index) in selectedIssue.comments" :key="comment.id || index" class="comment mb-4">
              <div class="d-flex align-start gap-3 mb-2">
                <v-avatar size="32">
                  <v-img :src="comment.user.avatar_url" :alt="comment.user.login" />
                </v-avatar>
                <div>
                  <span class="font-weight-medium mr-2">{{ comment.user.login }}</span>
                  <span class="text-caption text-medium-emphasis">{{ formatDate(comment.created_at) }}</span>
                </div>
              </div>
              <div class="pl-11">
                <MarkdownRenderer :content="comment.body" />
              </div>
              <v-divider v-if="index < selectedIssue.comments.length - 1" class="mt-4" />
            </div>
          </div>

          <div class="add-comment-section mt-6">
            <h4 class="text-subtitle-1 mb-4">{{ t('myIssues.details.addCommentTitle') }}</h4>
            <v-textarea
              v-model="newCommentText"
              :label="t('myIssues.details.commentPlaceholder')"
              variant="outlined"
              rows="3"
              auto-grow
              hide-details="auto"
              class="mb-3"
            />
            <v-btn color="primary" @click="submitComment" :disabled="!newCommentText.trim()" :loading="submittingComment" block>
              {{ t('myIssues.buttons.submitComment') }}
            </v-btn>
          </div>

          <div v-if="selectedIssue.closed_at" class="d-flex align-center justify-end text-caption text-medium-emphasis mt-6">
            {{ t('myIssues.labels.closed') }} {{ formatDate(selectedIssue.closed_at) }}
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="primary" variant="text" @click="showDetails = false"> {{ t('myIssues.buttons.close') }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { GetMyIssues, AddCommentToIssue } from '@/API/github';
import type { GitHubIssue, GitHubLabel } from '@/API/github';
import { useSocket } from '@/composables/useSocket';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth';
import MarkdownRenderer from '../../components/common/MarkdownRenderer.vue';

const { t } = useI18n();
const socket = useSocket();
const issues = ref<any[]>([]);
const loading = ref(true);
const showDetails = ref(false);
const selectedIssue = ref<any | null>(null);
const newCommentText = ref('');
const submittingComment = ref(false);

const authStore = useAuthStore();

const loadIssues = async (selectIssueNumber: number | null = null) => {
  loading.value = true;
  try {
    const response = await GetMyIssues('all');
    issues.value = response;
    if (selectIssueNumber !== null) {
      const issueToSelect = issues.value.find((iss) => iss.number === selectIssueNumber);
      if (issueToSelect) {
        selectedIssue.value = issueToSelect;
        showDetails.value = true;
      }
    }
  } catch (error) {
    console.error('Failed to load issues:', error);
  } finally {
    loading.value = false;
  }
};

const filteredLabels = (labels: GitHubLabel[]): GitHubLabel[] => {
  if (!labels) return [];
  return labels.filter((label) => label.name.toLowerCase() !== 'helpdesk');
};

const getLabelColor = (color: string | undefined): string | undefined => {
  if (!color || color.toLowerCase() === 'ededed') {
    return undefined;
  }
  return '#' + color;
};

const formatDate = (date: string | undefined | null) => {
  if (!date) return t('myIssues.labels.na');
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return format(dateObj, 'MMM d, yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const truncateText = (text: string | null | undefined, length: number): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const openIssueDetails = (issue: GitHubIssue) => {
  selectedIssue.value = issue;
  newCommentText.value = '';
  submittingComment.value = false;
  showDetails.value = true;
};

const submitComment = async () => {
  if (!selectedIssue.value || !newCommentText.value.trim()) return;

  submittingComment.value = true;
  try {
    const comment = `
Naam: ${authStore.user?.Name}
Email: ${authStore.user?.Email}
Bericht: ${newCommentText.value.trim()}
`;
    await AddCommentToIssue(selectedIssue.value.number.toString(), comment);
    const issueNumber = selectedIssue.value.number;
    await loadIssues(issueNumber);
    newCommentText.value = '';
  } catch (error) {
    console.error('Failed to submit comment:', error);
  } finally {
    submittingComment.value = false;
  }
};

onMounted(() => {
  loadIssues();

  socket.on('issue:created', () => {
    console.log('Socket event: issue:created');
    loadIssues();
  });

  socket.on('issue:updated', () => {
    console.log('Socket event: issue:updated');
    loadIssues();
  });

  socket.on('issue:deleted', () => {
    console.log('Socket event: issue:deleted');
    loadIssues();
  });

  socket.on('comment:created', (issueNumber: number) => {
    console.log(`Socket event: comment:created for issue #${issueNumber}`);
    loadIssues();
  });
});
</script>

<style scoped>
.my-issues-admin {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
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

.issue-card {
  transition: transform 0.2s ease-in-out;
}

.issue-card:hover {
  transform: translateY(-2px);
}

.issue-number {
  font-family: monospace;
  font-size: 0.9rem;
}

.body-text {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
}

.comments-section .comment:last-child {
  margin-bottom: 0;
}

.pl-11 {
  padding-left: 44px;
}

.description,
.comments-section {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  padding: 16px;
}
</style>
