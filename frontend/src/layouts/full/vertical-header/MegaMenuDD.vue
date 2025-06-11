<script setup lang="ts">
import { shallowRef } from 'vue';
const dropdownMenu = shallowRef([
  { header: 'User Quick' },
  { header: 'Applications' },
  { header: 'Primitives' },
  {
    link: 'Social Profile',
    href: 'https://berrydashboard.io/vue/app/user/social/posts'
  },
  {
    link: 'Chat',
    href: 'https://berrydashboard.io/vue/app/chats'
  },
  {
    link: 'Colors',
    href: 'https://berrydashboard.io/vue/utils/colors'
  },
  {
    link: 'Account Profile',
    href: 'https://berrydashboard.io/vue/app/user/account-profile/profile1'
  },
  {
    link: 'Kanban',
    href: 'https://berrydashboard.io/vue/app/kanban'
  },
  {
    link: 'Typography',
    href: 'https://berrydashboard.io/vue/utils/typography'
  },
  {
    link: 'User Cards',
    href: 'https://berrydashboard.io/vue/app/user/card/card1'
  },
  {
    link: 'Mail',
    href: 'https://berrydashboard.io/vue/app/mail'
  },
  {
    link: 'Shadows',
    href: 'https://berrydashboard.io/vue/utils/shadows'
  },
  {
    link: 'User List',
    href: 'https://berrydashboard.io/vue/app/user/list2'
  },
  {
    link: 'Calendar',
    href: 'https://berrydashboard.io/vue/app/calendar'
  },
  {
    link: 'Icons',
    href: 'https://berrydashboard.io/vue/icons/tabler'
  },
  {
    link: 'Contact',
    href: 'https://berrydashboard.io/vue/app/contact/c-card'
  },
  {
    link: 'E-Commerce',
    href: 'https://berrydashboard.io/vue/ecommerce/products'
  },
  {
    link: 'Elements',
    href: 'https://berrydashboard.io/vue/basic/expansion-panel'
  }
]);
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!-- mega menu DD -->
  <!-- ---------------------------------------------- -->
  <div>
    <v-row>
      <v-col cols="12" lg="4">
        <img src="@/assets/images/background/mega-bg.svg" />
      </v-col>
      <v-col cols="12" lg="8">
        <v-list density="compact" class="overflow-hidden pt-6">
          <v-row no-gutters>
            <template v-for="(item, i) in dropdownMenu" :key="i">
              <v-col cols="6" sm="4">
                <v-list-item v-if="item.header" rounded="md">
                  <v-list-item-title class="text-subtitle-1">{{ item.header }}</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="item.link" :href="item.href" rounded="md" color="secondary" target="_blank" class="no-spacer">
                  <template v-slot:prepend>
                    <v-icon class="text-8 mr-2">mdi-circle</v-icon>
                  </template>
                  <v-list-item-title class="text-subtitle-1 font-weight-regular">{{ item.link }} </v-list-item-title>
                </v-list-item>
              </v-col>
            </template>
          </v-row>
        </v-list>
      </v-col>
    </v-row>
  </div>
</template>
