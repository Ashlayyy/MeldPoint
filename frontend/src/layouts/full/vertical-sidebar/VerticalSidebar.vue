<script setup lang="ts">
import { shallowRef, ref, onMounted } from 'vue';
import { useCustomizerStore } from '@/stores/customizer';
import sidebarItems from './sidebarItem';
import { hasPermission } from '@/utils/permission';
import { GetVersion } from '@/API/changelog';
import NavGroup from './NavGroup/NavGroup.vue';
import NavItem from './NavItem/NavItem.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
import Logo from '../logo/LogoMain.vue';
import LogoMini from '../logo/LogoMini.vue';

const customizer = useCustomizerStore();
const sidebarMenu = shallowRef(sidebarItems);

const appVersion = ref<string | null>(null);
const versionLoading = ref<boolean>(true);
const versionError = ref<string | null>(null);

onMounted(async () => {
  try {
    appVersion.value = await GetVersion();
  } catch (err: any) {
    console.error('Failed to load app version for sidebar:', err);
    versionError.value = err.message || 'Error';
  } finally {
    versionLoading.value = false;
  }
});
</script>

<template>
  <v-navigation-drawer
    left
    v-model="customizer.Sidebar_drawer"
    elevation="0"
    rail-width="75"
    app
    class="leftSidebar"
    :rail="customizer.mini_sidebar"
    expand-on-hover
  >
    <div class="pa-5">
      <Logo v-if="!customizer.mini_sidebar" />
      <LogoMini v-if="customizer.mini_sidebar" />
    </div>
    <div class="scrollnavbar">
      <v-list class="pa-4">
        <!---Menu Loop -->
        <template v-for="(item, i) in sidebarMenu" :key="i">
          <!---Item Sub Header -->
          <NavGroup :item="item" v-if="item.header && item.enabledHeader && hasPermission(item.permissionNeeded)" :key="item.title" />
          <!---Item Divider -->
          <v-divider class="my-3" v-else-if="item.divider && hasPermission(item.permissionNeeded)" />
          <!---If Has Child -->
          <NavCollapse :item="item" :level="0" v-else-if="item.children && hasPermission(item.permissionNeeded)" />
          <!---Single Item-->
          <NavItem :item="item" :level="0" v-else-if="hasPermission(item.permissionNeeded)" />
        </template>
      </v-list>
      <div class="pa-4 text-center">
        <v-chip color="inputBorder" size="small" v-if="versionLoading"> Loading... </v-chip>
        <v-chip color="error" size="small" v-else-if="versionError"> Error </v-chip>
        <router-link :to="{ name: 'changelog' }" class="text-decoration-none">
          <v-chip color="inputBorder" size="small" v-if="appVersion"> v{{ appVersion }} </v-chip>
        </router-link>
      </div>
    </div>
  </v-navigation-drawer>
</template>
