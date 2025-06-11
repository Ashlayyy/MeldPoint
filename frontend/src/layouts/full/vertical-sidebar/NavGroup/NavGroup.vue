<script setup lang="ts">
const props = defineProps<{ item: Record<string, any> }>();
</script>

<template>
  <v-list-subheader color="black" class="text-black text-capitalize font-weight-black">{{ $t(props.item.header) }}</v-list-subheader>
</template>
