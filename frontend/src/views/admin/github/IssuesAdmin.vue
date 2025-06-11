<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <UiParentCard :title="$t('admin.github.issues.title')">
          <div class="d-flex gap-4 mb-6">
            <template v-if="statsLoading">
              <v-card v-for="i in 3" :key="`skel-${i}`" class="stat-card flex-grow-1">
                <v-card-text>
                  <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
                </v-card-text>
              </v-card>
            </template>
            <template v-else>
              <v-card v-for="stat in issueStats" :key="stat.state" class="stat-card flex-grow-1">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <div class="text-subtitle-1 mb-1">{{ stat.state?.charAt(0).toUpperCase() + stat.state?.slice(1) }}</div>
                      <div class="text-h4">{{ stat._count }}</div>
                    </div>
                    <v-icon :color="getStateColor(stat.state)" size="40">
                      {{ getStateIcon(stat.state) }}
                    </v-icon>
                  </div>
                </v-card-text>
              </v-card>
            </template>
          </div>

          <v-card class="mb-6" variant="outlined">
            <v-card-text>
              <v-row align="center">
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="localStateFilter"
                    :items="['all', 'open', 'closed']"
                    :label="$t('admin.github.issues.filter.status')"
                    density="comfortable"
                    variant="outlined"
                    hide-details
                    clearable
                    :item-props="
                      (item) => ({
                        prependIcon: getStateIcon(item),
                        prependIconColor: getStateColor(item)
                      })
                    "
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="localTypeFilter"
                    :items="['bug', 'feature', 'documentation']"
                    :label="$t('admin.github.issues.filter.type')"
                    density="comfortable"
                    variant="outlined"
                    hide-details
                    clearable
                    :item-props="
                      (item) => ({
                        prependIcon: getTypeIcon(item)
                      })
                    "
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model="localSearchFilter"
                    :label="$t('admin.github.issues.filter.search')"
                    density="comfortable"
                    variant="outlined"
                    hide-details
                    prepend-inner-icon="mdi-magnify"
                    clearable
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-data-table
            :headers="headers"
            :items="issues"
            :loading="loading"
            :items-per-page="filters.limit || 50"
            :page="filters.page"
            :items-length="total"
            :server-items-length="total"
            :show-select="false"
            :sort-by="[{ key: filters.sortBy || 'state', order: filters.sortOrder || 'asc' }]"
            @update:page="updatePage"
            @update:items-per-page="(limit) => issuesStore.updateFilters({ limit })"
            @update:sort-by="(sortBy) => issuesStore.updateFilters({ sortBy: sortBy[0]?.key, sortOrder: sortBy[0]?.order })"
            :items-per-page-options="[
              { value: 50, title: '50' },
              { value: 100, title: '100' }
            ]"
            hover
          >
            <template v-slot:item.title="{ item }">
              <div class="text-truncate" @click="viewIssueDetails(item)" style="cursor: pointer">{{ item.title }}</div>
            </template>

            <template v-slot:item.state="{ item }">
              <v-chip :color="getStateColor(item.state)" size="small" variant="flat" :prepend-icon="getStateIcon(item.state)">
                {{ t(`myIssues.states.${item.state}`) }}
              </v-chip>
            </template>

            <template v-slot:item.labels="{ item }">
              <div class="d-flex flex-wrap gap-1">
                <template v-for="label in filteredLabels(item.labels)" :key="label.name">
                  <v-chip size="x-small" variant="tonal" :color="getLabelColor(label.color)">
                    {{ label.name }}
                  </v-chip>
                </template>
              </div>
            </template>

            <template v-slot:item.createdAt="{ item }">
              <div class="d-flex align-center">
                <v-icon size="small" class="mr-2">mdi-calendar</v-icon>
                {{ formatDate(item.created_at) }}
              </div>
            </template>

            <template v-slot:item.actions="{ item }">
              <div class="d-flex gap-2">
                <v-tooltip :text="$t(item.state === 'open' ? 'admin.github.issues.actions.close' : 'admin.github.issues.actions.reopen')">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      :icon="item.state === 'open' ? 'mdi-check-circle' : 'mdi-refresh'"
                      size="small"
                      :color="item.state === 'open' ? 'success' : 'info'"
                      variant="flat"
                      @click="toggleIssueStatus(item)"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip :text="$t('admin.github.issues.actions.view_details')">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-eye" size="small" color="primary" variant="flat" @click="viewIssueDetails(item)" />
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </UiParentCard>
      </v-col>
    </v-row>

    <v-dialog v-model="showDetails" max-width="800">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <div class="d-flex align-center">
            <v-icon :color="getTypeColor(selectedIssue?.type)" size="24" class="mr-2">
              {{ getTypeIcon(selectedIssue?.type) }}
            </v-icon>
            <span>{{ $t('admin.github.issues.details_title') }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="showDetails = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <template v-if="selectedIssue">
            <div class="d-flex align-center flex-wrap gap-2 mb-4">
              <v-chip
                :color="getStateColor(selectedIssue.state)"
                size="small"
                variant="flat"
                :prepend-icon="getStateIcon(selectedIssue.state)"
              >
                {{ t(`myIssues.states.${selectedIssue.state}`) }}
              </v-chip>
              <template v-for="label in filteredLabels(selectedIssue.labels)" :key="label.name">
                <v-chip size="small" variant="outlined" :color="getLabelColor(label.color)" class="text-capitalize">
                  {{ label.name }}
                </v-chip>
              </template>
              <v-spacer />
              <div class="text-caption">
                <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                {{ t('myIssues.labels.created') }}: {{ formatDate(selectedIssue.created_at) }}
              </div>
            </div>
            <div class="text-h6 mb-4">{{ selectedIssue.title }}</div>

            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <Suspense>
                  <template #fallback>
                    <v-skeleton-loader type="article" />
                  </template>
                  <template #default>
                    <div class="markdown-body" v-html="sanitizedContent"></div>
                  </template>
                </Suspense>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <div class="d-flex align-center gap-2" v-if="selectedIssue.user">
                  <v-avatar size="32">
                    <v-img :src="selectedIssue.user.avatar_url || '/images/default-avatar.png'" />
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-2">
                      {{ selectedIssue.user.login }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ t('admin.github.issues.created_by') }}
                      {{ formatDate(selectedIssue.created_at) }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-caption text-medium-emphasis">{{ t('admin.github.issues.creator_unknown') }}</div>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4" v-if="selectedIssue.comments && selectedIssue.comments.length > 0">
              <v-card-title class="text-subtitle-2">
                {{ t('myIssues.details.commentsTitle', { count: selectedIssue.comments.length }) }}
              </v-card-title>
              <v-divider />
              <v-card-text>
                <div v-for="(comment, index) in selectedIssue.comments" :key="comment.id || index" class="comment mb-4">
                  <div class="d-flex align-start gap-3 mb-2">
                    <v-avatar size="32">
                      <v-img :src="comment.user.avatar_url || '/images/default-avatar.png'" :alt="comment.user.login" />
                    </v-avatar>
                    <div>
                      <span class="font-weight-medium mr-2">{{ comment.user.login }}</span>
                      <span class="text-caption text-medium-emphasis">{{ formatDate(comment.created_at) }}</span>
                    </div>
                  </div>
                  <div class="pl-11 markdown-body" v-html="sanitizeCommentBody(comment.body)"></div>
                  <v-divider v-if="index < selectedIssue.comments.length - 1" class="mt-4" />
                </div>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-2">{{ t('myIssues.details.addCommentTitle') }}</v-card-title>
              <v-divider />
              <v-card-text>
                <v-textarea
                  v-model="newAdminCommentText"
                  :label="t('myIssues.details.commentPlaceholder')"
                  variant="outlined"
                  rows="3"
                  auto-grow
                  hide-details="auto"
                  class="mb-3"
                />
                <v-btn
                  color="primary"
                  @click="submitAdminComment"
                  :disabled="!newAdminCommentText.trim()"
                  :loading="submittingAdminComment"
                  block
                >
                  {{ t('myIssues.buttons.submitComment') }}
                </v-btn>
              </v-card-text>
            </v-card>

            <v-expand-transition>
              <div v-if="showCloseForm">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="text-subtitle-1 mb-3">
                      {{ $t('admin.github.issues.close_issue') }}
                    </div>
                    <v-select
                      v-model="closeReason.type"
                      :items="closeReasons"
                      :label="$t('admin.github.issues.close_reason')"
                      :item-title="(item) => $t(`admin.github.issues.close_reasons.${item}`)"
                      density="comfortable"
                      variant="outlined"
                      class="mb-3"
                      :rules="[(v) => !!v || $t('admin.github.issues.reason_required')]"
                      required
                    />
                    <v-textarea
                      v-model="closeReason.comment"
                      :label="$t('admin.github.issues.close_comment')"
                      :placeholder="$t('admin.github.issues.close_comment_placeholder')"
                      density="comfortable"
                      variant="outlined"
                      rows="3"
                      class="mb-3"
                      :rules="[(v) => !!v || $t('admin.github.issues.comment_required')]"
                      required
                    />
                  </v-card-text>
                </v-card>
              </div>
            </v-expand-transition>
          </template>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn color="error" variant="text" @click="showDetails = false">
            {{ $t('general.cancel') }}
          </v-btn>
          <v-spacer />
          <template v-if="selectedIssue?.state === 'open'">
            <v-btn v-if="!showCloseForm" color="warning" variant="flat" prepend-icon="mdi-close-circle" @click="showCloseForm = true">
              {{ $t('admin.github.issues.close_issue') }}
            </v-btn>
            <v-btn
              v-else
              color="error"
              variant="flat"
              prepend-icon="mdi-check-circle"
              :disabled="!isCloseFormValid"
              @click="confirmClose"
              :loading="closingIssue"
            >
              {{ $t('admin.github.issues.confirm_close') }}
            </v-btn>
          </template>
          <v-btn v-else color="primary" variant="flat" prepend-icon="mdi-refresh" @click="handleReopenIssue">
            {{ $t('admin.github.issues.actions.reopen') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useI18n } from 'vue-i18n';
import { format } from 'date-fns';
import { useSocket } from '@/composables/useSocket';
import { storeToRefs } from 'pinia';
import { useGithubIssuesStore } from '@/stores/github_issues_store';
import { useAuthStore } from '@/stores/auth';
import type { GitHubIssue, GitHubLabel } from '@/API/github';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AddCommentToIssue } from '@/API/github';

const { t } = useI18n();

const headers = [
  { title: t('admin.github.issues.table.title'), key: 'title', sortable: true },
  { title: t('admin.github.issues.table.status'), key: 'state', sortable: true },
  { title: t('admin.github.issues.table.labels'), key: 'labels', sortable: false },
  { title: t('admin.github.issues.table.created'), key: 'createdAt', sortable: true },
  { title: t('admin.github.issues.table.actions'), key: 'actions', sortable: false }
];

const issuesStore = useGithubIssuesStore();
const { issues, total, loading, issueStats, filters, selectedIssue, closingIssue, statsLoading } = storeToRefs(issuesStore);
const localStateFilter = ref(filters.value.state);
const localTypeFilter = ref(filters.value.labels);
const localSearchFilter = ref(filters.value.search);

const showDetails = ref(false);
const showCloseForm = ref(false);
const closeReason = ref({
  type: 'Other',
  comment: ''
});
const sanitizedContent = ref('');
const newAdminCommentText = ref('');
const submittingAdminComment = ref(false);

const authStore = useAuthStore();
const socket = useSocket();

const getStateColor = (state: string): string => {
  switch (state) {
    case 'open':
      return 'success';
    case 'closed':
      return 'error';
    default:
      return 'grey';
  }
};

const getStateIcon = (state: string): string => {
  switch (state) {
    case 'open':
      return 'mdi-checkbox-blank-circle-outline';
    case 'closed':
      return 'mdi-checkbox-marked-circle';
    default:
      return 'mdi-help-circle';
  }
};

const getTypeIcon = (type: string | undefined | null): string => {
  switch (type) {
    case 'bug':
      return 'mdi-bug';
    case 'feature':
      return 'mdi-lightbulb';
    case 'documentation':
      return 'mdi-file-document';
    default:
      return 'mdi-help-circle';
  }
};

const getTypeColor = (type: string | undefined | null): string => {
  switch (type) {
    case 'bug':
      return 'error';
    case 'feature':
      return 'success';
    case 'documentation':
      return 'info';
    default:
      return 'grey';
  }
};

const toggleIssueStatus = async (issue: GitHubIssue) => {
  if (issue.state === 'open') {
    const comment = `Closed by: ${authStore.user?.Name || authStore.user?.Email}`;
    await issuesStore.updateIssueStatus(issue.id, 'closed', { comment });
  } else {
    await issuesStore.reopenIssue(issue.id);
  }

  if (showDetails.value) {
    showDetails.value = false;
  }
};

const viewIssueDetails = async (issue: GitHubIssue) => {
  issuesStore.setSelectedIssue(issue);
  showCloseForm.value = false;
  closeReason.value = { type: 'Other', comment: '' };
  newAdminCommentText.value = '';
  submittingAdminComment.value = false;
  showDetails.value = true;
  sanitizedContent.value = await sanitizeMarkdown(issue.body || '');
};

const updatePage = (page: number) => {
  issuesStore.updateFilters({ page });
};

const formatDate = (date: string | undefined | null) => {
  if (!date) return t('myIssues.labels.na');
  try {
    return format(new Date(date), 'PPpp');
  } catch (e) {
    console.error('Error formatting date:', date, e);
    return t('myIssues.labels.na');
  }
};

const closeReasons = ['Duplicate', 'Invalid', 'wont_fix', 'Completed', 'Not Needed', 'Other'];

const sanitizeMarkdown = async (content: string): Promise<string> => {
  const preprocessed = content
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, '§PARAGRAPH§')
    .replace(/\n/g, '<br>')
    .replace(/§PARAGRAPH§/g, '\n\n');

  const rawHtml = await marked(preprocessed || '');

  return DOMPurify.sanitize(rawHtml as string, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'blockquote',
      'a',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'img'
    ],
    ALLOWED_ATTR: ['href', 'src']
  });
};

const sanitizeCommentBody = (content: string): string => {
  if (!content) return '';
  const escaped = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/\r\n|\n|\r/g, '<br />');
};

const filteredLabels = (labels: GitHubLabel[] | undefined): GitHubLabel[] => {
  if (!labels) return [];
  return labels.filter((label) => label.name.toLowerCase() !== 'helpdesk');
};

const getLabelColor = (color: string | undefined): string | undefined => {
  if (!color || color.toLowerCase() === 'ededed') {
    return undefined;
  }
  if (/^[0-9A-F]{6}$/i.test(color)) {
    return '#' + color;
  }
  return color;
};

const submitAdminComment = async () => {
  if (!selectedIssue.value || !newAdminCommentText.value.trim()) return;

  submittingAdminComment.value = true;
  try {
    await AddCommentToIssue(selectedIssue.value.id, newAdminCommentText.value.trim());
    await issuesStore.fetchIssues();
    newAdminCommentText.value = '';
  } catch (error) {
    console.error('Failed to submit admin comment:', error);
  } finally {
    submittingAdminComment.value = false;
  }
};

const isCloseFormValid = computed(() => {
  return !!closeReason.value.type && closeReason.value.comment.trim().length >= 3;
});

const confirmClose = async () => {
  if (!isCloseFormValid.value || !selectedIssue.value) return;

  const success = await issuesStore.closeIssue(selectedIssue.value.id, closeReason.value.type, closeReason.value.comment.trim());

  if (success) {
    showDetails.value = false;
    showCloseForm.value = false;
    closeReason.value = { type: 'Other', comment: '' };
  }
};

const handleReopenIssue = async () => {
  if (!selectedIssue.value) return;

  const success = await issuesStore.reopenIssue(selectedIssue.value.id);
  if (success) {
    showDetails.value = false;
  }
};

const debounceTimer = ref<NodeJS.Timeout | null>(null);
watch([localStateFilter, localTypeFilter, localSearchFilter], ([newState, newType, newSearch]) => {
  if (debounceTimer.value) clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    issuesStore.applyFilters({
      state: newState || undefined,
      labels: newType || undefined,
      search: newSearch || undefined
    });
  }, 300);
});

watch(
  () => ({
    state: filters.value.state,
    labels: filters.value.labels,
    search: filters.value.search
  }),
  (storeFilters) => {
    if (localStateFilter.value !== storeFilters.state) {
      localStateFilter.value = storeFilters.state;
    }
    if (localTypeFilter.value !== storeFilters.labels) {
      localTypeFilter.value = storeFilters.labels;
    }
    if (localSearchFilter.value !== storeFilters.search) {
      localSearchFilter.value = storeFilters.search;
    }
  },
  { deep: true }
);

onMounted(() => {
  issuesStore.fetchIssues();
  issuesStore.fetchStats();

  socket.on('issue:created', () => {
    console.log('Socket event: issue:created received');
    Promise.all([issuesStore.fetchIssues(), issuesStore.fetchStats()]);
  });

  socket.on('issue:updated', () => {
    console.log('Socket event: issue:updated received');
    Promise.all([issuesStore.fetchIssues(), issuesStore.fetchStats()]);
  });
});
</script>

<style scoped>
.stat-card {
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.05);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

:deep(.v-data-table) {
  background-color: rgb(var(--v-theme-surface));
  border-radius: 8px;
}

.markdown-body {
  background-color: transparent;
  padding: 16px;
  border-radius: 8px;
}

.markdown-body :deep(a) {
  color: rgb(var(--v-theme-primary));
}

.markdown-body :deep(code) {
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  padding: 2px 4px;
  border-radius: 4px;
}

.markdown-body :deep(pre) {
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid rgba(var(--v-theme-primary), 0.5);
  margin: 0;
  padding-left: 16px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
