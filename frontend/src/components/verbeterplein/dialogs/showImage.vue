<template>
  <v-dialog v-model="dialogVisible" :max-width="maxWidth">
    <v-card>
      <v-card-title>
        <span class="headline">{{ title }}</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-carousel v-model="currentImageIndex" hide-delimiters>
          <v-carousel-item v-for="(image, index) in images" :key="index">
            <v-img :src="image?.url" contain max-height="500"></v-img>
          </v-carousel-item>
        </v-carousel>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="prevImage">Previous</v-btn>
        <v-btn color="primary" variant="text" @click="nextImage">Next</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, PropType } from 'vue';

interface Image {
  url: string;
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Image Gallery'
  },
  maxWidth: {
    type: [String, Number],
    default: 800
  },
  images: {
    type: Array as PropType<Image[]>,
    default: () => []
  },
  initialIndex: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['update:modelValue']);

const dialogVisible = ref(props.modelValue);
const currentImageIndex = ref(props.initialIndex);

watch(
  () => props.modelValue,
  (newValue) => {
    dialogVisible.value = newValue;
  }
);

const closeDialog = () => {
  dialogVisible.value = false;
};

const nextImage = () => {
  if (currentImageIndex.value < props.images.length - 1) {
    currentImageIndex.value++;
  } else {
    currentImageIndex.value = 0;
  }
};

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  } else {
    currentImageIndex.value = props.images.length - 1;
  }
};
</script>
