<script setup lang="ts">
import { shallowRef } from 'vue';

const languageDD = shallowRef([
  { title: 'English', subtext: 'UK', value: 'en' },
  { title: 'Nederlands', subtext: 'NL', value: 'nl' },
  { title: 'Pools', subtext: 'PL', value: 'pl' }
]);

const updateLocale = (locale: string) => {
  localStorage.setItem('locale', locale);
};
</script>

<template>
  <v-list>
    <v-list-item
      v-for="(item, index) in languageDD"
      :key="index"
      color="secondary"
      :active="$i18n.locale == item.value"
      class="d-flex align-center"
      @click="
        () => {
          $i18n.locale = item.value;
          updateLocale(item.value);
        }
      "
    >
      <v-list-item-title class="text-subtitle-1 font-weight-regular">
        {{ item.title }}
        <span class="text-disabled text-subtitle-1 pl-2">({{ item.subtext }})</span>
      </v-list-item-title>
    </v-list-item>
  </v-list>
</template>
