<template>
  <div class="melding-stepper">
    <div class="header-container mb-4">
      <v-btn icon="mdi-close" variant="text" size="small" class="close-button" @click="closeDialog" />
      <div class="d-flex align-center">
        <div class="header-icon">
          <v-icon color="primary" size="x-large">mdi-clipboard-edit-outline</v-icon>
        </div>
        <div class="header-content">
          <div class="text-overline text-medium-emphasis mb-n1">Verbeterplein</div>
          <div class="d-flex align-center">
            <h2 class="text-h5 font-weight-medium">Nieuwe <span class="text-primary font-weight-bold">Melding</span></h2>
            <v-chip color="primary" variant="flat" size="small" class="ml-3" density="comfortable">
              <template v-slot:prepend>
                <v-icon size="x-small" start>mdi-pencil</v-icon>
              </template>
              Concept
            </v-chip>
          </div>
        </div>
      </div>
    </div>

    <div class="stepper-nav px-4 mb-6">
      <div class="stepper-steps">
        <div
          v-for="step in steps"
          :key="step.value"
          class="step-item"
          :class="{
            active: currentStep === step.value,
            completed: isStepCompleted(step.value),
            disabled: !isStepAccessible(step.value)
          }"
          @click="handleStepClick(step)"
        >
          <div class="step-circle">
            <v-icon v-if="isStepCompleted(step.value)" size="small">mdi-check</v-icon>
            <span v-else>{{ step.value }}</span>
          </div>
          <div class="step-label">
            {{ step.title }}
            <span v-if="step.subtitle" class="step-subtitle">{{ step.subtitle }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="step-content px-4">
      <v-window v-model="currentStep">
        <v-window-item v-for="step in steps" :key="step.value" :value="step.value">
          <component
            :is="step.component"
            :ref="(el: any) => setStepRef(el, step.value)"
            :errors="errors"
            @step-complete="handleStepComplete"
            @goToStep="goToStep"
            @closeDialog="closeDialog"
            @update="handleUpdate"
            :saveCorrespondence="step.value === 5 ? step3Values : undefined"
          />
        </v-window-item>
      </v-window>
    </div>

    <div class="stepper-navigation px-4">
      <v-btn v-if="currentStep > 1" variant="outlined" @click="handlePrevious" density="comfortable"> Terug </v-btn>
      <v-spacer></v-spacer>
      <template v-if="currentStep < steps.length">
        <v-tooltip v-if="!canContinue(currentStep)" :text="getNextButtonTooltip()" location="top">
          <template v-slot:activator="{ props }">
            <v-btn color="primary" @click="handleNext" :disabled="!canContinue(currentStep)" v-bind="props" density="comfortable">
              Volgende
            </v-btn>
          </template>
        </v-tooltip>
        <v-btn v-else color="primary" @click="handleNext" density="comfortable"> Volgende </v-btn>
      </template>
      <v-btn
        v-if="currentStep === steps.length"
        color="secondary"
        @click="handleSubmit"
        :loading="loading"
        prepend-icon="mdi-content-save"
        density="comfortable"
      >
        Indienen
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCreateMeldingStore } from '@/stores/verbeterplein/create_melding_store';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { useProjectStore } from '@/stores/verbeterplein/project_store';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';

import Step1 from './stepperSteps/Melding/step1.vue';
import Step2 from './stepperSteps/Melding/step2.vue';
import Step3 from './stepperSteps/shared/stepBijlagen.vue';
import Step4 from './stepperSteps/shared/stepCorrectief.vue';
import Step5 from './stepperSteps/Melding/step5.vue';

const t = useI18n().t;

const createMeldingStore = useCreateMeldingStore();
const meldingStore = useMeldingStore();
const projectStore = useProjectStore();
const router = useRouter();
const notification = useNotificationStore();

interface Step {
  value: number;
  title: string;
  subtitle?: string;
  component: Component;
  optional?: boolean;
}

const currentStep = ref(1);
const completedSteps = ref<Set<number>>(new Set());
const errors = ref<Record<number, string>>({});
const stepRefs = ref<Record<number, any>>({});
const showConfirmDialog = ref(false);
const loading = ref(false);

const steps: Step[] = [
  { value: 1, title: t('verbeterplein.createReport.step1'), component: Step1 },
  { value: 2, title: t('verbeterplein.createReport.step2'), component: Step2 },
  {
    value: 3,
    title: t('verbeterplein.createReport.step3'),
    component: Step3,
    subtitle: t('verbeterplein.createReport.step3_subtitle'),
    optional: true
  },
  { value: 4, title: t('verbeterplein.createReport.step4'), component: Step4 },
  { value: 5, title: t('verbeterplein.createReport.step5'), component: Step5 }
];

const emit = defineEmits<{
  (e: 'closeDialog', force?: boolean): void;
  (e: 'update', update: boolean[]): void;
  (e: 'goToStep', step: [string, number?]): void;
}>();

const step3Values = computed(() => stepRefs.value[3]?.saveCorrespondence);

const setStepRef = (el: any, value: number) => {
  if (el) stepRefs.value[value] = el;
};

const getStepIcon = (step: number, selected: boolean) => {
  if (completedSteps.value.has(step)) {
    return 'mdi-check-circle';
  }
  return `mdi-numeric-${step}-circle${selected ? '' : '-outline'}`;
};

const isStepCompleted = (step: number): boolean => {
  return completedSteps.value.has(step);
};

const canContinue = (step: number): boolean => {
  return isStepCompleted(step) || !!steps[step - 1]?.optional;
};

const handlePrevious = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const handleNext = () => {
  if (currentStep.value < steps.length && canContinue(currentStep.value)) {
    currentStep.value++;
  }
};

const handleClose = (forceClose: boolean = false) => {
  if (forceClose) {
    emit('closeDialog', true);
  } else {
    showConfirmDialog.value = true;
  }
};

const closeDialog = (forceClose: boolean = false) => handleClose(forceClose);

const handleStepComplete = (step: number, completed: boolean) => {
  if (completed === true) {
    completedSteps.value.add(step);
  } else {
    completedSteps.value.delete(step);
  }
};

const handleUpdate = (update: boolean[]) => {
  emit('update', update);
};

const goToStep = (step: string[]) => {
  const stepNumber = parseInt(step[0].replace('step', ''));
  currentStep.value = stepNumber;

  if (step[1]) {
    errors.value[stepNumber] = step[1];
  }
};

const empty = (value: any) => {
  return value === null || value === undefined || value === '' || (typeof value === 'string' && value?.trim() === '');
};

const checkForm = async (): Promise<[boolean, string[]]> => {
  const componentToPage = [
    ['obstakel', 'step1'],
    ['project', 'step2'],
    ['correctief', 'step4']
  ];
  const arrayToCheck = [
    [createMeldingStore.obstakel, 'Obstakel', 1],
    [createMeldingStore.project.projectnummer, 'Project nummer', 2],
    [createMeldingStore.project.deelorder, 'Project Deelorder', 3],
    [createMeldingStore.correctief.user, 'Actiehouder Correctief', 5],
    [createMeldingStore.correctief.deadline, 'Deadline Correctief', 6],
    [createMeldingStore.correctief.oplossing, 'Oplossing Correctief', 7],
    [createMeldingStore.correctief.status, 'Status Correctief', 8]
  ];
  const emptyItems: any[] = [];

  arrayToCheck.forEach((item) => {
    if (empty(item[0])) {
      emptyItems.push(item[1]);
    }
  });

  if (emptyItems.length > 0) {
    for (const item of emptyItems) {
      for (const component of componentToPage) {
        if (item.toLowerCase().includes(component[0].toLowerCase())) {
          emit('goToStep', [component[1], arrayToCheck.find((i) => i[1] === item)?.[2]]);
          return [false, emptyItems];
        }
      }
    }
    return [false, emptyItems];
  }

  return [true, []];
};

const handleSubmit = async () => {
  loading.value = true;
  const [checkedForm, emptyItems] = await checkForm();
  notification.promise({
    message: t('notifications.start_melding'),
    duration: 2500
  });

  if (checkedForm === true) {
    try {
      const project = projectStore.projects.find((project: any) => project.NumberID === createMeldingStore.project.projectnummer);
      const meldingData: any = {
        Type: 'Melding',
        PDCA: false,
        Obstakel: createMeldingStore.obstakel,
        Deelorder: createMeldingStore.project.deelorder,
        ProjectID: project?.id,
        CorrespondenceIDs: {
          IDs: JSON.stringify(createMeldingStore.bijlagen)
        },
        Project: {
          ProjectNaam: createMeldingStore.project.projectnaam,
          NumberID: createMeldingStore.project.projectnummer,
          Deelorders: [],
          ProjectleiderId: createMeldingStore.projectleider?.id
        },
        Correctief: {
          Deadline: createMeldingStore.correctief.deadline,
          Oplossing: createMeldingStore.correctief.oplossing,
          Faalkosten: createMeldingStore.correctief.faalkosten,
          ActiehouderID: createMeldingStore.correctief.user.id,
          StatusID: createMeldingStore.correctief.status.id
        }
      };

      const report = await meldingStore.addReport(meldingData);

      if (report?.status === 201) {
        meldingStore.selectedFormId = report.data.id;
        if (createMeldingStore.bijlagen.length > 0 && step3Values.value?.()) {
          await step3Values.value();
        }

        notification.resolvePromise({
          message: t('notifications.create_success'),
          duration: 2500
        });

        setTimeout(() => {
          loading.value = false;
          emit('closeDialog', true);
          emit('update', [true, true]);
          meldingStore.fetchReports();
          router.push('/verbeterplein/overzicht');
        }, 500);
      }
    } catch (error) {
      loading.value = false;
      notification.rejectPromise({
        message: t('errors.create_melding_failed', { error: error })
      });
    } finally {
      loading.value = false;
    }
  } else {
    loading.value = false;
    notification.rejectPromise({
      message: t('errors.create_melding_failed_required', { error: emptyItems.join(', ') })
    });
  }
};

const handleStepClick = (step: Step) => {
  if (isStepAccessible(step.value)) {
    currentStep.value = step.value;
  }
};

const isStepAccessible = (step: number): boolean => {
  if (step === 1) return true;

  if (steps[step - 1]?.optional && isStepCompleted(step - 1)) return true;

  for (let i = 1; i < step; i++) {
    if (!steps[i - 1]?.optional && !isStepCompleted(i)) {
      return false;
    }
  }
  return true;
};

const getStepTooltip = (step: Step): string => {
  if (!isStepAccessible(step.value)) {
    return 'Vul eerst de vorige stappen in';
  }
  return '';
};

const getNextButtonTooltip = (): string => {
  if (!canContinue(currentStep.value)) {
    return 'Vul eerst alle verplichte velden in';
  }
  return '';
};
</script>

<style lang="scss" scoped>
.melding-stepper {
  padding: 0;
  background: rgb(var(--v-theme-surface));
  height: 100vh;
  display: flex;
  flex-direction: column;

  .header-container {
    position: relative;
    padding: 16px;
    background: rgb(var(--v-theme-surface));
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);

    .close-button {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1;
    }

    .header-icon {
      position: relative;
      margin-right: 16px;

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        right: -8px;
        transform: translateY(-50%);
        width: 1px;
        height: 44px;
        background: linear-gradient(
          180deg,
          transparent 0%,
          rgba(var(--v-theme-on-surface), 0.12) 20%,
          rgba(var(--v-theme-on-surface), 0.12) 80%,
          transparent 100%
        );
      }
    }

    .header-content {
      .text-overline {
        letter-spacing: 2px;
        font-size: 11px;
        opacity: 0.8;
      }
    }
  }

  .stepper-nav {
    position: sticky;
    top: 0;
    z-index: 1;
    background: rgb(var(--v-theme-surface));
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 8px;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);

    .stepper-steps {
      display: flex;
      min-width: min-content;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 16px;
        left: 20px;
        right: 20px;
        height: 2px;
        background: rgba(var(--v-theme-on-surface), 0.12);
        z-index: 1;
      }

      .step-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        min-width: 80px;
        position: relative;
        z-index: 2;
        padding: 0 8px;
        cursor: pointer;

        &.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgb(var(--v-theme-surface));
          border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .step-label {
          text-align: center;
          font-size: 12px;
          line-height: 1.2;
          color: rgba(var(--v-theme-on-surface), 0.87);

          .step-subtitle {
            display: block;
            font-size: 10px;
            color: rgba(var(--v-theme-on-surface), 0.6);
          }
        }

        &.active {
          .step-circle {
            background: rgb(var(--v-theme-primary));
            border-color: rgb(var(--v-theme-primary));
            color: rgb(var(--v-theme-on-primary));
          }

          .step-label {
            color: rgb(var(--v-theme-primary));
          }
        }

        &.completed {
          .step-circle {
            background: rgb(var(--v-theme-primary));
            border-color: rgb(var(--v-theme-primary));
            color: rgb(var(--v-theme-on-primary));
          }
        }
      }
    }
  }

  .step-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .stepper-navigation {
    position: sticky;
    bottom: 0;
    background: rgb(var(--v-theme-surface));
    display: flex;
    padding: 16px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
  }
}

:deep(.v-row) {
  display: flex !important;
  flex-direction: column !important;
  margin: -8px;

  .v-col {
    flex: 0 0 100% !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 8px;

    // Force single column layout for flex containers
    .d-flex {
      flex-direction: column !important;
      gap: 1rem !important;

      .flex-grow-1 {
        width: 100% !important;
      }
    }
  }
}

:deep(.v-input) {
  width: 100% !important;
  max-width: 100% !important;
}

.step-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  :deep(.v-card) {
    width: 100%;
  }
}
</style>
