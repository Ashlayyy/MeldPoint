import { defineStore } from 'pinia';

export const useCreateMeldingStore = defineStore('createMelding', {
  state: () =>
    <any>{
      obstakel: null,
      project: <any>{},
      rawproject: <any>{},
      correctief: <any>{},
      bijlagen: <any>[],
      projectleider: <any>null,
      correctiefSkipped: false
    },

  actions: {
    clear() {
      this.obstakel = null;
      this.project = <any>{};
      this.rawproject = <any>{};
      this.correctief = <any>{};
      this.bijlagen = <any>[];
      this.projectleider = <any>null;
      this.correctiefSkipped = false;
    }
  }
});
