<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">Notification Tester</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="sendNotification">
              <div class="d-flex align-center mb-4">
                <v-switch
                  v-model="isTodoNotification"
                  :label="isTodoNotification ? 'Todo Notification' : 'Standard Notification'"
                  hide-details
                  color="primary"
                  class="mb-0"
                ></v-switch>
              </div>

              <v-select v-model="form.type" :items="['system', 'toast']" label="Notification Type" rounded="none" required></v-select>

              <v-text-field v-model="form.message" label="Message" rounded="none" required></v-text-field>

              <v-text-field v-model="form.url" label="URL (Optional)" rounded="none" hint="The URL to navigate to when clicking the notification"></v-text-field>

              <v-text-field v-if="isTodoNotification" v-model="form.todoItem" label="Todo Item Text" rounded="none" required></v-text-field>

              <v-radio-group v-model="form.target" label="Target" class="mb-4">
                <v-radio v-if="!isTodoNotification" label="Broadcast (All Users)" value="broadcast"></v-radio>
                <v-radio label="Specific Users" value="users"></v-radio>
                <v-radio label="Current User" value="self"></v-radio>
              </v-radio-group>

              <v-select
                v-if="form.target === 'users'"
                v-model="form.selectedUsers"
                :items="userStore.users"
                item-title="Name"
                item-value="id"
                label="Select Users"
                multiple
                chips
                closable-chips
                required
              ></v-select>

              <v-textarea
                v-model="form.jsonData"
                label="Additional Data (JSON)"
                hint="Optional JSON data to include with notification"
              ></v-textarea>

              <v-btn type="submit" color="primary" :loading="loading" class="mt-4">
                Send {{ isTodoNotification ? 'Todo' : 'Standard' }} Notification
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/verbeterplein/user_store';
import axios from '@/utils/axios';

const notificationStore = useNotificationStore();
const authStore = useAuthStore();
const userStore = useUserStore();
const loading = ref(false);
const isTodoNotification = ref(false);

// Single form state
const form = ref({
  type: 'system',
  message: '',
  todoItem: '',
  target: 'broadcast',
  selectedUsers: [],
  jsonData: '',
  url: ''
});

// Fetch users when component mounts
onMounted(async () => {
  await userStore.fetchUsers({ limit: 20000 });
});

const parseJsonData = (jsonString: string) => {
  if (!jsonString) return undefined;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    notificationStore.error({
      message: 'Invalid JSON data'
    });
    throw e;
  }
};

const sendNotification = async () => {
  try {
    if (form.value.target === 'self' && !authStore.user?.id) {
      notificationStore.error({
        message: 'User ID not available. Please ensure you are logged in.'
      });
      return;
    }

    loading.value = true;
    let data = undefined;

    try {
      data = parseJsonData(form.value.jsonData);
    } catch {
      return;
    }

    if (isTodoNotification.value) {
      const userIds = form.value.target === 'self' ? [authStore.user?.id] : form.value.selectedUsers;
      
      if (!userIds || userIds.length === 0) {
        notificationStore.error({
          message: 'No users selected for notification'
        });
        return;
      }

      // Send todo notifications to all selected users
      const promises = userIds.map((userId) => {
        if (!userId) {
          console.warn('Skipping notification for undefined user ID');
          return Promise.resolve();
        }
        return axios.post('/notifications/test/todo', {
          type: form.value.type,
          message: form.value.message,
          todoItem: form.value.todoItem,
          userId,
          url: form.value.url,
          data
        });
      });

      await Promise.all(promises);
      notificationStore.info({
        message: 'Todo notifications sent successfully to selected users'
      });
    } else {
      if (form.value.target === 'broadcast') {
        const response = await axios.post('/notifications/test/broadcast', {
          type: form.value.type,
          message: form.value.message,
          data,
          url: form.value.url
        });

        if (response.data.success) {
          notificationStore.info({
            message: 'Broadcast notification sent successfully'
          });
        }
      } else {
        // Send to multiple users or self
        const userIds = form.value.target === 'self' ? [authStore.user?.id] : form.value.selectedUsers;
        
        if (!userIds || userIds.length === 0) {
          notificationStore.error({
            message: 'No users selected for notification'
          });
          return;
        }

        // Send notifications to all selected users
        const promises = userIds.map((userId) => {
          if (!userId) {
            console.warn('Skipping notification for undefined user ID');
            return Promise.resolve();
          }
          return axios.post('/notifications/test', {
            type: form.value.type,
            message: form.value.message,
            userId,
            data,
            url: form.value.url
          });
        });

        await Promise.all(promises);
        notificationStore.info({
          message: 'Notifications sent successfully to selected users'
        });
      }
    }
  } catch (error: any) {
    notificationStore.error({
      message: `Failed to send notification: ${error.response?.data?.error || error.message}`
    });
  } finally {
    loading.value = false;
  }
};
</script>
