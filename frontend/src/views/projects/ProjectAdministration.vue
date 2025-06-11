<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useProjectStore } from '@/stores/verbeterplein/project_store';
import { useProjectleiderStore } from '@/stores/verbeterplein/projectleider_store';
import { usePageStore } from '@/stores/pageStore';
import { useI18n } from 'vue-i18n';
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Define interface for project item
interface ProjectItem {
  id: string;
  ProjectNaam: string;
  NumberID: string;
  ProjectLeider: any;
  ProjectleiderId: undefined | null;
  StartDate: string;
  EndDate: string;
  ProjectLocatie: string;
  Beschrijving: string;
  Deelorders: string[];
  CreatedAt: string;
  UpdatedAt: string;
}

// Stores
const projectStore = useProjectStore();
const projectleiderStore = useProjectleiderStore();
const pageStore = usePageStore();
const { t } = useI18n();

// Table state
const loading = ref(false);
const search = ref('');
const dialog = ref(false);
const dialogDelete = ref(false);
const locationDialog = ref(false);
const locationMapRef = ref<InstanceType<typeof LMap> | null>(null);
const tempMarker = ref<L.Marker | null>(null);
const mapCenter = ref<[number, number]>([52.1326, 5.2913]);
const mapZoom = ref(7);

// Form state
const editedItem = ref<ProjectItem>({
  id: '',
  ProjectNaam: '',
  NumberID: '',
  ProjectLeider: null,
  ProjectleiderId: undefined,
  StartDate: '',
  EndDate: '',
  ProjectLocatie: '',
  Beschrijving: '',
  Deelorders: [],
  CreatedAt: '',
  UpdatedAt: ''
});

const defaultItem: ProjectItem = {
  id: '',
  ProjectNaam: '',
  NumberID: '',
  ProjectLeider: null,
  ProjectleiderId: undefined,
  StartDate: '',
  EndDate: '',
  ProjectLocatie: '',
  Beschrijving: '',
  Deelorders: [],
  CreatedAt: '',
  UpdatedAt: ''
};

// Add new ref for new deelorder input
const newDeelorder = ref('');

// Add method to handle adding deelorders
const addDeelorder = () => {
  const trimmedDeelorder = newDeelorder.value.trim();
  if (trimmedDeelorder && !editedItem.value.Deelorders.includes(trimmedDeelorder)) {
    editedItem.value.Deelorders.push(trimmedDeelorder);
    newDeelorder.value = '';
  } else if (trimmedDeelorder) {
    // If it's a duplicate, clear the input but don't add it
    newDeelorder.value = '';
  }
};

// Add method to remove deelorders
const removeDeelorder = (index: number) => {
  editedItem.value.Deelorders.splice(index, 1);
};

// Table headers
const headers = [
  { title: 'Projectnaam', key: 'ProjectNaam', align: 'start' as const, sortable: true },
  { title: 'Projectnummer', key: 'NumberID', align: 'start' as const, sortable: true },
  { title: 'Projectteam', key: 'ProjectLeider', align: 'start' as const, sortable: false },
  { title: 'Startdatum', key: 'StartDate', align: 'start' as const, sortable: true },
  { title: 'Einddatum', key: 'EndDate', align: 'start' as const, sortable: true },
  { title: 'Locatie', key: 'ProjectLocatie', align: 'start' as const, sortable: false },
  { title: 'Deelorders', key: 'Deelorders', align: 'start' as const, sortable: false },
  { title: 'Acties', key: 'actions', sortable: false, align: 'end' as const }
];

// Form validation rules
const rules = {
  required: (v: any) => !!v || 'Dit veld is verplicht',
  numberID: (v: any) => /^\d+$/.test(v) || 'Alleen nummers zijn toegestaan'
};

// Methods
const editItem = (item: ProjectItem) => {
  editedItem.value = {
    ...defaultItem,
    ...item,
    ProjectLocatie: item.ProjectLocatie || ''
  };
  dialog.value = true;
};

const deleteItem = (item: ProjectItem) => {
  editedItem.value = {
    ...defaultItem,
    ...item,
    ProjectLocatie: item.ProjectLocatie || ''
  };
  dialogDelete.value = true;
};

const deleteItemConfirm = async () => {
  try {
    loading.value = true;
    await projectStore.deleteProject(editedItem.value.id);
    await projectStore.fetchProjects();
    closeDelete();
  } catch (error) {
    console.error('Error deleting project:', error);
  } finally {
    loading.value = false;
  }
};

const close = () => {
  dialog.value = false;
  editedItem.value = Object.assign({}, defaultItem);
};

const closeDelete = () => {
  dialogDelete.value = false;
  editedItem.value = Object.assign({}, defaultItem);
};

const save = async () => {
  try {
    loading.value = true;

    // Create a cleaned version of the data for update/create
    const cleanedData = {
      ProjectNaam: editedItem.value.ProjectNaam,
      NumberID: parseInt(editedItem.value.NumberID),
      ProjectleiderId: editedItem.value.ProjectleiderId,
      StartDate: editedItem.value.StartDate ? new Date(editedItem.value.StartDate) : null,
      EndDate: editedItem.value.EndDate ? new Date(editedItem.value.EndDate) : null,
      ProjectLocatie: editedItem.value.ProjectLocatie || '',
      Beschrijving: editedItem.value.Beschrijving || '',
      Deelorders: editedItem.value.Deelorders || []
    };

    if (editedItem.value.id) {
      await projectStore.updateProject(editedItem.value.id, cleanedData);
    } else {
      await projectStore.createProject(cleanedData);
    }
    close();
  } catch (error) {
    console.error('Error saving project:', error);
  } finally {
    loading.value = false;
  }
};

// Fix for Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// Add this function to handle map clicks
const handleMapClick = (e: L.LeafletMouseEvent) => {
  const { lat, lng } = e.latlng;
  const map = locationMapRef.value?.leafletObject;

  if (!map) return;

  // Remove existing temporary marker if any
  if (tempMarker.value) {
    tempMarker.value.remove();
    tempMarker.value = null;
  }

  // Create new marker (Leaflet uses [lat, lng] format)
  tempMarker.value = L.marker([lat, lng]).addTo(map as L.Map);

  // Update the location field with rounded coordinates (longitude,latitude format)
  editedItem.value.ProjectLocatie = `${lng.toFixed(6)},${lat.toFixed(6)}`;
};

// Add this function to handle location selection confirmation
const confirmLocation = () => {
  locationDialog.value = false;
};

// Add this function to open the location picker
const openLocationPicker = async () => {
  locationDialog.value = true;

  await nextTick();
  const map = locationMapRef.value?.leafletObject;
  if (!map) return;

  // If there's already a location, center the map there
  const locationString = editedItem.value.ProjectLocatie;
  if (locationString && locationString !== '') {
    const [longitude, latitude] = locationString.split(',').map((coord: string) => parseFloat(coord.trim()));
    if (!isNaN(latitude) && !isNaN(longitude)) {
      mapCenter.value = [latitude, longitude];
      mapZoom.value = 15;

      // Remove existing marker if any
      if (tempMarker.value) {
        tempMarker.value.remove();
        tempMarker.value = null;
      }

      // Create initial marker
      tempMarker.value = L.marker([latitude, longitude]).addTo(map as L.Map);
    }
  }
};

// Add cleanup on dialog close
const closeLocationDialog = () => {
  if (tempMarker.value) {
    tempMarker.value.remove();
    tempMarker.value = null;
  }
  locationDialog.value = false;
};

// Initialize data
onMounted(async () => {
  loading.value = true;
  try {
    if (projectStore.projects.length === 0) {
      await projectStore.fetchProjects();
    }
    if (projectleiderStore.projectleiders.length === 0) {
      await projectleiderStore.fetchProjectleiders();
    }

    // Set page info
    pageStore.setPageInfo('Projecten', [
      { title: 'Home', href: '/' },
      { title: 'Projecten', href: '/overzicht' }
    ]);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <v-container fluid>
    <!-- Data Table -->
    <v-card>
      <v-card-title>
        <v-row align="center">
          <v-col cols="6">
            <span class="text-h5"></span>
          </v-col>
          <v-col cols="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Zoeken"
              single-line
              hide-details
              rounded="none"
              density="comfortable"
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="2" class="text-right">
            <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true"> Nieuw Project </v-btn>
          </v-col>
        </v-row>
      </v-card-title>
      <!-- {{projectStore.projects}} -->
      <v-data-table
        :headers="headers"
        :items="projectStore.projects"
        :search="search"
        :loading="loading"
        class="elevation-1"
        item-value="id"
      >
        <template v-slot:item.ProjectLeider="{ item }">
          <span v-if="item.ProjectLeider">{{ item.ProjectLeider.Name }}</span>
          <span v-else>-</span>
        </template>

        <template v-slot:item.StartDate="{ item }">
          {{ item.StartDate ? new Date(item.StartDate).toLocaleDateString() : '-' }}
        </template>

        <template v-slot:item.EndDate="{ item }">
          {{ item.EndDate ? new Date(item.EndDate).toLocaleDateString() : '-' }}
        </template>

        <template v-slot:item.ProjectLocatie="{ item }">
          {{ item.ProjectLocatie || '-' }}
        </template>

        <template v-slot:item.Deelorders="{ item }">
          <div class="d-flex align-center deelorders-container">
            <v-chip-group class="deelorders-group">
              <v-chip
                v-for="deelorder in item.Deelorders"
                :key="deelorder"
                size="small"
                variant="outlined"
                color="primary"
                class="mr-1"
                label
              >
                {{ deelorder }}
              </v-chip>
            </v-chip-group>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="editItem(item)"></v-btn>
          <v-btn
            v-permission="[{ action: 'manage', resourceType: 'all' }]"
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            @click="deleteItem(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ editedItem.id ? 'Project Bewerken' : 'Nieuw Project' }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  rounded="none"
                  v-model="editedItem.ProjectNaam"
                  label="Projectnaam"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  type="number"
                  rounded="none"
                  v-model="editedItem.NumberID"
                  label="Projectnummer"
                  :rules="[rules.required, rules.numberID]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  rounded="none"
                  v-model="editedItem.ProjectleiderId"
                  :items="projectleiderStore.projectleiders"
                  label="Projectteam"
                  item-title="Name"
                  item-value="id"
                  :rules="[rules.required]"
                  required
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  rounded="none"
                  v-model="editedItem.StartDate"
                  label="Startdatum"
                  type="date"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field rounded="none" v-model="editedItem.EndDate" label="Einddatum" type="date"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  rounded="none"
                  v-model="editedItem.ProjectLocatie"
                  label="Projectlocatie"
                  placeholder="longitude,latitude"
                  hint="Bijvoorbeeld: 4.8951679,52.3702157"
                  persistent-hint
                  :append-inner-icon="'mdi-map-marker'"
                  @click:append-inner="openLocationPicker"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <div class="deelorders-section rounded-lg">
                  <div class="text-h6 mb-4">Deelorders</div>
                  <div class="d-flex align-center mb-4">
                    <v-text-field
                      rounded="lg"
                      type="number"
                      v-model="newDeelorder"
                      label="Voeg deelorder toe"
                      @keyup.enter="addDeelorder"
                      class="flex-grow-1 mr-2"
                      hide-details
                      variant="outlined"
                      density="comfortable"
                      placeholder="Voer een deelorder in..."
                      bg-color="white"
                      :error-messages="
                        newDeelorder.trim() && editedItem.Deelorders.includes(newDeelorder.trim()) ? 'Deze deelorder bestaat al' : ''
                      "
                    ></v-text-field>
                    <v-btn
                      color="primary"
                      icon="mdi-plus"
                      @click="addDeelorder"
                      :disabled="!newDeelorder.trim() || editedItem.Deelorders.includes(newDeelorder.trim())"
                      variant="tonal"
                      class="rounded-lg"
                    >
                    </v-btn>
                  </div>
                  <v-slide-y-transition group>
                    <v-chip
                      v-for="(deelorder, index) in editedItem.Deelorders"
                      :key="deelorder"
                      closable
                      @click:close="removeDeelorder(index)"
                      class="ma-1"
                      variant="outlined"
                      label
                    >
                      {{ deelorder }}
                    </v-chip>
                  </v-slide-y-transition>
                  <div v-if="editedItem.Deelorders.length === 0" class="text-subtitle-2 text-grey mt-2">Nog geen deelorders toegevoegd</div>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="close">Annuleren</v-btn>
          <v-btn color="primary" variant="text" @click="save" :loading="loading">Opslaan</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Weet je zeker dat je dit project wilt verwijderen?</v-card-title>
        <v-card-text>Deze actie kan niet ongedaan worden gemaakt.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="closeDelete">Annuleren</v-btn>
          <v-btn
            v-permission="[{ action: 'manage', resourceType: 'all' }]"
            color="error"
            variant="text"
            @click="deleteItemConfirm"
            :loading="loading"
            >Verwijderen</v-btn
          >
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Location Dialog -->
    <v-dialog v-model="locationDialog" max-width="800px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Selecteer Locatie</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeLocationDialog"></v-btn>
        </v-card-title>

        <v-card-text>
          <div style="height: 500px; width: 100%">
            <l-map
              ref="locationMapRef"
              v-model:zoom="mapZoom"
              v-model:center="mapCenter"
              :use-global-leaflet="false"
              :max-zoom="18"
              :options="{ zoomControl: true, attributionControl: true }"
              @click="handleMapClick"
            >
              <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base" name="OpenStreetMap"></l-tile-layer>
            </l-map>
          </div>
          <div class="text-caption mt-2">Klik op de kaart om de locatie te selecteren</div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeLocationDialog">Annuleren</v-btn>
          <v-btn color="primary" variant="text" @click="confirmLocation">Bevestigen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.v-data-table {
  width: 100%;
}

:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
  z-index: 1;
}

.deelorders-section {
  background-color: rgb(var(--v-theme-background));
  border: thin solid rgba(var(--v-border-color), 0.12);
  padding: 16px;
}

:deep(.v-field.v-field--variant-outlined) {
  background-color: white;
}

.deelorders-container {
  width: 100%;
  gap: 8px;
}

.deelorders-group {
  min-width: 0;
  flex: 1;
}

.add-deelorder-btn {
  margin-left: auto;
}

:deep(.v-chip-group) {
  flex-wrap: wrap;
}
</style>
