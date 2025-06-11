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

    <div class="d-flex stepper-container">
      <v-tabs v-model="currentStep" direction="vertical" class="mr-6 steps-list">
        <template v-for="step in steps" :key="step.value">
          <v-tooltip v-if="!isStepAccessible(step.value)" :text="getStepTooltip(step)" location="right">
            <template v-slot:activator="{ props }">
              <v-tab :value="step.value" :disabled="!isStepAccessible(step.value)" class="justify-start" v-bind="props">
                <template #default>
                  <v-icon start class="mr-2">
                    {{ getStepIcon(step.value, currentStep === step.value) }}
                  </v-icon>
                  <div class="d-flex flex-column align-start">
                    {{ step.title }}
                    <span v-if="step.subtitle" class="text-caption text-medium-emphasis">{{ step.subtitle }}</span>
                  </div>
                </template>
              </v-tab>
            </template>
          </v-tooltip>
          <v-tab v-else :value="step.value" class="justify-start">
            <template #default>
              <v-icon start class="mr-2">
                {{ getStepIcon(step.value, currentStep === step.value) }}
              </v-icon>
              <div class="d-flex flex-column align-start">
                {{ step.title }}
                <span v-if="step.subtitle" class="text-caption text-medium-emphasis">{{ step.subtitle }}</span>
              </div>
            </template>
          </v-tab>
        </template>
      </v-tabs>

      <v-window v-model="currentStep" class="flex-grow-1 step-body-container">
        <v-window-item v-for="step in steps" :key="step.value" :value="step.value">
          <component
            :is="step.component"
            :ref="(el: any) => setStepRef(el, step.value)"
            :errors="errors"
            @step-complete="handleStepComplete"
            @goToStep="goToStep"
            @closeDialog="closeDialog"
            :saveCorrespondence="step.value === 5 ? step3Values : undefined"
          />
        </v-window-item>
      </v-window>
    </div>

    <div class="stepper-navigation">
      <v-btn v-if="currentStep > 1" variant="outlined" @click="handlePrevious"> Terug </v-btn>
      <v-spacer></v-spacer>
      <template v-if="currentStep < steps.length">
        <v-btn v-if="currentStep === 4" color="secondary" class="mr-2" @click="handleSkip()">Overslaan</v-btn>
        <v-tooltip v-if="!canContinue(currentStep)" :text="getNextButtonTooltip()" location="top">
          <template v-slot:activator="{ props }">
            <v-btn color="primary" @click="handleNext" :disabled="!canContinue(currentStep)" v-bind="props"> Volgende </v-btn>
          </template>
        </v-tooltip>
        <v-btn v-else color="primary" @click="handleNext"> Volgende </v-btn>
      </template>
      <v-btn v-if="currentStep === steps.length" color="secondary" @click="handleSubmit" :loading="loading" prepend-icon="mdi-content-save">
        Indienen
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCreateMeldingStore } from '@/stores/verbeterplein/create_melding_store';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
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
const statusStore = useStatusStore();
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
const defaultStatus = ref<any>(null);

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
const skipStep = ref(false);
const setStepRef = (el: any, value: number) => {
  if (el) stepRefs.value[value] = el;
};

onMounted(async () => {
  await statusStore.fetchStatussen();
  defaultStatus.value = statusStore.statusListCorrectief.find((status: any) => status.StatusNaam?.toLowerCase().includes('afgerond'));
});

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
    ...(skipStep.value ? [] : [createMeldingStore.correctief.user, 'Actiehouder Correctief', 5]),
    ...(skipStep.value ? [] : [createMeldingStore.correctief.deadline, 'Deadline Correctief', 6]),
    ...(skipStep.value ? [] : [createMeldingStore.correctief.oplossing, 'Oplossing Correctief', 7]),
    ...(skipStep.value ? [] : [createMeldingStore.correctief.status, 'Status Correctief', 8])
  ];
  let emptyItems: any[] = [];

  arrayToCheck.forEach((item) => {
    if (empty(item[0])) {
      if (item[0] !== null && item[0] !== undefined) {
        emptyItems.push(item[1]);
      }
    }

    if (typeof item[0] === 'number' && (item[0] < 0 || item[0] > 99999999)) {
      emptyItems.push(item[1]);
    }
  });

  if (emptyItems.length > 0) {
    for (const item of emptyItems) {
      for (const component of componentToPage) {
        if (item?.toLowerCase().includes(component[0]?.toLowerCase())) {
          emit('goToStep', [component[1], arrayToCheck.find((i) => i[1] === item)?.[2]]);
          return [false, emptyItems];
        }
      }
    }
    emptyItems = emptyItems.filter((item: any) => Boolean(item));
  }

  if (emptyItems.length > 0) {
    return [false, emptyItems];
  }

  return [true, []];
};

const handleSkip = () => {
  handleStepComplete(4, true);
  skipStep.value = true;
  currentStep.value = 5;
  createMeldingStore.correctiefSkipped = true;
};

const handleSubmit = async () => {
  loading.value = true;
  const [checkedForm, emptyItems] = await checkForm();
  notification.promise({
    message: t('notifications.start_melding')
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
          ProjectNaam: createMeldingStore.project.projectnaam || `Project-${createMeldingStore.project.projectnummer}`,
          NumberID: createMeldingStore.project.projectnummer,
          ProjectleiderId: createMeldingStore.projectleider?.id
        },
        ...(skipStep.value
          ? {
              Correctief: {
                Deadline: new Date().toISOString(),
                Oplossing: 'afgerond',
                Faalkosten: 0,
                StatusID: defaultStatus.value.id,
                AkoordOPS: true
              }
            }
          : {
              Correctief: {
                Deadline: createMeldingStore.correctief.deadline,
                Oplossing: createMeldingStore.correctief.oplossing,
                Faalkosten: createMeldingStore.correctief.faalkosten,
                ActiehouderID: createMeldingStore.correctief.user.id,
                StatusID: createMeldingStore.correctief.status.id
              }
            })
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

        setTimeout(async () => {
          createMeldingStore.clear();
          loading.value = false;
          emit('closeDialog', true);
          emit('update', [true, true]);
          await Promise.all([meldingStore.fetchReports(), projectStore.fetchProjects()]);
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
  padding: 1rem;
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  height: 100%;
  width: 100%;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  overflow: hidden;

  .header-container {
    position: relative;
    padding: 16px 0;

    .close-button {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 96%;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(var(--v-theme-on-surface), 0.12) 15%,
        rgba(var(--v-theme-on-surface), 0.12) 85%,
        transparent 100%
      );
    }
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

  :deep(.v-card) {
    border-radius: 8px;

    .v-card-item {
      border-radius: 8px 8px 0 0;
    }
  }

  .stepper-container {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;

    .steps-list {
      min-width: 240px;
      border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
      padding-right: 1rem;
      overflow-y: auto;

      :deep(.v-tab) {
        justify-content: flex-start !important;
        text-align: left;
        min-height: 48px;
        padding: 0 16px;
        opacity: 1;
        margin-bottom: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;

        &:not(.v-tab--disabled):hover {
          background: rgba(var(--v-theme-primary), 0.05);
        }

        &.v-tab--selected {
          background: rgba(var(--v-theme-primary), 0.1);
          color: rgb(var(--v-theme-primary));
        }
      }

      :deep(.v-tab.v-tab--disabled) {
        opacity: 0.7;
      }
    }

    .step-body-container {
      flex: 1;
      padding: 0 24px;
      overflow-y: auto;
      min-height: 0;
    }
  }

  .stepper-navigation {
    display: flex;
    padding-top: 1rem;
    margin-top: 1rem;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  }

  :deep(.v-row) {
    display: flex;
    flex-wrap: wrap;
    margin: -12px;

    .v-col {
      flex: 0 0 50%;
      padding: 12px;

      @media (max-width: 600px) {
        flex: 0 0 100%;
      }

      .d-flex {
        flex-direction: row;
        gap: 1rem;

        @media (max-width: 600px) {
          flex-direction: column;
        }

        .flex-grow-1 {
          flex: 1;
        }
      }
    }
  }

  :deep(.v-input) {
    width: 100%;
    min-width: unset;
    max-width: 100%;
  }
}

:deep(.v-field),
:deep(.v-field__input),
:deep(.v-text-field) {
  transition: none !important;
}

:deep(.v-row) {
  display: flex;
  flex-wrap: wrap;

  .v-col {
    flex: 0 1 auto;
    width: auto;
    max-width: none;
  }
}

:deep(.v-input) {
  width: auto;
  min-width: 200px;
  max-width: 400px;
}
</style>
