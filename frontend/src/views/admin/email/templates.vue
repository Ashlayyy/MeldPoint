<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import EditorMenubar from '@/components/forms/plugins/editor/EditorMenubar.vue';
import axios from '@/utils/axios';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';

const { t } = useI18n();
const notification = useNotificationStore();

const page = ref({ title: t('admin.email.templates') });
const breadcrumbs = ref([
  {
    title: t('admin.title'),
    disabled: false,
    href: '#'
  },
  {
    title: t('admin.email.templates'),
    disabled: true,
    href: '#'
  }
]);

const templates = ref([]);
const loading = ref(false);
const dialog = ref(false);
const editMode = ref(false);
const currentTemplate = ref<any>({
  name: '',
  subject: '',
  content: '',
  variables: []
});

const editor = useEditor({
  extensions: [StarterKit],
  content: currentTemplate.value.content
});

const fetchTemplates = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/email/templates');
    if (response.data.data) {
      templates.value = response.data.data;
    } else {
      templates.value = [];
    }
  } catch (error) {
    notification.error({
      message: t('errors.fetch_error', { error: error || 'Fetch error' })
    });
  } finally {
    loading.value = false;
  }
};

const saveTemplate = async () => {
  if (!currentTemplate.value.name || !editor.value?.getHTML()) return;

  try {
    const payload = {
      ...currentTemplate.value,
      content: editor.value?.getHTML()
    };

    if (editMode.value) {
      await axios.put(`/api/email/templates/${currentTemplate.value.id}`, payload);
    } else {
      await axios.post('/api/email/templates', payload);
    }

    await fetchTemplates();
    dialog.value = false;
    resetForm();
  } catch (error) {
    notification.error({
      message: t('errors.save_error', { error: error || 'Save error' })
    });
  }
};

const editTemplate = (template: any) => {
  currentTemplate.value = { ...template };
  editor.value?.commands.setContent(template.content);
  editMode.value = true;
  dialog.value = true;
};

const resetForm = () => {
  currentTemplate.value = {
    name: '',
    subject: '',
    content: '',
    variables: []
  };
  editor.value?.commands.setContent('');
  editMode.value = false;
};

onMounted(() => {
  fetchTemplates();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Email Templates">
        <template v-slot:action>
          <v-btn color="primary" @click="dialog = true">
            <v-icon start>mdi-plus</v-icon>
            {{ $t('admin.email.add_template') }}
          </v-btn>
        </template>

        <v-data-table
          :headers="[
            { title: t('admin.email.table.name'), key: 'name' },
            { title: t('admin.email.table.subject'), key: 'subject' },
            { title: t('admin.email.table.variables'), key: 'variables' },
            { title: t('admin.email.table.actions'), key: 'actions', align: 'end' }
          ]"
          :items="templates"
          :loading="loading"
          hover
        >
          <template v-slot:item.variables="{ item }: any">
            <v-chip v-for="variable in item.variables" :key="variable" size="small" class="mr-1">
              {{ variable }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" color="primary" @click="editTemplate(item)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon variant="text" color="error">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Template Editor Dialog -->
  <v-dialog v-model="dialog" max-width="900px">
    <v-card>
      <v-card-title>
        {{ editMode ? t('admin.email.edit_template') : t('admin.email.new_template') }}
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="currentTemplate.name" :label="t('admin.email.table.name')" required variant="outlined"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="currentTemplate.subject"
                :label="t('admin.email.table.subject')"
                required
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-combobox
                v-model="currentTemplate.variables"
                :label="t('admin.email.table.variables')"
                multiple
                chips
                variant="outlined"
              ></v-combobox>
            </v-col>
            <v-col cols="12">
              <EditorMenubar v-if="editor" :editor="editor" />
              <editor-content :editor="editor" />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" variant="text" @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="saveTemplate">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.ProseMirror {
  min-height: 300px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
}
</style>
