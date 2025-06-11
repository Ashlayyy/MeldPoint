<script setup lang="ts">
// assets
import dashboard from '@/assets/images/landing/dashboard.png';
import widget2 from '@/assets/images/landing/widget-2.png';
</script>

<template>
  <v-row class="spacer bg-background">
    <v-col cols="12" lg="4" md="5">
      <div class="pr-lg-4">
        <h1 class="bannerText my-5 secondary" data-aos="fade-up" data-aos-duration="500">
          <span class="text-secondary">FEEL </span>
          <span class="text-primary">CONNECTED</span>
        </h1>
        <div data-aos="fade-up" data-aos-duration="1000">
          <v-btn color="secondary" size="large" class="mr-2" to="/dashboard/default">Intalligence</v-btn>
        </div>
      </div>
    </v-col>
    <v-col cols="12" lg="8" md="7" class="d-none d-md-block">
      <div class="position-relative">
        <img :src="dashboard" alt="dashboard" class="HeaderImage" />
      </div>
    </v-col>
  </v-row>
  <div class="spacer bg-background"></div>
</template>
<style lang="scss">
.bannerText {
  font-family: 'Futura', sans-serif;
  font-size: 4rem;
}
.HeaderImage {
  max-width: 100%;
  border-radius: 20px;
  transform: scale(1.5);
  transform-origin: 0 25%;
}
.widget1 {
  position: absolute;
  top: -40px;
  right: -170px;
  width: 290px;
  animation: 10s slideY linear infinite;
}
.widgetImages {
  max-width: 100%;
  filter: drop-shadow(0px 0px 50px rgb(33 150 243 / 30%));
}
@media (max-width: 800px) {
  .bannerText {
    font-size: 2rem;
  }
}
.spacer {
  width: 100%;
  min-height: 10vh;
}
</style>
