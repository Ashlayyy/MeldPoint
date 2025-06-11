<template>
  <teleport to="body">
    <div class="helpdesk-wrapper">
      <div class="screenshot-hint" v-if="showScreenshotHint">
        <div class="hint-content">
          <v-icon size="32" color="white" class="mb-2">mdi-gesture-tap-drag</v-icon>
          <span>Klik en sleep om een screenshot te maken</span>
        </div>
      </div>
      <div
        id="crop"
        v-if="crop.active"
        :style="{
          top: crop.top + 'px',
          left: crop.left + 'px',
          width: crop.width + 'px',
          height: crop.height + 'px'
        }"
      ></div>
      <!-- Floating Feedback Button -->
      <div id="helpdesk" @click="toggleHelpdesk" :class="{ active: helpdesk }">
        <span><v-icon>mdi-comment</v-icon> feedback?</span>
      </div>
    </div>

    <!-- Feedback Drawer -->
    <v-navigation-drawer
      v-model="helpdesk"
      location="right"
      width="436"
      temporary
      class="helpdesk-drawer"
      @click.stop
      @keydown.stop
      @keypress.stop
      @keyup.stop
    >
      <v-container class="pa-4" @click.stop>
        <div class="d-flex align-center mb-6" @click.stop>
          <img src="/header-bullet.svg" class="mr-2" />
          <h2 class="text-h2 mb-0">SAMEN VERBETEREN</h2>
        </div>
        <v-divider class="mb-8"></v-divider>

        <v-form @submit.prevent="submitFeedback" @click.stop @keydown.stop @keypress.stop @keyup.stop>
          <div>
            <div class="d-flex align-center2" v-if="selectedFormNumber">
              <v-text-field
                v-model="selectedFormNumber"
                label="Volgnummer"
                placeholder="Volgnummer"
                variant="outlined"
                disabled
                class="mb-0 mr-2"
                required
                readonly
              ></v-text-field>
            </div>
            <div class="d-flex align-center justify-center mb-6" v-if="selectedFormNumber">
              <span class="mr-2 text-subtitle-1 font-weight-lighter">Open melding opnieuw na aanmaken feedback: </span>
              <v-switch v-model="openItemBackUp" color="primary" hide-details density="compact" inset></v-switch>
            </div>
          </div>

          <!-- Feedback Type -->
          <div class="mb-0">
            <label class="text-subtitle-1 font-weight-bold mb-8 d-block">Wat voor feedback wil je geven?</label>
            <v-radio-group v-model="form.type" class="feedback-type-group mt-8">
              <v-radio v-for="option in feedbackOptions" :key="option.value" :label="option.label" :value="option.value" density="compact">
                <template #label>
                  <div class="d-flex align-center">
                    <v-icon :color="option.color" size="small" class="mr-2">{{ option.icon }}</v-icon>
                    {{ option.label }}
                  </div>
                </template>
              </v-radio>
            </v-radio-group>
          </div>

          <!-- Subject -->
          <v-text-field
            v-model="form.subject"
            label="Onderwerp*"
            placeholder="Subject"
            variant="outlined"
            class="mb-0"
            required
          ></v-text-field>

          <!-- Message -->
          <v-textarea
            v-model="form.body"
            label="Bericht*"
            placeholder="Description"
            variant="outlined"
            rows="3"
            required
            class="mb-0"
          ></v-textarea>

          <!-- Screenshot Button -->
          <v-btn
            prepend-icon="mdi-camera"
            variant="outlined"
            class="mb-4"
            @click="requestScreenshot"
            :loading="isCapturing"
            :disabled="isCapturing"
            v-if="!form.imageData"
          >
            Maak Screenshot
          </v-btn>
          <v-btn v-else prepend-icon="mdi-close" color="warning" variant="outlined" class="mb-4" @click="form.imageData = ''">
            Wis Screenshot
          </v-btn>

          <img v-if="form.imageData" :src="form.imageData" class="preview mb-4" />

          <!-- Submit Buttons -->
          <v-btn color="primary" block class="mb-2" :loading="isSubmitting" :disabled="!form.subject || !form.body" @click="submitFeedback">
            Stuur
          </v-btn>

          <v-btn
            block
            variant="outlined"
            @click="
              helpdesk = false;
              cleanupHelpdeskState();
              sendToReport();
            "
          >
            Annuleer
          </v-btn>
        </v-form>
      </v-container>
    </v-navigation-drawer>

    <!-- Overlay when helpdesk is active -->
    <div v-if="helpdesk || showScreenshotHint" class="helpdesk-overlay" @click="handleOverlayClick"></div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue';
import html2canvas from 'html2canvas-pro';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { uploadScreenshot } from '@/API/upload';
import { CreateGithubIssue } from '@/API/github';
import { GetVersion } from '@/API/changelog';
const notification = useNotificationStore();

interface FeedbackOption {
  value: 'bug' | 'data' | 'question' | 'suggestion';
  label: string;
  icon: string;
  color: string;
}

interface CropState {
  active: boolean;
  start: { x: number; y: number };
  left: number;
  top: number;
  width: number;
  height: number;
}

interface FeedbackForm {
  type: FeedbackOption['value'];
  subject: string;
  body: string;
  imageData: string;
}

const MAX_IMAGE_DIMENSION = 1920;
const authStore = useAuthStore();
const meldingStore = useMeldingStore();
const feedbackOptions: FeedbackOption[] = [
  { value: 'bug', label: 'Bug', icon: 'mdi-bug', color: 'error' },
  { value: 'data', label: 'Verkeerde data', icon: 'mdi-alert', color: 'warning' },
  { value: 'question', label: 'Vraag', icon: 'mdi-help', color: 'info' },
  { value: 'suggestion', label: 'Suggestie', icon: 'mdi-lightbulb', color: 'success' }
];

// State
const t = useI18n().t;
const helpdesk = ref(false);
const isSubmitting = ref(false);
const isCapturing = ref(false);
const showScreenshotHint = ref(false);
const hasMouseMoved = ref(false);
const selectedFormNumber = ref('');
const openItemBackUp = ref(false);
let screenshot: HTMLCanvasElement | null = null;

const crop = reactive<CropState>({
  active: false,
  start: { x: 0, y: 0 },
  left: 100,
  top: 100,
  width: 0,
  height: 0
});

const form = reactive<FeedbackForm>({
  type: 'bug',
  subject: '',
  body: '',
  imageData: ''
});

// Utils
const addNoSelectClass = () => document.body.classList.add('no-select');
const removeNoSelectClass = () => document.body.classList.remove('no-select');

const toggleHelpdesk = () => {
  helpdesk.value = !helpdesk.value;
  if (helpdesk.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
    cleanupHelpdeskState();
  }
};

const cleanupHelpdeskState = () => {
  form.imageData = '';
  form.subject = '';
  form.body = '';
  form.type = 'bug';
  isSubmitting.value = false;
  isCapturing.value = false;
  showScreenshotHint.value = false;
  document.body.style.overflow = '';
};

const sendToReport = () => {
  if (selectedFormNumber.value) {
    window.location.href = `/verbeterplein/melding/${selectedFormNumber.value}`;
  }
};

const handleOverlayClick = () => {
  if (!isCapturing.value) {
    helpdesk.value = false;
    cleanupHelpdeskState();
  }
};

// Modify cleanupScreenshotState
const cleanupScreenshotState = () => {
  document.removeEventListener('mousedown', startCrop, true);
  document.removeEventListener('mousemove', moveCrop, true);
  document.removeEventListener('mouseup', endCrop, true);

  showScreenshotHint.value = false;
  hasMouseMoved.value = false;
  crop.active = false;
  isCapturing.value = false;

  document.body.classList.remove('screenshot-mode');
  removeNoSelectClass();

  // Remove any lingering no-select classes from the form fields
  const formFields = document.querySelectorAll('.v-field__input, .v-textarea__input');
  formFields.forEach((field) => {
    field.classList.remove('no-select');
  });

  // Ensure pointer events are restored
  const drawerElement = document.querySelector('.helpdesk-drawer');
  if (drawerElement) {
    (drawerElement as HTMLElement).style.pointerEvents = 'auto';
  }

  document.body.style.overflow = helpdesk.value ? 'hidden' : '';
};

// Modify setupScreenshotListeners
const setupScreenshotListeners = () => {
  document.body.classList.add('screenshot-mode');
  document.addEventListener('mousedown', startCrop, true);
  document.addEventListener('mousemove', moveCrop, true);
  document.addEventListener('mouseup', endCrop, true);
};

const takeScreenshot = async (): Promise<HTMLCanvasElement> => {
  const screenshot = await html2canvas(document.body, {
    useCORS: true,
    allowTaint: true,
    logging: true,
    width: document.documentElement.clientWidth * window.devicePixelRatio,
    height: document.documentElement.clientHeight * window.devicePixelRatio
  });
  if (!screenshot) throw new Error('Failed to capture screenshot');
  return screenshot;
};

const processScreenshot = (canvas: HTMLCanvasElement, cropDimensions: CropState) => {
  if (cropDimensions.width < 10 || cropDimensions.height < 10) {
    throw new Error('Selected area is too small');
  }

  const target = document.createElement('canvas');
  target.width = cropDimensions.width * window.devicePixelRatio;
  target.height = cropDimensions.height * window.devicePixelRatio;

  const ctx = target.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(
    canvas,
    cropDimensions.left * window.devicePixelRatio,
    cropDimensions.top * window.devicePixelRatio,
    cropDimensions.width * window.devicePixelRatio,
    cropDimensions.height * window.devicePixelRatio,
    0,
    0,
    target.width,
    target.height
  );

  return target;
};

const scaleCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  if (canvas.width <= MAX_IMAGE_DIMENSION && canvas.height <= MAX_IMAGE_DIMENSION) {
    return canvas;
  }

  const scale = MAX_IMAGE_DIMENSION / Math.max(canvas.width, canvas.height);
  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = canvas.width * scale;
  scaledCanvas.height = canvas.height * scale;

  const ctx = scaledCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  }

  return scaledCanvas;
};

// Event handlers
const requestScreenshot = async () => {
  if (isCapturing.value) return;
  cleanupScreenshotState();
  isCapturing.value = true;
  helpdesk.value = false;

  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    screenshot = await takeScreenshot();
    showScreenshotHint.value = true;
    addNoSelectClass();
    setupScreenshotListeners();
  } catch (error) {
    notification.error({
      message: t('errors.helpdesk_screenshot_error', { error: error })
    });
    helpdesk.value = true;
  } finally {
    if (!screenshot) cleanupScreenshotState();
  }
};

const moveCrop = (e: MouseEvent) => {
  e.preventDefault();
  if (!crop.active) return;

  if (!hasMouseMoved.value) {
    hasMouseMoved.value = true;
    showScreenshotHint.value = false;
  }

  const dx = e.pageX - crop.start.x;
  const dy = e.pageY - crop.start.y;

  if (dx < 0) {
    crop.left = e.pageX;
    crop.width = crop.start.x - e.pageX;
  } else {
    crop.width = dx;
  }

  if (dy < 0) {
    crop.top = e.pageY;
    crop.height = crop.start.y - e.pageY;
  } else {
    crop.height = dy;
  }
};

const startCrop = (e: MouseEvent) => {
  hasMouseMoved.value = false;
  crop.active = true;
  crop.start = { x: e.pageX, y: e.pageY };
  crop.left = e.pageX;
  crop.top = e.pageY;
  crop.width = 0;
  crop.height = 0;
};

const endCrop = async (e: MouseEvent) => {
  e.preventDefault();

  if (!screenshot || !crop.width || !crop.height) {
    cleanupScreenshotState();
    return;
  }

  try {
    const croppedCanvas = processScreenshot(screenshot, crop);
    const finalCanvas = scaleCanvas(croppedCanvas);
    const dataUrl = finalCanvas.toDataURL('image/png');

    if (!dataUrl || dataUrl === 'data:,') {
      throw new Error('Failed to generate image data');
    }

    form.imageData = dataUrl;
    cleanupScreenshotState();

    // Reduced timeout and ensure drawer is interactive
    setTimeout(() => {
      helpdesk.value = true;
      document.body.classList.remove('screenshot-mode');
      const drawerElement = document.querySelector('.helpdesk-drawer');
      if (drawerElement) {
        (drawerElement as HTMLElement).style.pointerEvents = 'auto';
      }
      // Ensure form fields are interactive
      const formFields = document.querySelectorAll('.v-field__input, .v-textarea__input');
      formFields.forEach((field) => {
        field.classList.remove('no-select');
        (field as HTMLElement).style.pointerEvents = 'auto';
      });
    }, 50);
  } catch (error) {
    notification.error({
      message: t('errors.helpdesk_screenshot_error', { error: error })
    });
    cleanupScreenshotState();
  }
};

// Form submission
const submitFeedback = async () => {
  if (!form.subject || !form.body) return;
  isSubmitting.value = true;

  notification.promise({
    message: t('notifications.creating_feedback')
  });

  const url = window.location.href.includes('/overzicht')
    ? window.location.href.replace('/overzicht', `/melding/${selectedFormNumber.value}`)
    : window.location.href;

  const version = await GetVersion();

  try {
    let message = [
      'Melding vanaf Intalligence \n\n',
      `**Melder**:       ${authStore.user.Name}`,
      `**Email**:        ${authStore.user.Email}`,
      `**Versie**:       ${version.data.latestVersion}`,
      `**URL**:          ${window.location.href}`,
      `**Onderwerp**:    ${form.subject}\n\n`,
      `**Date**:         ${new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} - ${new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
      selectedFormNumber.value ? `**Volgnummer**:   ${selectedFormNumber.value || ''}` : '',
      selectedFormNumber.value ? `**URL MELDING**:  ${url}` : '',
      form.body
    ].join('\n');

    let screenshotUrl = '';
    if (form.imageData) {
      try {
        const base64Data = form.imageData.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArray = new Uint8Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }

        const blob = new Blob([byteArray], { type: 'image/png' });
        const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });

        const response = await uploadScreenshot(file);
        screenshotUrl = response.data.url;
        message += `\n\n![Screenshot](${screenshotUrl})`;
      } catch (error: any) {
        if (error instanceof Error && error.message === 'Upload timed out') {
          notification.error({
            message: t('notifications.feedback_error_upload_timeout', { error: error.message })
          });
        } else {
          notification.error({
            message: t('notifications.feedback_error_upload', { error: error })
          });
        }
        return;
      }
    }
    await CreateGithubIssue({
      title: `[HD] ${form.subject}`,
      body: message,
      labels: ['helpdesk', form.type]
    });

    Object.assign(form, {
      type: 'bug',
      subject: '',
      body: '',
      imageData: ''
    });

    notification.resolvePromise({ message: t('notifications.feedback_created') });

    const shouldRedirect = openItemBackUp.value;
    const redirectId = selectedFormNumber.value;
    helpdesk.value = false;
    if (shouldRedirect && redirectId) {
      await nextTick();
      window.location.href = `/verbeterplein/melding/${redirectId}`;
    }
  } catch (error: any) {
    notification.rejectPromise({ message: t('notifications.feedback_error', { error: error }) });
  } finally {
    isSubmitting.value = false;
  }
};

watch(
  () => meldingStore.selectedForm,
  (newVal: any) => {
    selectedFormNumber.value = newVal?.VolgNummer || '';
  }
);
</script>

<style scoped>
#helpdesk.active {
  right: 399px;
  z-index: 999999;
}

#helpdesk {
  transition: right 0.38s ease;
  font-size: 16px;
  position: fixed;
  top: 50%;
  text-align: center;
  padding: 5px 0px;
  transform: rotate(-90deg);
  transform-origin: right, top;
  border-radius: 5px 5px 0px 0px;
  right: -35px;
  width: 110px;
  background: rgb(var(--v-theme-secondary));
  color: white;
  font-weight: bold;
  z-index: 999999;
}

#helpdesk:hover {
  cursor: pointer;
  background: rgb(var(--v-theme-secondary_lighten_1));
}

.preview {
  width: 100%;
  max-height: 150px;
  border-radius: 4px;
  border: 1px solid rgb(var(--v-border-color));
  object-fit: contain;
  background: rgb(var(--v-theme-surface));
}

/* Ensure drawer appears above other elements */
.v-navigation-drawer {
  z-index: 9999999 !important;
}

/* Add crop styles */
#crop {
  position: fixed;
  border: 2px solid rgb(var(--v-theme-secondary));
  background: rgba(var(--v-theme-secondary), 0.1);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  z-index: 999999 !important;
  pointer-events: none;
}

.screenshot-hint {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999999 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.hint-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  font-size: 1.2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Add this new class */
:global(body.screenshot-mode) {
  cursor: crosshair !important;
}
</style>

<style>
/* Global styles for helpdesk */
.helpdesk-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999999;
}

/* Hide helpdesk on mobile devices */
@media (max-width: 768px) {
  .helpdesk-wrapper,
  .helpdesk-drawer,
  .helpdesk-overlay {
    display: none !important;
  }
}

/* Only enable pointer events for specific helpdesk elements */
#helpdesk,
.v-navigation-drawer,
.helpdesk-overlay {
  pointer-events: all !important;
}

.helpdesk-overlay {
  z-index: 9999998 !important;
}

/* When in screenshot mode, make everything except crop unclickable */
.screenshot-mode .helpdesk-wrapper > *:not(#crop) {
  pointer-events: none;
}

.screenshot-mode #crop {
  pointer-events: auto;
}

/* Prevent text selection during screenshot mode */
.screenshot-mode * {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

:deep(.v-field__input),
:deep(.v-textarea__input) {
  pointer-events: all !important;
  z-index: 9999999 !important;
}

:deep(.v-navigation-drawer__content) {
  pointer-events: all !important;
  z-index: 9999999 !important;
}

:deep(.v-field__input),
:deep(.v-textarea__input),
:deep(.v-text-field input),
:deep(.v-textarea textarea) {
  pointer-events: all !important;
}

:deep(.v-overlay__content) {
  pointer-events: all !important;
}

:deep(.v-overlay__scrim) {
  z-index: 9999998 !important;
}

/* Rest of your existing styles... */
</style>
