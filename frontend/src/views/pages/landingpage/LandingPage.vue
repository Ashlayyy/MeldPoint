<script setup lang="ts">
import Appbar from "./Components/AppBarMenu.vue";
import HomeBanner from "./Components/HomeBanner.vue";
import Footer from "./Components/FooterSection.vue";
import "aos/dist/aos.css";
import { onMounted } from "vue";
import AOS from "aos";

onMounted(() => {
  AOS.init();
});
</script>

<template>
  <v-layout>
    <Appbar />
    <v-main class="ma-0">
      <v-container class="maxWidth">
        <HomeBanner />
      </v-container>
      <Footer />
    </v-main>
  </v-layout>
</template>
