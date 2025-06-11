<template>
  <v-container>
    <!-- Active Devices Section -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>{{ t('settings.security.devices.title') }}</span>
            <v-btn color="error" variant="text" :disabled="isLoading || !devices.length" @click="revokeAllDevices">
              {{ t('settings.security.devices.revoke_all') }}
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>{{ t('settings.security.devices.device') }}</th>
                  <th>{{ t('settings.security.devices.browser') }}</th>
                  <th>{{ t('settings.security.devices.os') }}</th>
                  <th>{{ t('settings.security.devices.last_active') }}</th>
                  <th>{{ t('settings.security.devices.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="device in devices" :key="device.deviceId">
                  <td>{{ device.deviceName }}</td>
                  <td>{{ device.browser }}</td>
                  <td>{{ device.os }}</td>
                  <td>{{ formatDate(device.lastActive) }}</td>
                  <td>
                    <v-btn
                      color="error"
                      variant="text"
                      :disabled="isLoading || device.deviceId === securityService.deviceId"
                      @click="revokeDevice(device.deviceId)"
                    >
                      {{ t('settings.security.devices.revoke') }}
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <v-overlay v-model="isLoading" class="align-center justify-center">
              <v-progress-circular indeterminate />
            </v-overlay>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Login History Section -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>{{ t('settings.security.login_history.title') }}</v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>{{ t('settings.security.login_history.date') }}</th>
                  <th>{{ t('settings.security.login_history.browser') }}</th>
                  <th>{{ t('settings.security.login_history.device') }}</th>
                  <th>{{ t('settings.security.login_history.ip') }}</th>
                  <th>{{ t('settings.security.login_history.status') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in loginHistory" :key="entry.id">
                  <td>{{ formatDate(entry.createdAt) }}</td>
                  <td>{{ entry.deviceInfo.browser }} ({{ entry.deviceInfo.os }})</td>
                  <td>
                    <template v-if="entry.currentDeviceInfo">
                      {{ entry.currentDeviceInfo.deviceName }}<br />
                      <small class="text-grey">
                        {{ entry.currentDeviceInfo.browser }} ({{ entry.currentDeviceInfo.os }})
                        <template v-if="entry.currentDeviceInfo.currentlyActive">
                          <v-chip color="success" size="x-small" class="ml-2">Active</v-chip>
                        </template>
                      </small>
                    </template>
                    <template v-else>
                      <span class="text-grey">Device no longer exists</span>
                    </template>
                  </td>
                  <td>{{ entry.ipAddress }}</td>
                  <td>
                    <v-chip :color="entry.status === 'success' ? 'success' : 'error'" size="small" variant="flat">
                      {{ entry.status }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <div class="d-flex align-center justify-center mt-4">
              <v-pagination v-model="historyPage" :length="Math.ceil(historyTotal / historyLimit)" :total-visible="7" />
            </div>
            <v-overlay v-model="isLoadingHistory" class="align-center justify-center">
              <v-progress-circular color="primary" indeterminate size="64" />
            </v-overlay>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Security Settings Section
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>{{ t('settings.security.settings.title') }}</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon :color="twoFactorEnabled ? 'success' : 'grey'">mdi-shield-check</v-icon>
                </template>
                <v-list-item-title>
                  {{ t('settings.security.settings.two_factor') }}
                </v-list-item-title>
                <template v-slot:append>
                  <v-btn color="primary" variant="text" @click="setupTwoFactor">
                    {{ twoFactorEnabled ? t('settings.security.settings.configure') : t('settings.security.settings.enable') }}
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row> -->

    <!-- Two Factor Setup Dialog -->
    <v-dialog v-model="showTwoFactorDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('settings.security.two_factor.setup_title') }}</v-card-title>
        <v-card-text>
          <!-- Two Factor Setup UI will go here -->
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLoginHistoryStore } from '@/stores/loginHistory';
import { useAuthStore } from '@/stores/auth';
import { securityService } from '@/services/SecurityService';
import type { LoginHistoryEntry } from '@/API/loginHistory';
import type { DeviceInfo } from '@/types/security';

const { t } = useI18n();
const authStore = useAuthStore();
const loginHistoryStore = useLoginHistoryStore();

// Device management
const devices = ref<DeviceInfo[]>([]);
const isLoading = ref(false);
const isLoadingHistory = ref(false);

// Dialog controls
const showTwoFactorDialog = ref(false);

// Security states
const twoFactorEnabled = ref(false);

// Pagination
const historyPage = ref(1);
const historyLimit = ref(10);
const historyTotal = ref(0);
const loginHistory = ref<LoginHistoryEntry[]>([]);

const refreshDevices = async () => {
  try {
    isLoading.value = true;
    await loginHistoryStore.fetchActiveDevices();
    devices.value = loginHistoryStore.activeDevices;
  } catch (error) {
    console.error('Failed to fetch devices:', error);
  } finally {
    isLoading.value = false;
  }
};

const revokeDevice = async (deviceId: string) => {
  try {
    await loginHistoryStore.revokeDevice(deviceId);
    await refreshDevices();
  } catch (error) {
    console.error('Failed to revoke device:', error);
  }
};

const revokeAllDevices = async () => {
  try {
    await loginHistoryStore.revokeAllDevices();
    await refreshDevices();
  } catch (error) {
    console.error('Failed to revoke all devices:', error);
  }
};

const fetchLoginHistory = async () => {
  if (!authStore.user?.id) return;

  isLoadingHistory.value = true;
  try {
    await loginHistoryStore.fetchLoginHistory(historyPage.value);
    loginHistory.value = loginHistoryStore.loginHistory;
    historyTotal.value = loginHistoryStore.totalEntries;
  } catch (error) {
    console.error('Failed to fetch login history:', error);
  } finally {
    isLoadingHistory.value = false;
  }
};

const formatDate = (date: string | Date): string => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

const setupTwoFactor = () => {
  showTwoFactorDialog.value = true;
};

// Watch for page changes
watch(historyPage, () => {
  fetchLoginHistory();
});

// Initial load
onMounted(async () => {
  await refreshDevices();
  await fetchLoginHistory();
});
</script>

<style scoped>
.v-card-title {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
