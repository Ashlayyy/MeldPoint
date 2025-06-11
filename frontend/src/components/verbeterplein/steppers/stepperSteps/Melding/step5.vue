<template>
  <div>
    <div class="d-flex align-center mb-6">
      <v-icon color="primary" class="mr-2" style="font-size: 40px">mdi-clipboard-check-outline</v-icon>
      <div>
        <h3 class="text-h4 mb-0">Overzicht van je melding</h3>
        <p class="text-body-2 text-medium-emphasis">Controleer de gegevens voordat je de melding opslaat</p>
      </div>
    </div>

    <v-row>
      <!-- Obstacle Card -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="card-hover-border bg-gray100 h-100">
          <v-card-text>
            <div class="d-flex align-start">
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-office-building</v-icon>
                <h3 class="text-subtitle-1 font-weight-bold">OBSTAKELGEGEVENS</h3>
              </div>
            </div>

            <v-divider class="mt-4 mb-4" thickness="2"></v-divider>

            <div class="d-flex justify-space-between gap-8">
              <div class="flex-grow-1">
                <div class="d-flex flex-column mb-4">
                  <div class="text-subtitle-2 font-weight-medium">Project nummer</div>
                  <div class="text-body-2">
                    {{
                      createMeldingStore.project?.projectnummer >= 0 &&
                      createMeldingStore.project?.projectnummer <= 99999999 &&
                      createMeldingStore.project?.projectnummer !== null
                        ? createMeldingStore.project?.projectnummer
                        : 'N/A'
                    }}
                  </div>
                </div>
                <div class="d-flex flex-column">
                  <div class="text-subtitle-2 font-weight-medium">Project naam</div>
                  <div class="text-body-2">
                    {{ createMeldingStore.project?.projectnaam ?? 'N/A' }}
                  </div>
                </div>
              </div>

              <div class="flex-grow-1">
                <div class="d-flex flex-column mb-4">
                  <div class="text-subtitle-2 font-weight-medium">Deelorder</div>
                  <div class="text-body-2">
                    {{ createMeldingStore.project?.deelorder ?? 'N/A' }}
                  </div>
                </div>
                <div class="d-flex flex-column">
                  <div class="text-subtitle-2 font-weight-medium">Projectteam</div>
                  <div class="text-body-2">
                    {{ createMeldingStore.projectleider?.Name ?? 'N/A' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="d-flex flex-column mt-6">
              <div class="text-subtitle-2 font-weight-medium mb-2">Obstakel</div>
              <div class="text-body-2 expandable-text">
                {{ createMeldingStore.obstakel ?? 'N/A' }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Correctief Card -->
      <v-col v-if="!createMeldingStore.correctiefSkipped" cols="12" md="6">
        <v-card variant="outlined" class="card-hover-border bg-lightprimary h-100">
          <v-card-text>
            <div class="d-flex align-start">
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-flash</v-icon>
                <h3 class="text-subtitle-1 font-weight-bold">CORRECTIEF</h3>
              </div>
            </div>

            <v-divider class="mt-4 mb-4" thickness="2"></v-divider>

            <div class="d-flex justify-space-between gap-8">
              <div class="flex-grow-1">
                <div class="d-flex flex-column mb-4">
                  <div class="text-subtitle-2 font-weight-medium">Actiehouder</div>
                  <div class="text-body-2">
                    {{ createMeldingStore?.correctief?.user?.Name ?? 'N/A' }}
                  </div>
                </div>
                <div class="d-flex flex-column">
                  <div class="text-subtitle-2 font-weight-medium">Status</div>
                  <div class="text-body-2">
                    {{ createMeldingStore?.correctief?.status?.StatusNaam ?? 'N/A' }}
                  </div>
                </div>
              </div>

              <div class="flex-grow-1">
                <div class="d-flex flex-column mb-4">
                  <div class="text-subtitle-2 font-weight-medium">Deadline</div>
                  <div class="text-body-2">
                    {{ formatDate(createMeldingStore?.correctief?.deadline) }}
                  </div>
                </div>
                <div class="d-flex flex-column">
                  <div class="text-subtitle-2 font-weight-medium">Faalkosten</div>
                  <div class="text-body-2">
                    {{ createMeldingStore?.correctief?.faalkosten ? `€ ${createMeldingStore?.correctief?.faalkosten}` : 'N/A' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="d-flex flex-column mt-6">
              <div class="text-subtitle-2 font-weight-medium mb-2">Oplossing</div>
              <div class="text-body-2 expandable-text">
                {{ createMeldingStore?.correctief?.oplossing ?? 'N/A' }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Attachments Card -->
    <v-card v-if="createMeldingStore?.bijlagen?.length > 0" variant="outlined" class="h-100 card-hover-border mt-6">
      <v-card-text>
        <div class="d-flex align-start">
          <div class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-paperclip</v-icon>
            <h3 class="text-subtitle-1 font-weight-bold">BIJLAGEN</h3>
          </div>
          <v-chip color="primary" size="small" class="ml-auto" variant="flat">
            {{ createMeldingStore?.bijlagen?.length }} bestanden
          </v-chip>
        </div>

        <v-divider class="mt-4 mb-4" thickness="2"></v-divider>

        <div class="bijlage-container">
          <div v-for="bijlage in createMeldingStore.bijlagen" :key="bijlage.id" class="bijlage-preview">
            <template v-if="isImage(bijlage.type)">
              <v-img :src="bijlage.url" :alt="bijlage.name" cover :aspect-ratio="1" class="bijlage-image">
                <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </div>
                </template>
              </v-img>
            </template>
            <span v-else class="file-preview">
              {{ bijlage.name }}
            </span>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useCreateMeldingStore } from '@/stores/verbeterplein/create_melding_store';

const createMeldingStore = useCreateMeldingStore();

const isImage = (type: string): boolean => {
  return type?.startsWith('image/') || false;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
</script>

<style lang="scss" scoped>
.card-hover-border {
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);

  &:hover {
    border-color: rgb(var(--v-theme-primary));
  }
}

.bg-gray100 {
  background-color: rgb(var(--v-theme-surface));
}

.bg-lightprimary {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.h-100 {
  height: 100%;
}

.gap-8 {
  gap: 2rem;
}

.expandable-text {
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
  margin-top: 0.5rem;
}

.bijlage-preview {
  max-width: 250px;
  max-height: 200px;
  object-fit: contain;
  margin: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1;
}

.bijlage-image {
  height: 100%;
  width: 100%;
}

.file-preview {
  padding: 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.04);
  text-align: center;
  word-break: break-word;
}

.bijlage-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 8px;
  min-height: 100px;
  max-height: 100vh;
}

/* Remove the existing img styles since we're using v-img now */
.bijlage-preview img {
  display: none;
}
</style>
