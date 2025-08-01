<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useContactStore } from '@/stores/apps/contact';
import _ from 'lodash';
import ContactCardItem from './ContactCardItem.vue';
import SelectedContact from './SelectedContact.vue';
import EditContact from './EditContact.vue';
import AddContact from './AddContact.vue';

const store = useContactStore();

onMounted(() => {
  store.fetchContacts();
});

const allContacts = computed(() => {
  return store.contact;
});
const searchValue = ref('');
const { flow, orderBy, groupBy, flatMap, get, filter } = _;
/* eslint-disable @typescript-eslint/no-explicit-any */
const groupItems = flow([
  (arr: any) => orderBy(arr, 'name'),
  (arr: any) => groupBy(arr, (o: any) => get(o, 'name[0]', '').toUpperCase()),
  (groups: any) => flatMap(groups, (v: any, k: any) => [k, ...v]),
  (arr: any) => filter(arr, (o: any) => get(o, 'name', '').toLowerCase().includes(searchValue.value.toLowerCase()))
]);
const filteredContact = computed(() => {
  return groupItems(allContacts.value);
});
const drawer = ref(false);
const contactDrawer = ref(false);

const editContact = ref(false);
</script>

<template>
  <UiParentCard title="Contact List">
    <div class="d-flex align-center gap-3">
      <v-text-field
        variant="outlined"
        v-model="searchValue"
        prepend-inner-icon="mdi-magnify"
        persistent-placeholder
        placeholder="Search Contact"
        hide-details
      ></v-text-field>
      <v-btn
        class="ml-auto"
        elevation="0"
        variant="flat"
        color="primary"
        size="large"
        prepend-icon="mdi-plus-circle-outline"
        @click.stop="contactDrawer = !contactDrawer"
        >Add</v-btn
      >
    </div>
    <div>
      <ContactCardItem :getContacts="filteredContact" @openDrawer="drawer = true" />
    </div>
  </UiParentCard>
  <v-navigation-drawer v-model="drawer" temporary location="right" width="300">
    <SelectedContact @editContact="editContact = true" v-if="!editContact" />
    <EditContact @closeDrawer="(drawer = false), (editContact = false)" v-else />
  </v-navigation-drawer>
  <v-navigation-drawer v-model="contactDrawer" temporary location="right" width="300">
    <AddContact @closeDrawer="contactDrawer = false" />
  </v-navigation-drawer>
</template>
