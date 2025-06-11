<template>
  <div class="w-100 h-100 d-flex align-center justify-center">
    <IconArrowBack
      v-permission="[{ action: 'manage', resourceType: 'all' }]"
      @click="handleUnArchive(params)"
      size="30"
      class="cursor-pointer"
    />
  </div>
</template>

<script lang="ts" setup>
import { IconArrowBack } from '@tabler/icons-vue';

const props = defineProps<{
  params: any;
}>();

const handleUnArchive = (params: any) => {
  const items = params.api.getSelectedRows();
  const currentItem = params.data;
  const itemsToUnArchive = new Set([...items, currentItem]);
  if (props.params.context && typeof props.params.context.openUnArchivePreview === 'function') {
    props.params.context.openUnArchivePreview(Array.from(itemsToUnArchive));
  } else {
    console.warn('AG-Grid context or openUnArchivePreview function not found!');
  }
};
</script>
