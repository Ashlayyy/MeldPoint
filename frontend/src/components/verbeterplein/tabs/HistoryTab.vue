<template>
  <div class="history-container">
    <div class="history-header">
      <h3 class="history-title">{{ $t('verbeterplein.showItem.tabs.history') }}</h3>
      <div class="history-stats">
        <v-chip size="small" color="primary" class="mr-2"
          >{{ timelineItems.length }} {{ $t('verbeterplein.showItem.history.events_count') }}</v-chip
        >
        <v-chip v-if="item?.Correctief?.id" size="small" color="info" class="mr-2">{{
          $t('verbeterplein.showItem.history.correctief')
        }}</v-chip>
        <v-chip v-if="item?.Preventief?.id" size="small" color="secondary">{{ $t('verbeterplein.showItem.history.preventief') }}</v-chip>
      </div>
    </div>

    <div class="history-list" v-if="timelineItems.length > 0">
      <v-card
        v-for="(item, index) in timelineItems"
        :key="index"
        class="history-card mb-3"
        :class="{ 'history-card-expanded': expandedItems[index] }"
      >
        <div class="history-card-header" :class="{ 'history-error': !item.success }">
          <div class="d-flex align-center">
            <v-avatar size="32" :color="item.color" class="mr-3">
              <v-icon color="white">{{ getActionIcon(item.event) }}</v-icon>
            </v-avatar>
            <div>
              <div class="history-card-title">
                {{ $t(`verbeterplein.showItem.history.actions.${item.event}`) }}
              </div>
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <div class="history-card-subtitle" v-bind="props">
                    {{ formatTimeDisplay(item.timestamp) }}
                  </div>
                </template>
                {{ formatFullDate(item.timestamp) }}
              </v-tooltip>
            </div>
          </div>
          <v-btn icon @click="toggleExpand(index)" size="small">
            <v-icon>{{ expandedItems[index] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </v-btn>
        </div>

        <div class="history-card-content">
          <div class="history-card-user">
            <v-icon size="small" color="grey" class="mr-2">mdi-account</v-icon>
            {{ $t('verbeterplein.showItem.history.by_user', { name: item.person }) }}
            <span v-if="item.metadata?.department" class="department-tag ml-1"> ({{ item.metadata.department }}) </span>
          </div>

          <div class="request-info-bar" v-if="hasRequestInfo(item)">
            <div class="request-info-item" v-if="item.method">
              <v-chip size="x-small" :color="getMethodColor(item.method)" class="mr-1">{{ item.method }}</v-chip>
            </div>
            <div class="request-info-item" v-if="item.resourceType">
              <span class="resource-type">{{ item.resourceType }}</span>
            </div>
            <div class="request-info-item ml-auto" v-if="item.metadata?.statusCode">
              <v-chip size="x-small" :color="getStatusColor(item.metadata.statusCode)">
                {{ item.metadata.statusCode }}
              </v-chip>
            </div>
          </div>

          <div v-if="hasCorrespondenceFiles(item)" class="history-card-changes">
            <div @click="toggleFilesDetails(index)" class="history-changes-toggle">
              <v-icon size="small" class="mr-1">{{ showFilesDetails[index] ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
              {{ $t('verbeterplein.showItem.history.view_files') || 'View Files' }}
            </div>

            <v-expand-transition>
              <div v-if="showFilesDetails[index]" class="history-changes-details">
                <div class="correspondence-files">
                  <div class="correspondence-heading">
                    <v-icon size="small" color="primary" class="mr-2">mdi-file-document-outline</v-icon>
                    {{ $t('verbeterplein.showItem.history.correspondence_files') || 'Correspondence Files' }}
                  </div>
                  <div v-for="(file, fileIdx) in getCorrespondenceFiles(item)" :key="fileIdx" class="correspondence-file">
                    <div class="d-flex align-center">
                      <v-icon size="small" :color="getFileIconColor(file?.type)">{{ getFileIcon(file?.type) }}</v-icon>
                      <div class="file-name ml-2">{{ file?.name }}</div>
                    </div>
                    <div class="file-details">
                      <span class="file-size">{{ formatFileSize(file?.size) }}</span>
                      <span class="file-type ml-2">{{ file?.type }}</span>
                    </div>
                    <div class="file-actions mt-1" v-if="file?.url && item.method !== 'DELETE'">
                      <a :href="file?.url" target="_blank" class="file-link">
                        <v-icon size="x-small" class="mr-1">mdi-open-in-new</v-icon>
                        {{ $t('verbeterplein.showItem.history.view_file') || 'View File' }}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </v-expand-transition>
          </div>

          <div v-if="hasChangeDetails(item)" class="history-card-changes">
            <div @click="toggleChangeDetails(index)" class="history-changes-toggle">
              <v-icon size="small" class="mr-1">{{ showChangeDetails[index] ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
              {{ $t('verbeterplein.showItem.history.view_changes') }}
            </div>

            <v-expand-transition>
              <div v-if="showChangeDetails[index]" class="history-changes-details">
                <div v-for="(change, changeIdx) in parseChanges(item.details)" :key="changeIdx" class="change-item">
                  <div class="change-field">{{ change.field }}</div>
                  <div class="change-values">
                    <div class="change-value-old">
                      <div class="change-label">{{ $t('verbeterplein.showItem.history.before') }}:</div>
                      <div class="change-text">{{ change.oldValue || $t('verbeterplein.showItem.history.empty') }}</div>
                    </div>
                    <v-icon class="change-arrow">mdi-arrow-right</v-icon>
                    <div class="change-value-new">
                      <div class="change-label">{{ $t('verbeterplein.showItem.history.after') }}:</div>
                      <div class="change-text">{{ change.newValue || $t('verbeterplein.showItem.history.empty') }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </v-expand-transition>
          </div>

          <v-expand-transition>
            <div v-if="expandedItems[index]" class="history-card-expanded-content">
              <v-divider class="my-3"></v-divider>

              <div class="history-metadata-section" v-if="hasEnvironmentInfo(item)">
                <div class="history-metadata-heading">
                  <v-icon size="small" color="primary" class="mr-2">mdi-information-outline</v-icon>
                  {{ $t('verbeterplein.showItem.history.request_info') }}
                </div>

                <div class="info-panel">
                  <div class="info-row" v-if="item.metadata?.environment">
                    <div class="info-label">{{ $t('verbeterplein.showItem.history.environment') }}</div>
                    <div class="info-value">{{ item.metadata.environment }}</div>
                  </div>

                  <div class="info-row" v-if="item.metadata?.version">
                    <div class="info-label">{{ $t('verbeterplein.showItem.history.version') }}</div>
                    <div class="info-value">{{ item.metadata.version }}</div>
                  </div>

                  <div class="info-row" v-if="item.metadata?.executionTime">
                    <div class="info-label">{{ $t('verbeterplein.showItem.history.execution_time') }}</div>
                    <div class="info-value">{{ item.metadata.executionTime }}ms</div>
                  </div>
                </div>
              </div>

              <div class="history-metadata-section" v-if="hasEndpointOrMethodInfo(item)">
                <div class="history-metadata-heading">
                  <v-icon size="small" color="primary" class="mr-2">mdi-code-tags</v-icon>
                  {{ $t('verbeterplein.showItem.history.technical_details') }}
                </div>

                <div class="code-panel">
                  <div class="endpoint-display" v-if="item.endpoint || item.metadata?.endpoint">
                    <div class="endpoint-method" :class="getMethodClass(item.method || '')">{{ item.method }}</div>
                    <div class="endpoint-path">{{ item.endpoint || item.metadata?.endpoint }}</div>
                  </div>

                  <v-expansion-panels class="mt-2" v-if="hasDetailedTechnicalInfo(item)">
                    <v-expansion-panel class="technical-details-panel">
                      <v-expansion-panel-title class="py-2">
                        <div class="d-flex align-center">
                          <v-icon size="small" color="primary" class="mr-2">mdi-information-outline</v-icon>
                          <span class="text-subtitle-2">{{ $t('verbeterplein.showItem.history.advanced_details') }}</span>
                        </div>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <div class="technical-details-grid">
                          <div class="tech-detail-section">
                            <div class="tech-section-title">
                              <v-icon size="small" color="primary" class="mr-1">mdi-send-outline</v-icon>
                              {{ $t('verbeterplein.showItem.history.request_details') }}
                            </div>
                            <div class="info-row" v-if="item.id">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.id') }}</div>
                              <div class="info-value mono">{{ item.id }}</div>
                            </div>
                            <div class="info-row" v-if="item.correlationID">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.correlation_id') }}</div>
                              <div class="info-value mono">{{ item.correlationID }}</div>
                            </div>
                            <div class="info-row" v-if="item.metadata?.apiVersion">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.api_version') }}</div>
                              <div class="info-value">{{ item.metadata.apiVersion }}</div>
                            </div>
                            <div class="info-row" v-if="item.metadata?.preventiefId">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.preventief_id') }}</div>
                              <div class="info-value mono">{{ item.metadata.preventiefId }}</div>
                            </div>
                            <div class="info-row" v-if="item.metadata?.correctiefId">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.correctief_id') }}</div>
                              <div class="info-value mono">{{ item.metadata.correctiefId }}</div>
                            </div>
                            <div class="info-row" v-if="item.resourceId">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.resource_id') }}</div>
                              <div class="info-value mono">{{ item.resourceId }}</div>
                            </div>
                            <div class="info-row" v-if="item.resourceType">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.resource_type') }}</div>
                              <div class="info-value">
                                <v-chip size="x-small" color="primary" variant="flat" class="text-uppercase">
                                  {{ item.resourceType }}
                                </v-chip>
                              </div>
                            </div>
                          </div>

                          <div class="tech-detail-section">
                            <div class="tech-section-title">
                              <v-icon size="small" color="primary" class="mr-1">mdi-reply-outline</v-icon>
                              {{ $t('verbeterplein.showItem.history.response_details') }}
                            </div>
                            <div class="info-row" v-if="item.metadata?.responseStatus || item.metadata?.statusCode">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.status_code') }}</div>
                              <div class="info-value">
                                <v-chip
                                  size="x-small"
                                  :color="getStatusColor(item.metadata.responseStatus || item.metadata.statusCode)"
                                  variant="flat"
                                >
                                  {{ item.metadata.responseStatus || item.metadata.statusCode }}
                                </v-chip>
                              </div>
                            </div>
                            <div class="info-row" v-if="item.metadata?.responseTime || item.metadata?.executionTimeMs">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.response_time') }}</div>
                              <div class="info-value">
                                <v-icon size="x-small" color="grey-darken-1" class="mr-1">mdi-clock-outline</v-icon>
                                {{ item.metadata.responseTime || item.metadata.executionTimeMs }}ms
                              </div>
                            </div>
                            <div class="info-row" v-if="item.metadata?.contentLength">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.content_length') }}</div>
                              <div class="info-value">
                                <v-icon size="x-small" color="grey-darken-1" class="mr-1">mdi-file-outline</v-icon>
                                {{ formatBytes(item.metadata.contentLength) }}
                              </div>
                            </div>
                            <div class="info-row" v-if="item.metadata?.resultCount !== undefined">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.result_count') }}</div>
                              <div class="info-value">
                                <v-icon size="x-small" color="grey-darken-1" class="mr-1">mdi-format-list-numbered</v-icon>
                                {{ item.metadata.resultCount }}
                              </div>
                            </div>
                            <div class="info-row" v-if="item.metadata?.executionTime">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.execution_time') }}</div>
                              <div class="info-value">
                                <v-icon size="x-small" color="grey-darken-1" class="mr-1">mdi-timer-outline</v-icon>
                                {{ item.metadata.executionTime.toFixed(2) }}ms
                              </div>
                            </div>
                          </div>

                          <div class="tech-detail-section">
                            <div class="tech-section-title">
                              <v-icon size="small" color="primary" class="mr-1">mdi-account-outline</v-icon>
                              {{ $t('verbeterplein.showItem.history.user_details') }}
                            </div>
                            <div class="info-row" v-if="item.userId">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.user_id') }}</div>
                              <div class="info-value mono">{{ item.userId }}</div>
                            </div>
                            <div class="info-row" v-if="item.userEmail">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.user_email') }}</div>
                              <div class="info-value">{{ item.userEmail }}</div>
                            </div>
                            <div class="info-row" v-if="item.ipAddress">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.ip_address') }}</div>
                              <div class="info-value">
                                <v-chip size="x-small" color="grey" variant="flat">{{ item.ipAddress }}</v-chip>
                              </div>
                            </div>
                            <div class="info-row" v-if="item.sessionId">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.session_id') }}</div>
                              <div class="info-value mono">{{ item.sessionId }}</div>
                            </div>
                            <div class="info-row" v-if="item.userAgent">
                              <div class="info-label">{{ $t('verbeterplein.showItem.history.user_agent') }}</div>
                              <div class="info-value user-agent">{{ item.userAgent }}</div>
                            </div>
                          </div>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </div>
              </div>

              <div class="history-metadata-section" v-if="item.timestamp">
                <div class="history-metadata-heading">
                  <v-icon size="small" color="primary" class="mr-2">mdi-clock-outline</v-icon>
                  {{ $t('verbeterplein.showItem.history.timing') }}
                </div>

                <div class="info-panel">
                  <div class="info-row">
                    <div class="info-label">{{ $t('verbeterplein.showItem.history.timestamp') }}</div>
                    <div class="info-value">{{ formatFullDate(item.timestamp) }}</div>
                  </div>

                  <div class="info-row" v-if="item.metadata?.requestedAt">
                    <div class="info-label">{{ $t('verbeterplein.showItem.history.requested_at') }}</div>
                    <div class="info-value">{{ formatFullDate(item.metadata.requestedAt) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </v-expand-transition>
        </div>
      </v-card>
    </div>

    <div v-else class="history-empty">
      <v-icon size="64" color="grey-lighten-2">mdi-history</v-icon>
      <div class="history-empty-text">{{ $t('verbeterplein.showItem.history.no_history') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useHistoryStore } from '@/stores/verbeterplein/history_store';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
import { formatDateHistory } from '@/utils/helpers/dateHelpers';
import { useI18n } from 'vue-i18n';

const historyStore = useHistoryStore();
const statusStore = useStatusStore();
const expandedItems = ref<Record<number, boolean>>({});
const showChangeDetails = ref<Record<number, boolean>>({});
const showFilesDetails = ref<Record<number, boolean>>({});
const statusCache = reactive<Record<string, string>>({});
const { t } = useI18n();

interface TimelineItem {
  date: string;
  event: string;
  person: string;
  details: string;
  color: string | undefined;
  metadata: any;
  success: boolean;
  endpoint?: string;
  method?: string;
  resourceType?: string;
  timestamp: string;
  id?: string;
  correlationID?: string;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  sessionId?: string;
  userAgent?: string;
  changesData?: string;
  changeCount?: number;
  changedFieldNames?: string[];
  errorStack?: string | null;
  errorCode?: string | null;
  action?: string;
}

interface ChangeDetail {
  field: string;
  oldValue: string;
  newValue: string;
}

const props = defineProps({
  item: {
    type: Object as () => Record<string, any>,
    default: () => ({})
  }
});

const timelineItems = computed((): TimelineItem[] => {
  return historyStore.currentHistory.map((item: any) => ({
    id: item.id,
    date: formatDateHistory(new Date(item.timestamp)),
    event: item.action.toLowerCase(),
    person: item.userName || item.userEmail || 'System',
    details: historyStore.getActionDetails(item),
    color: item.success ? item.color : 'error',
    metadata: item.metadata,
    success: item.success,
    endpoint: item.endpoint,
    method: item.method,
    resourceType: item.resourceType,
    timestamp: item.timestamp,
    correlationID: item.correlationID,
    resourceId: item.resourceId,
    userId: item.userId,
    userEmail: item.userEmail,
    ipAddress: item.ipAddress,
    sessionId: item.sessionId,
    userAgent: item.userAgent,
    changesData: item.changesData,
    changeCount: item.changeCount,
    changedFieldNames: item.changedFieldNames,
    errorStack: item.errorStack,
    errorCode: item.errorCode,
    action: item.action
  }));
});

const toggleExpand = (index: number) => {
  expandedItems.value[index] = !expandedItems.value[index];
};

const toggleChangeDetails = (index: number) => {
  showChangeDetails.value[index] = !showChangeDetails.value[index];
};

const toggleFilesDetails = (index: number) => {
  showFilesDetails.value[index] = !showFilesDetails.value[index];
};

const formatTimeDisplay = (timestamp: string) => {
  if (!timestamp) return t('verbeterplein.showItem.history.unknown_time');

  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    if (diffHours < 1) {
      return t('verbeterplein.showItem.history.minutes_ago', { minutes: diffMinutes });
    }
    return t('verbeterplein.showItem.history.hours_ago', { hours: diffHours });
  } else if (diffDays === 1) {
    return t('verbeterplein.showItem.history.yesterday');
  } else {
    return formatDateHistory(date);
  }
};

const formatFullDate = (dateString: string) => {
  if (!dateString) return t('verbeterplein.showItem.history.unknown_time');
  const date = new Date(dateString);
  return date.toLocaleString();
};

const getActionIcon = (action: string) => {
  const iconMap: Record<string, string> = {
    create: 'mdi-plus-circle',
    update: 'mdi-pencil',
    delete: 'mdi-delete',
    archive: 'mdi-archive',
    status_change: 'mdi-refresh',
    add_correspondence: 'mdi-file-plus',
    remove_correspondence: 'mdi-file-remove',
    add_comment: 'mdi-comment-plus',
    get_system_logs: 'mdi-database-search',
    get_single_report: 'mdi-file-document',
    default: 'mdi-history'
  };

  for (const key in iconMap) {
    if (action.includes(key)) {
      return iconMap[key];
    }
  }
  return iconMap.default;
};

const getStatusColor = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) {
    return 'success';
  } else if (statusCode >= 300 && statusCode < 400) {
    return 'info';
  } else if (statusCode >= 400 && statusCode < 500) {
    return 'warning';
  } else if (statusCode >= 500) {
    return 'error';
  } else {
    return 'grey';
  }
};

const getMethodColor = (method: string) => {
  const methodColors: Record<string, string> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    PATCH: 'secondary',
    DELETE: 'error'
  };
  return methodColors[method] || 'grey';
};

const getMethodClass = (method: string) => {
  if (!method) return 'method-unknown';
  return `method-${method.toLowerCase()}`;
};

const hasEndpointOrMethodInfo = (item: TimelineItem) => {
  return !!(
    item.endpoint ||
    item.method ||
    (item.metadata &&
      (item.metadata.endpoint ||
        item.metadata.method ||
        item.metadata.statusCode ||
        item.metadata.executionTime ||
        item.metadata.environment ||
        item.metadata.version))
  );
};

const hasEnvironmentInfo = (item: TimelineItem) => {
  return !!(item.metadata?.environment || item.metadata?.version || item.metadata?.executionTime || item.metadata?.statusCode);
};

const hasRequestInfo = (item: TimelineItem) => {
  return !!(item.method || item.resourceType || item.metadata?.statusCode);
};

const hasChangeDetails = (item: TimelineItem) => {
  return !!item.details && item.details.includes('→');
};

const hasCorrespondenceFiles = (item: TimelineItem) => {
  return !!(
    item.event.toLowerCase().includes('correspondence') &&
    item.metadata?.correspondence &&
    Array.isArray(item.metadata.correspondence) &&
    item.metadata.correspondence.length > 0
  );
};

const getCorrespondenceFiles = (item: TimelineItem) => {
  if (!hasCorrespondenceFiles(item)) return [];
  return item.metadata.correspondence;
};

const getFileIcon = (fileType: string) => {
  if (!fileType) return 'mdi-file-outline';

  if (fileType.includes('pdf')) return 'mdi-file-pdf-box';
  if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg'))
    return 'mdi-file-image';
  if (fileType.includes('word') || fileType.includes('doc')) return 'mdi-file-word';
  if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xls')) return 'mdi-file-excel';
  if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('ppt')) return 'mdi-file-powerpoint';
  if (fileType.includes('zip') || fileType.includes('compressed')) return 'mdi-file-zip';

  return 'mdi-file-outline';
};

const getFileIconColor = (fileType: string) => {
  if (!fileType) return 'grey';

  if (fileType.includes('pdf')) return 'red';
  if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg')) return 'green';
  if (fileType.includes('word') || fileType.includes('doc')) return 'blue';
  if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xls')) return 'green';
  if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('ppt')) return 'orange';

  return 'grey';
};

const formatFileSize = (sizeInBytes: number) => {
  if (!sizeInBytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

const lookupStatusName = async (id: string): Promise<string> => {
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return id;
  }

  if (statusCache[id]) {
    return statusCache[id];
  }

  statusCache[id] = 'Loading...';

  if (!statusStore.initialized) {
    await statusStore.initialize();
  }

  const foundStatus = statusStore.statusListCorrectief.find((status: any) => status.id === id);
  if (foundStatus) {
    statusCache[id] = foundStatus.StatusNaam;
    return foundStatus.StatusNaam;
  }

  statusCache[id] = '[ID]';
  return '[ID]';
};

const parseChanges = (details: string): ChangeDetail[] => {
  if (!details) return [];

  const changes: ChangeDetail[] = [];
  const fieldRegex = /^([^:]+):\s*(.+?)\s*→\s*(.+?)(?=\n[^:]+:|$)/gms;

  let match;
  while ((match = fieldRegex.exec(details))) {
    const field = match[1].trim();
    let oldValue = match[2].trim();
    let newValue = match[3].trim();

    if (field === 'StatusID') {
      continue;
    }

    const isStatusField = field.toLowerCase().includes('status');
    const oldValueIsId = /^[a-f\d]{24}$/i.test(oldValue);
    const newValueIsId = /^[a-f\d]{24}$/i.test(newValue);

    if (field.toLowerCase() === 'id') {
      continue;
    }

    if (isStatusField && (oldValueIsId || newValueIsId)) {
      if (oldValueIsId) {
        oldValue = statusCache[oldValue] || 'Loading...';
        if (oldValue === 'Loading...') {
          lookupStatusName(match[2].trim());
        }
      }

      if (newValueIsId) {
        newValue = statusCache[newValue] || 'Loading...';
        if (newValue === 'Loading...') {
          lookupStatusName(match[3].trim());
        }
      }
    } else if (field.toLowerCase().includes('id') || oldValueIsId || newValueIsId) {
      continue;
      //if (field.toLowerCase().includes('id') || oldValueIsId) oldValue = '[ID]';
      //if (field.toLowerCase().includes('id') || newValueIsId) newValue = '[ID]';
    }

    changes.push({ field, oldValue, newValue });
  }

  if (changes.length === 0 && details.trim()) {
    return [{ field: details.trim(), oldValue: '', newValue: '' }];
  }

  return changes;
};

const hasDetailedTechnicalInfo = (item: TimelineItem) => {
  return !!(
    item.correlationID ||
    item.resourceId ||
    item.userId ||
    item.userEmail ||
    item.ipAddress ||
    item.sessionId ||
    item.userAgent ||
    (item.metadata &&
      (item.metadata.responseTime ||
        item.metadata.contentLength ||
        item.metadata.resultCount ||
        item.metadata.apiVersion ||
        item.metadata.preventiefId ||
        item.metadata.correctiefId))
  );
};

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

onMounted(async () => {
  if (props.item?.id) {
    await historyStore.getHistory(props.item.id, props.item?.Preventief?.id, props.item?.Correctief?.id);

    if (!statusStore.initialized) {
      await statusStore.initialize();
    }

    timelineItems.value.forEach((item, index) => {
      //console.log('item', item);
      // Auto-expand file details for correspondence items
      if (hasCorrespondenceFiles(item)) {
        showFilesDetails.value[index] = true;
      }

      if (item.details) {
        const fieldRegex = /^([^:]+):\s*(.+?)\s*→\s*(.+?)(?=\n[^:]+:|$)/gms;
        let match;
        while ((match = fieldRegex.exec(item.details))) {
          const field = match[1].trim();
          const oldValue = match[2].trim();
          const newValue = match[3].trim();

          if (field.toLowerCase().includes('status')) {
            if (/^[a-f\d]{24}$/i.test(oldValue)) {
              lookupStatusName(oldValue);
            }
            if (/^[a-f\d]{24}$/i.test(newValue)) {
              lookupStatusName(newValue);
            }
          }
        }
      }
    });
  }
});
</script>

<style scoped lang="scss">
.history-container {
  padding: 16px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .history-title {
    font-size: 1.2rem;
    font-weight: 500;
    margin: 0;
  }
}

.history-list {
  max-height: 600px;
  overflow-y: auto;
}

.history-card {
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

  &-expanded {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: rgb(245, 245, 245);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    &.history-error {
      background-color: rgba(244, 67, 54, 0.1);
    }
  }

  &-title {
    font-weight: 500;
    font-size: 0.95rem;
  }

  &-subtitle {
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.6);
  }

  &-content {
    padding: 12px 16px;
  }

  &-user {
    display: flex;
    align-items: center;
    font-size: 0.85rem;
    color: rgba(0, 0, 0, 0.7);
    margin-bottom: 8px;
  }

  &-expanded-content {
    margin-top: 16px;
  }

  &-changes {
    margin-top: 12px;
  }
}

.request-info-bar {
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  padding: 6px 10px;
  margin: 8px 0;
  font-size: 0.8rem;

  .request-info-item {
    display: flex;
    align-items: center;
    margin-right: 12px;
  }

  .resource-type {
    color: rgba(0, 0, 0, 0.7);
    font-weight: 500;
  }
}

.department-tag {
  font-style: italic;
  color: rgba(0, 0, 0, 0.5);
}

.history-changes-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.85rem;
  color: rgba(var(--v-theme-primary), 0.8);
  padding: 4px 0;

  &:hover {
    color: rgb(var(--v-theme-primary));
  }
}

.history-changes-details {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.change-item {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  .change-field {
    font-weight: 500;
    font-size: 0.9rem;
    margin-bottom: 4px;
    color: rgba(0, 0, 0, 0.8);
  }

  .change-values {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .change-value-old,
  .change-value-new {
    flex: 1;
    min-width: 200px;
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 4px;
    padding: 8px;
  }

  .change-value-old {
    border-left: 3px solid rgba(244, 67, 54, 0.5);
  }

  .change-value-new {
    border-left: 3px solid rgba(76, 175, 80, 0.5);
  }

  .change-label {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.5);
    margin-bottom: 3px;
  }

  .change-text {
    font-size: 0.85rem;
    word-break: break-word;
  }

  .change-arrow {
    color: rgba(0, 0, 0, 0.3);
  }
}

.history-metadata {
  &-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &-heading {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 8px;
  }
}

.info-panel {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  padding: 10px;

  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 6px;

    &:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      min-width: 120px;
      margin-right: 8px;
    }

    .info-value {
      font-size: 0.85rem;
    }
  }
}

.code-panel {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  font-family: monospace;
  overflow: hidden;

  .endpoint-display {
    display: flex;
    align-items: stretch;

    .endpoint-method {
      background-color: rgba(0, 0, 0, 0.2);
      color: white;
      padding: 8px 12px;
      font-weight: bold;
      font-size: 0.8rem;
    }

    .endpoint-path {
      padding: 8px 12px;
      font-size: 0.8rem;
      overflow-x: auto;
      white-space: nowrap;
      flex: 1;
    }
  }
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: rgba(0, 0, 0, 0.5);

  &-text {
    margin-top: 16px;
    font-size: 0.95rem;
  }
}

.correspondence-files {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  padding: 12px;
}

.correspondence-heading {
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.correspondence-file {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.file-name {
  font-weight: 500;
  font-size: 0.85rem;
}

.file-details {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

.file-link {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-primary), 0.8);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

:deep(.v-theme--dark) {
  .history-card {
    &-header {
      background-color: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);

      &.history-error {
        background-color: rgba(244, 67, 54, 0.2);
      }
    }

    &-subtitle {
      color: rgba(255, 255, 255, 0.6);
    }

    &-user {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .request-info-bar {
    background-color: rgba(255, 255, 255, 0.05);

    .resource-type {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .department-tag {
    color: rgba(255, 255, 255, 0.5);
  }

  .history-changes-details {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .change-item {
    .change-field {
      color: rgba(255, 255, 255, 0.8);
    }

    .change-value-old,
    .change-value-new {
      background-color: rgba(255, 255, 255, 0.05);
    }

    .change-label {
      color: rgba(255, 255, 255, 0.5);
    }

    .change-arrow {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  .info-panel,
  .code-panel {
    background-color: rgba(255, 255, 255, 0.05);

    .info-row .info-label {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .code-panel .endpoint-method {
    background-color: rgba(0, 0, 0, 0.3);
  }

  .history-empty {
    color: rgba(255, 255, 255, 0.5);
  }

  .correspondence-files {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .correspondence-file {
    background-color: rgba(255, 255, 255, 0.07);
  }

  .file-details {
    color: rgba(255, 255, 255, 0.6);
  }

  .file-link {
    color: rgba(var(--v-theme-primary), 0.8);
  }
}

.technical-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  padding: 8px 4px;
}

.tech-detail-section {
  margin-bottom: 16px;
}

.tech-section-title {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 12px;
  color: rgba(var(--v-theme-primary), 0.9);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding-bottom: 6px;
  display: flex;
  align-items: center;
}

.mono {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8rem;
  letter-spacing: -0.3px;
  overflow-wrap: break-word;
  word-break: break-all;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.user-agent {
  font-size: 0.75rem;
  white-space: normal;
  word-break: break-word;
  color: rgba(var(--v-theme-on-surface), 0.7);
  padding: 6px 8px;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
  line-height: 1.4;
  width: 100%;
}

.endpoint-display {
  display: flex;
  align-items: center;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.endpoint-method {
  font-weight: 600;
  font-size: 0.75rem;
  padding: 4px 8px;
  color: white;
  min-width: 60px;
  text-align: center;
}

.method-get {
  background-color: #2196f3;
}

.method-post {
  background-color: #4caf50;
}

.method-put,
.method-patch {
  background-color: #ff9800;
}

.method-delete {
  background-color: #f44336;
}

.method-unknown {
  background-color: #9e9e9e;
}

.endpoint-path {
  padding: 4px 12px;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.technical-details-panel {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 6px;
}

.info-row {
  display: flex;
  margin-bottom: 6px;
  padding: 2px 0;
}

.info-label {
  flex: 0 0 40%;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  padding-right: 8px;
}

.info-value {
  flex: 0 0 60%;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
}
</style>
