<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useProjectStore } from '@/stores/verbeterplein/project_store';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet';
import type { LatLngExpression, LatLngTuple } from 'leaflet';

// Import marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Define Project interface
interface Project {
  id: string;
  ProjectNaam: string;
  NumberID: string;
  ProjectLeider: { Name: string } | null;
  ProjectleiderId: string | null;
  StartDate: string | null;
  EndDate: string | null;
  ProjectLocatie: string | null;
  Beschrijving: string | null;
  Deelorders: any[];
  CreatedAt: string;
  UpdatedAt: string;
}

// Store
const projectStore = useProjectStore();
const mapRef = ref<InstanceType<typeof LMap> | null>(null);
const markerClusterGroup = ref<any>(null);

// State management
const isLoading = ref(true);
const error = ref<string | null>(null);

// Netherlands center coordinates
const center = ref<[number, number]>([52.1326, 5.2913]);
const zoom = ref(7);
const projectDialog = ref(false);
const selectedProject = ref<Project | null>(null);

// Fix for Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const customIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const handleMapReady = () => {
  const map = mapRef.value?.leafletObject as L.Map;
  if (!map) return;

  try {
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers directly to map
    projectStore.projects.forEach((project) => {
      if (project.ProjectLocatie) {
        try {
          const coordinates = project.ProjectLocatie.split(',');
          if (coordinates.length !== 2) {
            console.warn(`Invalid coordinates format for project ${project.ProjectNaam}: ${project.ProjectLocatie}`);
            return;
          }

          const longitude = parseFloat(coordinates[0].trim());
          const latitude = parseFloat(coordinates[1].trim());

          if (isNaN(latitude) || isNaN(longitude)) {
            console.warn(`Invalid coordinates for project ${project.ProjectNaam}: lat=${latitude}, lng=${longitude}`);
            return;
          }

          if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            console.warn(`Coordinates out of range for project ${project.ProjectNaam}: lat=${latitude}, lng=${longitude}`);
            return;
          }
          const marker = L.marker([latitude, longitude], { icon: customIcon })
            .bindPopup(`<strong>${project.ProjectNaam}</strong>`)
            .on('click', () => {
              selectedProject.value = project;
              projectDialog.value = true;
            });

          marker.addTo(map);
        } catch (err) {
          console.warn(`Error processing coordinates for project ${project.ProjectNaam}:`, err);
        }
      }
    });
  } catch (error) {
    console.error('Error setting up markers:', error);
  } finally {
    isLoading.value = false;
  }
};

// Watch for changes in projects
watch(
  () => projectStore.projects,
  async (newProjects) => {
    if (mapRef.value?.leafletObject) {
      handleMapReady();
    }
  },
  { deep: true }
);

onMounted(async () => {
  try {
    if (projectStore.projects.length === 0) {
      await projectStore.fetchProjects();
    }
  } catch (e) {
    console.error('Error fetching projects:', e);
    error.value = e instanceof Error ? e.message : 'An error occurred loading the map';
  }
});

onUnmounted(() => {
  const map = mapRef.value?.leafletObject as L.Map;
  if (map) {
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
  }
});
</script>

<template>
  <v-container fluid class="fill-height pa-0">
    <v-overlay v-model="isLoading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>

    <v-alert v-if="error" type="error" title="Error" :text="error" class="ma-4"></v-alert>

    <v-row no-gutters class="fill-height">
      <v-col cols="12" class="fill-height">
        <div class="map-container">
          <l-map
            ref="mapRef"
            v-model:zoom="zoom"
            v-model:center="center"
            :max-zoom="18"
            :use-global-leaflet="false"
            :options="{ zoomControl: true, attributionControl: true }"
            @ready="handleMapReady"
          >
            <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base" name="OpenStreetMap"></l-tile-layer>
          </l-map>
        </div>
      </v-col>
    </v-row>

    <v-dialog v-model="projectDialog" max-width="600px">
      <v-card v-if="selectedProject">
        <v-card-title>
          <span class="text-h5">{{ selectedProject.ProjectNaam }}</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="projectDialog = false"></v-btn>
        </v-card-title>

        <v-card-text>
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-identifier</v-icon>
              </template>
              <v-list-item-title>Project Nummer</v-list-item-title>
              <v-list-item-subtitle>{{ selectedProject.NumberID }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-map-marker</v-icon>
              </template>
              <v-list-item-title>Locatie</v-list-item-title>
              <v-list-item-subtitle>{{ selectedProject.ProjectLocatie }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-calendar</v-icon>
              </template>
              <v-list-item-title>Start Datum</v-list-item-title>
              <v-list-item-subtitle>{{
                selectedProject?.StartDate ? new Date(selectedProject.StartDate).toLocaleDateString() : '-'
              }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedProject?.EndDate">
              <template v-slot:prepend>
                <v-icon color="primary">mdi-calendar-end</v-icon>
              </template>
              <v-list-item-title>Eind Datum</v-list-item-title>
              <v-list-item-subtitle>{{ new Date(selectedProject.EndDate).toLocaleDateString() }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <div v-if="selectedProject.Beschrijving" class="mt-4">
            <div class="text-h6 mb-2">Beschrijving</div>
            <p>{{ selectedProject.Beschrijving }}</p>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="projectDialog = false">Sluiten</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.map-container {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
}

:deep(.vue-leaflet) {
  height: 100%;
  width: 100%;
}
</style>
