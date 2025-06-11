<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { IconDeviceFloppy } from '@tabler/icons-vue';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { usePreventiefStore } from '@/stores/verbeterplein/preventief_store';
import { generateRootCauseAnalysis } from '@/utils/obstacleAnalyzer';
import { detectChanges } from '@/utils/changeDetector';
import type { Node, LearningPoint, Preventief } from '@/types/pdca';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import TodoTable from '@/components/common/TodoTable.vue';
import { useI18n } from 'vue-i18n';
import { hasPermission } from '@/utils/permission';
import { useTaskStore } from '@/stores/task_store';
import { companyKPIs } from '@/data/companyKPIs';
import { useCanCompletePreventief } from '@/utils/canCompletePreventief';
import { useStatusStore } from '@/stores/verbeterplein/status_store'; // Added

// Add these types at the top of the file
type SmartKey = 'Specifiek' | 'Meetbaar' | 'Haalbaar' | 'Relevant' | 'Tijdgebonden';
type StepKey = 'Obstakel' | 'Plan' | 'Do' | 'Check' | 'Act' | 'Finished';

const { t } = useI18n();

const meldingStore = useMeldingStore();
const actiehouderStore = useActiehouderStore();
const preventiefStore = usePreventiefStore();
const taskStore = useTaskStore();
const notification = useNotificationStore();
const statusStore = useStatusStore(); // Added
const melding = ref<any>({});
const actiehouders = ref<any[]>([]);
const teamMembers = ref<any[]>([]);
const taskEvaluations = ref<Record<string, { effectiviteit: string; impact: string; comments: string }>>({});
const defaultSmartItem = { Text: '', Behaald: '', Toelichting: '' };
const defaultStep = { Finished: false, Deadline: null };

// Step 1: Introduce originalPreventiefData ref
const originalPreventiefData = ref<Preventief | null>(null);
const kernoorzaakTriggeredStatusUpdate = ref(false); // Added

const preventief = ref<Preventief>({
  ...{
    Teamleden: null,
    CorrespondenceIDs: null,
    Smart: {
      Specifiek: { ...defaultSmartItem },
      Meetbaar: { ...defaultSmartItem },
      Haalbaar: { ...defaultSmartItem },
      Relevant: { ...defaultSmartItem },
      Tijdgebonden: { ...defaultSmartItem }
    },
    Steps: {
      Obstakel: { ...defaultStep },
      Plan: { ...defaultStep },
      Do: { ...defaultStep },
      Check: { ...defaultStep },
      Act: { ...defaultStep },
      Finished: { ...defaultStep }
    }
  },
  FailureAnalysis: null,
  NewPDCAPlanning: null,
  Documentation: null,
  TrainingNeeded: false,
  TrainingNeededType: null,
  Monitoring: null,
  FollowUpDate: null,
  Responsible: null,
  TodoItems: [],
  id: '',
  Kernoorzaak: null,
  Why: null,
  Deadline: null,
  Title: null,
  Strategie: {
    KPI: null,
    Comments: null
  },
  Conclusie: null,
  PDCAStatus: null,
  ActJSON: null,
  StatusID: null,
  BegeleiderID: null,
  Begeleider: null,
  CreatedAt: '',
  UpdatedAt: '',
  User: null,
  Status: null
});

const teamLeaders = ref<any[]>([]);
const leanCoaches = ref<any[]>([]);

const AUTOSAVE_DELAY = 5000;
const autoSaveTimeout = ref<number | null>(null);
const isSaving = ref(false);
const lastSaved = ref<Date | null>(null);

const resetAutoSaveTimer = () => {
  console.log('[AutoSave Debug] Resetting autosave timer.'); // Log timer reset
  if (autoSaveTimeout.value) {
    window.clearTimeout(autoSaveTimeout.value);
  }
  autoSaveTimeout.value = window.setTimeout(async () => {
    if (selectedNode.value && !isSaving.value) {
      await handleAutoSave();
      lastSaved.value = new Date();
      isSaving.value = false;
    }
  }, AUTOSAVE_DELAY);
};

const startAutoSave = () => {
  setTimeout(() => {
    watch(
      [() => preventief.value, () => taskEvaluations.value],
      ([newVal, newTaskEvaluations], [oldVal, oldTaskEvaluations]) => {
        console.log('[AutoSave Debug] Watcher triggered.'); // Log watcher trigger
        if (newTaskEvaluations && Object.keys(newTaskEvaluations).length > 0) {
          console.log('[AutoSave Debug] Task evaluations changed, resetting timer.');
          resetAutoSaveTimer();
        }

        // Also trigger for preventief changes
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          console.log('[AutoSave Debug] Preventief data changed, resetting timer.');
          resetAutoSaveTimer();
        }
      },
      { deep: true, immediate: false }
    );
  }, 1000);
};

const beforeUnloadHandler = async (e: BeforeUnloadEvent) => {
  if (isSaving.value) {
    e.preventDefault();
    return;
  }

  if (selectedNode.value) {
    e.preventDefault();
    isSaving.value = true;
    await handleSave(selectedNode.value);
    isSaving.value = false;
  }
};

// Update onUnmounted to clear the timeout
onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler);

  if (autoSaveTimeout.value) {
    window.clearTimeout(autoSaveTimeout.value);
    autoSaveTimeout.value = null;
  }
});

onMounted(async () => {
  if (meldingStore.selectedFormId) {
    // Load required data
    if (
      preventiefStore.preventieven?.length === 0 ||
      preventiefStore.preventieven === null ||
      preventiefStore.loading.all == true ||
      preventiefStore.loading.single == true
    ) {
      await preventiefStore.getAllPreventief();
    }
    if (
      actiehouderStore.actiehouders?.length === 0 ||
      actiehouderStore.actiehouders === null ||
      actiehouderStore.loading.all == true ||
      actiehouderStore.loading.single == true
    ) {
      await actiehouderStore.fetchActiehouders();
    }

    // Set required refs
    melding.value = meldingStore.getReportById(meldingStore.selectedFormId);
    actiehouders.value = actiehouderStore.actiehouders;
    teamMembers.value = actiehouders.value;
    teamLeaders.value = actiehouders.value;
    leanCoaches.value = actiehouders.value;

    // Ensure status store is initialized
    if (!statusStore.initialized) {
      await statusStore.initialize();
    }

    // Fetch preventief data
    const response = await preventiefStore.getSinglePreventief(melding.value?.Preventief?.id);

    // Only proceed if we have data
    if (response?.data) {
      // Create a fully filled in preventief object
      const fetchedPreventief = response.data;

      // Ensure tasks are loaded before initializing evaluations
      if (melding.value?.Preventief?.id) {
        await taskStore.fetchTasksByPreventief(melding.value.Preventief.id);
      }

      // Initialize task evaluations from existing tasks
      if (taskStore.preventiefTasks.size > 0) {
        const tasks = Array.from(taskStore.preventiefTasks.values());
        tasks.forEach((task) => {
          if (!taskEvaluations.value[task.id]) {
            taskEvaluations.value[task.id] = {
              effectiviteit: task.data?.effectiviteit || '',
              impact: task.data?.impact || '',
              comments: task.data?.comments || ''
            };
          }
        });
      }

      // Fill in missing properties with default values
      if (!fetchedPreventief.Smart) {
        fetchedPreventief.Smart = {
          Specifiek: { ...defaultSmartItem },
          Meetbaar: { ...defaultSmartItem },
          Haalbaar: { ...defaultSmartItem },
          Relevant: { ...defaultSmartItem },
          Tijdgebonden: { ...defaultSmartItem }
        };
      } else {
        Object.keys(fetchedPreventief.Smart).forEach((key) => {
          if (!fetchedPreventief.Smart[key as SmartKey].Toelichting) {
            fetchedPreventief.Smart[key as SmartKey].Toelichting = '';
          }
        });
      }
      if (!fetchedPreventief.Strategie) {
        fetchedPreventief.Strategie = { KPI: null, Comments: null };
      }
      if (!fetchedPreventief.Steps) {
        fetchedPreventief.Steps = {
          Obstakel: { ...defaultStep },
          Plan: { ...defaultStep },
          Do: { ...defaultStep },
          Check: { ...defaultStep },
          Act: { ...defaultStep },
          Finished: { ...defaultStep }
        };
      } else {
        // Process PDCA state for existing data
        currentStep.value = 'obstacle';

        if (fetchedPreventief.Steps.Obstakel?.Finished) {
          completedNodes.value.add('obstacle');
          currentStep.value = 'obstacle';
        }

        if (fetchedPreventief.Steps.Plan?.Finished) {
          completedNodes.value.add('plan');
          currentStep.value = 'plan';
        }

        if (fetchedPreventief.Steps.Do?.Finished) {
          completedNodes.value.add('do');
          currentStep.value = 'do';
        }

        if (fetchedPreventief.Steps.Check?.Finished) {
          completedNodes.value.add('check');
          currentStep.value = 'check';
        }

        if (fetchedPreventief.Steps.Act?.Finished) {
          completedNodes.value.add('act');
          currentStep.value = 'act';
        }

        handleNextStep({
          id: currentStep.value,
          label: currentStep.value.toUpperCase(),
          title: getNodeInfo(currentStep.value as FlowStep).title,
          description: getNodeInfo(currentStep.value as FlowStep).description,
          status: completedNodes.value.has(currentStep.value) ? 'Completed' : 'Not Started'
        });
      }

      // Only set preventief.value once we have all the data
      preventief.value = fetchedPreventief;

      // Step 2: Initialize originalPreventiefData with a deep clone
      originalPreventiefData.value = JSON.parse(JSON.stringify(fetchedPreventief));

      // Start autosave
      startAutoSave();

      // Add beforeunload listener
      window.addEventListener('beforeunload', beforeUnloadHandler);
    }
  }
});

// Update onUnmounted to use the stored handler
onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler);

  // Clear autosave interval
  if (autoSaveTimeout.value) {
    window.clearTimeout(autoSaveTimeout.value);
    autoSaveTimeout.value = null;
  }
});

// Add this computed property
const updateTijdgebondenText = computed({
  get: () => {
    const doDeadline = preventief.value.Steps?.Do?.Deadline;
    const checkDeadline = preventief.value.Steps?.Check?.Deadline;
    const actDeadline = preventief.value.Steps?.Act?.Deadline;

    if (!doDeadline && !checkDeadline && !actDeadline) {
      return '';
    }

    let text = '';
    if (doDeadline) text += `DO fase wordt afgerond op ${formatDate(doDeadline)}. `;
    if (checkDeadline) text += `CHECK fase wordt afgerond op ${formatDate(checkDeadline)}. `;
    if (actDeadline) text += `ACT fase wordt afgerond op ${formatDate(actDeadline)}.`;

    return text.trim();
  },
  set: (newValue) => {
    if (preventief.value?.Smart?.Tijdgebonden) {
      preventief.value.Smart.Tijdgebonden.Text = newValue;
    }
  }
});

// Add this computed property
const updateRelevantText = computed({
  get: () => {
    const kpi = preventief.value.Strategie?.KPI;
    const comments = preventief.value.Strategie?.Comments;

    if (!kpi && !comments) {
      return '';
    }

    let text = '';
    if (kpi) text += `Dit draagt bij aan KPI: ${kpi}. `;
    if (comments) text += comments;

    return text.trim();
  },
  set: (newValue) => {
    if (preventief.value?.Smart?.Relevant) {
      preventief.value.Smart.Relevant.Text = newValue;
    }
  }
});

// Add a watcher for the Strategie fields
watch([() => preventief.value.Strategie?.KPI, () => preventief.value.Strategie?.Comments], () => {
  if (preventief.value?.Smart?.Relevant) {
    preventief.value.Smart.Relevant.Text = updateRelevantText.value;
  }
});

// Add a watcher for the deadlines
watch(
  [() => preventief.value.Steps?.Do?.Deadline, () => preventief.value.Steps?.Check?.Deadline, () => preventief.value.Steps?.Act?.Deadline],
  () => {
    if (preventief.value?.Smart?.Tijdgebonden) {
      preventief.value.Smart.Tijdgebonden.Text = updateTijdgebondenText.value;
    }
  }
);

const flowOrder = ['obstacle', 'plan', 'do', 'check', 'act', 'finished'] as const;
type FlowStep = (typeof flowOrder)[number];

const currentStep = ref<FlowStep>('obstacle');
const showDialog = ref(false);
const dialogVisible = ref(false);
const selectedNode = ref<Node | null>(null);
const completedNodes = ref<Set<string>>(new Set());

const handleNodeClick = (node: Node) => {
  if (!isNodeClickable(node.id)) return;
  const nodeInfo = getNodeInfo(node.id as FlowStep);
  selectedNode.value = {
    ...node,
    title: nodeInfo.title,
    description: nodeInfo.description,
    status: node.status || 'Not Started'
  };
  showDialog.value = true;
  dialogVisible.value = true;
};

const handleCompleteStep = (updatedNode: Node) => {
  switch (updatedNode.id) {
    case 'obstacle':
      preventief.value.Steps.Obstakel.Finished = true;
      break;
    case 'plan':
      preventief.value.Steps.Plan.Finished = true;
      break;
    case 'do':
      preventief.value.Steps.Do.Finished = true;
      break;
    case 'check':
      preventief.value.Steps.Check.Finished = true;
      break;
    case 'act':
      preventief.value.Steps.Act.Finished = true;
      break;
    default:
      break;
  }
};

const handleAutoSave = async () => {
  console.log(`[AutoSave Debug] handleAutoSave started. isSaving: ${isSaving.value}`); // Log autosave start
  if (isSaving.value) {
    console.log('[AutoSave Debug] Already saving, exiting handleAutoSave.');
    return;
  }

  isSaving.value = true;
  try {
    console.log('[AutoSave Debug] Kernoorzaak before currentState:', preventief.value.Kernoorzaak); // Log current Kernoorzaak
    const currentState = JSON.parse(JSON.stringify(preventief.value));
    // Step 5: Compare against originalPreventiefData
    const changes = detectChanges(originalPreventiefData.value || {}, currentState);
    console.log('[detectChanges Debug] Detected changes (comparing against original):', changes);

    if (taskStore.preventiefTasks.size > 0) {
      const currentTasks = Array.from(taskStore.preventiefTasks.values());
      for (const task of currentTasks) {
        const evaluationData = taskEvaluations.value[task.id] || {
          effectiviteit: '',
          impact: '',
          comments: ''
        };

        // Only update tasks if we have actual data to send
        // or if the task already has data that we want to preserve
        const hasExistingData = task.data?.effectiviteit || task.data?.impact || task.data?.comments;
        const hasNewData = evaluationData.effectiviteit || evaluationData.impact || evaluationData.comments;

        // If we have new data or we're preserving existing data, update
        if (hasNewData || (hasExistingData && JSON.stringify(evaluationData) !== JSON.stringify(task.data))) {
          console.log(`[AutoSave Debug] Updating task ${task.id} with data:`, evaluationData); // Log task update
          await taskStore.updateTask(task.id, 'preventief', {
            data: evaluationData
          });
        }
      }

      // Refresh tasks after updates
      console.log('[AutoSave Debug] Refreshing tasks after updates.');
      await taskStore.fetchTasksByPreventief(melding.value.Preventief.id);
    }

    if (changes.length > 0) {
      const updates = changes.reduce((acc: any, change: any) => {
        if (selectedNode.value?.id === 'check' && change.field === 'Smart') {
          return {
            ...acc,
            Smart: currentState.Smart
          };
        }
        return {
          ...acc,
          [change.field]: change.newValue
        };
      }, {});

      console.log('[AutoSave Debug] Calling updatePreventiefAutoSave with updates:', updates);
      const response = await preventiefStore.updatePreventiefAutoSave(melding.value.Preventief.id, updates);

      if (response?.status === 200) {
        console.log('[AutoSave Debug] Autosave successful.');
        lastSaved.value = new Date(); // <-- Ensure lastSaved is updated here
        // Step 3: Update originalPreventiefData after successful save
        originalPreventiefData.value = JSON.parse(JSON.stringify(currentState));
      } else {
        console.error('[AutoSave Debug] Autosave failed:', response); // Log failure
      }
    } else {
      console.log('[AutoSave Debug] No changes detected, skipping API call.');
    }
  } catch (error) {
    console.error('[AutoSave Debug] Error during autosave:', error);
  } finally {
    isSaving.value = false;
    console.log(`[AutoSave Debug] handleAutoSave finished. isSaving: ${isSaving.value}`); // Log autosave completion
  }
};

// Modify handleSave to handle step completion
const handleSave = async (updatedNode: Node) => {
  if (isSaving.value) return;

  isSaving.value = true;
  try {
    if (canComplete.value) {
      handleCompleteStep(updatedNode);
      completedNodes.value.add(updatedNode.id);
      handleNextStep(updatedNode);
    }

    await handleAutoSave();

    // --> Add status update logic here
    if (updatedNode.id === 'act' && canComplete.value) {
      // Check if the save was successful before updating status
      // We might need a better way to confirm success from handleAutoSave if it doesn't throw
      // Assuming handleAutoSave updates the originalPreventiefData on success
      if (preventief.value.Steps?.Act?.Finished) {
        await setPreventiefStatusToAfgerond();
      }
    }
    // <-- End of added logic
  } finally {
    isSaving.value = false;
  }
};

// Function to set status to Afgerond (similar to the one in meldingItem)
const setPreventiefStatusToAfgerond = async () => {
  // Ensure status store is initialized if not already
  if (!statusStore.initialized) {
    await statusStore.initializeData();
  }

  const afgerondStatus = statusStore.getStatusByName('Afgerond');
  const preventiefId = preventief.value?.id;

  if (!preventiefId) {
    console.warn('Preventief ID not found when trying to auto-set status to Afgerond from PDCA.');
    return;
  }

  if (!afgerondStatus?.id) {
    console.warn('Status "Afgerond" not found.');
    return;
  }

  // Check if status is already Afgerond
  if (preventief.value.StatusID === afgerondStatus.id) {
    console.log('Preventief status is already Afgerond.');
    return;
  }

  console.log(`PDCA ACT complete: Auto-setting status for Preventief ${preventiefId} to "Afgerond" (${afgerondStatus.id}).`);

  try {
    // Use updatePreventiefAutoSave for potentially less UI disruption
    const updateResult = await preventiefStore.updatePreventiefAutoSave(preventiefId, { StatusID: afgerondStatus.id });

    if (updateResult?.status === 200) {
      console.log(`Successfully auto-updated status for Preventief ${preventiefId} to Afgerond from PDCA.`);
      // Update local preventief status ID to prevent repeat calls
      preventief.value.StatusID = afgerondStatus.id;
      // Optionally emit an event or trigger refresh in parent if needed
    } else {
      console.error('Failed to auto-update preventief status to Afgerond from PDCA:', updateResult);
      // Optionally notify user
    }
  } catch (error) {
    console.error('Error auto-updating preventief status to Afgerond from PDCA:', error);
    // Optionally notify user
  }
};

const handleNextStep = (updatedNode: Node) => {
  if (!completedNodes.value.has(updatedNode.id)) {
    return;
  }

  const currentIndex = flowOrder.indexOf(updatedNode.id as FlowStep);
  if (currentIndex < flowOrder.length - 1) {
    const nextStepId = flowOrder[currentIndex + 1];

    // Only move to next step if current step is completed
    if (completedNodes.value.has(updatedNode.id)) {
      currentStep.value = nextStepId;

      // Only open drawer for next node if we're not closing
      if (showDialog.value) {
        const nextNode = {
          id: nextStepId,
          label: nextStepId.toUpperCase(),
          title: getNodeInfo(nextStepId as FlowStep).title,
          description: getNodeInfo(nextStepId as FlowStep).description,
          status: (completedNodes.value.has(nextStepId) ? 'Completed' : 'Not Started') as 'Completed' | 'Not Started' | 'In Progress'
        };
        selectedNode.value = nextNode;
      }
    }
  } else if (updatedNode.id === 'act' && completedNodes.value.has('act')) {
    currentStep.value = 'finished';
    showDialog.value = false;
  }
};

const isNodeClickable = (nodeId: string): boolean => {
  const stepIndex = flowOrder.indexOf(currentStep.value as FlowStep);
  const nodeIndex = flowOrder.indexOf(nodeId as FlowStep);

  // Can only click current step or completed steps
  if (nodeIndex === stepIndex) return true;
  if (nodeIndex < stepIndex && completedNodes.value.has(nodeId)) return true;
  return false;
};

const getNodeInfo = (step: FlowStep): { title: string; description: string } => {
  const nodeInfo = {
    obstacle: {
      title: 'ONDERZOEK KERNOORZAAK',
      description: 'Identify and describe the current obstacle'
    },
    plan: {
      title: 'PLAN FASE',
      description: 'Create an action plan to address the obstacle'
    },
    do: {
      title: 'DO FASE',
      description: 'Implement the planned actions'
    },
    check: {
      title: 'CHECK FASE',
      description: 'Analyze the results of the actions'
    },
    act: {
      title: 'ACT FASE',
      description: 'Make improvements based on evaluation'
    },
    finished: {
      title: 'Completed',
      description: 'PDCA cycle completed'
    }
  };
  return nodeInfo[step];
};

const isGenerating = ref(false);
const generationTime = ref(0);
const timerInterval = ref<number | null>(null);

const whyAnswers = ref(['', '', '', '', '']);
const whyPrompts = [
  'Waarom is dit probleem nu een obstakel voor ons?',
  'Waarom bestaat deze situatie en wat houdt het in stand?',
  'Waarom hebben bestaande maatregelen dit niet voorkomen?',
  'Waarom zijn we dit niet eerder tegengekomen of hebben we dit niet eerder opgelost?',
  'Waarom zijn de onderliggende systemen of processen niet toereikend?'
];
const whyPlaceholders = [
  'Beschrijf het directe probleem...',
  'Ga een niveau dieper...',
  'Onderzoek de onderliggende factoren...',
  'Kijk naar processen en systemen...',
  'Identificeer de fundamentele oorzaak...'
];

const generateRootCause = async () => {
  if (!selectedNode.value) return;

  isGenerating.value = true;
  generationTime.value = 0;

  timerInterval.value = window.setInterval(() => {
    generationTime.value++;
  }, 0);

  try {
    const filledAnswers = whyAnswers.value
      .filter((answer) => answer.trim())
      .map((answer, index) => `${index + 1}. ${answer}`)
      .join('\n');

    const analysisContext = `
      Obstakel: ${melding.value.Obstakel || 'Geen obstakel beschreven'}

      5x Waarom Analyse:
      ${filledAnswers}
    `;

    const generatedRootCause = await generateRootCauseAnalysis(analysisContext);
    preventief.value.Kernoorzaak = generatedRootCause;
  } catch (error) {
    console.error('Failed to generate root cause:', error);
  } finally {
    isGenerating.value = false;
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
  }
};

const canComplete = useCanCompletePreventief(
  computed(() => selectedNode.value?.id || ''),
  preventief
);

const isFormValid = computed(() => {
  return canComplete.value;
});

const getNextStepLabel = (currentId: string): string => {
  switch (currentId) {
    case 'obstacle':
      return 'PLAN';
    case 'plan':
      return 'DO';
    case 'do':
      return 'CHECK';
    case 'check':
      return 'ACT';
    case 'act':
      return 'FINISH';
    default:
      return '';
  }
};

const planFormValid = ref(false);

// Update the smartScore computed property
const smartScore = computed(() => {
  if (!preventief.value?.Smart) return 0;

  let score = 0;

  // Create a typed array of keys
  const keys: SmartKey[] = ['Specifiek', 'Meetbaar', 'Haalbaar'];
  keys.forEach((key) => {
    if (preventief.value.Smart[key]?.Text?.length > 1) {
      score++;
    }
  });

  if (preventief.value.Strategie?.KPI && preventief.value.Strategie?.Comments?.length > 1) {
    score++;
  }

  const hasAllDeadlines =
    preventief.value.Steps.Do.Deadline && preventief.value.Steps.Check.Deadline && preventief.value.Steps.Act.Deadline;

  if (hasAllDeadlines) {
    score++;
  }

  return score;
});

const getTimelineColor = (phase: DeadlinePhase) => {
  if (preventief.value.Steps[phase].Deadline) return 'success';
  return 'grey';
};

type DeadlinePhase = 'Do' | 'Check' | 'Act';

const phaseDescriptions = {
  Do: 'Uitvoeren van de geplande acties',
  Check: 'Evalueren van de resultaten',
  Act: 'Borgen van de verbeteringen'
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const checkData = ref<any>({
  smartEvaluation: {
    Specifiek: {
      status: null,
      notes: ''
    },
    Meetbaar: {
      status: null,
      notes: ''
    },
    Haalbaar: {
      status: null,
      notes: ''
    },
    Relevant: {
      status: null,
      notes: ''
    },
    Tijdgebonden: {
      status: null,
      notes: ''
    }
  },
  actionEvaluation: {},
  conclusion: '',
  overallStatus: null
});

preventief.value.TodoItems.forEach((action: any) => {
  checkData.value.actionEvaluation[action.id] = {
    effectiveness: null,
    impact: null,
    learnings: ''
  };
});

const effectivenessLevels = [
  { title: 'Zeer Effectief', value: 'Zeer' },
  { title: 'Redelijk Effectief', value: 'Redelijk' },
  { title: 'Weinig Effectief', value: 'Weinig' }
];

const impactLevels = [
  { title: 'Grote Impact', value: 'Groot' },
  { title: 'Gemiddelde Impact', value: 'Gemiddeld' },
  { title: 'Kleine Impact', value: 'Klein' }
];

const actData = ref<any>({
  implementationStatus: {
    improvements: [] as any[],
    deviations: '',
    unexpectedOutcomes: ''
  },
  standardization: {
    actions: [] as any[],
    documentation: '',
    trainingNeeded: false,
    trainingNotes: ''
  },
  sustainability: {
    monitoringPlan: '',
    followUpDate: null as string | null,
    responsiblePerson: null as number | null
  },
  learnings: {
    points: [] as LearningPoint[],
    futureRecommendations: ''
  },
  completionConfidence: 0 // Initialize with 0 instead of null
});

const isCompletingPDCA = ref(false);
const showCompletionAnimation = ref(false);

const isActComplete = computed(() => {
  return (
    actData.value.implementationStatus.improvements.length > 0 &&
    actData.value.standardization.documentation &&
    actData.value.sustainability.monitoringPlan &&
    actData.value.learnings.points.length > 0 &&
    actData.value.completionConfidence !== null
  );
});

// Add this computed property in the script section
const pdcaProgress = computed(() => {
  const totalSteps = 5; // obstacle, plan, do, check, act
  const completedSteps = completedNodes.value.size;
  return Math.round((completedSteps / totalSteps) * 100);
});

// Add this to the script section
const dateMenus = ref<any>({
  do: false,
  check: false,
  act: false
});

// Add to computed properties
const getStatusAlertColor = computed(() => {
  switch (preventief.value.PDCAStatus) {
    case 'Wel':
      return 'success';
    case 'Deels':
      return 'warning';
    case 'Niet':
      return 'error';
    default:
      return 'info';
  }
});

const getStatusHeader = computed(() => {
  switch (preventief.value.PDCAStatus) {
    case 'Wel':
      return 'Succesvol Afgerond';
    case 'Deels':
      return 'Deels Succesvol';
    case 'Niet':
      return 'Niet Succesvol';
    default:
      return 'Status Onbekend';
  }
});

const getStatusDescription = computed(() => {
  switch (preventief.value.PDCAStatus) {
    case 'Wel':
      return 'De verbetering is succesvol. Laten we dit borgen in het proces.';
    case 'Deels':
      return 'Er zijn positieve resultaten, maar verdere verbetering is mogelijk.';
    case 'Niet':
      return 'De doelstellingen zijn niet behaald. Een nieuwe PDCA-cyclus is nodig.';
    default:
      return 'Bepaal eerst de status in de CHECK-fase.';
  }
});

interface StatusIconConfig {
  icon: string;
  color: string;
}

function getStatusIcon(status: string): StatusIconConfig {
  const statusMap: Record<string, StatusIconConfig> = {
    online: {
      icon: 'mdi-circle',
      color: 'success'
    },
    away: {
      icon: 'mdi-circle',
      color: 'warning'
    },
    busy: {
      icon: 'mdi-circle',
      color: 'error'
    },
    offline: {
      icon: 'mdi-circle',
      color: 'grey'
    },
    default: {
      icon: 'mdi-circle',
      color: 'grey'
    }
  };

  if (!status || typeof status !== 'string') {
    return statusMap.default;
  }

  return statusMap[status?.toLowerCase()] || statusMap.default;
}

// First, add this function to handle clicks outside
const handleDialogClose = async (value: boolean) => {
  if (!value) {
    // Step 4: Use originalPreventiefData here too
    const changes = detectChanges(originalPreventiefData.value || {}, preventief.value as Record<string, any>);
    if (changes.length > 0) {
      const updates = changes.reduce(
        (acc, change) => ({
          ...acc,
          [change.field]: change.newValue
        }),
        {}
      );

      // Assuming updateData calls preventiefStore.updatePreventief or similar
      // await updateData(melding.value.Preventief.id, updates); // Assuming this is replaced by direct store call
      const response = await preventiefStore.updatePreventief(melding.value.Preventief.id, updates);

      if (response?.status === 200) {
        const fetchedPreventief = response?.data;
        // Ensure defaults are filled (copied from handleClose)
        if (fetchedPreventief) {
          if (!fetchedPreventief.Smart) {
            fetchedPreventief.Smart = {
              Specifiek: { ...defaultSmartItem },
              Meetbaar: { ...defaultSmartItem },
              Haalbaar: { ...defaultSmartItem },
              Relevant: { ...defaultSmartItem },
              Tijdgebonden: { ...defaultSmartItem }
            };
          } else {
            Object.keys(fetchedPreventief.Smart).forEach((key) => {
              if (!fetchedPreventief.Smart[key as SmartKey].Toelichting) {
                fetchedPreventief.Smart[key as SmartKey].Toelichting = '';
              }
            });
          }
          if (!fetchedPreventief.Strategie) {
            fetchedPreventief.Strategie = { KPI: null, Comments: null };
          }
          if (!fetchedPreventief.Steps) {
            fetchedPreventief.Steps = {
              Obstakel: { ...defaultStep },
              Plan: { ...defaultStep },
              Do: { ...defaultStep },
              Check: { ...defaultStep },
              Act: { ...defaultStep },
              Finished: { ...defaultStep }
            };
          }
          if (fetchedPreventief.TodoItems === null) {
            fetchedPreventief.TodoItems = [];
          }

          setTimeout(() => {
            preventief.value = JSON.parse(JSON.stringify(fetchedPreventief));
            // Step 4: Update originalPreventiefData after successful save in handleDialogClose
            originalPreventiefData.value = JSON.parse(JSON.stringify(fetchedPreventief));
          }, 25);
        }
      } else {
        console.error('[handleDialogClose Debug] Error saving data:', response);
        // Optionally notify user
      }
    }
    showDialog.value = false;
  }
};

// Then update the v-navigation-drawer in the template

const handleViewFinishedReport = () => {
  showDialog.value = true;
  selectedNode.value = {
    id: 'finished',
    label: 'Completed',
    title: 'PDCA Cycle Completed',
    description: 'Continuous improvement journey milestone reached',
    status: 'Completed'
  };
};

const formatLastSaved = computed(() => {
  if (!lastSaved.value) return '';
  return lastSaved.value.toLocaleTimeString();
});

const handleResetPhase = async () => {
  if (!selectedNode.value) return;

  const confirm = window.confirm('Weet je zeker dat je deze fase wilt resetten?');

  if (!confirm) return;

  const currentPhase = selectedNode.value.id;
  const phaseMap = {
    obstacle: 'Obstakel',
    plan: 'Plan',
    do: 'Do',
    check: 'Check',
    act: 'Act'
  } as const;

  // Reset the current phase and all subsequent phases
  const currentIndex = flowOrder.indexOf(currentPhase as FlowStep);
  const phasesToReset = flowOrder.slice(currentIndex);

  // Create updates object with default values
  const updates: any = {
    Steps: { ...preventief.value.Steps }
  };

  // Reset Steps
  phasesToReset.forEach((phase) => {
    if (phase !== 'finished' && phase in phaseMap) {
      const phaseKey = phaseMap[phase as keyof typeof phaseMap];
      updates.Steps[phaseKey] = { ...defaultStep };
    }
  });

  // Reset all fields based on the phase
  if (currentPhase === 'obstacle' || phasesToReset.includes('obstacle')) {
    updates.Kernoorzaak = null;
    updates.Why = null;
  }

  if (currentPhase === 'plan' || phasesToReset.includes('plan')) {
    updates.Smart = {
      Specifiek: { ...defaultSmartItem },
      Meetbaar: { ...defaultSmartItem },
      Haalbaar: { ...defaultSmartItem },
      Relevant: { ...defaultSmartItem },
      Tijdgebonden: { ...defaultSmartItem }
    };
    updates.Strategie = {
      KPI: null,
      Comments: null
    };
    updates.Begeleider = null;
    updates.Teamleden = null;
  }

  if (currentPhase === 'do' || phasesToReset.includes('do')) {
    updates.TodoItems = [];
  }

  if (currentPhase === 'check' || phasesToReset.includes('check')) {
    updates.Smart = {
      ...(updates.Smart || preventief.value.Smart),
      Meetbaar: { ...defaultSmartItem },
      Specifiek: {
        ...preventief.value.Smart?.Specifiek,
        Behaald: '',
        Toelichting: ''
      }
    };
    updates.Conclusie = null;
    updates.PDCAStatus = null;
  }

  if (currentPhase === 'act' || phasesToReset.includes('act')) {
    updates.PDCAStatus = null;
    updates.Documentation = null;
    updates.Monitoring = null;
    updates.FailureAnalysis = null;
    updates.NewPDCAPlanning = null;
    updates.TrainingNeeded = false;
    updates.TrainingNeededType = null;
    updates.FollowUpDate = null;
    updates.Responsible = null;
  }

  // Update the server
  notification.promise({
    message: t('notifications.resetting_phase')
  });

  try {
    const response = await preventiefStore.updatePreventief(melding.value.Preventief.id, updates);
    if (response?.status === 200) {
      // Update local state
      preventief.value = {
        ...preventief.value,
        ...updates
      };

      // Reset completed nodes and set current step
      completedNodes.value.clear(); // Clear all completed nodes

      // Re-add completed nodes up to the current phase
      flowOrder.some((phase) => {
        if (phase === currentPhase) {
          return true; // Stop when we reach current phase
        }
        if (preventief.value.Steps[phaseMap[phase as keyof typeof phaseMap]]?.Finished) {
          completedNodes.value.add(phase);
        }
        return false;
      });

      // Set current step to the reset phase
      currentStep.value = currentPhase as FlowStep;

      // Update selected node status
      if (selectedNode.value) {
        selectedNode.value.status = 'Not Started';
      }

      notification.resolvePromise({
        message: t('notifications.phase_reset_success')
      });
    } else {
      throw new Error(response?.data?.message || 'Unknown error');
    }
  } catch (error) {
    notification.rejectPromise({
      message: t('errors.phase_reset_failed', { error })
    });
  }
};

const handleNextPhase = async () => {
  if (!selectedNode.value || !isFormValid.value) return;

  await handleSave({
    ...selectedNode.value,
    status: 'Completed'
  });
};

const canResetPhase = computed(() => {
  return hasPermission([{ action: 'manage', resourceType: 'preventief' }]);
});

const teamleden = computed(() => {
  if (!melding.value?.Preventief?.Teamleden?.IDs) return [];
  const teamleden = melding.value.Preventief.Teamleden.IDs.map((teamlid: any) => actiehouderStore.getActiehouderById(teamlid));
  if (teamleden.length === 0) return [];
  return teamleden.filter((teamlid: any) => Boolean(teamlid)).map((teamlid: any) => teamlid?.Name);
});

// Add these computed properties before the template
const getTaskEvaluation = (taskId: string) => {
  // If we don't have this task's evaluation in our local state yet
  if (!taskEvaluations.value[taskId]) {
    // Get the task from the store
    const task = taskStore.preventiefTasks.get(taskId);

    // Initialize with task data if it exists, otherwise empty values
    taskEvaluations.value[taskId] = {
      effectiviteit: task?.data?.effectiviteit || '',
      impact: task?.data?.impact || '',
      comments: task?.data?.comments || ''
    };
  }
  return taskEvaluations.value[taskId];
};

const checkItems = computed(() => {
  return Array.from(taskStore.preventiefTasks.values()).filter(
    (task) => task.actionType === 'task' && task.preventiefId === melding.value.Preventief.id
  );
});

const handleClose = async () => {
  // Removed the 'if (changes.length > 0)' check
  // const changes = detectChanges(originalPreventiefData.value || {}, preventief.value as Record<string, any>);
  notification.promise({
    message: t('notifications.saving_pdca')
  });

  // Construct updates based on the current state compared to original
  // We still need changes to know *what* to send, even if we always send
  const changes = detectChanges(originalPreventiefData.value || {}, preventief.value as Record<string, any>);
  const updates = changes.reduce(
    (acc, change) => ({
      ...acc,
      [change.field]: change.newValue
    }),
    {}
  );

  // If there are no actual changes, send an empty object or a minimal update
  // depending on what the backend expects. Sending the full 'preventief.value' might be an option too.
  // Here, we'll send the calculated 'updates' which will be {} if no changes.
  const response = await preventiefStore.updatePreventief(melding.value.Preventief.id, updates);

  if (response?.status !== 200) {
    notification.rejectPromise({
      message: t('errors.pdca_error', { error: response?.data?.message || 'Unknown error' })
    });
    return; // Exit if save failed
  }

  const fetchedPreventief = response?.data;

  // Ensure defaults are filled (copied from onMounted logic for consistency)
  if (fetchedPreventief) {
    // ... [rest of the default filling logic remains the same] ...
    if (!fetchedPreventief.Smart) {
      fetchedPreventief.Smart = {
        Specifiek: { ...defaultSmartItem },
        Meetbaar: { ...defaultSmartItem },
        Haalbaar: { ...defaultSmartItem },
        Relevant: { ...defaultSmartItem },
        Tijdgebonden: { ...defaultSmartItem }
      };
    } else {
      Object.keys(fetchedPreventief.Smart).forEach((key) => {
        if (!fetchedPreventief.Smart[key as SmartKey].Toelichting) {
          fetchedPreventief.Smart[key as SmartKey].Toelichting = '';
        }
      });
    }
    if (!fetchedPreventief.Strategie) {
      fetchedPreventief.Strategie = { KPI: null, Comments: null };
    }
    if (!fetchedPreventief.Steps) {
      fetchedPreventief.Steps = {
        Obstakel: { ...defaultStep },
        Plan: { ...defaultStep },
        Do: { ...defaultStep },
        Check: { ...defaultStep },
        Act: { ...defaultStep },
        Finished: { ...defaultStep }
      };
    }
  }

  // Update local state after successful save
  preventief.value = JSON.parse(JSON.stringify(fetchedPreventief || preventief.value)); // Use fetched or fallback
  originalPreventiefData.value = JSON.parse(JSON.stringify(fetchedPreventief || preventief.value)); // Update original data
  notification.resolvePromise({
    message: t('notifications.pdca_saved')
  });

  // Close the dialog
  showDialog.value = false;
  dialogVisible.value = false;
};

// Watcher for Kernoorzaak changes to update status once
watch(
  () => preventief.value.Kernoorzaak,
  async (newKernoorzaak) => {
    console.log('[Kernoorzaak Watcher] Triggered. New:', newKernoorzaak, 'Original:', originalPreventiefData.value?.Kernoorzaak);
    // Check if it's the first meaningful change *after initial load* and update hasn't happened
    if (
      originalPreventiefData.value && // Ensure original data is loaded
      newKernoorzaak !== originalPreventiefData.value.Kernoorzaak && // Changed from original
      !kernoorzaakTriggeredStatusUpdate.value && // Update not yet triggered
      preventief.value?.id // We have a preventief ID
    ) {
      console.log('[Kernoorzaak Watcher] Conditions met for status update.');
      const inBehandelingStatus = statusStore.getStatusByName('In behandeling');
      const openStatus = statusStore.getStatusByName('Open'); // Get 'Open' status

      // Only update if current status is 'Open'
      if (inBehandelingStatus && openStatus && preventief.value.StatusID === openStatus.id) {
        console.log(
          `[Kernoorzaak Watcher] Current StatusID: ${preventief.value.StatusID} (Open), Target StatusID: ${inBehandelingStatus.id}. Updating...`
        );
        try {
          const updatePayload = { StatusID: inBehandelingStatus.id };
          const response = await preventiefStore.updatePreventiefAutoSave(preventief.value.id, updatePayload);

          if (response?.status === 200) {
            console.log(`[Kernoorzaak Watcher] Status successfully updated to 'In behandeling' (ID: ${inBehandelingStatus.id})`);
            kernoorzaakTriggeredStatusUpdate.value = true;
            // Update local state immediately
            preventief.value.StatusID = inBehandelingStatus.id;
            // Update original data to prevent autosave reversion
            if (originalPreventiefData.value) {
              originalPreventiefData.value.StatusID = inBehandelingStatus.id;
            }
          } else {
            throw new Error(`Autosave failed with status: ${response?.status}`);
          }
        } catch (error) {
          console.error('[Kernoorzaak Watcher] Failed to update preventief status:', error);
          notification.error({ message: 'Kon PDCA status niet bijwerken.' }); // Optional feedback
        }
      } else {
        console.log(
          `[Kernoorzaak Watcher] Update skipped. Target Status: ${inBehandelingStatus ? inBehandelingStatus.id : 'Not Found'}, Current Status: ${preventief.value.StatusID} (Not 'Open' or required statuses not found)`
        );
      }
    } else {
      console.log(
        `[Kernoorzaak Watcher] Conditions not met. Original loaded: ${!!originalPreventiefData.value}, Changed: ${originalPreventiefData.value ? newKernoorzaak !== originalPreventiefData.value.Kernoorzaak : 'N/A'}, Triggered: ${kernoorzaakTriggeredStatusUpdate.value}, Preventief ID: ${preventief.value?.id}`
      );
    }
  },
  { deep: false }
); // No need for deep watch on a primitive string
</script>
<template>
  <div class="pdca-container" v-if="!preventiefStore.loading.single && !preventiefStore.loading.all && preventief.id" :key="preventief.id">
    <div class="pdca-content" :class="{ 'shift-left': showDialog }">
      <v-card variant="outlined" class="info-card mb-2">
        <v-card-text class="pa-4">
          <!-- Main row with team and progress -->
          <div class="d-flex align-center justify-space-between">
            <!-- Left: Team info -->
            <div class="d-flex align-center flex-grow-1">
              <v-avatar color="primary" size="40" class="mr-3">
                <v-icon color="white">mdi-account-group</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="d-flex align-center">
                  <span class="text-subtitle-1 font-weight-medium">{{ melding.Preventief?.User?.Name || 'Niet toegewezen' }}</span>
                  <v-chip size="x-small" class="ml-2" color="primary" variant="flat">Actiehouder</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ teamleden.length > 0 ? `Team: ${teamleden.join(', ')}` : 'Geen teamleden toegewezen' }}
                </div>
              </div>
            </div>

            <!-- Right: Progress -->
            <div class="d-flex align-center ml-4">
              <v-progress-circular :model-value="pdcaProgress" :color="pdcaProgress === 100 ? 'success' : 'primary'" :size="60" :width="5">
                {{ pdcaProgress }}%
              </v-progress-circular>
            </div>
          </div>

          <!-- Subtle second row with project info and report button -->
          <div class="d-flex align-center justify-space-between mt-2">
            <div class="d-flex align-center project-info">
              <v-icon size="16" color="medium-emphasis" class="mr-2">mdi-folder-outline</v-icon>
              <span class="text-caption text-medium-emphasis">{{ melding.Project?.ProjectNaam || 'N/A' }}</span>
              <v-divider vertical class="mx-2" style="height: 12px" />
              <v-icon size="16" color="medium-emphasis" class="mr-2">mdi-calendar-outline</v-icon>
              <span class="text-caption text-medium-emphasis">
                {{
                  melding.Preventief?.Deadline
                    ? new Date(melding.Preventief.Deadline).toLocaleDateString('nl-NL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : 'Geen deadline'
                }}
              </span>
              <v-divider vertical class="mx-2" style="height: 12px" />
              <span class="text-caption text-medium-emphasis">
                <span v-if="isSaving">Opslaan...</span>
                <span v-else-if="lastSaved">Laatst opgeslagen om {{ formatLastSaved }}</span>
              </span>
            </div>
            <v-btn
              v-if="completedNodes.has('act')"
              color="success"
              variant="tonal"
              density="comfortable"
              size="small"
              prepend-icon="mdi-file-document-check"
              @click="handleViewFinishedReport"
            >
              Bekijk rapport
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="pdca-circle">
        <!-- SVG Curved Arrows -->
        <svg class="connection-paths" viewBox="0 0 300 300">
          <!-- Modified Obstacle to Plan path -->
          <path
            :class="{
              active: currentStep === 'plan' && completedNodes.has('obstacle'),
              'cycle-complete': currentStep === 'finished' || completedNodes.has('plan'),
              hidden: currentStep === 'obstacle' || (!completedNodes.has('obstacle') && currentStep === 'plan')
            }"
            d="M 150 110 L 150 40"
            style="--delay: 0s"
          />

          <!-- Plan to Do -->
          <path
            :class="{
              active: currentStep === 'do' && completedNodes.has('plan'),
              'cycle-complete': currentStep === 'finished' || completedNodes.has('do'),
              hidden: !completedNodes.has('plan') && currentStep === 'do'
            }"
            d="M 190 40 Q 260 40 260 110"
            style="--delay: 0s"
          />
          <!-- Do to Check -->
          <path
            :class="{
              active: currentStep === 'check' && completedNodes.has('do'),
              'cycle-complete': currentStep === 'finished' || completedNodes.has('check'),
              hidden: !completedNodes.has('do') && currentStep === 'check'
            }"
            d="M 260 190 Q 260 260 190 260"
            style="--delay: 0.5s"
          />
          <!-- Check to Act -->
          <path
            :class="{
              active: currentStep === 'act' && completedNodes.has('check'),
              'cycle-complete': currentStep === 'finished',
              hidden: !completedNodes.has('check') && currentStep === 'act'
            }"
            d="M 110 260 Q 40 260 40 190"
            style="--delay: 1s"
          />
          <!-- Act to Plan -->
          <path
            :class="{
              active: currentStep === 'finished' && completedNodes.has('act'),
              'cycle-complete': currentStep === 'finished',
              hidden: !completedNodes.has('act') && currentStep === 'finished'
            }"
            d="M 40 110 Q 40 40 110 40"
            style="--delay: 1.5s"
          />
        </svg>

        <!-- Obstacle in center -->
        <div
          class="node obstacle"
          :class="{
            completed: (selectedNode?.id === 'obstacle' && selectedNode?.status === 'Completed') || completedNodes.has('obstacle')
          }"
          @click="
            handleNodeClick({
              id: 'obstacle',
              label: 'Obstakel',
              title: 'Obstakel',
              description: 'Identify and address obstacles',
              status: completedNodes.has('obstacle') ? 'Completed' : 'Not Started'
            })
          "
        >
          <div class="node-content">
            <div class="node-title">Oorzaak</div>
          </div>
          <v-icon
            v-if="(selectedNode?.id === 'obstacle' && selectedNode?.status === 'Completed') || completedNodes.has('obstacle')"
            class="checkmark-icon"
            icon="mdi-check-circle"
            color="success"
          />
        </div>

        <!-- PDCA nodes -->
        <div
          v-for="(step, index) in ['plan', 'do', 'check', 'act']"
          :key="step"
          class="node"
          :class="[
            step,
            { disabled: !isNodeClickable(step) },
            { active: currentStep === step },
            { completed: (selectedNode?.id === step && selectedNode?.status === 'Completed') || completedNodes.has(step) }
          ]"
          @click="
            handleNodeClick({
              id: step,
              label: step.toUpperCase(),
              title: `${step.charAt(0).toUpperCase() + step.slice(1)}ing Phase`,
              description: getNodeInfo(step as FlowStep).description,
              status: completedNodes.has(step) ? 'Completed' : 'Not Started'
            })
          "
        >
          <div class="node-content">
            <div class="node-title">{{ step.toUpperCase() }}</div>
          </div>
          <v-icon
            v-if="(selectedNode?.id === step && selectedNode?.status === 'Completed') || completedNodes.has(step)"
            class="checkmark-icon"
            icon="mdi-check-circle"
            color="success"
          />
          <v-icon v-if="!isNodeClickable(step)" class="lock-icon" icon="mdi-lock-outline" color="secondary" />
        </div>
      </div>
    </div>

    <div class="drawer-container" v-show="showDialog">
      <v-navigation-drawer
        :model-value="showDialog"
        @update:model-value="handleDialogClose"
        location="right"
        width="670"
        :temporary="true"
        :scrim="true"
        class="node-drawer"
      >
        <v-card flat class="d-flex flex-column" style="height: 100%">
          <v-card-title v-if="selectedNode?.id === 'finished'" class="d-flex align-center pb-2">
            <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
            PDCA Voltooid - Eindrapport
            <v-btn icon="mdi-close" size="small" variant="text" class="ml-auto" @click="showDialog = false" />
          </v-card-title>
          <v-card-title v-else class="d-flex align-center justify-space-between pa-4">
            <div class="text-h4"><img src="/header-bullet.svg" class="mr-2 mt-1" width="15" height="15" /> {{ selectedNode?.title }}</div>
            <v-tooltip location="bottom" text="Opslaan">
              <template v-slot:activator="{ props: tooltipProps }">
                <div
                  v-bind="tooltipProps"
                  class="ml-auto cursor-pointer"
                  @click="handleClose"
                  style="display: inline-flex; align-items: center; justify-content: center"
                >
                  <IconDeviceFloppy :size="24" :style="{ color: 'var(--v-theme-primary)' }"></IconDeviceFloppy>
                </div>
              </template>
            </v-tooltip>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="selectedNode?.id === 'obstacle'">
            <div class="root-cause-container">
              <div class="obstacle-info-box mb-8">
                <h1 class="text-h4">OBSTAKEL</h1>
                <p>{{ melding.Obstakel }}</p>
              </div>
              <v-textarea
                v-if="selectedNode"
                :loading="isGenerating"
                v-model="preventief.Kernoorzaak"
                label="Kernoorzaak"
                placeholder="Hoe heeft dit obstakel kunnen gebeuren?"
                class="font-futura mb-4 mt-4"
                variant="outlined"
                rows="10"
                hint='Tip: Gebruik de "5x Waarom-methode" om tot de kernoorzaak te komen'
                persistent-hint
              ></v-textarea>
              <div class="generating-pill ai-analysis-btn" :class="{ 'is-generating': isGenerating }" @click="generateRootCause">
                <v-tooltip location="top" :open-delay="200" content-class="ai-tooltip">
                  <template v-slot:activator="{ props }">
                    <div v-bind="props" class="pill-content">
                      <span class="generating-text">
                        <span v-if="isGenerating" class="ai-text" style="color: rgb(var(--v-theme-secondary))">Genereren</span>
                        <span v-if="!isGenerating" class="ai-text" style="color: rgb(var(--v-theme-secondary))">IntalAI</span>
                      </span>
                      <div class="sparkle"></div>
                    </div>
                  </template>
                  <div class="ai-tooltip-content">
                    <v-icon size="small" color="primary" class="mr-1">mdi-lightbulb-outline</v-icon>
                    Klik voor een AI-suggestie
                  </div>
                </v-tooltip>
              </div>
            </div>

            <v-expansion-panels class="mt-4 mb-4">
              <v-expansion-panel elevation="0">
                <v-expansion-panel-title class="text-primary">
                  <v-icon color="primary" class="mr-2">mdi-lightbulb-outline</v-icon>
                  5x Waarom Analyse Tool
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="why-analysis">
                    <div v-for="(why, index) in whyAnswers" :key="index" class="why-step">
                      <div class="d-flex align-center mb-2">
                        <v-chip color="primary" size="small" class="mr-2" style="min-width: 80px">Waarom {{ index + 1 }}</v-chip>
                        <span class="text-body-2">{{ whyPrompts[index] }}</span>
                      </div>
                      <v-text-field
                        v-model="whyAnswers[index]"
                        :placeholder="whyPlaceholders[index]"
                        variant="outlined"
                        density="comfortable"
                        class="mb-4"
                      ></v-text-field>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
          <v-card-text v-if="selectedNode?.id === 'plan'">
            <!-- Add SMART Score chip at the top of plan phase -->
            <div class="d-flex justify-end mb-4">
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-chip v-bind="props" :color="smartScore >= 4 ? 'success' : 'warning'" size="small">
                    <span class="text-subtitle-2">SMART Score: {{ smartScore }}/5</span>
                  </v-chip>
                </template>
                Score gebaseerd op alle ingevulde SMART-criteria
              </v-tooltip>
            </div>
            <v-form v-model="planFormValid" class="plan-form">
              <v-expansion-panels variant="accordion" rounded>
                <!-- Team Assignment Section -->
                <v-expansion-panel>
                  <v-expansion-panel-title expanded>
                    <div class="d-flex align-center">
                      <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
                      <div class="text-h6">Team Toewijzing</div>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-autocomplete
                      v-model="preventief.User"
                      label="Actiehouder"
                      :items="teamLeaders"
                      item-title="Name"
                      item-value="id"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Selecteer actiehouder"
                      prepend-inner-icon="mdi-account-tie"
                      :return-object="true"
                    ></v-autocomplete>
                    <v-autocomplete
                      v-model="preventief.Begeleider"
                      label="Team begeleider"
                      :items="leanCoaches"
                      item-title="Name"
                      item-value="id"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Selecteer begeleider"
                      prepend-inner-icon="mdi-shield-account"
                      hint="Verplicht indien teamleider geen belt heeft"
                      persistent-hint
                      :return-object="true"
                    ></v-autocomplete>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center justify-space-between">
                      <div class="d-flex align-center">
                        <v-icon color="primary" class="mr-2">mdi-lightbulb-on</v-icon>
                        <div class="text-h6">Doel</div>
                      </div>
                      <!-- <v-chip :color="smartScore >= 4 ? 'success' : 'warning'" size="small">
                        <span class="text-subtitle-2">SMART Score: {{ smartScore }}/5</span>
                      </v-chip> -->
                    </div>
                    <!-- <template v-slot:actions="{ expanded }">
                      <v-icon
                        v-if="isSmartComplete"
                        :color="!expanded ? 'success' : ''"
                        :icon="expanded ? 'mdi-chevron-up' : 'mdi-check'"
                      ></v-icon>
                    </template> -->
                  </v-expansion-panel-title>

                  <v-expansion-panel-text>
                    <v-textarea
                      v-model="preventief.Smart.Specifiek.Text"
                      label="Wat willen we precies bereiken?"
                      placeholder="Beschrijf concreet wat er moet gebeuren"
                      variant="outlined"
                      rows="2"
                      hide-details
                      class="mt-8"
                    ></v-textarea>
                    <v-textarea
                      v-model="preventief.Smart.Haalbaar.Text"
                      label="Is dit haalbaar?"
                      placeholder="Beschrijf waarom dit haalbaar is met beschikbare middelen"
                      variant="outlined"
                      rows="2"
                      hide-details
                      class="mt-8"
                    ></v-textarea>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center justify-space-between">
                      <div class="d-flex align-center">
                        <v-icon color="primary" class="mr-2">mdi-chart-timeline</v-icon>
                        <div class="text-h6">Meetplan</div>
                      </div>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <!-- Meetbaar -->
                    <div class="smart-section">
                      <v-textarea
                        v-model="preventief.Smart.Meetbaar.Text"
                        label="Hoe meten we het resultaat?"
                        placeholder="Definieer meetbare criteria voor succes"
                        variant="outlined"
                        rows="2"
                        hide-details
                        class="mt-2"
                      ></v-textarea>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Strategic Alignment Section -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon color="primary" class="mr-2">mdi-target</v-icon>
                      <div class="text-h6">Strategische Afstemming</div>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-select
                      v-model="preventief.Strategie.KPI"
                      label="Bedrijfs KPI"
                      :items="companyKPIs"
                      variant="outlined"
                      density="comfortable"
                      class="mb-4 mt-4"
                      placeholder="Selecteer relevante KPI"
                    ></v-select>

                    <v-textarea
                      v-model="preventief.Strategie.Comments"
                      label="Waarom is dit obstakel een probleem?"
                      variant="outlined"
                      rows="3"
                      placeholder="Wat draagt het verbeteren van dit obstakel bij aan de bedrijfsdoelstelling?"
                    ></v-textarea>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Timeline Planning -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon color="primary" class="mr-2">mdi-calendar-clock</v-icon>
                      <div class="text-h6">Planning</div>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <!--<template v-slot:opposite>
                          <div class="text-caption text-uppercase">{{ phase }} Fase</div>
                        </template>-->
                    <v-timeline density="comfortable">
                      <v-timeline-item
                        v-for="phase in ['Do', 'Check', 'Act'] as DeadlinePhase[]"
                        :key="phase"
                        :dot-color="getTimelineColor(phase)"
                        size="small"
                      >
                        <v-card variant="outlined" class="timeline-card">
                          <v-card-text>
                            <div class="d-flex flex-column">
                              <div class="text-subtitle-1 mb-2">{{ phase }} Fase</div>
                              <div class="text-caption text-medium-emphasis mb-4">{{ phaseDescriptions[phase] }}</div>
                              <v-menu v-model="dateMenus[phase]" :close-on-content-click="false" transition="scale-transition" offset-y>
                                <template v-slot:activator="{ props }">
                                  <VueDatePicker
                                    class="date-picker"
                                    prevent-min-max-navigation
                                    ignore-time-validation
                                    :max-date="preventief.Deadline"
                                    v-bind="props"
                                    model-type="iso"
                                    auto-position="top"
                                    :enable-time-picker="false"
                                    :teleport="true"
                                    v-model="preventief.Steps[phase].Deadline"
                                    :label="`${phase.toUpperCase()} Deadline`"
                                    @click="dateMenus[phase] = true"
                                  ></VueDatePicker>
                                </template>
                                <v-date-picker
                                  v-model="preventief.Steps[phase].Deadline"
                                  @update:model-value="dateMenus[phase] = false"
                                ></v-date-picker>
                              </v-menu>
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-timeline-item>
                    </v-timeline>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- SMART Plan Panel -->
              </v-expansion-panels>
            </v-form>
          </v-card-text>

          <!--DO INDEX-->
          <v-card-text v-if="selectedNode?.id === 'do'" class="pa-0">
            <div class="actielijst-table mx-4">
              <TodoTable :item="melding" :id="preventief.id" type="preventief" title="Actiepunten" />
            </div>
          </v-card-text>

          <!--CHECK INDEX -->

          <v-card-text v-if="selectedNode?.id === 'check'">
            <!-- Progress Overview -->

            <!-- Action Items Review -->
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-clipboard-check</v-icon>
                    Actiepunten Evaluatie
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div v-if="taskStore.preventiefTasks.size === 0" class="text-center pa-4">
                    <v-icon size="large" color="grey" class="mb-2">mdi-clipboard-text-off</v-icon>
                    <div class="text-subtitle-1 text-grey">Geen actiepunten gevonden</div>
                    <div class="text-caption text-grey">Er zijn nog geen actiepunten toegevoegd om te evalueren</div>
                  </div>

                  <div v-else v-for="action in checkItems" :key="action.id" class="action-evaluation mb-4">
                    <v-card variant="outlined" class="pa-4">
                      <v-card-title>
                        <div class="d-flex justify-space-between align-start mb-4">
                          <div>
                            <div class="text-subtitle-1 font-weight-bold">{{ action.action }}</div>
                            <div class="text-caption">
                              Toegewezen aan: {{ teamMembers.find((member) => member.id === action.userId)?.Name }} <br />
                              Deadline: {{ formatDate(action.deadline) }}
                            </div>
                          </div>
                        </div>
                      </v-card-title>
                      <v-divider class="mb-4"></v-divider>

                      <div class="d-flex gap-4 mt-4">
                        <v-select
                          :model-value="getTaskEvaluation(action.id).effectiviteit"
                          @update:model-value="(val) => (getTaskEvaluation(action.id).effectiviteit = val)"
                          label="Effectiviteit"
                          :items="effectivenessLevels"
                          variant="outlined"
                          density="compact"
                          hide-details
                          class="flex-grow-1"
                        ></v-select>

                        <v-select
                          :model-value="getTaskEvaluation(action.id).impact"
                          @update:model-value="(val) => (getTaskEvaluation(action.id).impact = val)"
                          label="Impact"
                          :items="impactLevels"
                          variant="outlined"
                          density="compact"
                          hide-details
                          class="flex-grow-1"
                        ></v-select>
                      </div>

                      <v-textarea
                        :model-value="getTaskEvaluation(action.id).comments"
                        @update:model-value="(val) => (getTaskEvaluation(action.id).comments = val)"
                        label="Leerpunten & Observaties"
                        variant="outlined"
                        density="comfortable"
                        rows="1"
                        class="mt-4"
                        hide-details
                      ></v-textarea>
                    </v-card>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- SMART Evaluation -->

              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-target</v-icon>
                    Doel & Meetplan Evaluatie
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="smart-evaluation mb-4">
                    <div class="d-flex align-center mb-2"></div>

                    <div class="d-flex flex-column gap-4">
                      <div class="original-goal pa-3" style="background: rgb(var(--v-theme-primary_lighten_5))">
                        <div class="text-h5 mb-1">Doel:</div>
                        <div>{{ preventief.Smart?.Specifiek?.Text }}</div>
                      </div>

                      <div class="evaluation">
                        <v-radio-group v-model="preventief.Smart.Specifiek.Behaald" class="mt-0">
                          <v-radio label="Behaald" value="achieved" color="success"></v-radio>
                          <v-radio label="Deels Behaald" value="partial" color="warning"></v-radio>
                          <v-radio label="Niet Behaald" value="not_achieved" color="error"></v-radio>
                        </v-radio-group>

                        <v-textarea
                          v-model="preventief.Smart.Specifiek.Toelichting"
                          label="Toelichting"
                          variant="outlined"
                          density="comfortable"
                          rows="1"
                          hide-details
                        ></v-textarea>
                      </div>
                    </div>
                    <v-divider class="my-8"></v-divider>
                    <div class="d-flex flex-column gap-4">
                      <div class="original-goal pa-3" style="background: rgb(var(--v-theme-primary_lighten_5))">
                        <div class="text-h5 mb-1">Meetplan:</div>
                        <div>{{ preventief.Smart.Meetbaar.Text }}</div>
                      </div>

                      <div class="evaluation">
                        <v-radio-group v-model="preventief.Smart.Meetbaar.Behaald" class="mt-0">
                          <v-radio label="Behaald" value="achieved" color="success"></v-radio>
                          <v-radio label="Deels Behaald" value="partial" color="warning"></v-radio>
                          <v-radio label="Niet Behaald" value="not_achieved" color="error"></v-radio>
                        </v-radio-group>

                        <v-textarea
                          v-model="preventief.Smart.Meetbaar.Toelichting"
                          label="Toelichting"
                          variant="outlined"
                          density="comfortable"
                          rows="1"
                          hide-details
                        ></v-textarea>
                      </div>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Overall Conclusion -->
            <v-card class="mt-4" variant="outlined">
              <v-card-title class="d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-file-document-check</v-icon>
                Eindconclusie
              </v-card-title>
              <v-card-text>
                <v-textarea
                  v-model="preventief.Conclusie"
                  label="Wat zeggen de uitkomsten van je meetplan?"
                  variant="outlined"
                  rows="4"
                  placeholder="Beschrijf de belangrijkste bevindingen en lessen..."
                ></v-textarea>

                <v-radio-group v-model="preventief.PDCAStatus" class="mt-4">
                  <div class="text-subtitle-1 mb-2">Status PDCA</div>
                  <v-radio label="Succesvol Afgerond" value="Wel" color="success"></v-radio>
                  <v-radio label="Deels Succesvol - Vervolgacties Nodig" value="Deels" color="warning"></v-radio>
                  <v-radio label="Niet Succesvol - Herziening Nodig" value="Niet" color="error"></v-radio>
                </v-radio-group>
              </v-card-text>
            </v-card>
          </v-card-text>

          <v-card-text v-if="selectedNode?.id === 'act'">
            <div class="act-phase-container">
              <!-- Status-based header -->
              <v-alert :color="getStatusAlertColor" variant="tonal" class="mb-6">
                <template v-slot:prepend>
                  <v-icon :icon="getStatusIcon(preventief.PDCAStatus || '').icon"></v-icon>
                </template>
                <div class="text-h6">{{ getStatusHeader }}</div>
                <div class="text-body-2">{{ getStatusDescription }}</div>
              </v-alert>

              <template v-if="preventief.PDCAStatus !== 'Niet'">
                <v-card variant="outlined" class="mb-6">
                  <v-card-title class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-shield-check</v-icon>
                    Borging
                  </v-card-title>
                  <v-card-text>
                    <v-textarea
                      v-model="preventief.Documentation"
                      label="Hoe ga je deze verbetering borgen in het proces?"
                      placeholder="Beschrijf de concrete stappen om deze verbetering permanent te maken..."
                      variant="outlined"
                      rows="3"
                    ></v-textarea>

                    <v-checkbox
                      v-model="preventief.TrainingNeeded"
                      label="Is er training nodig voor medewerkers?"
                      color="primary"
                    ></v-checkbox>

                    <v-textarea
                      v-if="preventief.TrainingNeeded"
                      v-model="preventief.TrainingNeededType"
                      label="Welke training is nodig?"
                      variant="outlined"
                      rows="2"
                    ></v-textarea>
                  </v-card-text>
                </v-card>

                <!-- Follow-up section -->
                <v-card variant="outlined" class="mb-6">
                  <v-card-title class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-calendar-check</v-icon>
                    Vervolgacties
                  </v-card-title>
                  <v-card-text>
                    <v-textarea
                      v-model="preventief.Monitoring"
                      label="Hoe ga je het succes monitoren?"
                      placeholder="Beschrijf hoe je gaat controleren of de verbetering blijvend is..."
                      variant="outlined"
                      rows="3"
                    ></v-textarea>

                    <div class="d-flex gap-4">
                      <v-text-field v-model="preventief.FollowUpDate" label="Evaluatiedatum" type="date" variant="outlined"></v-text-field>

                      <v-select
                        v-model="preventief.Responsible"
                        :items="teamMembers"
                        item-title="Name"
                        item-value="id"
                        label="Verantwoordelijke"
                        variant="outlined"
                      ></v-select>
                    </div>
                  </v-card-text>
                </v-card>
              </template>

              <template v-else>
                <!-- For 'failed' status -->
                <v-card variant="outlined" class="mb-6">
                  <v-card-title class="d-flex align-center">
                    <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
                    Analyse
                  </v-card-title>
                  <v-card-text>
                    <v-textarea
                      v-model="preventief.FailureAnalysis"
                      label="Waarom is het niet gelukt?"
                      placeholder="Beschrijf de belangrijkste redenen waarom de doelstellingen niet zijn behaald..."
                      variant="outlined"
                      rows="4"
                    ></v-textarea>

                    <v-textarea
                      v-model="preventief.NewPDCAPlanning"
                      label="Hoe ga je dit verwerken in je nieuwe PDCA?"
                      placeholder="Beschrijf je plan voor een nieuwe PDCA-cyclus..."
                      variant="outlined"
                      rows="4"
                    ></v-textarea>
                  </v-card-text>
                </v-card>
              </template>
            </div>
          </v-card-text>
          <v-card-text v-if="selectedNode?.id === 'finished'">
            <!-- Obstacle Summary -->
            <div class="root-cause-container">
              <div class="obstacle-info-box mb-8">
                <h1 class="text-h4">OBSTAKEL</h1>
                <p>{{ melding.Obstakel }}</p>
              </div>
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-magnify</v-icon>
                  Kernoorzaak Analyse
                </v-card-title>
                <v-card-text>
                  <p class="text-body-1">{{ preventief.Kernoorzaak || 'Geen kernoorzaak gedefinieerd' }}</p>
                </v-card-text>
              </v-card>
            </div>

            <!-- PDCA Steps Summary -->
            <v-timeline density="compact" class="mt-6">
              <v-timeline-item
                v-for="step in ['plan', 'do', 'check', 'act']"
                :key="step"
                :dot-color="completedNodes.has(step) ? 'success' : 'grey'"
                size="small"
              >
                <template v-slot:opposite>
                  <div class="text-caption">
                    {{ preventief.Steps[(step.charAt(0).toUpperCase() + step.slice(1)) as StepKey]?.Deadline || 'Geen datum' }}
                  </div>
                </template>
                <div class="text-subtitle-1 font-weight-bold text-capitalize">
                  {{ step.toUpperCase() }}
                </div>
                <div class="text-body-2">
                  <!-- Plan phase summary -->
                  <template v-if="step === 'plan'">
                    <div v-if="preventief.Smart?.Specifiek?.Text" class="mb-2">
                      <strong>Doel:</strong> {{ preventief.Smart?.Specifiek?.Text }}
                    </div>
                    <div v-if="preventief.Smart?.Meetbaar?.Text" class="mb-2">
                      <strong>Meetplan:</strong> {{ preventief.Smart?.Meetbaar?.Text }}
                    </div>
                    <div v-if="preventief.Strategie?.KPI" class="mb-2"><strong>KPI:</strong> {{ preventief.Strategie.KPI }}</div>
                  </template>

                  <!-- Do phase summary -->
                  <template v-if="step === 'do'">
                    <div v-if="preventief.TodoItems?.length" class="mb-2">
                      <strong>Uitgevoerde acties:</strong>
                      <ul class="mt-1">
                        <li v-for="item in preventief.TodoItems" :key="item.id" class="mb-1">{{ item.Actie }} - {{ item.Status }}</li>
                      </ul>
                    </div>
                    <div v-else>Geen acties geregistreerd</div>
                  </template>

                  <!-- Check phase summary -->
                  <template v-if="step === 'check'">
                    <div v-if="preventief.Smart?.Meetbaar" class="mb-2">
                      <strong>Meetplan resultaat:</strong>
                      <div class="ml-2">
                        <div>{{ preventief.Smart?.Meetbaar?.Text }}</div>
                        <div v-if="preventief.Smart?.Meetbaar?.Behaald" class="mt-1">
                          <v-chip
                            size="small"
                            :color="
                              preventief.Smart?.Meetbaar?.Behaald === 'achieved'
                                ? 'success'
                                : preventief.Smart?.Meetbaar?.Behaald === 'partial'
                                  ? 'warning'
                                  : 'error'
                            "
                          >
                            {{
                              preventief.Smart?.Meetbaar?.Behaald === 'achieved'
                                ? 'Behaald'
                                : preventief.Smart?.Meetbaar?.Behaald === 'partial'
                                  ? 'Deels Behaald'
                                  : 'Niet Behaald'
                            }}
                          </v-chip>
                          <div v-if="preventief.Smart?.Meetbaar?.Toelichting" class="text-body-2 mt-1">
                            {{ preventief.Smart?.Meetbaar?.Toelichting }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="preventief?.Conclusie" class="mb-2"><strong>Conclusie:</strong> {{ preventief?.Conclusie }}</div>
                    <div v-if="preventief?.PDCAStatus" class="mb-2"><strong>Status:</strong> {{ preventief.PDCAStatus }}</div>
                  </template>

                  <!-- Act phase summary -->
                  <template v-if="step === 'act'">
                    <template v-if="preventief.PDCAStatus !== 'Niet'">
                      <div v-if="preventief.Documentation" class="mb-2"><strong>Borging:</strong> {{ preventief.Documentation }}</div>
                      <div v-if="preventief.Monitoring" class="mb-2"><strong>Monitoring:</strong> {{ preventief.Monitoring }}</div>
                    </template>
                    <template v-else>
                      <div v-if="preventief.FailureAnalysis" class="mb-2"><strong>Analyse:</strong> {{ preventief.FailureAnalysis }}</div>
                      <div v-if="preventief.NewPDCAPlanning" class="mb-2">
                        <strong>Nieuwe PDCA planning:</strong> {{ preventief.NewPDCAPlanning }}
                      </div>
                    </template>
                  </template>
                </div>
              </v-timeline-item>
            </v-timeline>

            <!-- Final Status -->
            <v-alert color="success" variant="tonal" class="mt-4" icon="mdi-flag-checkered"> PDCA cyclus succesvol afgerond </v-alert>
          </v-card-text>

          <!-- Add drawer footer with action buttons -->
          <v-card-actions class="mt-auto pa-4" v-if="selectedNode?.id !== 'finished'">
            <v-btn
              color="error"
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="handleResetPhase"
              :disabled="!selectedNode || !canResetPhase"
            >
              Reset {{ selectedNode?.label }}
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" prepend-icon="mdi-arrow-right" @click="handleNextPhase" :disabled="!isFormValid">
              {{ getNextStepLabel(selectedNode?.id || '') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-navigation-drawer>
    </div>
  </div>
  <div v-else class="d-flex flex-column justify-center align-center h-100 w-100">
    <h5>Loading...</h5>
    <br />
    <v-progress-circular indeterminate color="primary" size="100"></v-progress-circular>
  </div>
</template>

<style scoped lang="scss">
@import './meldingPDCA.scss';
</style>
