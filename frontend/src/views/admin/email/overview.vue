<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axios from '@/utils/axios';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';

const { t } = useI18n();
const notification = useNotificationStore();
const page = ref({ title: t('admin.email.overview') });
const breadcrumbs = ref([
  {
    title: t('admin.title'),
    disabled: false,
    href: '#'
  },
  {
    title: t('admin.email.overview'),
    disabled: true,
    href: '#'
  }
]);

const loading = ref(false);
const headers: any = [
  { title: t('admin.email.table.date_sent'), key: 'createdAt', align: 'start' },
  { title: t('admin.email.table.status'), key: 'deliveryStatus', align: 'start' },
  { title: t('admin.email.table.recipient'), key: 'messageId', align: 'start' },
  { title: t('admin.email.table.opened'), key: 'openedAt', align: 'start' },
  { title: t('admin.email.table.opened_from'), key: 'ipOpened', align: 'start' },
  { title: t('admin.email.table.actions'), key: 'actions', align: 'end' }
];
const items = ref([]);

const fetchEmails = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/email/tracking/all');
    if (response.data.data) {
      items.value = response.data.data;
    } else {
      items.value = [];
    }
  } catch (error) {
    notification.error({
      message: t('errors.fetch_error', { error: error || 'Fetch error' })
    });
  } finally {
    loading.value = false;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'sent':
      return 'info';
    case 'delivered':
      return 'success';
    case 'opened':
      return 'primary';
    case 'bounced':
      return 'error';
    default:
      return 'warning';
  }
};

onMounted(() => {
  fetchEmails();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Email Tracking Overview">
        <template v-slot:action>
          <v-btn color="primary" @click="fetchEmails" :loading="loading">
            <IconRefresh class="mr-1" />
            {{ $t('general.actions.refresh') }}
          </v-btn>
        </template>

        <v-data-table :headers="headers" :items="items" :loading="loading" hover>
          <template v-slot:item.createdAt="{ item }: any">
            {{ new Date(item.createdAt).toLocaleString() }}
          </template>

          <template v-slot:item.deliveryStatus="{ item }: any">
            <v-chip :color="getStatusColor(item.deliveryStatus)" size="small">
              {{ item.deliveryStatus }}
            </v-chip>
          </template>

          <template v-slot:item.openedAt="{ item }: any">
            <v-icon v-if="item.openedAt" color="success">mdi-check</v-icon>
            <v-icon v-else>mdi-minus</v-icon>
          </template>

          <template v-slot:item.ipOpened="{ item }: any">
            {{ item.ipOpened?.length ? item.ipOpened[0] : '-' }}
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" size="small">
              <v-icon>mdi-information</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
