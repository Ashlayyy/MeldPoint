import { defineStore } from 'pinia';
// project imports
import axios from '@/utils/axios';

export const useKanbanStore = defineStore({
  id: 'kanban',
  state: () => ({
    kanbanItems: []
  }),
  getters: {},
  actions: {
    // Fetch Chat from action
    async fetchkanbanItems() {
      try {
        const response = await axios.get('/api/data/kanban');
        this.kanbanItems = response.data;
      } catch (error) {
        alert(error);
      }
    },
    addTask(itemID: number, item: string) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      this.kanbanItems = this.kanbanItems.filter((task: any) => {
        return task.id === itemID
          ? {
              ...task,
              ...task.tasks.push(item)
            }
          : task;
      });
    }
  }
});
