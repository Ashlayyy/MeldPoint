<template>
  <div class="customHeight">
    <!-- Header -->
    <div class="d-sm-flex align-center gap-3 pa-4">
      <div class="d-flex gap-2 align-center">
        <v-avatar>
          <v-icon size="24">mdi-account</v-icon>
        </v-avatar>
        <div>
          <h5 class="text-h5 mb-n1">{{ $t('verbeterplein.dialog.chat') }}</h5>
        </div>
      </div>
    </div>
    <v-divider />

    <!-- Chat Messages -->
    <div class="chat-messages pa-5" ref="chatContainer">
      <div class="wrapper" v-for="(message, index) in messages" :key="message.id">
        <!-- Date Divider -->
        <div
          class="text-center my-4"
          v-if="
            index === 0 ||
            new Date(messages[messages.length > 1 ? index - 1 : index].createdAt).toLocaleDateString() !==
              new Date(message.createdAt).toLocaleDateString()
          "
        >
          <v-chip size="small" class="text-medium-emphasis">
            {{ new Date(message.createdAt).toLocaleDateString() }}
          </v-chip>
        </div>

        <!-- Message -->
        <div class="d-flex" :class="{ 'justify-end': message?.user.id === authStore.user.id || false }">
          <v-sheet
            class="rounded-md pa-3 mb-1"
            :class="message?.user.id === authStore.user.id || false ? 'bg-lightprimary' : 'bg-lightsecondary'"
            max-width="80%"
          >
            <div class="d-flex align-center gap-2 mb-1">
              <span class="font-weight-medium">{{ message?.user.Name }}</span>
            </div>
            <p class="text-body-1 message-content">{{ message?.content }}</p>
            <small class="text-medium-emphasis">{{ new Date(message?.createdAt).toLocaleTimeString() }}</small>
          </v-sheet>
        </div>
      </div>
    </div>

    <!-- Chat Input -->
    <div class="chat-input pa-4 bg-surface">
      <v-textarea
        v-model="message"
        rows="3"
        no-resize
        hide-details
        density="comfortable"
        variant="outlined"
        placeholder="Type your message here..."
        class="mb-2"
        @keydown="handleKeyDown"
      >
        <template v-slot:append>
          <v-btn color="primary" icon variant="text" @click="checkMessage" :disabled="!message">
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </template>
      </v-textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useMeldingStore } from '@/stores/verbeterplein/melding_store';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/verbeterplein/chatStore';

const meldingStore = useMeldingStore();
const chatStore = useChatStore();
const authStore = useAuthStore();
const messages = ref<any[]>([]);
const message = ref('');
const loading = ref(false);

const chatContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const checkMessage = async () => {
  if (!message.value?.trim() || loading.value) return;

  loading.value = true;
  const messageContent = message.value;
  message.value = '';

  try {
    const melding = meldingStore.getReportById(meldingStore.selectedFormId);
    
    // Set the chatroom ID if it exists
    if (melding?.ChatRoomID) {
      chatStore.setCurrentChatRoom(melding.ChatRoomID);
    }

    // Send the message
    await chatStore.sendMessage(messageContent, meldingStore.selectedFormId, authStore.user.id);
    
    // Update local messages from store
    messages.value = chatStore.messages;
    setTimeout(scrollToBottom, 100);
  } catch (error) {
    console.error('Error in chat message handling:', error);
    message.value = messageContent;
  } finally {
    loading.value = false;
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  // Checks for enter key
  if (e.key === 'Enter') {
    // If shift is not pressed, send message
    if (!e.shiftKey) {
      e.preventDefault();
      checkMessage();
    }
    // If shift is pressed, add a new line
  }
};

// Watch for changes in chatStore messages
watch(
  () => chatStore.messages,
  (newMessages) => {
    if (newMessages?.length) {
      messages.value = newMessages;
      setTimeout(scrollToBottom, 100);
    }
  },
  { deep: true }
);

onMounted(async () => {
  if (meldingStore.selectedFormId) {  
    const melding = meldingStore.getReportById(meldingStore.selectedFormId);
    if (melding?.ChatRoom?.id) {
      chatStore.setCurrentChatRoom(melding.ChatRoom.id);
      await chatStore.fetchMessages();
      messages.value = chatStore.messages;
      setTimeout(scrollToBottom, 100);
    }
  }
});
</script>

<style scoped lang="scss">
.customHeight {
  height: calc(100vh - 250px);
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
}

.chat-input {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.message-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

:deep(.v-textarea) {
  .v-field__append-inner {
    padding-top: 0;
    align-self: center;
  }
}
</style>
