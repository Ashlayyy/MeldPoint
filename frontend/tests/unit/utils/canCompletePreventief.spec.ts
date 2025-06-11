import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, computed, nextTick, type Ref, type ComputedRef } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useCanCompletePreventief } from '@/utils/canCompletePreventief';
import type { Task } from '@/stores/task_store';

// ++ Prepare mock variables ++
// Initialize the ref outside hoisting as 'ref' might not be available inside vi.hoisted's scope yet
const mockPreventiefTasks = ref<Map<string, Task>>(new Map());

// Hoist only the factory function that needs access to the hoisted scope
const { mockUseTaskStore } = vi.hoisted(() => {
  const mockUseTaskStore = vi.fn(() => ({
    preventiefTasks: mockPreventiefTasks.value
  }));
  return { mockUseTaskStore }; // Only return what was defined inside
});

// ++ Mock the store AFTER hoisting the mock implementation ++
vi.mock('@/stores/task_store', () => ({
  useTaskStore: mockUseTaskStore
}));

type MockPreventief = {
  id: string;
  Kernoorzaak?: string | null;
  Smart?: {
    Specifiek?: { Text?: string; Behaald?: string; Toelichting?: string };
    Meetbaar?: { Text?: string; Behaald?: string; Toelichting?: string };
    Haalbaar?: { Text?: string };
    Relevant?: { Text?: string };
    Tijdgebonden?: { Text?: string };
  };
  Steps?: {
    Do?: { Deadline?: string | null };
    Check?: { Deadline?: string | null };
    Act?: { Deadline?: string | null };
  };
  Strategie?: {
    KPI?: string | null;
    Comments?: string | null;
  } | null;
  User?: any | null;
  Begeleider?: any | null;
  Conclusie?: string | null;
  PDCAStatus?: string | null;
  FailureAnalysis?: string | null;
  NewPDCAPlanning?: string | null;
  Documentation?: string | null;
  TrainingNeeded?: boolean;
  TrainingNeededType?: string | null;
  Monitoring?: string | null;
  FollowUpDate?: string | null;
  Responsible?: string | null;
};

const createDefaultPreventief = (id: string): MockPreventief => ({
  id: id,
  Kernoorzaak: 'Valid Kernoorzaak',
  Smart: {
    Specifiek: { Text: 'S', Behaald: 'Ja', Toelichting: 'Good S' },
    Meetbaar: { Text: 'M', Behaald: 'Ja', Toelichting: 'Good M' },
    Haalbaar: { Text: 'A' },
    Relevant: { Text: 'R' },
    Tijdgebonden: { Text: 'T' }
  },
  Steps: {
    Do: { Deadline: '2024-01-01' },
    Check: { Deadline: '2024-01-02' },
    Act: { Deadline: '2024-01-03' }
  },
  Strategie: {
    KPI: 'Valid KPI',
    Comments: 'Valid Comments'
  },
  User: { id: 'user1' },
  Begeleider: null,
  Conclusie: 'Valid Conclusion',
  PDCAStatus: 'Wel',
  FailureAnalysis: 'Valid Analysis',
  NewPDCAPlanning: 'Valid Planning',
  Documentation: 'Valid Docs',
  TrainingNeeded: false,
  TrainingNeededType: null,
  Monitoring: 'Valid Monitoring',
  FollowUpDate: '2024-02-01',
  Responsible: 'user1'
});

describe('useCanCompletePreventief', () => {
  let nodeIdRef: Ref<string>;
  let preventiefRef: Ref<MockPreventief | null>;
  const testPreventiefId = 'preventief-1';

  beforeEach(() => {
    setActivePinia(createPinia());

    vi.clearAllMocks();
    mockPreventiefTasks.value.clear();

    nodeIdRef = ref('obstacle');
    preventiefRef = ref(createDefaultPreventief(testPreventiefId));
  });

  afterEach(() => {});

  const getCompletionStatus = () => {
    const nodeIdComputed = computed(() => nodeIdRef.value);
    return useCanCompletePreventief(nodeIdComputed, preventiefRef as Ref<any>);
  };

  it('should return false if preventief data is null', async () => {
    preventiefRef.value = null;
    const canComplete = getCompletionStatus();
    await nextTick();
    expect(canComplete.value).toBe(false);
  });

  it('should return false for unknown nodeId', async () => {
    nodeIdRef.value = 'unknown-node';
    const canComplete = getCompletionStatus();
    await nextTick();
    expect(canComplete.value).toBe(false);
  });

  it('should return true for finished nodeId', async () => {
    nodeIdRef.value = 'finished';
    const canComplete = getCompletionStatus();
    await nextTick();
    expect(canComplete.value).toBe(true);
  });

  describe('obstacle node', () => {
    beforeEach(() => {
      nodeIdRef.value = 'obstacle';
    });

    it('should return true if Kernoorzaak has text', async () => {
      preventiefRef.value!.Kernoorzaak = 'Some root cause';
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(true);
    });

    it('should return false if Kernoorzaak is null', async () => {
      preventiefRef.value!.Kernoorzaak = null;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Kernoorzaak is empty string', async () => {
      preventiefRef.value!.Kernoorzaak = '';
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Kernoorzaak is only whitespace', async () => {
      preventiefRef.value!.Kernoorzaak = '   ';
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });
  });

  describe('plan node', () => {
    beforeEach(() => {
      nodeIdRef.value = 'plan';
      preventiefRef.value = createDefaultPreventief(testPreventiefId);
    });

    it('should return true with default valid data', async () => {
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(true);
    });

    it('should return false if a SMART Text is missing', async () => {
      preventiefRef.value!.Smart!.Specifiek!.Text = '';
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Smart object is missing', async () => {
      preventiefRef.value!.Smart = undefined;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if User and Begeleider are missing', async () => {
      preventiefRef.value!.User = null;
      preventiefRef.value!.Begeleider = null;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return true if only User is present', async () => {
      preventiefRef.value!.User = { id: 'user1' };
      preventiefRef.value!.Begeleider = null;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(true);
    });

    it('should return true if only Begeleider is present', async () => {
      preventiefRef.value!.User = null;
      preventiefRef.value!.Begeleider = { id: 'begeleider1' };
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(true);
    });

    it('should return false if Strategie KPI is missing', async () => {
      preventiefRef.value!.Strategie!.KPI = '';
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Strategie Comments is missing', async () => {
      preventiefRef.value!.Strategie!.Comments = '';
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Strategie object is null', async () => {
      preventiefRef.value!.Strategie = null;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if a Step Deadline is missing', async () => {
      preventiefRef.value!.Steps!.Do!.Deadline = null;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Steps object is missing', async () => {
      preventiefRef.value!.Steps = undefined;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });
  });

  describe('do node', () => {
    beforeEach(() => {
      nodeIdRef.value = 'do';
      preventiefRef.value = createDefaultPreventief(testPreventiefId);
      mockPreventiefTasks.value.clear();
    });

    const createMockTask = (id: string, overrides: Partial<Task> = {}): Task => ({
      id: id,
      preventiefId: testPreventiefId,
      actionType: 'task',
      userId: 'user-do-' + id,
      action: 'Valid Do Action ' + id,
      deadline: '2024-01-01',
      data: {},
      createdAt: new Date().toISOString(),
      status: 'todo',
      meldingId: 'melding-' + id,
      message: 'Valid message',
      finished: false,
      ...overrides
    });

    it('should return true if there is at least one valid task', async () => {
      mockPreventiefTasks.value.set('task1', createMockTask('task1'));
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(true);
    });

    it('should return false if there are no tasks for the preventiefId', async () => {
      mockPreventiefTasks.value.set('task-other', createMockTask('task-other', { preventiefId: 'other-id' }));
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if there are only non-task actionTypes', async () => {
      mockPreventiefTasks.value.set('task1', createMockTask('task1', { actionType: 'comment' }));
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if any task is missing userId', async () => {
      mockPreventiefTasks.value.set('task1', createMockTask('task1'));
      mockPreventiefTasks.value.set('task2', createMockTask('task2', { userId: undefined }));
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if any task is missing action text', async () => {
      mockPreventiefTasks.value.set('task1', createMockTask('task1'));
      mockPreventiefTasks.value.set('task2', createMockTask('task2', { action: '' }));
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if any task is missing deadline', async () => {
      mockPreventiefTasks.value.set('task1', createMockTask('task1'));
      mockPreventiefTasks.value.set('task2', createMockTask('task2', { deadline: undefined }));
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });
  });

  describe('check node', () => {
    beforeEach(() => {
      nodeIdRef.value = 'check';
      preventiefRef.value = createDefaultPreventief(testPreventiefId);
      mockPreventiefTasks.value.clear();

      const task1 = createMockTaskForCheck('task-c1', true);
      const task2 = createMockTaskForCheck('task-c2', true);
      mockPreventiefTasks.value.set(task1.id, task1);
      mockPreventiefTasks.value.set(task2.id, task2);
    });

    const createMockTaskForCheck = (id: string, isValid: boolean): Task => {
      const taskData = isValid
        ? {
            effectiviteit: 'Good effect',
            impact: 'High impact',
            comments: 'Valid comments'
          }
        : {
            effectiviteit: '',
            impact: 'High impact',
            comments: 'Valid comments'
          };
      return createMockTask(id, { data: taskData });
    };

    it('should return true with default valid data and evaluated tasks', async () => {
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(true);
    });

    it('should return false if Specifiek Behaald is missing', async () => {
      preventiefRef.value!.Smart!.Specifiek!.Behaald = undefined;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Specifiek Toelichting is missing', async () => {
      preventiefRef.value!.Smart!.Specifiek!.Toelichting = '';
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Meetbaar Behaald is missing', async () => {
      preventiefRef.value!.Smart!.Meetbaar!.Behaald = undefined;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Meetbaar Toelichting is missing', async () => {
      preventiefRef.value!.Smart!.Meetbaar!.Toelichting = '';
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Smart object is missing', async () => {
      preventiefRef.value!.Smart = undefined;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if any task is missing evaluation data (effectiviteit)', async () => {
      const invalidTask = createMockTaskForCheck('task-c1', false);
      mockPreventiefTasks.value.set(invalidTask.id, invalidTask);

      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if any task is missing task.data object', async () => {
      const taskWithoutData = createMockTask('task-nodata');
      taskWithoutData.data = undefined;
      mockPreventiefTasks.value.set(taskWithoutData.id, taskWithoutData);

      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if Conclusie is missing', async () => {
      preventiefRef.value!.Conclusie = '';
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });

    it('should return false if PDCAStatus is missing', async () => {
      preventiefRef.value!.PDCAStatus = null;
      const canComplete = getCompletionStatus();
      await nextTick();
      expect(canComplete.value).toBe(false);
    });
  });

  describe('act node', () => {
    beforeEach(() => {
      nodeIdRef.value = 'act';
      preventiefRef.value = createDefaultPreventief(testPreventiefId);
    });

    describe('when PDCAStatus is Niet', () => {
      beforeEach(() => {
        preventiefRef.value!.PDCAStatus = 'Niet';
      });

      it('should return true if FailureAnalysis and NewPDCAPlanning are valid', async () => {
        preventiefRef.value!.FailureAnalysis = 'Valid analysis';
        preventiefRef.value!.NewPDCAPlanning = 'Valid planning';
        const canComplete = getCompletionStatus();
        await nextTick();
        expect(canComplete.value).toBe(true);
      });

      it('should return false if FailureAnalysis is missing', async () => {
        preventiefRef.value!.FailureAnalysis = '';
        preventiefRef.value!.NewPDCAPlanning = 'Valid planning';
        const canComplete = getCompletionStatus();
        await nextTick();
        expect(canComplete.value).toBe(false);
      });

      it('should return false if NewPDCAPlanning is missing', async () => {
        preventiefRef.value!.FailureAnalysis = 'Valid analysis';
        preventiefRef.value!.NewPDCAPlanning = '';
        const canComplete = getCompletionStatus();
        await nextTick();
        expect(canComplete.value).toBe(false);
      });
    });

    describe('when PDCAStatus is not Niet', () => {
      beforeEach(() => {
        preventiefRef.value!.PDCAStatus = 'Wel';
        preventiefRef.value!.Documentation = 'Valid Docs';
        preventiefRef.value!.TrainingNeeded = false;
        preventiefRef.value!.TrainingNeededType = null;
        preventiefRef.value!.Monitoring = 'Valid Monitoring';
        preventiefRef.value!.FollowUpDate = '2024-02-01';
        preventiefRef.value!.Responsible = 'user1';
      });

      it('should return true if Documentation, TrainingInfo, and Monitoring are valid (TrainingNeeded=false)', async () => {
        const canComplete = getCompletionStatus();
        await nextTick();
        expect(canComplete.value).toBe(true);
      });

      it('should return false if Documentation is missing', async () => {
        preventiefRef.value!.Documentation = '';
        const canComplete = getCompletionStatus();
        await nextTick();
        expect(canComplete.value).toBe(false);
      });

      it('should return false if TrainingNeeded is true but TrainingNeededType is missing', async () => {
        preventiefRef.value!.TrainingNeeded = true;
        preventiefRef.value!.TrainingNeededType = '';
        const canComplete = getCompletionStatus();
        await nextTick();
        expect(canComplete.value).toBe(false);
      });

      it('should return true if TrainingNeeded is true and TrainingNeededType is valid', async () => {
        preventiefRef.value!.TrainingNeeded = true;
        preventiefRef.value!.TrainingNeededType = 'Specific Training';
        const canComplete = getCompletionStatus();
        await nextTick();
        expect(canComplete.value).toBe(true);
      });

      it('should return false if Monitoring text is missing', async () => {
        preventiefRef.value!.Monitoring = '';
        const canComplete = getCompletionStatus();
        await nextTick();
        expect(canComplete.value).toBe(false);
      });

      it('should return false if FollowUpDate is missing', async () => {
        preventiefRef.value!.FollowUpDate = null;
        const canComplete = getCompletionStatus();
        await nextTick();
        expect(canComplete.value).toBe(false);
      });

      it('should return false if Responsible is missing', async () => {
        preventiefRef.value!.Responsible = null;
        const canComplete = getCompletionStatus();
        await nextTick();
        expect(canComplete.value).toBe(false);
      });
    });
  });

  it('should update canComplete reactively when nodeId changes', async () => {
    nodeIdRef.value = 'obstacle';
    preventiefRef.value!.Kernoorzaak = '';
    const canComplete = getCompletionStatus();

    await nextTick();
    expect(canComplete.value).toBe(false);

    nodeIdRef.value = 'finished';
    await nextTick();
    expect(canComplete.value).toBe(true);
  });

  it('should update canComplete reactively when preventief data changes', async () => {
    nodeIdRef.value = 'obstacle';
    preventiefRef.value!.Kernoorzaak = '';
    const canComplete = getCompletionStatus();

    await nextTick();
    expect(canComplete.value).toBe(false);

    preventiefRef.value!.Kernoorzaak = 'Now valid';
    await nextTick();
    expect(canComplete.value).toBe(true);
  });

  it('should update canComplete reactively when taskStore data changes (for relevant nodes)', async () => {
    nodeIdRef.value = 'do';
    const canComplete = getCompletionStatus();
    await nextTick();
    expect(canComplete.value).toBe(false);

    const validTask = createMockTask('task-reactive');
    mockPreventiefTasks.value.set(validTask.id, validTask);
    await nextTick();

    const reEvaluatedCanComplete = getCompletionStatus();
    await nextTick();

    expect(reEvaluatedCanComplete.value).toBe(true);
  });
});

const createMockTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id: id,
  preventiefId: 'preventief-1',
  actionType: 'task',
  userId: 'user-do-' + id,
  action: 'Valid Do Action ' + id,
  deadline: '2024-01-01',
  data: {},
  createdAt: new Date().toISOString(),
  status: 'todo',
  message: 'Valid message',
  finished: false,
  ...overrides
});
