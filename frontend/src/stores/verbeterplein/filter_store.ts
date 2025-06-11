import { defineStore } from 'pinia';

interface FilterState {
  expandedPanel: boolean;
  loginFilterActive: boolean;
  voorMijFilterActive: boolean;
  filters: {
    project: any | null;
    projectNaam: string | null;
    volgNummer: string | null;
    deelorder: any | null;
    actiehouderCorrectief: any | null;
    actiehouderPreventief: any | null;
    projectleider: any | null;
    statusCorrectief: any | null;
    statusPreventief: any | null;
    akoord: any | null;
    title: any | null;
    PDCA_status: any | null;
    department: any | null;
    filterMode: 'AND' | 'OR' | null;
  };
}

export const useFilterStore = defineStore('filter', {
  state: (): FilterState => ({
    expandedPanel: false,
    loginFilterActive: false,
    voorMijFilterActive: false,
    filters: {
      project: null,
      projectNaam: null,
      volgNummer: null,
      deelorder: null,
      actiehouderCorrectief: null,
      actiehouderPreventief: null,
      projectleider: null,
      statusCorrectief: null,
      statusPreventief: null,
      akoord: null,
      title: null,
      PDCA_status: null,
      department: null,
      filterMode: 'OR'
    }
  }),

  actions: {
    setFilters(filters: FilterState['filters']) {
      this.filters = filters;
    },
    clearFilters() {
      this.filters = {
        project: null,
        projectNaam: null,
        volgNummer: null,
        deelorder: null,
        actiehouderCorrectief: null,
        actiehouderPreventief: null,
        projectleider: null,
        statusCorrectief: null,
        statusPreventief: null,
        akoord: null,
        title: null,
        PDCA_status: null,
        department: null,
        filterMode: 'OR'
      };
    },
    togglePanel(value: boolean) {
      this.expandedPanel = value;
    },
    applyFilterLogin(actiehouder: any, projectleider: any) {
      if (actiehouder && this.voorMijFilterActive) {
        this.filters.actiehouderCorrectief = actiehouder;
        this.filters.actiehouderPreventief = actiehouder;
        this.filters.filterMode = 'OR';
      }
      if (projectleider && this.voorMijFilterActive) {
        this.filters.projectleider = projectleider;
        // this.filters.filterMode = 'AND';
        this.filters.filterMode = 'OR';
      }
    }
  },

  persist: true
});
