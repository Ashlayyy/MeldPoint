<script setup lang="ts">
import { ref } from 'vue';
import Logo from '@/layouts/full/logo/LogoMain.vue';
import { useDisplay } from 'vuetify';
import { HomeIcon } from 'vue-tabler-icons';

const { mdAndUp } = useDisplay();
const drawer = ref(false);
</script>

<template>
  <v-app-bar elevation="0" flat height="74" class="border-bottom position-fixed">
    <v-container class="fill-height maxWidth">
      <div class="d-flex align-center gap-2 w-100">
        <Logo />
        <v-spacer />
        <template v-if="mdAndUp">
          <v-btn variant="text" color="primary" to="/">Home</v-btn>
          <v-btn variant="text" href="https://www.kennisplein.intalligence.nl/" target="_blank" rel="noopener">Kennisplein</v-btn>
          <v-btn variant="flat" color="secondary" href="/dashboard/default">Intalligence</v-btn>
        </template>
        <template v-else>
          <v-btn color="lightsecondary" icon rounded="sm" variant="flat" size="small" @click="drawer = true">
            <Menu2Icon size="20" stroke-width="1.5" />
          </v-btn>
        </template>
      </div>
    </v-container>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" temporary location="right" floating v-if="!mdAndUp">
    <v-list color="primary">
      <v-list-item to="/">
        <template v-slot:prepend>
          <HomeIcon size="20" stroke-width="1.5px" />
        </template>

        <v-list-item-title class="ml-3">Home</v-list-item-title>
      </v-list-item>
      <v-list-item to="/">
        <template v-slot:prepend>
          <BookIcon size="20" stroke-width="1.5px" />
        </template>

        <v-list-item-title class="ml-3">Documentation</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
