<template>
  <div>
    <template v-if="label">
      <div class="text-h5 ai-text-shimmer d-flex align-center">
        {{ label }}
        <div class="star-container">
          <v-icon icon="mdi-star-four-points" size="x-small" class="ml-0 mb-2 gemini-star" :class="{ 'is-generating': isGenerating }" />
          <div class="generating-pill star-tooltip">
            <span class="generating-text">intal<span style="color: rgb(var(--v-theme-secondary))">AI</span></span>
            <div class="sparkle"></div>
          </div>
        </div>
      </div>
      <div class="d-flex align-center">
        <transition name="fade" mode="out-in">
          <div class="title-container" :key="currentIndex">
            <template v-if="isGenerating">
              <div class="generating-pill">
                <span class="generating-text">Genereren</span>
                <!-- <span class="dots">...</span> -->
                <div class="sparkle"></div>
              </div>
            </template>
            <template v-else>
              <div :class="{ 'typewriter-container': shouldShowTypewriter }">
                <template v-if="props.showOriginal && props.originalText">
                  <div class="original-text">{{ props.originalText }}</div>
                  <v-divider class="my-2 divider-style"></v-divider>
                </template>
                <span v-for="(char, index) in generatedItems[currentIndex] || placeholder" :key="index" class="typewriter-char">
                  {{ char }}
                </span>
              </div>
            </template>
          </div>
        </transition>
        <div class="actions-container ml-2" style="position: absolute; right: 30px">
          <v-icon
            icon="mdi-pencil"
            size="x-small"
            class="mr-1 clickable action-icon"
            @click="showEditDialog = true"
          />
          <v-icon
            icon="mdi-close"
            size="x-small"
            class="mr-1 clickable action-icon"
            :class="{
              'text-disabled': !generatedItems.length,
              'pulse-animation': isRemoving
            }"
            @click="handleRemoveItem"
          >
            <span v-if="isRemoving" class="removing-indicator">Removing...</span>
          </v-icon>
          <v-icon
            icon="mdi-arrow-left"
            size="x-small"
            class="mr-1 clickable"
            :class="{ 'text-disabled': currentIndex <= 0 }"
            @click="currentIndex--"
          />
          <v-icon
            icon="mdi-arrow-right"
            size="x-small"
            class="mr-1 clickable"
            :class="{ 'text-disabled': currentIndex >= generatedItems.length - 1 }"
            @click="currentIndex++"
          />
          <v-icon icon="mdi-refresh" size="x-small" color="primary" class="clickable" @click="generateNew" />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="d-flex align-center">
        <div class="star-container mr-2">
          <v-icon icon="mdi-star-four-points" size="x-small" class="gemini-star" :class="{ 'is-generating': isGenerating }" />
          <div class="generating-pill star-tooltip">
            <span class="generating-text">intalAI</span>
            <div class="sparkle"></div>
          </div>
        </div>
        <div class="title-container">
          <template v-if="isGenerating">
            <div class="generating-pill">
              <span class="generating-text">Genereren</span>
              <!-- <span class="dots">...</span> -->
              <div class="sparkle"></div>
            </div>
          </template>
        </div>
        <div class="actions-container ml-2">
          <v-icon
            icon="mdi-pencil"
            size="x-small"
            class="mr-1 clickable action-icon"
            @click="showEditDialog = true"
          />
          <v-icon
            icon="mdi-close"
            color="red"
            size="x-small"
            class="mr-1 clickable action-icon"
            :class="{
              'text-disabled': !generatedItems.length,
              'pulse-animation': isRemoving
            }"
            @click="handleRemoveItem"
          >
            <span v-if="isRemoving" class="removing-indicator">Removing...</span>
          </v-icon>
          <v-icon
            icon="mdi-arrow-left"
            size="x-small"
            class="mr-1 clickable"
            :class="{ 'text-disabled': currentIndex <= 0 }"
            @click="currentIndex--"
          />
          <v-icon
            icon="mdi-arrow-right"
            size="x-small"
            class="mr-1 clickable"
            :class="{ 'text-disabled': currentIndex >= generatedItems.length - 1 }"
            @click="currentIndex++"
          />
          <v-icon icon="mdi-refresh" size="x-small" color="primary" class="clickable" @click="generateNew" />
        </div>
      </div>
    </template>

    <!-- Edit Dialog -->
    <v-dialog v-model="showEditDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ t(`verbeterplein.showItem.edit.${label.toLowerCase() === 'category' ? 'category' : 'summary'}`) }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editedText"
            :label="label"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showEditDialog = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="primary" @click="saveEdit">
            {{ t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';

const t = useI18n().t;
const notification = useNotificationStore();

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: 'No item generated'
  },
  generateFunction: {
    type: Function,
    required: true
  },
  saveFunction: {
    type: Function,
    required: true
  },
  showOriginal: {
    type: Boolean,
    default: false
  },
  originalText: {
    type: String,
    default: ''
  },
  initialValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update']);

const generatedItems = ref<string[]>([]);
const currentIndex = ref(0);
const isGenerating = ref(false);
const isSaving = ref(false);
const isRemoving = ref(false);
const shouldShowTypewriter = ref(false);
const removingIndex = ref<number | null>(null);
const showEditDialog = ref(false);
const editedText = ref('');

onMounted(() => {
  if (props.initialValue) {
    generatedItems.value = [props.initialValue];
    currentIndex.value = 0;
  }
});

watch(
  () => props.initialValue,
  (newVal) => {
    if (newVal && (!generatedItems.value.length || generatedItems.value[0] !== newVal)) {
      generatedItems.value = [newVal];
      currentIndex.value = 0;
    }
  }
);

const generateNew = async () => {
  isGenerating.value = true;
  shouldShowTypewriter.value = false;

  try {
    const [result] = await Promise.all([props.generateFunction(), new Promise((resolve) => setTimeout(resolve, 1500))]);

    await new Promise((resolve) => setTimeout(resolve, 900));

    generatedItems.value.push(result);
    currentIndex.value = generatedItems.value.length - 1;
    shouldShowTypewriter.value = true;

    setTimeout(() => {
      shouldShowTypewriter.value = false;
    }, 2000);
  } catch (error) {
    notification.rejectPromise({
      message: t('errors.ai_generate_error', { error: error })
    });
  } finally {
    acceptItem();
    isGenerating.value = false;
  }
};

watch(currentIndex, () => {
  shouldShowTypewriter.value = false;
});

const acceptItem = async () => {
  if (!generatedItems.value.length || currentIndex.value < 0) return;

  isSaving.value = true;
  const selectedItem = generatedItems.value[currentIndex.value];

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await props.saveFunction(selectedItem);
    notification.resolvePromise({
      message: t('notifications.item_saved')
    });
    emit('update', selectedItem);
  } catch (error) {
    notification.rejectPromise({
      message: t('errors.ai_generate_error', { error: error })
    });
  } finally {
    isSaving.value = false;
  }
};

const handleRemoveItem = async () => {
  if (!generatedItems.value.length || currentIndex.value < 0) return;

  isRemoving.value = true;
  removingIndex.value = currentIndex.value;

  try {
    await new Promise((resolve) => setTimeout(resolve, 300));

    generatedItems.value.splice(removingIndex.value!, 1);
    notification.resolvePromise({
      message: t('notifications.item_removed')
    });

    if (currentIndex.value >= generatedItems.value.length) {
      currentIndex.value = generatedItems.value.length - 1;
    }
    emit('update', null);
  } catch (error) {
    notification.rejectPromise({
      message: t('errors.ai_generate_error', { error: error })
    });
  } finally {
    isRemoving.value = false;
    removingIndex.value = null;
  }
};

watch(
  () => showEditDialog.value,
  (newVal) => {
    if (newVal) {
      editedText.value = generatedItems.value[currentIndex.value] || '';
    }
  }
);

const saveEdit = async () => {
  if (editedText.value.trim()) {
    try {
      await props.saveFunction(editedText.value);
      generatedItems.value[currentIndex.value] = editedText.value;
      emit('update', editedText.value);
      showEditDialog.value = false;
      notification.resolvePromise({
        message: t('notifications.item_saved')
      });
    } catch (error) {
      notification.rejectPromise({
        message: t('errors.save_failed')
      });
    }
  }
};
</script>

<style scoped lang="scss">
.title-container {
  min-width: 75px;
  max-width: 80%;
  min-height: 20px;
  max-height: 150px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease-out;
}

.actions-container {
  display: flex;
  align-items: center;
}

.action-icon {
  transition: transform 0.2s ease;
  position: relative;
  color: rgb(244, 90, 90);
  &:active {
    transform: scale(0.85);
  }
}

.text-disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
}

.clickable {
  cursor: pointer;
}

.pulse-animation {
  animation: pulse 1.5s infinite;
}

.saving-indicator,
.removing-indicator {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.generating-pill {
  background: var(--v-secondary);
  height: 30px;
  padding: 8px 2px;
  border-radius: 20px;
  border: 1px solid rgb(var(--v-theme-primary), 0.1);
  width: 100px;
  font-size: 16px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.generating-pill .generating-text {
  color: rgb(var(--v-theme-primary));
  font-family: 'FreeSetDemiBold', sans-serif;
  font-weight: 400;
  letter-spacing: 0.2px;
  font-size: 14px;
  text-align: center;
  margin: 0 auto;
}

.generating-pill .dots {
  color: rgb(var(--v-theme-secondary));
  animation: loadingDots 0.8s infinite;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.generating-pill .sparkle {
  position: absolute;
  top: 0;
  left: -50%;
  width: 70%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--v-theme-primary), 0.05),
    rgba(var(--v-theme-primary), 0.1),
    rgba(255, 255, 255, 0.1),
    rgba(var(--v-theme-secondary), 0.1),
    rgba(var(--v-theme-secondary), 0.05),
    transparent
  );
  animation: sparkleSlide 1.6s infinite cubic-bezier(0.1, 0.3, 0.2, 1);
}

.typewriter-text,
div:not(.generating-pill):not(.original-text) {
  opacity: 1;
  transition: opacity 0.7s ease;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes sparkleSlide {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(300%);
  }
}

@keyframes loadingDots {
  0%,
  20% {
    content: '.';
  }
  40%,
  60% {
    content: '..';
  }
  80%,
  100% {
    content: '...';
  }
}

.ai-text-shimmer {
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 50%, rgb(var(--v-theme-primary)) 100%);
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: textShimmer 3s linear infinite;
}

@keyframes textShimmer {
  to {
    background-position: 200% center;
  }
}

.gemini-star {
  color: rgb(var(--v-theme-secondary));
  animation: starPulse 2s ease-in-out forwards;
  filter: brightness(1) drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
}

.gemini-star.is-generating {
  animation: starPulse 2s ease-in-out infinite;
  filter: brightness(1) drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
}

@keyframes starPulse {
  0% {
    opacity: 0.6;
    transform: scale(0.8) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.1) rotate(180deg);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.8) rotate(360deg);
  }
}

.star-container {
  position: relative;

  &:hover .star-tooltip {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
}

.star-tooltip {
  position: absolute;
  background: white;
  height: 35px;
  top: -30px;
  left: 10%;
  transform: translateY(10px);
  transform-origin: bottom center;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 100;
  margin: 4px;

  &.generating-pill {
    animation: none;
    scale: 0.8;
  }

  .generating-text {
    font-size: 20px;
    font-weight: 700;
  }
}

.original-text {
  color: rgb(var(--v-theme-primary));
  opacity: 0.9;
  font-weight: 300;
  margin-bottom: 4px;
}

.divider-style {
  opacity: 0.3;
}

.original-text {
  color: rgb(var(--v-theme-primary));
  opacity: 0.9;
  font-weight: 300;
  margin-bottom: 4px;
}

.divider-style {
  opacity: 0.3;
}

/* Transition Styles for Fade Effect */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
