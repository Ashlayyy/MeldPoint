<script setup lang="ts">
import Logo from '@/layouts/full/logo/LogoMain.vue';
</script>

<template>
  <v-row class="bg-secondary">
    <v-col cols="12">
      <v-container class="maxWidth">
        <v-row class="align-center text-center text-md-left">
          <v-col md="6" cols="12" class="my-3">
            <Logo />
          </v-col>
          <v-col md="6" cols="12" class="text-center text-md-right">
            <ul class="d-flex justify-center justify-md-end gap-4 customlink align-center">
              <li>
                <a href="https://www.instagram.com/intal_aluminium/" target="_blank"
                  ><v-icon class="mr-2">mdi-instagram</v-icon>Instagram</a
                >
              </li>
              <li>
                <a href="https://www.facebook.com/Intal-BV-140215039483018/" target="_blank"
                  ><v-icon class="mr-2">mdi-facebook</v-icon>Facebook</a
                >
              </li>
              <li>
                <a href="https://www.linkedin.com/company/intal-bv" target="_blank"><v-icon class="mr-2">mdi-linkedin</v-icon>LinkedIn</a>
              </li>
              <li>
                <a href="https://www.youtube.com/channel/UChb4sjtBY4tvfS7GEYNcJ5Q" target="_blank"
                  ><v-icon class="mr-2">mdi-youtube</v-icon>Youtube</a
                >
              </li>
            </ul>
          </v-col>
        </v-row>
      </v-container>
    </v-col>
    <v-col cols="12" class="bg-dark">
      <v-container class="maxWidth"><small> © Intal Proces Development and Innovation </small></v-container></v-col
    >
  </v-row>
</template>
<style lang="scss">
.customlink {
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    list-style: none;
    a {
      text-decoration: none;
      color: white;
      opacity: 0.7;
      &:hover {
        opacity: 1;
      }
    }
  }
}
.bg-dark {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
