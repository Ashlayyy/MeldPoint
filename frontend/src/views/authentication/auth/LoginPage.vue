<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import Logo from '@/layouts/full/logo/LogoDark.vue';
import AuthLogin from '../authForms/AuthLogin.vue';
import PersistentAlert from '@/components/shared/PersistentAlert.vue';
import { GetVersion } from '@/API/changelog';

const backgrounds = ref<string[]>([]);

const imageArray = [
  '20190215-094531_2_1.jpg',
  'header_5_2_1.jpg',
  'Duindoornflat_Groningen-0137_VMRG_2_1.jpg',
  'intal-11okt23-9777-kopie_2_1.jpg',
  'Horizon_Purmerend_Header_2_1.jpg',
  'intal-290621-3275_2_1.jpg',
  'Intal_Xavier-0102_2_1.jpg',
  'intal-biomass-5276_2_1.jpg',
  'SP2015-JT-Hilversum-19-HiRes_2_1.JPG',
  'intal-clusius-nb-5945-kopieren-6_2_1.jpg',
  'SP2015-Wehkamp-2-HiRes_2_1.JPG',
  'intal-oceaanhuis-3929_2_1.jpg',
  'SP2016-AZ-HEADER_2_1.JPG',
  'intal-westbeat-9496-kopieren_2_1.jpg',
  'Windes-2557_2_1.jpg',
  'lc-packaging-waddinxveen-5212_2_1.jpg',
  'Zuidplas-2567_2_1.jpg',
  'leperron-8251_2_1.jpg',
  'blaak16-2829_2_1.jpg',
  'nd6-1834-kopieren-2_2_1.jpg',
  'david-hart-header_2_1.jpg',
  'nieuweroord-leiden-2512-kopieren_2_1.jpg',
  'dji-0065-kopieren-2_2_1.jpg',
  'sp2016-dc6-eindhoven-9-hires_2_1.jpg',
  'dji-0285-kopie_2_1.jpg',
  'sp2017-delft-studentenwoningen-1-hires_2_1.jpg',
  'dsc-1280-kopieren_2_1.jpg',
  'spaarnelicht-3788-kopieren_2_1.jpg',
  'gerrit-rietveld-college-header_2_1.jpg',
  'stadhouders-8226_2_1.jpg',
  'harbourfenster-3006-kopieren-1_2_1.jpg',
  'uniantiek-header_2_1.jpg',
  'header_3_2_1.jpg',
  'yotel-header_2_1.jpg',
  'header_4_2_1.jpg'
];

const backgroundImages = imageArray.map((image) => `/backgrounds-intal/${image}`);

const getRandomItems = (arr: string[], count: number) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

backgrounds.value = getRandomItems(backgroundImages, 5);

const appVersion = ref<string | null>(null);
const versionLoading = ref<boolean>(true);
const versionError = ref<string | null>(null);

onMounted(async () => {
  versionLoading.value = true;
  try {
    appVersion.value = await GetVersion();
  } catch (err: any) {
    console.error('Failed to load app version:', err);
    versionError.value = err.message || 'Could not load version';
    appVersion.value = 'N/A';
  } finally {
    versionLoading.value = false;
  }
});
</script>

<template>
  <v-row class="h-100vh" no-gutters>
    <!---Left Part-->
    <v-col cols="12" lg="7" xl="7" class="d-flex align-center position-relative login-bg">
      <v-container>
        <PersistentAlert
          id="app-announcement"
          title="Verbeterplein v1.3 is gelanceerd 🎉"
          text="Features: Changelog pagina en nog veel meer! Bedankt voor jullie feedback!💪"
          type="info"
          localstorageKey="announcement-new-version"
        />
        <div class="pa-0 pa-sm-12">
          <v-row justify="center">
            <v-col cols="12" lg="10" xl="6" md="7">
              <v-card elevation="0" class="loginBox">
                <v-card variant="elevated" class="login-card" elevation="4">
                  <div class="card-accent"></div>
                  <v-card-text class="pa-9">
                    <!---Logo Row-->
                    <v-row class="mt-3">
                      <v-col cols="12" class="text-center">
                        <Logo class="login-logo" />
                      </v-col>
                    </v-row>

                    <!---Welcome Text-->
                    <v-row class="mb-6">
                      <v-col cols="12" class="text-center">
                        <h2 class="welcome-text text-h3 font-weight-bold mb-2">Hi, Intalist</h2>
                        <h4 class="text-subtitle-1 text-medium-emphasis">Login met je Intal-account</h4>
                      </v-col>
                    </v-row>

                    <!---Login Form-->
                    <AuthLogin class="login-form" />

                    <!---Version Info-->
                    <div class="version-info">
                      <span v-if="versionLoading">Loading...</span>
                      <span v-else-if="versionError">Error happened</span>
                      <span v-else-if="appVersion">v{{ appVersion }}</span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </v-col>
    <!---Left Part-->
    <!---Right Part-->
    <v-col cols="12" lg="5" xl="5" class="d-none d-lg-flex position-relative p-0">
      <v-carousel cycle hide-delimiter-background show-arrows="hover" class="background-carousel" height="100vh">
        <v-carousel-item v-for="(bg, i) in backgrounds" :key="i">
          <div class="background-image" :style="{ backgroundImage: `url(${bg})` }"></div>
        </v-carousel-item>
      </v-carousel>
    </v-col>
    <!---Right Part-->
  </v-row>
</template>

<style lang="scss">
.login-bg {
  background-color: rgb(var(--v-theme-gray100));
  // background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.loginBox {
  max-width: 475px;
  margin: 0 auto;
  background: transparent;

  .login-card {
    border-radius: 14px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.98);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 0 1px rgba(var(--v-theme-secondary), 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    position: relative;

    .card-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 10px;
      // background: linear-gradient(90deg,
      //   rgb(var(--v-theme-primary)) 0%,
      //   rgb(var(--v-theme-secondary)) 100%
      // );
      opacity: 0.9;
    }

    &:hover {
      transform: translateY(-2px) scale(1.01);
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04),
        0 0 0 1px rgba(var(--v-theme-secondary), 0.08);
    }

    .v-card-text {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      padding-top: 2.5rem !important;
    }
  }

  .login-logo {
    transform: scale(1.1);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05));

    &:hover {
      transform: scale(1.15);
    }
  }

  .welcome-text {
    color: rgb(var(--v-theme-secondary));
    font-weight: 700;
    font-size: 2rem;
    letter-spacing: -0.5px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
    display: inline-block;

    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 3px;
      // background: linear-gradient(90deg,
      //   rgb(var(--v-theme-primary)) 0%,
      //   rgb(var(--v-theme-secondary)) 100%
      // );
      border-radius: 2px;
      opacity: 0.7;
    }
  }

  .text-medium-emphasis {
    opacity: 0.75;
    font-size: 1.1rem;
    margin-top: 1rem;
  }

  .login-form {
    position: relative;
    padding: 2rem;
    background: rgba(var(--v-theme-secondary), 0.02);
    border-radius: 16px;
    border: 1px solid rgba(var(--v-theme-secondary), 0.08);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(var(--v-theme-secondary), 0.03);
      border-color: rgba(var(--v-theme-secondary), 0.12);
    }

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 16px;
      padding: 2px;
      background: linear-gradient(45deg, rgba(var(--v-theme-primary), 0.2), rgba(var(--v-theme-secondary), 0.2));
      mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: 0.5;
      transition: opacity 0.3s ease;
    }

    &:hover::before {
      opacity: 0.8;
    }
  }

  .version-info {
    position: absolute;
    bottom: 1rem;
    right: 1.5rem;
    font-size: 0.75rem;
    color: rgba(var(--v-theme-secondary), 0.4);
    font-weight: 500;
  }
}

.heightCalc {
  height: calc(100vh - 150px);
}

.background-carousel {
  height: 100vh;
  width: 100%;
  // border-left: 3px solid rgba(var(--v-theme-secondary));

  .background-image {
    height: 100vh;
    width: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
}

.v-carousel__controls {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
  padding: 16px 0;

  .v-btn {
    opacity: 0.6;
    transition: all 0.3s ease;

    &--active {
      opacity: 1;
      transform: scale(1.2);
    }

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
