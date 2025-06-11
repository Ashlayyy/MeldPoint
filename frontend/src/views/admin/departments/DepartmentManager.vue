<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h1 class="text-h4">Department Management</h1>
          <v-btn color="primary" @click="openCreateDialog">
            <v-icon left>mdi-plus</v-icon>
            Add Department
          </v-btn>
        </div>

        <v-card>
          <v-data-table :headers="headers" :items="departments" :loading="departmentStore.isLoading" class="elevation-1">
            <template v-slot:item.actions="{ item }">
              <v-btn icon variant="text" color="primary" @click="openEditDialog(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon variant="text" color="error" @click="confirmDelete(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name"
                  label="Department Name"
                  :rules="[(v) => !!v || 'Name is required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="editedItem.description" label="Description" rows="3"></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog"> Cancel </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="save"> Save </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Delete Department</v-card-title>
        <v-card-text> Are you sure you want to delete this department? This action cannot be undone. </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="deleteItemConfirm">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDepartmentStore } from '@/stores/verbeterplein/department_store';

const departmentStore = useDepartmentStore();

const headers = [
  { title: 'Name', align: 'start' as const, key: 'name' },
  { title: 'Description', align: 'start' as const, key: 'description' },
  { title: 'Created At', align: 'start' as const, key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const }
];

const departments = computed(() => departmentStore.departments);

const dialog = ref(false);
const deleteDialog = ref(false);
const editedIndex = ref(-1);
const editedItem = ref({
  id: '',
  name: '',
  description: ''
});
const defaultItem = {
  id: '',
  name: '',
  description: ''
};

const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'New Department' : 'Edit Department';
});

onMounted(async () => {
  await departmentStore.initializeData();
});

function openCreateDialog() {
  editedIndex.value = -1;
  editedItem.value = { ...defaultItem };
  dialog.value = true;
}

function openEditDialog(item: any) {
  editedIndex.value = departments.value.indexOf(item);
  editedItem.value = { ...item };
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  editedItem.value = { ...defaultItem };
  editedIndex.value = -1;
}

async function save() {
  if (editedIndex.value > -1) {
    // Update
    await departmentStore.updateDepartment(editedItem.value.id, {
      name: editedItem.value.name,
      description: editedItem.value.description
    });
  } else {
    // Create
    await departmentStore.createDepartment({
      name: editedItem.value.name,
      description: editedItem.value.description
    });
  }
  closeDialog();
}

function confirmDelete(item: any) {
  editedIndex.value = departments.value.indexOf(item);
  editedItem.value = { ...item };
  deleteDialog.value = true;
}

function closeDeleteDialog() {
  deleteDialog.value = false;
  editedItem.value = { ...defaultItem };
  editedIndex.value = -1;
}

async function deleteItemConfirm() {
  await departmentStore.deleteDepartment(editedItem.value.id);
  closeDeleteDialog();
}
</script>
