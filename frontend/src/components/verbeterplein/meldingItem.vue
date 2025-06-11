<template>
  <Dialog
    v-model="dialogVisible"
    :max-width="1500"
    :show-actions="false"
    :editingButton="showEdit"
    @update:modelValue="handleDialogVisibility"
    @openEdit="editItem"
    :persistent="false"
  >
    <template #default>
      <div class="dialog-wrapper" @click.stop>
        <div class="info-header" style="font-size: 1.2rem">
          <div class="info-header__content">
            <div class="info-header__primary">
              <!-- Original Header for non-PDCA modes -->
              <template v-if="openedFromMode !== 'PDCA'">
                <div class="info-header__id">
                  <img src="/header-bullet.svg" class="mr-2" />
                  <span>{{ item?.VolgNummer || 'N/A' }}</span>
                </div>
                <!-- <v-divider vertical class="mx-3"></v-divider> -->
                <div class="info-header__project flex-grow-1 d-flex justify-center">
                  <div v-if="item?.Project?.NumberID !== 1" class="project-content">
                    <v-icon color="primary" size="small">mdi-office-building-outline</v-icon>
                    <span>{{ item?.Project?.NumberID }}</span>
                    <span>DO{{ item?.Deelorder || 'N/A' }}</span>
                    <div class="info-header__secondary" v-if="item?.Project?.ProjectNaam">
                      <span class="project-name">{{ item?.Project?.ProjectNaam }}</span>
                    </div>
                  </div>
                  <div v-else class="project-content">
                    <v-icon color="primary" size="small">mdi-information-outline</v-icon>
                    <div class="info-header__secondary">
                      <span class="project-name">Algemene melding</span>
                    </div>
                  </div>
                </div>
              </template>
              <!-- New Header for PDCA mode -->
              <template v-else>
                <div class="info-header__id">
                  <img src="/header-bullet.svg" class="mr-2" />
                  <span>Melding: {{ item?.VolgNummer || 'N/A' }}</span>
                </div>
                <div class="info-header__project flex-grow-1 d-flex justify-center">
                  <!-- Revert this part back to showing Project details -->
                  <div v-if="item?.Project?.NumberID !== 1" class="project-content">
                    <v-icon color="primary" size="small">mdi-office-building-outline</v-icon>
                    <span>{{ item?.Project?.NumberID }}</span>
                    <span>DO{{ item?.Deelorder || 'N/A' }}</span>
                    <div class="info-header__secondary" v-if="item?.Project?.ProjectNaam">
                      <span class="project-name">{{ item?.Project?.ProjectNaam }}</span>
                    </div>
                  </div>
                  <div v-else class="project-content">
                    <v-icon color="primary" size="small">mdi-information-outline</v-icon>
                    <div class="info-header__secondary">
                      <span class="project-name">Algemene melding</span>
                    </div>
                  </div>
                </div>
              </template>
              <v-btn
                icon="mdi-share-variant"
                size="small"
                variant="text"
                color="primary"
                @click="copyToClipboard"
                :disabled="!item?.VolgNummer"
              >
              </v-btn>
            </div>
          </div>
        </div>

        <div class="tabs-container">
          <v-tabs v-model="activeTab" centered color="primary" fixed-tabs>
            <v-tab value="melding">
              <v-icon start>mdi-information-outline</v-icon>
              {{ $t('verbeterplein.showItem.tabs.report') }}
            </v-tab>
            <v-tab
              value="pdca"
              :disabled="item?.Preventief?.id && item?.Preventief?.rootCauseLevel !== 1 && item?.PDCA === true ? false : true"
            >
              <v-icon start>mdi-alpha-p-circle-outline </v-icon>
              {{ $t('verbeterplein.showItem.tabs.pdca') }}
            </v-tab>
            <v-tab value="communicatie" class="position-relative">
              <v-icon start variant="outline">mdi-message-outline</v-icon>{{ $t('verbeterplein.showItem.tabs.communication') }}
            </v-tab>
            <v-tab
              value="historie"
              :disabled="historyStore.loading || !historyStore.currentHistory.length || historyStore.currentHistory.length === 0"
            >
              <v-icon start>mdi-history</v-icon>
              {{ $t('verbeterplein.showItem.tabs.history') }}
              <v-progress-circular
                v-if="historyStore.loading"
                indeterminate
                size="16"
                width="2"
                color="primary"
                class="ml-2"
              ></v-progress-circular>
            </v-tab>
            <v-tab
              v-if="canViewEngagementTab"
              value="engagement"
              :disabled="engagementStore.loading || !!engagementStore.error || !engagementStore.hasData"
            >
              <v-icon start>mdi-chart-line</v-icon>
              {{ $t('verbeterplein.showItem.tabs.engagement') }}
              <v-progress-circular
                v-if="engagementStore.loading"
                indeterminate
                size="16"
                width="2"
                color="secondary"
                class="ml-2"
              ></v-progress-circular>
            </v-tab>
          </v-tabs>
          <v-divider></v-divider>
        </div>

        <v-window v-model="activeTab" class="window-container" :touch="false">
          <v-window-item value="melding">
            <div class="tab-content">
              <!-- <div class="d-flex justify-center align-center mt-5 mb-5">
                <img src="/header-bullet.svg" class="mr-2" />
                <h3>ALGEMEEN</h3>
              </div> -->
              <v-row>
                <v-col cols="12" md="12" class="d-flex">
                  <v-card variant="outlined" class="card-hover-border bg-gray100 flex-grow-1">
                    <v-card-text>
                      <div class="d-flex align-start">
                        <div class="d-flex align-center">
                          <v-icon class="mr-2" color="primary">mdi-office-building</v-icon>
                          <h3>OBSTAKELGEGEVENS</h3>
                        </div>
                        <div class="ml-auto">
                          <v-btn icon="mdi-pencil" variant="text" density="compact" size="small" @click="openEditObstakel"> </v-btn>
                        </div>
                      </div>

                      <v-divider class="mt-4 mb-4" thickness="2"></v-divider>

                      <v-row>
                        <v-col cols="12" md="6">
                          <!-- Project Info Column -->
                          <!-- <div> -->
                          <div class="d-flex mt-9 gap-8">
                            <div class="flex-grow-1">
                              <div class="d-flex flex-column mb-4">
                                <div class="text-h5">
                                  {{ $t('verbeterplein.showItem.fields.project_number') }}
                                </div>
                                <div class="text-caption">
                                  {{
                                    item?.Project?.NumberID || item?.Project?.NumberID === 0
                                      ? item?.Project?.NumberID
                                      : $t('verbeterplein.showItem.placeholders.na')
                                  }}
                                </div>
                              </div>
                              <div class="d-flex flex-column mt-4">
                                <div class="text-h5">
                                  {{ $t('verbeterplein.showItem.fields.project_name') }}
                                </div>
                                <div class="text-caption">
                                  {{ item?.Project?.ProjectNaam || $t('verbeterplein.showItem.placeholders.na') }}
                                </div>
                              </div>
                            </div>

                            <!-- Order Info Column -->
                            <div class="flex-grow-1">
                              <div class="d-flex flex-column mb-4">
                                <div class="text-h5">
                                  {{ $t('verbeterplein.showItem.fields.sub_order') }}
                                </div>
                                <div class="text-caption">
                                  {{ item?.Deelorder || $t('verbeterplein.showItem.placeholders.na') }}
                                </div>
                              </div>
                              <div class="d-flex flex-column mt-4">
                                <div class="text-h5">
                                  {{ $t('verbeterplein.showItem.fields.project_team') }}
                                </div>
                                <div class="text-caption">
                                  {{ item?.Project?.ProjectLeider?.Name || $t('verbeterplein.showItem.placeholders.na') }}
                                </div>
                              </div>
                            </div>
                          </div>
                        </v-col>

                        <!-- AI Title Column -->

                        <v-col cols="12" md="6">
                          <!-- <div class="flex-grow-1"> -->
                          <!-- <div class="text-h2  mb-5" :style="{ fontFamily: 'FreeSetDemiBold' }">intalAI</div> -->
                          <div class="d-flex flex-column mt-9 mb-5 gap-8">
                            <AIGenerator
                              :label="$t('verbeterplein.showItem.fields.summary')"
                              :placeholder="$t('verbeterplein.showItem.placeholders.no_summary')"
                              :generate-function="() => generateNewTitle(item?.Obstakel)"
                              :save-function="saveTitle"
                              @update="handleTitleUpdate"
                              :show-original="true"
                              :initial-value="item?.Title"
                            />
                          </div>

                          <!-- Add AI Category section -->
                          <div class="d-flex flex-column mt-4 mr-0">
                            <AIGenerator
                              :label="$t('verbeterplein.showItem.fields.category')"
                              :placeholder="$t('verbeterplein.showItem.placeholders.no_category')"
                              :generate-function="generateNewCategory"
                              :save-function="saveCategory"
                              @update="handleCategoryUpdate"
                              :initial-value="item?.Category"
                            />
                          </div>
                        </v-col>
                      </v-row>

                      <!-- Obstacle Description -->
                      <div class="mt-6">
                        <div class="text-h5 mb-2">
                          {{ $t('verbeterplein.showItem.fields.obstacle') }}
                        </div>
                        <div
                          class="text-caption expandable-text"
                          @click="(e) => handleObstakelTextInteraction('click', e)"
                          @mouseenter="(e) => handleObstakelTextInteraction('hover', e)"
                          :style="{
                            maxHeight: isObstakelLong ? (showFullObstakelText ? 'none' : '100px') : 'none',
                            overflow: isObstakelLong ? 'hidden' : 'visible',
                            position: 'relative',
                            cursor: hasExpandedObstakelOnce ? 'pointer' : 'default'
                          }"
                        >
                          {{ item?.Obstakel || $t('verbeterplein.showItem.placeholders.no_obstacle') }}
                          <div v-if="isObstakelLong && !showFullObstakelText" class="gradient-overlay"></div>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <div class="d-flex justify-center align-center mt-8 mb-5">
                <img src="/header-bullet.svg" class="mr-2" />
                <h3>VERBETERINGEN</h3>
              </div>

              <v-row class="d-flex flex-row">
                <v-col cols="12" md="6" class="d-flex" v-if="item?.Correctief">
                  <v-card variant="outlined" class="card-hover-border bg-lightprimary flex-grow-1">
                    <v-card-text class="d-flex flex-column justify-space-between">
                      <div>
                        <div class="d-flex align-start">
                          <div class="d-flex align-center">
                            <v-icon class="mr-2" color="primary">mdi-flash</v-icon>
                            <h3>CORRECTIEF</h3>
                          </div>
                          <div class="ml-auto">
                            <v-btn size="medium" variant="text" @click="openCorrectiefEdit">
                              <v-icon>mdi-pencil</v-icon>
                            </v-btn>
                          </div>
                        </div>
                        <v-divider class="mt-4 mb-0" thickness="2"></v-divider>
                        <div class="d-flex align-center justify-space-between mt-3 mb-0">
                          <div class="d-flex flex-column">
                            <div class="text-h5 mt-5">
                              {{ $t('verbeterplein.showItem.fields.action_holder') }}
                            </div>
                            <div class="text-caption">
                              {{ item?.Correctief?.User?.Name || 'N/A' }}
                            </div>
                          </div>
                          <v-chip
                            v-if="item?.Correctief?.Status?.StatusNaam"
                            class="mt-0"
                            :color="item?.Correctief?.Status?.StatusColor ?? 'grey'"
                            dark
                            elevation="1"
                            density="comfortable"
                          >
                            <p :class="{ blacktext: !isDark, whitetext: isDark }">
                              {{ item?.Correctief?.Status?.StatusNaam }}
                            </p>
                          </v-chip>
                          <v-chip v-else color="grey" dark density="comfortable"> N/A </v-chip>
                        </div>

                        <div class="d-flex align-center justify-space-between mt-0 mb-4">
                          <div class="d-flex flex-column">
                            <div class="text-h5 mt-5">
                              {{ $t('verbeterplein.showItem.fields.deadline') }}
                            </div>
                            <div class="text-caption">
                              {{ item?.Correctief?.Deadline ? formatDate(item?.Correctief?.Deadline) : 'N/A' }}
                            </div>
                          </div>
                          <div class="d-flex flex-column">
                            <div class="text-h5 mt-5">
                              {{ $t('verbeterplein.showItem.fields.fail_costs') }}
                            </div>
                            <div class="text-caption">
                              {{
                                item?.Correctief?.Faalkosten === 0 || (item?.Correctief?.Faalkosten && item?.Correctief?.Faalkosten >= 0)
                                  ? `€ ${Number(item?.Correctief?.Faalkosten)}`
                                  : $t('verbeterplein.showItem.placeholders.na')
                              }}
                            </div>
                          </div>
                        </div>

                        <div class="d-flex align-center justify-space-between mt-0 mb-2">
                          <div class="text-h5 mt-1">
                            {{ $t('verbeterplein.showItem.fields.approval') }}
                          </div>
                          <v-switch
                            v-model="localAkoordOPS"
                            :label="
                              localAkoordOPS
                                ? $t('verbeterplein.showItem.fields.approval_yes')
                                : $t('verbeterplein.showItem.fields.approval_no')
                            "
                            color="success"
                            hide-details
                            @change="saveAkoord"
                          ></v-switch>
                        </div>
                      </div>

                      <!-- Solution Section -->
                      <div class="d-flex align-center justify-space-between mt-0 mb-2">
                        <div class="d-flex flex-column">
                          <div class="text-h5 mt-2">
                            {{ $t('verbeterplein.showItem.fields.solution') }}
                          </div>
                          <div
                            class="text-caption expandable-text"
                            @click="(e) => handleTextInteraction('click', e)"
                            @mouseenter="(e) => handleTextInteraction('hover', e)"
                            :style="{
                              maxHeight: isOplossingLong ? (showFullText ? 'none' : '100px') : 'none',
                              overflow: isOplossingLong ? 'hidden' : 'visible',
                              position: 'relative',
                              cursor: hasExpandedOnce ? 'pointer' : 'default'
                            }"
                          >
                            {{ item?.Correctief?.Oplossing || $t('verbeterplein.showItem.placeholders.no_solution') }}
                            <div v-if="isOplossingLong && !showFullText" class="gradient-overlay"></div>
                          </div>
                        </div>
                      </div>

                      <v-divider thickness="2" class="mt-4"></v-divider>

                      <TodoTable :item="item" :title="'Correctieve acties'" :id="item?.Correctief?.id" :type="'correctief'" />

                      <!-- Bijlagen section at the bottom -->
                      <div class="mt-auto">
                        <div class="d-flex align-center justify-space-between mb-4">
                          <div class="d-flex align-center">
                            <v-icon color="primary" size="24" class="mr-2">mdi-paperclip</v-icon>
                            <div class="text-h5">{{ $t('verbeterplein.showItem.fields.attachments') }}</div>
                          </div>
                          <v-btn
                            color="primary"
                            variant="tonal"
                            size="small"
                            prepend-icon="mdi-plus"
                            @click="openCorrespondenceDialog"
                            class="attachment-add-btn"
                          >
                            Bijlage toevoegen
                          </v-btn>
                        </div>

                        <!-- <v-divider class="mb-4"></v-divider> -->
                        <ShowFiles
                          :clickedItem="item"
                          :PDCA="false"
                          @openImageGallery="openImageGallery"
                          @update="$emit('update', [true, true])"
                        >
                        </ShowFiles>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" :md="item?.Correctief ? 6 : 8" class="d-flex" :class="{ 'mx-auto': !item?.Correctief }">
                  <v-card
                    variant="outlined"
                    class="card-hover-border flex-grow-1"
                    :class="{
                      'bg-simplePDCA': item?.Preventief?.rootCauseLevel === 1,
                      'bg-lightsecondary': item?.Preventief?.rootCauseLevel !== 1
                    }"
                  >
                    <v-card-text class="d-flex flex-column justify-space-between">
                      <div>
                        <div class="d-flex align-start">
                          <div class="d-flex align-center">
                            <v-icon class="mr-2" color="primary">mdi-shield</v-icon>
                            <h3>PREVENTIEF {{ item?.Preventief?.VolgNummer ? `- (${item?.Preventief?.VolgNummer})` : '' }}</h3>
                          </div>
                          <div v-if="item?.Preventief?.id" class="ml-auto">
                            <v-btn size="medium" variant="text" @click="openEditPdca">
                              <v-icon>mdi-pencil</v-icon>
                            </v-btn>
                          </div>
                        </div>
                        <v-divider class="mt-4 mb-0" thickness="2"></v-divider>
                        <section v-if="item?.Preventief?.id" class="d-flex flex-column">
                          <div class="d-flex align-center justify-space-between mt-3 mb-0">
                            <div class="d-flex flex-column">
                              <div class="text-h5 mt-5">
                                {{ $t('verbeterplein.showItem.fields.action_holder') }}
                              </div>
                              <div class="text-caption">
                                {{ item?.Preventief?.User?.Name || 'N/A' }}
                              </div>
                            </div>
                            <v-chip
                              v-if="item?.Preventief?.Status?.StatusNaam"
                              class="mt-0"
                              :color="item?.Preventief?.Status?.StatusColor ?? 'grey'"
                              dark
                              elevation="1"
                              density="comfortable"
                            >
                              <p :class="{ blacktext: !isDark, whitetext: isDark }">
                                {{ item?.Preventief?.Status?.StatusNaam }}
                              </p>
                            </v-chip>
                            <v-chip v-else color="grey" dark density="comfortable">N/A</v-chip>
                          </div>

                          <div class="d-flex align-center justify-space-between mt-0 mb-4">
                            <div class="d-flex flex-column">
                              <div class="text-h5 mt-5">
                                {{ $t('verbeterplein.showItem.fields.title') }}
                              </div>
                              <div class="text-caption">
                                {{ item?.Preventief?.Title || $t('verbeterplein.showItem.placeholders.na') }}
                              </div>
                            </div>
                          </div>

                          <div class="d-flex align-center justify-space-between mt-0 mb-4">
                            <div class="d-flex flex-column">
                              <div class="text-h5 mt-5">
                                {{ $t('verbeterplein.showItem.fields.deadline') }}
                              </div>
                              <div class="text-caption">
                                {{ item?.Preventief?.Deadline ? formatDate(item?.Preventief?.Deadline) : 'N/A' }}
                              </div>
                            </div>
                            <div class="d-flex flex-column" v-if="teamleden.length > 0">
                              <div class="text-h5 mt-5">
                                {{ $t('verbeterplein.showItem.fields.team_members') }}
                              </div>
                              <div class="text-caption">
                                <v-chip v-for="teamlid in teamleden" dark size="small" class="mr-1" primary>
                                  <span :class="{ blacktext: !isDark, whitetext: isDark }">{{
                                    teamlid?.Name ? teamlid?.Name : teamlid?.name || 'Error'
                                  }}</span>
                                </v-chip>
                              </div>
                            </div>
                          </div>

                          <div class="d-flex flex-column" v-if="item?.Preventief?.rootCauseLevel !== 1">
                            <div class="text-h5 mt-2">
                              {{ $t('verbeterplein.showItem.fields.cause') }}
                            </div>
                            <div class="text-caption">
                              {{ item?.Preventief?.Kernoorzaak || 'N/A' }}
                            </div>
                          </div>
                          <div class="d-flex flex-column mt-5" v-if="item?.Preventief?.rootCauseLevel !== 1">
                            <div class="text-h5">
                              {{ $t('verbeterplein.showItem.fields.linked_reports') }} ({{ connectedMeldingen.length }})
                            </div>
                            <div class="text-caption">
                              <v-chip
                                class="mr-1"
                                v-for="melding in connectedMeldingen"
                                color="primary"
                                link
                                @click="openItem(melding.VolgNummer, false)"
                              >
                                <span :class="{ blacktext: !isDark, whitetext: isDark }">{{ melding.VolgNummer }}</span>
                              </v-chip>
                            </div>
                          </div>

                          <v-divider thickness="2" class="mt-4"></v-divider>

                          <TodoTable
                            :item="item"
                            :title="'Preventieve acties'"
                            :id="item?.Preventief?.id"
                            :type="'preventief'"
                            @task-created="handlePreventiveTaskCreated"
                          />

                          <v-btn
                            v-if="item?.Preventief?.rootCauseLevel === 1"
                            color="secondary"
                            variant="tonal"
                            size="small"
                            prepend-icon="mdi-check"
                            @click="markPDAsDone"
                            class="mb-4"
                          >
                            Markeer PD klaar
                          </v-btn>

                          <v-divider thickness="2" class="mt-4"></v-divider>
                          <br />

                          <!-- Bijlagen section at the bottom -->
                          <div class="mt-auto">
                            <div class="d-flex align-center justify-space-between mb-4">
                              <div class="d-flex align-center">
                                <v-icon color="primary" size="24" class="mr-2">mdi-paperclip</v-icon>
                                <div class="text-h5">{{ $t('verbeterplein.showItem.fields.attachments') }}</div>
                              </div>
                              <v-btn
                                color="primary"
                                variant="tonal"
                                size="small"
                                prepend-icon="mdi-plus"
                                @click="openCorrespondenceDialogPDCA"
                                class="attachment-add-btn"
                              >
                                Bijlage toevoegen
                              </v-btn>
                            </div>
                            <ShowFiles
                              :clickedItem="item"
                              :PDCA="true"
                              @openImageGallery="openImageGallery"
                              @update="$emit('update', [true, true])"
                            >
                            </ShowFiles>
                          </div>
                        </section>
                        <div v-else>
                          <div class="empty-pdca-state">
                            <div class="empty-state-content">
                              <div class="icon-wrapper">
                                <v-icon size="64" color="primary">mdi-shield-outline</v-icon>
                              </div>
                              <h3>{{ $t('verbeterplein.showItem.preventief.empty_title') }}</h3>
                              <p class="text-body-1">
                                {{ $t('verbeterplein.showItem.preventief.empty_description') }}
                              </p>
                              <v-btn color="primary" @click="startPDCA" class="start-pdca-btn" elevation="2" prepend-icon="mdi-plus">
                                {{ $t('verbeterplein.showItem.actions.start_pdca') }}
                              </v-btn>
                            </div>
                            <!-- <div class="empty-state-checklist">
                              <div class="checklist-item" v-for="(item, index) in pdcaSteps" :key="index">
                                <v-icon size="20" color="primary" class="mr-3">mdi-checkbox-blank-circle-outline</v-icon>
                                <span class="text-body-2">{{ item }}</span>
                              </div>
                            </div> -->
                          </div>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              <v-card-actions>
                <v-btn
                  v-if="showQuestions"
                  :text="$t('verbeterplein.showItem.buttons.questions')"
                  variant="tonal"
                  color="secondary"
                  @click="openQuestions"
                ></v-btn>
              </v-card-actions>
            </div>
          </v-window-item>

          <v-window-item value="pdca">
            <div class="tab-content">
              <meldingPDCA />
            </div>
          </v-window-item>

          <v-window-item value="communicatie">
            <div class="tab-content chatWindow">
              <CommunicationTab />
            </div>
          </v-window-item>

          <v-window-item value="historie">
            <div class="tab-content">
              <HistoryTab :item="item" />
            </div>
          </v-window-item>
          <v-window-item value="engagement">
            <div class="tab-content">
              <EngagementTab :item="item" />
            </div>
          </v-window-item>
        </v-window>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { useTheme } from 'vuetify';
import { useI18n } from 'vue-i18n';
import Dialog from '@/components/verbeterplein/dialogs/dialog.vue';
import ShowFiles from '@/components/verbeterplein/uploadthing/showFiles.vue';
import CommunicationTab from '@/components/verbeterplein/tabs/CommunicationTab.vue';
import HistoryTab from '@/components/verbeterplein/tabs/HistoryTab.vue';
import EngagementTab from '@/components/verbeterplein/tabs/EngagementTab.vue';

import { formatDate, formatDateHistory } from '@/utils/helpers/dateHelpers';
import { useCorrectiefStore } from '@/stores/verbeterplein/correctief_store';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import { useActiehouderStore } from '@/stores/verbeterplein/actiehouder_store';
import { useTaskStore } from '@/stores/task_store';
import { titleCacheManager } from '@/utils/titleCache';
import { generateObstacleSummary, generateObstacleCategory } from '@/utils/obstacleAnalyzer';
import TodoTable from '@/components/common/TodoTable.vue';
import meldingPDCA from '@/components/verbeterplein/tabs/meldingPDCA.vue';
import AIGenerator from '@/components/shared/AIGenerator.vue';
import { useHistoryStore } from '@/stores/verbeterplein/history_store';
import { useChatStore } from '@/stores/verbeterplein/chatStore';
import { useRouter } from 'vue-router';
import { push } from 'notivue';
import { usePreventiefStore } from '@/stores/verbeterplein/preventief_store';
import { useStatusStore } from '@/stores/verbeterplein/status_store';
import { useEngagementStore } from '@/stores/verbeterplein/engagement_store';
import type { HeaderMode } from '@/components/verbeterplein/table/types/type';
import { hasPermission } from '@/utils/permission';

const theme = useTheme();
const correctiefStore = useCorrectiefStore();
const meldingStore = useMeldingStore();
const historyStore = useHistoryStore();
const engagementStore = useEngagementStore();
const notificationStore = useNotificationStore();
const chatStore = useChatStore();
const actiehouderStore = useActiehouderStore();
const taskStore = useTaskStore();
const preventiefStore = usePreventiefStore();
const statusStore = useStatusStore();
const { t } = useI18n();

const router = useRouter();
const showFullText = ref(false);
const hasExpandedOnce = ref(false);
const teamleden = computed(() => {
  if (!props.item?.Preventief?.Teamleden?.IDs) return [];
  return props.item.Preventief.Teamleden.IDs.map((teamlid: any) => actiehouderStore.getActiehouderById(teamlid));
});
const chatEnabled = ref(false);
const showFullObstakelText = ref(false);
const hasExpandedObstakelOnce = ref(false);
const activeTab = ref('melding');
const AkoordOPS = ref(false);
const localAkoordOPS = ref(false);
const dialogVisible = ref(false);
const isSavingTitle = ref(false);
const isSavingCategory = ref(false);
const generatedTitles = ref<string[]>([]);
const currentTitleIndex = ref(0);
const generatedCategories = ref<string[]>([]);
const currentCategoryIndex = ref(0);
const clonedItems = ref<any[]>([]);
const isObstakelLong = computed(() => {
  const text = props.item?.Obstakel || '';
  return text.length > 200;
});

const isOplossingLong = computed(() => {
  const text = props.item?.Correctief?.Oplossing || '';
  return text.length > 200;
});

const connectedMeldingen = computed(() => {
  if (!props.item?.Preventief?.Melding) return [];
  return props.item?.Preventief?.Melding;
});

const handleTextInteraction = (event: 'hover' | 'click', e?: Event) => {
  if (e) {
    e.stopPropagation();
  }
  if (!isOplossingLong.value) return;

  if (!hasExpandedOnce.value && event === 'hover') {
    showFullText.value = true;
    hasExpandedOnce.value = true;
  } else if (hasExpandedOnce.value && event === 'click') {
    showFullText.value = !showFullText.value;
  }
};

const handleObstakelTextInteraction = (event: 'hover' | 'click', e?: Event) => {
  if (e) {
    e.stopPropagation();
  }
  if (!isObstakelLong.value) return;

  if (!hasExpandedObstakelOnce.value && event === 'hover') {
    showFullObstakelText.value = true;
    hasExpandedObstakelOnce.value = true;
  } else if (hasExpandedObstakelOnce.value && event === 'click') {
    showFullObstakelText.value = !showFullObstakelText.value;
  }
};

const props = defineProps({
  modelValue: Boolean,
  item: {
    type: Object as () => Record<string, any>,
    default: () => ({})
  },
  showCorrespondence: {
    type: Boolean,
    default: false
  },
  showQuestions: {
    type: Boolean,
    default: false
  },
  showEdit: {
    type: Boolean,
    default: false
  },
  showOps: {
    type: Boolean,
    default: false
  },
  showPdca: {
    type: Boolean,
    default: false
  },
  showCorrectiefCorrespondence: {
    type: Boolean,
    default: false
  },
  showPreventiefCorrespondence: {
    type: Boolean,
    default: false
  },
  showPreventief: {
    type: Boolean,
    default: true
  },
  showCorrectiefEdit: {
    type: Boolean,
    default: false
  },
  initialTab: {
    type: String,
    default: 'melding'
  },
  openedFromMode: {
    type: String as () => HeaderMode,
    required: false
  }
});

const isDark = computed(() => theme.global.current.value.dark);

const updateFields = () => {
  const meldingId = props.item?.id || '';
  const cachedTitles = titleCacheManager.getCachedTitles(meldingId) || [];
  const cachedCategories = titleCacheManager.getCachedCategories(meldingId) || [];
  generatedTitles.value = cachedTitles;
  currentTitleIndex.value = Math.max(0, cachedTitles.length - 1);

  generatedCategories.value = cachedCategories;
  currentCategoryIndex.value = Math.max(0, cachedCategories.length - 1);
};

const markPDAsDone = async () => {
  // Ensure status store is initialized if not already
  if (!statusStore.initialized) {
    await statusStore.initializeData();
  }

  const afgerondStatus = statusStore.getStatusByName('Afgerond');
  const preventiefId = props.item?.Preventief?.id;

  if (!preventiefId) {
    console.warn('Preventief ID not found when trying to mark PD as done.');
    return;
  }

  if (!afgerondStatus?.id) {
    console.warn('Status "Afgerond" not found.');
    return;
  }

  console.log(`Attempting to set status for Preventief ${preventiefId} to "Afgerond" (${afgerondStatus.id})`);

  try {
    const updateResult = await preventiefStore.updatePreventief(preventiefId, { StatusID: afgerondStatus.id });

    if (updateResult?.status === 200) {
      console.log(`Successfully updated status for Preventief ${preventiefId} to Afgerond`);
      emit('update', [true, true]);
      // Optionally add a success notification here using push
      // push.success({ message: 'Preventieve status bijgewerkt naar "Afgerond".' });
    } else {
      console.error('Failed to update preventief status to Afgerond:', updateResult);
      // Optionally add an error notification here using push
      // push.error({ message: t('errors.save_error', { error: 'status update failed' }) });
    }
  } catch (error) {
    console.error('Error updating preventief status to Afgerond:', error);
    // Optionally add an error notification here using push
    // push.error({ message: t('errors.save_error', { error: error }) });
  }
};

const generateNewTitle = async (text: string) => {
  return await generateObstacleSummary(text || 'No obstacle description provided');
};

const handleTitleUpdate = async (newTitle: string) => {
  if (props.item?.id) {
    await saveTitle(newTitle);
  }
};

const handleCategoryUpdate = async (newCategory: string) => {
  if (props.item?.id) {
    await saveCategory(newCategory);
  }
};

const hasChanges = ref(false);

const saveTitle = async (title: string) => {
  notificationStore.promise({
    message: t('notifications.saving_title')
  });
  try {
    isSavingTitle.value = true;
    if (props.item?.id) {
      await meldingStore.updateReport(props.item.id, { Title: title });
      hasChanges.value = true;
      notificationStore.resolvePromise({ message: t('notifications.title_saved') });
    }
  } catch (error: any) {
    notificationStore.rejectPromise({
      message: t('errors.title_error', { error: error })
    });
  } finally {
    isSavingTitle.value = false;
  }
};

const saveCategory = async (category: string) => {
  notificationStore.promise({
    message: t('notifications.saving_category')
  });
  try {
    isSavingCategory.value = true;
    if (props.item?.id) {
      await meldingStore.updateReport(props.item.id, { Category: category });
      hasChanges.value = true;
      notificationStore.resolvePromise({ message: t('notifications.category_saved') });
    }
  } catch (error: any) {
    notificationStore.rejectPromise({
      message: t('errors.category_error', { error: error })
    });
  } finally {
    isSavingCategory.value = false;
  }
};

const generateClonedItems = () => {
  if (!props.item?.CloneIds?.IDs) return;

  clonedItems.value = meldingStore.reports
    .filter((report: any) => props.item?.CloneIds?.IDs.includes(report.id))
    .map((report: any) => report.VolgNummer);
};

// Update tab mapping to map from URL to component values
const tabMapping = {
  melding: 'melding',
  chat: 'communicatie',
  pdca: 'pdca',
  history: 'historie',
  engagement: 'engagement'
} as const;

// Add type for valid tab values
type ValidTab = 'melding' | 'communicatie' | 'pdca' | 'historie' | 'engagement';

// Update the watch for dialog visibility
watch(
  () => props.modelValue,
  async (newVal: boolean) => {
    dialogVisible.value = newVal;
    if (newVal) {
      const tab = props.initialTab?.toLowerCase();
      if (tab === 'pdca') {
        // If rootcauselvel is 2 = PDCA, PD = level 1. However, due to legacy data, we need to check for null and undefined as well since they will be that.
        if (
          props.item?.Preventief?.rootCauseLevel !== 2 &&
          props.item?.Preventief?.rootCauseLevel !== null &&
          props.item?.Preventief?.rootCauseLevel !== undefined
        ) {
          activeTab.value = 'melding';
          push.error({
            message: t('errors.no_pdca_available')
          });
          return;
        }
        if (!props.item?.PDCA || !props.item?.Preventief?.id) {
          activeTab.value = 'melding';
          push.error({
            message: t('errors.no_pdca_available')
          });
          return;
        }
      }

      if (tab === 'engagement' && !props.item?.id) {
        activeTab.value = 'melding';
        push.error({
          message: t('errors.no_engagement_available')
        });
        return;
      }
      if (tab === 'historie' && (!props.item?.id || !historyStore.currentHistory.length)) {
        activeTab.value = 'melding';
        push.error({
          message: t('errors.no_history_available')
        });
        return;
      }

      if (tab && tabMapping[tab as keyof typeof tabMapping]) {
        activeTab.value = tabMapping[tab as keyof typeof tabMapping] as ValidTab;
      } else {
        activeTab.value = 'melding';
      }
      showFullText.value = false;
      showFullObstakelText.value = false;
      hasExpandedOnce.value = false;
      hasExpandedObstakelOnce.value = false;

      // Initialize tasks when dialog opens
      if (props.item?.Correctief?.id) {
        await taskStore.fetchTasksByCorrectief(props.item.Correctief.id);
      }
    }
  },
  { immediate: true, deep: true }
);

// Modify the watch for item changes
watch(
  () => props.item,
  async (newVal, oldVal) => {
    if (newVal?.id !== oldVal?.id) {
      chatStore.resetState(); // Reset chat store when melding changes
    }
    if (newVal) {
      generateClonedItems();
      updateFields();
      if (!newVal?.Correctief) {
        AkoordOPS.value = false;
      } else {
        AkoordOPS.value = newVal.Correctief.AkoordOPS;
        if (newVal?.Correctief?.id) {
          await taskStore.fetchTasksByCorrectief(newVal.Correctief.id);
        }

        if (newVal?.Preventief?.id) {
          await taskStore.fetchTasksByPreventief(newVal.Preventief.id);
        }
      }
      // Fetch history and engagement data if the item ID is valid
      if (newVal?.id) {
        // Check if fetch is needed (either ID changed or stores haven't been populated for this ID yet)
        const needsHistoryFetch = newVal.id !== oldVal?.id || historyStore.currentHistory.length === 0; // Basic check, might need refinement
        const needsEngagementFetch = newVal.id !== engagementStore.currentMeldingId; // Use store's tracking

        const fetchPromises = [];
        if (needsHistoryFetch) {
          fetchPromises.push(historyStore.getHistory(newVal.id, newVal?.Preventief?.id, newVal?.Correctief?.id));
        }
        if (needsEngagementFetch) {
          fetchPromises.push(engagementStore.fetchAnalyticsData(newVal.id, newVal?.Preventief?.id, newVal?.Correctief?.id));
        }

        if (fetchPromises.length > 0) {
          await Promise.all(fetchPromises);
        }
      } else if (!newVal?.id && oldVal?.id) {
        // Only reset if the item becomes invalid
        // If the item becomes invalid/null, reset stores
        historyStore.currentHistory = [];
        engagementStore.resetState();
      }
    } else {
      updateFields(); // Ensure fields are updated if item becomes null/undefined initially
      historyStore.currentHistory = []; // Reset stores if the initial item is invalid
      engagementStore.resetState();
    }
  },
  { immediate: true }
);

// Watch for AkoordOPS changes
watch(
  () => props.item?.Correctief?.AkoordOPS,
  (newVal) => {
    if (typeof newVal === 'boolean' && localAkoordOPS.value !== newVal) {
      localAkoordOPS.value = newVal;
    }
  },
  { immediate: true }
);

const handleDialogVisibility = (value: boolean) => {
  chatEnabled.value = false;
  if (!value) {
    // Reset states when dialog closes
    showFullText.value = false;
    showFullObstakelText.value = false;
    hasExpandedOnce.value = false;
    hasExpandedObstakelOnce.value = false;
    chatStore.resetState(); // Reset chat store when dialog closes

    // If changes were made, force an update when closing
    if (hasChanges.value) {
      emit('update', [true, true]);
      hasChanges.value = false;
    }
  }
  dialogVisible.value = value;
  emit('update:modelValue', value);
};

const openCorrespondenceDialog = () => {
  emit('open:correspondence');
};

const openCorrespondenceDialogPDCA = () => {
  emit('open:correspondence:pdca');
};

const openQuestions = () => {
  emit('open:questions');
};

const editItem = () => {
  emit('open:edit');
};

const openEditObstakel = () => {
  emit('open:openEditObstakel');
};

const openEditPdca = () => {
  emit('open:editPdca');
};

const openImageGallery = (index: number, files: any[]) => {
  emit('open:imageGallery', [index, files]);
};

const openCorrectiefEdit = () => {
  emit('open:correctiefEdit');
};

const openItem = async (id: string, isCloned: boolean = false) => {
  // First emit the model update to close the dialog
  emit('update:modelValue', false);

  // Small delay to ensure dialog closing is processed
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (isCloned) {
    emit('open:item', id);
  } else {
    // Get the report by VolgNummer
    const report = meldingStore.getReportByVolgNummer(id);
    if (report) {
      // Set the selected form before navigation
      meldingStore.setSelectedFormId(report.id);
      meldingStore.setSelectedForm(report);

      // Close current dialog and wait for it to close
      dialogVisible.value = false;
      await nextTick();

      // Navigate to the new melding
      await router.push({
        path: `/verbeterplein/melding/${id}`,
        replace: true
      });
    } else {
      push.error({
        message: t('errors.report_not_found', { volgnummer: id })
      });
    }
  }
};

const saveAkoord = async () => {
  notificationStore.promise({
    message: t('notifications.saving_ops')
  });

  if (props.item?.Correctief?.id) {
    try {
      const newValue = localAkoordOPS.value;

      if (!newValue || props.item?.Correctief?.Faalkosten >= 0) {
        const response = await correctiefStore.updateCorrectief(props.item.Correctief.id, { AkoordOPS: newValue });

        if (response?.status === 200) {
          localAkoordOPS.value = newValue;
          await Promise.all([meldingStore.fetchReports(true), correctiefStore.fetchCorrectief()]);
          emit('update', [true, true]);
          notificationStore.resolvePromise({ message: t('notifications.ops_saved') });
        } else {
          localAkoordOPS.value = !newValue;
          notificationStore.rejectPromise({ message: t('errors.save_failed') });
        }
      } else {
        localAkoordOPS.value = false;
        notificationStore.rejectPromise({
          message: t('errors.correctief_error_faalkosten')
        });
      }
    } catch (error) {
      localAkoordOPS.value = !localAkoordOPS.value;
      notificationStore.rejectPromise({ message: t('errors.save_failed') });
    }
  } else {
    localAkoordOPS.value = false;
    notificationStore.rejectPromise({ message: t('errors.correctief_not_found') });
  }
};

const startPDCA = () => {
  emit('open:pdca');
};

const generateNewCategory = async () => {
  return await generateObstacleCategory(props.item?.Obstakel || 'No obstacle description provided');
};

// Add method to get shareable URL
const getShareableUrl = () => {
  if (props.item?.VolgNummer) {
    return `/verbeterplein/melding/${props.item.VolgNummer}`;
  }
  return null;
};

const copyToClipboard = async () => {
  const url = getShareableUrl();
  if (!url) return;

  try {
    await navigator.clipboard.writeText(window.location.origin + url);
    notificationStore.info({
      message: t('notifications.copied_to_clipboard')
    });
  } catch (err: any) {
    notificationStore.error({
      message: t('errors.copy_failed')
    });
  }
};

watch(
  () => activeTab.value,
  (newVal) => {
    if (newVal === 'pdca' && props.item?.Preventief?.rootCauseLevel !== 2 && props.item?.PDCA === false) {
      activeTab.value = 'melding';
      push.error({
        message: t('errors.no_pdca_available')
      });
      return;
    }

    // Handle chat tab initialization
    if (newVal === 'communicatie' && props.item?.id) {
      meldingStore.selectedFormId = props.item.id;
      const melding = meldingStore.getReportById(props.item.id);
      if (melding?.ChatRoom?.id) {
        chatStore.setCurrentChatRoom(melding.ChatRoom.id);
        chatStore.fetchMessages();
      }
    }

    // Prevent non-admins from accessing engagement tab
    if (newVal === 'engagement' && !canViewEngagementTab.value) {
      activeTab.value = 'melding';
      push.error({
        message: t('errors.no_engagement_available')
      });
    }
  }
);

const handlePreventiveTaskCreated = async () => {
  // Ensure status store is initialized if not already
  if (!statusStore.initialized) {
    await statusStore.initializeData();
  }

  const inBehandelingStatus = statusStore.getStatusByName('In behandeling');
  const openStatus = statusStore.getStatusByName('Open'); // Get 'Open' status
  const preventiefId = props.item?.Preventief?.id;

  if (!preventiefId) {
    console.warn('Preventief ID not found when trying to update status.');
    return;
  }

  if (!inBehandelingStatus?.id) {
    console.warn('Status "In behandeling" not found.');
    return;
  }

  // Only proceed if current status is 'Open'
  if (!openStatus || props.item?.Preventief?.StatusID !== openStatus.id) {
    console.log(
      `[handlePreventiveTaskCreated] Skipping status update. Current status ID: ${props.item?.Preventief?.StatusID} is not 'Open' (${openStatus?.id})`
    );
    return;
  }

  console.log(
    `[handlePreventiveTaskCreated] Current Status is 'Open'. Updating Preventief ${preventiefId} status to 'In behandeling' (${inBehandelingStatus.id}).`
  );

  try {
    const updateResult = await preventiefStore.updatePreventief(preventiefId, { StatusID: inBehandelingStatus.id });

    if (updateResult?.status === 200) {
      emit('update', [true, true]);
    } else {
      console.error('Failed to update preventief status:', updateResult);
    }
  } catch (error) {
    console.error('Error updating preventief status:', error);
  }
};

const emit = defineEmits([
  'update:modelValue',
  'update',
  'open:correctiefEdit',
  'open:correspondence',
  'open:correspondence:pdca',
  'open:pdca',
  'open:openEditObstakel',
  'open:editPdca',
  'open:imageGallery',
  'open:item',
  'open:questions',
  'open:edit',
  'open:newAction',
  'open:editAction'
]);

const canViewEngagementTab = computed(() => hasPermission([{ action: 'MANAGE', resourceType: 'ALL' }]));
</script>

<style scoped lang="scss" src="./meldingItem.scss"></style>
