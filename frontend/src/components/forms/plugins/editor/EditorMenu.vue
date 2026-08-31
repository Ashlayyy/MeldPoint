<script setup>
import 'remixicon/fonts/remixicon.css';

const props = defineProps({
  icon: String,
  title: String,
  action: Function,
  isActive: Function
});
</script>
<template>
  <div>
    <div class="menu-item" :class="{ 'is-active': isActive ? isActive() : null }" @click="action" :title="props.title">
      <i :class="`ri-${props.icon}`"></i>
    </div>
  </div>
</template>
<style lang="scss">
.menu-item {
  width: 1.75rem;
  height: 1.75rem;
  color: inherit;
  border: none;
  background-color: transparent;
  border-radius: 0.4rem;
  padding: 0.25rem;
  margin-right: 0.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  i {
    font-size: 1.15rem;
    line-height: 1;
  }

  &.is-active,
  &:hover {
    color: #fff;
    background-color: rgb(var(--v-theme-primary));
  }
}
</style>
