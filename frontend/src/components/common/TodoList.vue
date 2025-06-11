<template>
  <div class="todo-list">
    <h3 class="text-lg font-semibold mb-4">Tasks</h3>
    <div class="space-y-2">
      <div v-for="todo in uncompletedTodos" :key="todo.id" class="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
        <span>{{ todo.message }}</span>
        <button @click="completeTodo(todo.id)" class="text-green-500 hover:text-green-600">
          <i class="fas fa-check"></i>
        </button>
      </div>
      <div v-if="completedTodos.length > 0" class="mt-6">
        <h4 class="text-md font-medium text-gray-500 mb-2">Completed</h4>
        <div v-for="todo in completedTodos" :key="todo.id" class="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
          <span class="line-through text-gray-400">{{ todo.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useTodosStore } from '@/stores/todos';

const store = useTodosStore();

const uncompletedTodos = computed(() => store.uncompletedTodos);
const completedTodos = computed(() => store.completedTodos);

const completeTodo = async (id: string) => {
  await store.completeTodo(id);
};

onMounted(() => {
  store.fetchTodos();
});
</script>

<style scoped>
.todo-list {
  @apply p-4 bg-gray-50 rounded-lg;
}
</style>
