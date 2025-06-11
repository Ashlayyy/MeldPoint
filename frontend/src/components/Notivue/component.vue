<script setup lang="ts">
import { Notivue, Notification, NotivueSwipe, NotificationProgress } from 'notivue';
</script>

<template>
  <Notivue v-slot="item">
    <NotivueSwipe :item="item">
      <Notification :item="item">
        <NotificationProgress :item="item" />
      </Notification>
    </NotivueSwipe>
  </Notivue>
</template>

<style>
:root {
  --nv-gap: 1rem;
  --nv-z: 9999;
}

@media (max-width: 768px) {
  :root {
    --nv-root-x-align: center;
  }
}
</style>
