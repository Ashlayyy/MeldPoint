<script setup lang="ts">
import { shallowRef, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

import { MailIcon } from 'vue-tabler-icons';

const items = shallowRef([{ text: 'Email', icon: MailIcon, divider: true, subtext: authStore.user.Email }]);
const name = ref(authStore.user.Name.split(' ')[0][0] + authStore.user.Name.split(' ')[1][0]);

const details = shallowRef([
  {
    title: 'Full Name',
    subtext: authStore.user.Name
  },
  {
    title: 'Email',
    subtext: authStore.user.Email
  }
]);
</script>

<template>
  <v-row>
    <v-col cols="12" lg="4">
      <v-card variant="flat">
        <v-card variant="outlined">
          <v-list lines="two">
            <v-list-item>
              <template v-slot:prepend>
                <div class="v-avatar">
                  {{ name }}
                </div>
              </template>
              <template v-slot:title>
                <h5 class="text-subtitle-1 mt-1">{{ authStore.user.name }}</h5>
              </template>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <v-card-text>
            <v-list>
              <template v-for="(item, i) in items" :key="i">
                <v-list-item color="primary" :value="item" class="py-4">
                  <template v-slot:prepend>
                    <component :is="item.icon" size="20" stroke-width="1.5" class="mr-2" />
                  </template>

                  <v-list-item-title class="text-subtitle-1">
                    {{ item.text }}
                  </v-list-item-title>

                  <template v-slot:append>
                    <span class="text-subtitle-2 text-disabled font-weight-medium">{{ item.subtext }}</span>
                  </template>
                </v-list-item>
                <v-divider v-if="item.divider"></v-divider>
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-card>
    </v-col>
    <v-col cols="12" lg="8">
      <v-card variant="flat">
        <v-card variant="outlined">
          <v-card-text>
            <h5 class="text-subtitle-1 mt-6 pb-4">Personal Details</h5>
            <v-divider class="mb-4"></v-divider>

            <v-row class="py-2" v-for="(detail, i) in details" :key="i">
              <v-col md="3" class="text-subtitle-1">{{ detail.title }}</v-col>
              <v-col md="1" class="text-subtitle-1">:</v-col>
              <v-col md="8" class="text-medium-emphasis">{{ detail.subtext }}</v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
.v-avatar {
  height: 45px;
  width: 45px;
  background-color: #e99901;
  font-size: 1.1rem;
  border-radius: 50%;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
