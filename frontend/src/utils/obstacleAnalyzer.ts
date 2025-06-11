import { chatService } from '@/API/ai';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import i18n from '@/main';

const notification = useNotificationStore();

export async function generateObstacleSummary(obstacle: string): Promise<string> {
  const prompt = `Maak een korte titel (maximaal 100 karakters) die dit obstakel samenvat: "${obstacle}". 
                 De titel moet duidelijk en professioneel zijn. Antwoord in het Nederlands.`;

  try {
    return await chatService.sendMessage(prompt);
  } catch (error) {
    notification.error({ message: i18n.global.t('errors.ai_generate_error', { error: error }) });
    throw error;
  }
}

export async function generateObstacleCategory(obstacle: string): Promise<string> {
  const prompt = `Analyseer dit obstakel en categoriseer het volgens de volgende structuur. 
                 Kies exact één woord uit elke categorie en verbind ze met streepjes (-).

                 Product categorie (kies één):
                 - Kozijn
                 - Vliesgevel
                 - Schuifpuien
                 - Dekkappen
                 - Schroeflijsten
                 - Glas
                 - Panelen
                 - Glaslat
                 - Rubber
                 - Bevestigingsmateriaal
                 - Zetwerk
                 - Overig

                 Probleem type (kies één):
                 - Manco
                 - Beschadigd
                 - Fout

                 Fase (kies één):
                 - Fabriekslevering
                 - Bouwlevering
                 - Montage
                 - Productie

                 Obstakel: "${obstacle}"
                 
                 Antwoord in exact dit format: [product] - [probleem] - [fase]
                 Bijvoorbeeld: overig - fout - productie`;

  try {
    return await chatService.sendMessage(prompt);
  } catch (error) {
    notification.error({ message: i18n.global.t('errors.ai_generate_error', { error: error }) });
    throw error;
  }
}

export async function generateRootCauseAnalysis(userAnalysis: string): Promise<string> {
  const prompt = `Je bent een expert in root cause analysis voor productieproblemen in een aluminium kozijnenfabriek. 
                 Analyseer de volgende input en geef een gestructureerde kernoorzaak analyse:
                 
                 Obstakel + Gebruiker analyse: ${userAnalysis}
                 
                 Analyseer de input en geef een gecombineerde kernoorzaak analyse. 
                 Voorkom dat je zelf antwoorden verzint op de Waarom-vragen die niet door de gebruiker zijn ingevuld. 
                 Gebruik de 5-why methode als basis. Houdt het antwoord kort, onder de 50 woorden.
                 Antwoord in het Nederlands.`;

  try {
    return await chatService.sendMessage(prompt);
  } catch (error) {
    notification.error({ message: i18n.global.t('errors.ai_generate_error', { error: error }) });
    throw error;
  }
}
