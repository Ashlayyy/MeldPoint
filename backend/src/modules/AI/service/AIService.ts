import axios, { AxiosError } from 'axios';
import config from '../../../config';
import logger from '../../../helpers/loggerInstance';
import { Message } from '../types';

const SYSTEM_MESSAGE = 'You are a helpful assistant for the Intal Verbeterplein application.';
const BASE_URL = 'https://api.openai.com/v1';

const validateMessages = (messages: Message[]): void => {
  if (!Array.isArray(messages)) {
    logger.error('AIService: Messages must be an array');
    throw new Error('Messages must be an array');
  }

  if (messages.length === 0) {
    logger.error('AIService: Messages array cannot be empty');
    throw new Error('Messages array cannot be empty');
  }

  const isValidMessage = messages.every((msg) => {
    const hasRequiredFields = msg.role && msg.content;
    const hasValidRole = ['user', 'assistant', 'system'].includes(msg.role);
    return hasRequiredFields && hasValidRole;
  });

  if (!isValidMessage) {
    logger.error('AIService: Invalid message format');
    throw new Error('Invalid message format');
  }
};

const getAIResponse = async (messages: Message[]): Promise<string> => {
  try {
    validateMessages(messages);

    const filteredMessages = messages.filter((msg) => msg.role !== 'system');
    const finalMessages = [{ role: 'system' as const, content: SYSTEM_MESSAGE }, ...filteredMessages];

    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: config.ai.model,
        messages: finalMessages,
        temperature: 0.7,
        max_tokens: 100
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      logger.error('AIService: Invalid response format from OpenAI');
      throw new Error('Invalid response format from OpenAI');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error(`AIService: OpenAI API error - ${error.response?.data?.error?.message || error.message}`);
      throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
    logger.error(`AIService: Unknown error - ${error}`);
    throw error;
  }
};

export default getAIResponse;
