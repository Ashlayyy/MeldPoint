import { ref, watch, type Ref, type ComputedRef, computed } from 'vue';
import { useTaskStore } from '@/stores/task_store';
import type { Task } from '@/stores/task_store'; // Import Task type

interface Smart {
  Specifiek: SmartItem;
  Meetbaar: SmartItem;
  Haalbaar: SmartItem;
  Relevant: SmartItem;
  Tijdgebonden: SmartItem;
}

interface SmartItem {
  Text: string;
  Behaald: string | undefined;
  Toelichting: string;
}

interface Preventief {
  Teamleden: any[] | null;
  CorrespondenceIDs: any[] | null;
  Smart: Smart;
  Steps: {
    Obstakel: Step;
    Plan: Step;
    Do: Step;
    Check: Step;
    Act: Step;
    Finished?: Step;
  };
  FailureAnalysis: string | null;
  NewPDCAPlanning: string | null;
  Documentation: string | null;
  TrainingNeeded: boolean;
  TrainingNeededType: string | null;
  Monitoring: string | null;
  FollowUpDate: string | null;
  Responsible: string | null;
  TodoItems: any[];
  id: string;
  Kernoorzaak: string | null;
  Why: string | null;
  Deadline: string | null;
  Title: string | null;
  Strategie: {
    KPI: string | null;
    Comments: string | null;
  } | null;
  Conclusie: string | null;
  PDCAStatus: string | null;
  ActJSON: string | null;
  StatusID: string | null;
  BegeleiderID: string | null;
  Begeleider: any | null;
  CreatedAt: string;
  UpdatedAt: string;
  User: any;
  Status: any;
}

interface Step {
  Finished: boolean;
  Deadline: string | null;
}

export function useCanCompletePreventief(nodeId: ComputedRef<string>, preventief: Ref<Preventief>) {
  const taskStore = useTaskStore();
  const canComplete = ref(false);

  // Add taskStore.preventiefTasks to the dependencies
  watch(
    [nodeId, preventief, () => taskStore.preventiefTasks],
    () => {
      validateCompletion();
    },
    { deep: true, immediate: true }
  );

  function validateCompletion() {
    const currentNodeId = nodeId.value;

    if (!currentNodeId || !preventief.value) {
      canComplete.value = false;
      return;
    }

    switch (currentNodeId) {
      case 'obstacle':
        canComplete.value = validateObstacle();
        break;
      case 'plan':
        canComplete.value = validatePlan();
        break;
      case 'do':
        canComplete.value = validateDo();
        break;
      case 'check':
        canComplete.value = validateCheck();
        break;
      case 'act':
        canComplete.value = validateAct();
        break;
      case 'finished':
        canComplete.value = true;
        break;
      default:
        canComplete.value = false;
    }
  }

  function validateTextLength(text: string | null | undefined, minLength: number = 1): boolean {
    return !!text && text.trim().length >= minLength;
  }

  function validatePlan(): boolean {
    const p = preventief.value;
    if (!p || !p.Smart || !p.Steps || !p.Strategie) {
      return false;
    }

    // Check SMART goals
    const smartComplete = Object.entries(p.Smart).every(([key, item]) => {
      const isValid = item && validateTextLength(item.Text);
      return isValid;
    });

    // Check team assignments
    const hasTeam = !!p.User || !!p.Begeleider;

    // Check strategy
    const hasStrategy = p.Strategie && validateTextLength(p.Strategie.KPI, 1) && validateTextLength(p.Strategie.Comments);

    // Check deadlines
    const hasDeadlines = p.Steps?.Do?.Deadline && p.Steps?.Check?.Deadline && p.Steps?.Act?.Deadline;

    return Boolean(smartComplete && hasTeam && hasStrategy && hasDeadlines);
  }

  function validateObstacle(): boolean {
    const p = preventief.value;
    if (!p) return false;

    const isValid = validateTextLength(p.Kernoorzaak);
    return isValid;
  }

  function validateDo(): boolean {
    const p = preventief.value;
    if (!p) return false;

    // Get tasks for this preventief from the task store
    const preventiefTasks = Array.from(taskStore.preventiefTasks.values()).filter(
      (task) => task.preventiefId === p.id && task.actionType === 'task'
    );

    // Check if there are any tasks
    if (preventiefTasks.length === 0) {
      return false;
    }

    // Validate each task has required fields
    const allTasksValid = preventiefTasks.every((task) => task.userId && validateTextLength(task.action, 1) && task.deadline);
    return allTasksValid;
  }

  function validateCheck(): boolean {
    const p = preventief.value;
    if (!p || !p.Smart) {
      return false;
    }

    // Check SMART evaluations (Specifiek and Meetbaar) - Ensure properties exist and are valid
    const specificBehaald = !!p.Smart.Specifiek?.Behaald;
    const specificToelichtingValid = validateTextLength(p.Smart.Specifiek?.Toelichting, 1);
    const meetbaarBehaald = !!p.Smart.Meetbaar?.Behaald;
    const meetbaarToelichtingValid = validateTextLength(p.Smart.Meetbaar?.Toelichting, 1);

    const smartEvaluated = specificBehaald && specificToelichtingValid && meetbaarBehaald && meetbaarToelichtingValid;

    // Get relevant tasks from the store
    const preventiefTasks = Array.from(taskStore.preventiefTasks.values()).filter(
      (task) => task.preventiefId === p.id && task.actionType === 'task'
    );

    // Check if all fetched tasks have evaluation data in the store
    // Ensure task.data and its properties exist before validation
    const todosEvaluated = preventiefTasks.every(
      (task) =>
        task.data && // Check if task.data exists
        validateTextLength(task.data.effectiviteit, 1) &&
        validateTextLength(task.data.impact, 1) &&
        validateTextLength(task.data.comments, 1)
    );

    // Check conclusion and status
    const hasConclusion = validateTextLength(p.Conclusie);
    const hasStatus = !!p.PDCAStatus;

    // Step is complete if SMART goals are evaluated, all tasks are evaluated,
    // and conclusion/status are set.
    return smartEvaluated && todosEvaluated && hasConclusion && hasStatus;
  }

  function validateAct(): boolean {
    const p = preventief.value;
    if (!p) return false;

    if (p.PDCAStatus === 'Niet') {
      const hasFailureAnalysis = validateTextLength(p.FailureAnalysis);
      const hasNewPlanning = validateTextLength(p.NewPDCAPlanning);

      return hasFailureAnalysis && hasNewPlanning;
    } else {
      const hasDocumentation = validateTextLength(p.Documentation);
      const hasTrainingInfo = !p.TrainingNeeded || (p.TrainingNeeded && validateTextLength(p.TrainingNeededType, 1));
      const hasMonitoring = validateTextLength(p.Monitoring) && !!p.FollowUpDate && !!p.Responsible;

      return hasDocumentation && hasTrainingInfo && hasMonitoring;
    }
  }

  return canComplete;
}
