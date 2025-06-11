<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';
import { useAuthStore } from '../../../stores/auth';
import { useTaskStore } from '@/stores/task_store';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePageStore } from '@/stores/pageStore';
import { HelpSquareRoundedIcon, SettingsIcon, LanguageIcon, Menu2Icon, BellIcon, ListCheckIcon } from 'vue-tabler-icons';
import userNameSplit from '@/utils/userNameSplit';

import LanguageDD from './LanguageDD.vue';
import ProfileDD from './ProfileDD.vue';
import NotificationDD from './NotificationDD.vue';

const customizer = useCustomizerStore();
const auth = useAuthStore();
const taskStore = useTaskStore();
const notificationStore = useNotificationStore();
const pageStore = usePageStore();

const priority = ref(customizer.setHorizontalLayout ? 0 : 0);
watch(priority, (newPriority) => {
  priority.value = newPriority;
});

const uncompletedTasks = computed(() => taskStore.uncompletedTasks);

const showElevation = ref(false);

const handleScroll = () => {
  showElevation.value = window.scrollY > 0;
};

// Fetch notifications and todos when component mounts
onMounted(async () => {
  if (auth.user?.id) {
    await notificationStore.connect(auth.user.id);
    await taskStore.fetchTasksCurrentUser();
  }
  window.addEventListener('scroll', handleScroll);
});

// Watch for auth changes and reconnect notifications if needed
watch(
  () => auth.user?.id,
  async (newId) => {
    if (newId) {
      await notificationStore.connect(newId);
      await taskStore.fetchTasksCurrentUser();
    } else {
      notificationStore.disconnect();
    }
  }
);

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <v-app-bar :elevation="showElevation ? 3 : 0" :priority="priority" height="80">
    <v-btn
      class="hidden-md-and-down text-secondary"
      color="lightsecondary"
      icon
      rounded="sm"
      variant="flat"
      @click.stop="customizer.SET_MINI_SIDEBAR(!customizer.mini_sidebar)"
      size="small"
    >
      <Menu2Icon size="20" stroke-width="1.5" />
    </v-btn>
    <v-btn
      class="hidden-lg-and-up text-secondary ms-3"
      color="lightsecondary"
      icon
      rounded="sm"
      variant="flat"
      @click.stop="customizer.SET_SIDEBAR_DRAWER"
      size="small"
    >
      <Menu2Icon size="20" stroke-width="1.5" />
    </v-btn>

    <div class="header-content">
      <div class="page-title">{{ pageStore.title }}</div>
    </div>

    <v-spacer />
    <a href="https://www.kennisplein.intalligence.nl/" target="_blank" rel="noopener noreferrer" style="text-decoration: none">
      <v-btn icon class="text-primary mr-2" color="lightsecondary" rounded="sm" size="small" variant="flat">
        <HelpSquareRoundedIcon stroke-width="1.5" size="26" />
      </v-btn>
    </a>
    <!-- Notifications -->
    <!-- <v-menu :close-on-content-click="false">
      <template v-slot:activator="{ props }">
        <v-btn icon class="text-secondary mx-3" color="lightsecondary" rounded="sm" size="small" variant="flat" v-bind="props">
          <BellIcon stroke-width="1.5" size="22" />
          <v-badge
            v-if="notificationStore.unreadCount > 0"
            :content="notificationStore.unreadCount"
            color="error"
            location="top end"
            offset-x="-3"
            offset-y="3"
          />
        </v-btn>
      </template>
      <v-sheet rounded="md" width="400" elevation="12">
        <NotificationDD />
      </v-sheet>
    </v-menu> -->
    <v-menu :close-on-content-click="false">
      <template v-slot:activator="{ props }">
        <v-btn icon class="text-primary" color="lightprimary" rounded="sm" size="small" variant="flat" v-bind="props">
          <LanguageIcon stroke-width="1.5" size="22" />
        </v-btn>
      </template>
      <v-sheet rounded="md" width="200" elevation="12">
        <LanguageDD />
      </v-sheet>
    </v-menu>

    <!-- Vertical Divider -->
    <v-divider vertical class="mx-3 my-7" thickness="2" />

    <!-- Todo List -->
    <v-btn icon class="morph-button text-primary" color="lightprimary" rounded="sm" size="small" variant="flat" to="/tasks">
      <div class="button-content">
        <ListCheckIcon stroke-width="1.5" size="22" />
        <span class="button-text">Mijn Taken</span>
      </div>
      <v-badge
        v-if="uncompletedTasks.size > 0"
        :content="uncompletedTasks.size"
        color="error"
        location="top end"
        offset-x="-3"
        offset-y="3"
      />
    </v-btn>

    <div class="d-flex align-center"></div>
    <!-- Profile -->
    <v-menu :close-on-content-click="false">
      <template v-slot:activator="{ props }">
        <v-btn class="profileBtn text-primary" color="lightprimary" variant="flat" rounded="pill" v-bind="props">
          <div class="v-avatar">
            {{ userNameSplit(auth?.user) }}
          </div>
          <SettingsIcon stroke-width="1.5" />
        </v-btn>
      </template>
      <v-sheet rounded="md" width="330" elevation="12">
        <ProfileDD />
      </v-sheet>
    </v-menu>
  </v-app-bar>
</template>

<style scoped lang="scss">
@font-face {
  font-family: 'FreeSetDemiBold';
  src: url('/fonts/FreeSetDemiBold.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.header-content {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;

  .page-title {
    text-align: center;
    line-height: 1.6;
    font-weight: 900;
    font-size: 2rem;
    pointer-events: auto;
    letter-spacing: 0.03em;
    font-family: 'FreeSetDemiBold', sans-serif;
  }
}

.breadcrumbs-wrapper {
  margin-left: 48px;
  opacity: 0.7;
}

.v-avatar {
  height: 30px;
  width: 30px;
  background-color: #e99901;
  font-size: 1.1rem;
  border-radius: 50%;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profileBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.morph-button {
  position: relative;
  transition: all 0.2s ease;
  overflow: visible;
  width: 40px;
  padding: 8px;

  :deep(.v-badge) {
    position: absolute;
    right: 10px;
    top: -3px;
    pointer-events: none;
  }

  &:hover {
    width: 130px;
    .button-text {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

.button-content {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  position: relative;

  svg {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    transition: all 0.2s ease;
  }

  .morph-button:hover & svg {
    left: 0;
    transform: translateX(0);
  }
}

.button-text {
  opacity: 0;
  margin-left: 30px;
  transform: translateX(-10px);
  transition: all 0.2s ease;
}

.v-divider,
.profileBtn {
  transition: transform 0.2s ease;
}

.morph-button:hover ~ .v-divider {
  transform: translateX(90px);
}
</style>
