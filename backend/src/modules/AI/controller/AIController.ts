import { Request, Response } from 'express';
import logger from '../../../helpers/loggerInstance';
import getAIResponse from '../service/AIService';
import { Message } from '../types';

const getResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body as { messages: Message[] };
    const response = await getAIResponse(messages);
    res.json({ response });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
      logger.error(`AI-Controller: ${error.message} - ${error.stack}`);
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
      logger.error('AI-Controller: An unknown error occurred');
    }
  }
};

export default getResponse;
