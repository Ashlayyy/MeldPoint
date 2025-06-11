import { defineStore } from 'pinia';
import { GetTeamMembers } from '@/API/team';

interface TeamState {
  teamMeldingIds: string[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
}

export const useTeamStore = defineStore('team', {
  state: (): TeamState => ({
    teamMeldingIds: [],
    loading: false,
    error: null,
    currentUserId: null
  }),

  actions: {
    async fetchTeamMembers(userId: string) {
      this.loading = true;
      this.currentUserId = userId;
      try {
        const response = await GetTeamMembers(userId);
        this.teamMeldingIds = response.data.map((melding: any) => melding.id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'An error occurred';
        this.teamMeldingIds = [];
      } finally {
        this.loading = false;
      }
    },

    isMeldingInTeam(meldingId: string): boolean {
      return this.teamMeldingIds.includes(meldingId);
    },

    clearTeam() {
      this.teamMeldingIds = [];
      this.currentUserId = null;
      this.error = null;
    }
  },
}); 