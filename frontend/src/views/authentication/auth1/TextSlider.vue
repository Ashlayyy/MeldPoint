<script setup lang="ts">
import { ref } from 'vue';

type slideType = {
  title: string;
  description: string;
};

const slides = ref<slideType[]>([
  {
    title: 'GROEI',
    description: 'Bij Intal kan alles altijd beter!'
  },
  {
    title: 'JIJ',
    description: 'Wees jezelf en zorg voor een goede balans tussen jouw werk en privéleven.'
  },
  {
    title: 'WIJ',
    description: 'Intal is een platte organisatie, wij denken en handelen in de wij-vorm.'
  }
]);
</script>
<template>
  <v-carousel cycle height="190" hide-delimiter-background class="custom-delimiter" :show-arrows="false">
    <template v-slot:delimiter-icon>
      <v-icon class="text-8">mdi-circle</v-icon>
    </template>
    <v-carousel-item v-for="(slide, i) in slides" :key="i">
      <div class="text-center">
        <h1 class="text-h1">{{ slide.title }}</h1>
        <p class="text-medium-emphasis text-subtitle-1">{{ slide.description }}</p>
      </div>
    </v-carousel-item>
  </v-carousel>
</template>

<style lang="scss">
.custom-delimiter {
  .v-btn {
    font-size: 5px;
  }
}
</style>
