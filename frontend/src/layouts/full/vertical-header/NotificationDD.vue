<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNotificationStore } from '@/stores/notificationStore';
import { LinkIcon } from 'vue-tabler-icons';
import { useI18n } from 'vue-i18n';

interface Notification {
  id: string;
  type: 'system' | 'toast';
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  url?: string;
  isBroadcast: boolean;
}

const notificationStore = useNotificationStore();
const i18n = useI18n();
const notificationDD = ref([
  i18n.t('notificationPage.all_notifications'),
  i18n.t('notificationPage.system'),
  i18n.t('notificationPage.toast')
]);
const selectNotify = ref<string>(i18n.t('notificationPage.all_notifications'));
const loading = ref(false);

const activeNotifications = computed(() => {
  const notifications = notificationStore.notifications as Notification[];

  switch (selectNotify.value) {
    case i18n.t('notificationPage.system'):
      return notifications.filter((n) => n.type === 'system');
    case i18n.t('notificationPage.toast'):
      return notifications.filter((n) => n.type === 'toast');
    default:
      return notifications;
  }
});

const markAllAsRead = async () => {
  if (activeNotifications.value.length > 0) {
    loading.value = true;
    try {
      await notificationStore.markAllAsRead();
    } finally {
      loading.value = false;
    }
  }
};

const handleClick = (url: string) => {
  if (url) {
    window.open(url, '_blank');
  }
};

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!-- notifications DD -->
  <!-- ---------------------------------------------- -->
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-3">
      <h6 class="text-subtitle-1">
        {{ $t('notificationPage.all_notifications') }}
        <v-chip v-if="activeNotifications.length" color="warning" variant="flat" size="small" class="ml-2 text-white">
          {{ activeNotifications.length }}
        </v-chip>
      </h6>
      <a
        v-if="activeNotifications.length"
        href="#"
        class="text-decoration-underline text-primary text-subtitle-2"
        @click.prevent="markAllAsRead"
        :class="{ 'disabled': loading }"
      >
        <v-progress-circular
          v-if="loading"
          indeterminate
          size="16"
          width="2"
          color="primary"
          class="mr-2"
        ></v-progress-circular>
        {{ $t('notificationPage.mark_all_read') }}
      </a>
    </div>
    <!--<v-select :items="notificationDD" v-model="selectNotify" color="primary" variant="outlined" density="default" hide-details></v-select>-->
  </div>
  <v-divider></v-divider>
  <v-list class="py-0" lines="three">
    <template v-if="activeNotifications.length">
      <v-list-item
        v-for="notification in activeNotifications"
        :key="notification.id"
        value=""
        color="secondary"
        class="no-spacer"
        :class="{ 'clickable-notification': notification.url }"
      >
        <template v-slot:prepend>
          <v-avatar size="40" class="mr-3 py-2">
            <v-icon :color="notification.type === 'system' ? 'primary' : 'warning'" size="24">
              {{ notification.type === 'system' ? 'mdi-information' : 'mdi-bell' }}
            </v-icon>
          </v-avatar>
        </template>
        <div class="d-inline-flex align-center justify-space-between w-100">
          <div class="notification-content" :class="{ 'has-link': notification.url }">
            <div v-if="notification.url" class="notification-link" @click.stop="() => notification.url && handleClick(notification.url)">
              <h6 class="text-subtitle-1 font-weight-regular d-flex align-center">
                {{ $t('notificationPage.notification') }}
                <v-chip v-if="notification.isBroadcast" color="info" size="x-small" class="ml-2" variant="flat">
                  {{ $t('notificationPage.announcement') }}
                </v-chip>
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" size="16" color="primary" class="ml-2">
                      <LinkIcon />
                    </v-icon>
                  </template>
                  <span>{{ $t('notificationPage.click_to_open') }}</span>
                </v-tooltip>
              </h6>
              <span class="text-subtitle-2 text-medium-emphasis notification-message">{{ notification.message }}</span>
            </div>
            <div v-else>
              <h6 class="text-subtitle-1 font-weight-regular d-flex align-center">
                {{ $t('notificationPage.notification') }}
                <v-chip v-if="notification.isBroadcast" color="info" size="x-small" class="ml-2" variant="flat">
                  {{ $t('notificationPage.announcement') }}
                </v-chip>
              </h6>
              <span class="text-subtitle-2 text-medium-emphasis">{{ notification.message }}</span>
            </div>
          </div>
          <div class="d-flex flex-column align-end">
            <span class="text-subtitle-2 text-medium-emphasis">{{ formatDate(notification.createdAt) }}</span>
            <v-btn
              v-if="!notification.read"
              size="small"
              variant="text"
              color="primary"
              @click.stop="notificationStore.markAsRead(notification.id)"
            >
              {{ $t('notificationPage.mark_as_read') }}
            </v-btn>
          </div>
        </div>
      </v-list-item>
    </template>
    <v-list-item v-else value="" class="no-spacer">
      <div class="text-center w-100 py-4 text-medium-emphasis">{{ $t('notificationPage.no_notifications') }}</div>
    </v-list-item>
  </v-list>
</template>

<style scoped>
.no-spacer {
  margin: 0;
  padding: 8px 16px;
}

.notification-content {
  flex-grow: 1;
  margin-right: 16px;
}

.notification-content.has-link .notification-link {
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-content.has-link .notification-link:hover {
  color: var(--v-theme-primary);
}

.notification-content.has-link .notification-link:hover .notification-message {
  color: var(--v-theme-primary);
}

.notification-message {
  transition: color 0.2s ease;
}
</style>
