<template>
  <div class="w-100 h-100 d-flex align-center justify-center">
    <IconArchive v-permission="[{ action: 'manage', resourceType: 'all' }]" @click="handleArchive(params)" size="30" class="cursor-pointer" />
  </div>
</template>

<script lang="ts" setup>
import { IconArchive } from '@tabler/icons-vue';

const props = defineProps<{
  params: any;
}>();

const handleArchive = (params: any) => {
  const items = params.api.getSelectedRows();
  const currentItem = params.data;
  const itemsToArchive = new Set([...items, currentItem]);
  if (props.params.context && typeof props.params.context.openArchivePreview === 'function') {
    props.params.context.openArchivePreview(Array.from(itemsToArchive));
  } else {
    console.warn('AG-Grid context or openArchivePreview function not found!');
  }
};
</script>
