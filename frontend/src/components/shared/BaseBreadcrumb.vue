<script setup lang="ts">
import { ChevronRightIcon } from 'vue-tabler-icons';
const props = defineProps({
  title: String,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  breadcrumbs: Array as any,
  icon: String
});
</script>

// ===============================|| Theme Breadcrumb ||=============================== //
<template>
  <v-row class="page-breadcrumb mb-1 mt-1">
    <v-col cols="12" md="12">
      <v-card variant="outlined" elevation="0" class="px-4 py-3 withbg">
        <v-row no-gutters class="align-center">

          <v-col md="7" sm="12" cols="12">
            <v-breadcrumbs :items="props.breadcrumbs" class="text-h5 justify-md-end pa-1">
              <template v-slot:divider>
                <div class="d-flex align-center">
                  <ChevronRightIcon size="17" />
                </div>
              </template>
              <template v-slot:prepend>
                <v-icon size="large" icon="mdi-home" class="text-secondary mr-2"></v-icon>
                <div class="d-flex align-center">
                  <ChevronRightIcon size="17" />
                </div>
              </template>
            </v-breadcrumbs>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss">
.page-breadcrumb {
  .v-toolbar {
    background: transparent;
  }
}
</style>
