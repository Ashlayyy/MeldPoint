import { PrismaClient } from '@prisma/client';
import { addDays, startOfDay } from 'date-fns';
import logger from '../helpers/loggerInstance';
import NotificationChannel from '../services/socket/channels/NotificationChannel';
import { getAllDeadlines } from '../db/queries/deadlineQueries';
import prisma from '../db/prismaClient';

// Helper function to ensure ISO string format
function toISOStringWithoutMilliseconds(date: Date): string {
  return date.toISOString().split('.')[0] + 'Z';
}

// Helper function to format title with VolgNummer
const formatTitle = (title: string | null | undefined, volgNummer: number | null | undefined) => {
  return `${volgNummer ? `#${volgNummer} - ` : ''}${title || 'Ongetiteld'}`;
};

interface TodoItem {
  userId: string;
  title: string;
  description: string;
  meldingId: string;
  deadline: Date;
  type: string;
  volgNummer: number | null;
}

const createTodoItem = async (data: TodoItem) => {
  const message = `${data.title}\n${data.description}`;
  const url = data.volgNummer
    ? `https://intalligence.nl/verbeterplein/melding/${data.volgNummer}`
    : 'https://intalligence.nl/verbeterplein/overzicht';

  /*
  return await prisma.todo.create({
    data: {
      userId: data.userId,
      message,
      url,
      createdAt: new Date()
    }
  });
  */
  return {};
};

// Global lock for deadline checks
let isDeadlineCheckRunning = false;

// Helper function to check if notification was already sent today
const wasNotificationSentToday = async (userId: string, meldingId: string, type: string, deadline: Date) => {
  /*
  const today = startOfDay(new Date());

  // Use a transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // Check for existing todo
    const existingTodo = await tx.todo.findFirst({
      where: {
        userId,
        url: {
          contains: meldingId
        },
        createdAt: {
          gte: today
        }
      }
    });

    if (existingTodo) {
      logger.info(`[Deadline Debug] Todo already exists for user ${userId}, melding ${meldingId}, type ${type}`);
      return true;
    }

    // Check for existing notification as backup
    const notification = await tx.notification.findFirst({
      where: {
        userId,
        data: {
          contains: meldingId
        },
        createdAt: {
          gte: today
        },
        type
      }
    });

    return !!notification;
  });
  */
  return true;
};

const checkDeadlines = async (notificationChannel: NotificationChannel) => {
  // Check if another deadline check is already running
  if (isDeadlineCheckRunning) {
    logger.warn('[Deadline Debug] Another deadline check is already running, skipping this execution');
    return;
  }

  isDeadlineCheckRunning = true;
  const startTime = Date.now();
  logger.info('[Deadline Debug] Starting deadline check process');

  try {
    logger.info('[Deadline Debug] Step 1: Fetching upcoming deadlines');
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = addDays(tomorrowStart, 1);
    const todayStart = startOfDay(now);

    // Convert to ISO strings for database queries
    const todayStartISO = toISOStringWithoutMilliseconds(todayStart);
    const tomorrowStartISO = toISOStringWithoutMilliseconds(tomorrowStart);
    const tomorrowEndISO = toISOStringWithoutMilliseconds(tomorrowEnd);

    // Get all deadlines
    const [
      pastPreventiefDeadlines,
      upcomingPreventiefDeadlines,
      pastCorrectiefDeadlines,
      upcomingCorrectiefDeadlines,
      pdcaPhaseDeadlines,
      todoItemDeadlines,
      todayPreventiefDeadlines,
      todayCorrectiefDeadlines
    ] = await getAllDeadlines(todayStartISO, tomorrowStartISO, tomorrowEndISO);

    logger.info(
      `[Deadline Debug] Found ${pdcaPhaseDeadlines.length + todoItemDeadlines.length + pastPreventiefDeadlines.length + upcomingPreventiefDeadlines.length + pastCorrectiefDeadlines.length + upcomingCorrectiefDeadlines.length + todayPreventiefDeadlines.length + todayCorrectiefDeadlines.length} deadlines`
    );

    logger.info('[Deadline Debug] Step 2: Processing deadline notifications');

    // Process PDCA phase deadlines
    for (const pdcaItem of pdcaPhaseDeadlines) {
      const preventief = pdcaItem.preventief;
      if (!preventief.Melding?.[0] || !preventief.Steps) continue;
      const melding = preventief.Melding[0];
      const steps = preventief.Steps;

      const phases = [
        { name: 'Plan', data: steps.Plan },
        { name: 'Do', data: steps.Do },
        { name: 'Check', data: steps.Check },
        { name: 'Act', data: steps.Act }
      ];

      for (const { name, data } of phases) {
        if (!data?.Deadline || data.Finished) continue;
        const deadlineDate = new Date(data.Deadline);
        const isToday = deadlineDate >= todayStart && deadlineDate < tomorrowStart;
        const isPast = deadlineDate < todayStart;

        if (isPast || isToday) {
          if (!preventief.User?.id) {
            logger.info(
              `[Deadline Debug] Skipping PDCA phase notification for preventief ${preventief.id} - No user assigned`
            );
            continue;
          }

          // Check if notification was already sent today
          const notificationType = isToday ? 'today_pdca_phase' : 'past_pdca_phase';
          const alreadySent = await wasNotificationSentToday(
            preventief.User.id,
            preventief.id,
            notificationType,
            deadlineDate
          );
          if (alreadySent) {
            logger.info(
              `[Deadline Debug] Skipping PDCA phase notification - Already sent today for preventief ${preventief.id}`
            );
            continue;
          }

          const formattedTitle = formatTitle(melding.Title, melding.VolgNummer);
          const message = isToday
            ? `Let op: De deadline voor de ${name}-fase van preventieve melding ${formattedTitle} is vandaag! 
               Deadline: ${deadlineDate.toLocaleDateString()}.`
            : `Let op: De deadline voor de ${name}-fase van preventieve melding ${formattedTitle} is verstreken! 
               De deadline was: ${deadlineDate.toLocaleDateString()}. Actie is vereist.`;

          logger.info(
            `[Deadline Debug] Creating todo for ${isToday ? "today's" : 'past'} PDCA phase ${name} for preventief ${preventief.id}`
          );
          await createTodoItem({
            userId: preventief.User.id,
            title: `${name}-fase Deadline ${isToday ? 'Vandaag' : 'Verstreken'} - ${formattedTitle}`,
            description: message,
            meldingId: melding.id,
            deadline: deadlineDate,
            type: notificationType,
            volgNummer: melding.VolgNummer
          });

          notificationChannel.sendNotification({
            type: 'system',
            message,
            data: {
              title: `${name}-fase Deadline ${isToday ? 'Vandaag' : 'Verstreken'} - ${formattedTitle}`,
              preventief: {
                id: preventief.id,
                title: formattedTitle,
                phase: name,
                deadline: deadlineDate,
                assignedTo: preventief.User.Name,
                begeleider: preventief.Begeleider?.Name,
                volgNummer: melding.VolgNummer || 0,
                status: preventief.Status?.StatusNaam
              }
            },
            url: melding.VolgNummer
              ? `https://intalligence.nl/verbeterplein/melding/${melding.VolgNummer}`
              : 'https://intalligence.nl/verbeterplein/overzicht',
            userId: preventief.User.id,
            needTodo: true
          });

          if (preventief.Begeleider?.id) {
            const alreadySentToBegeleider = await wasNotificationSentToday(
              preventief.Begeleider.id,
              preventief.id,
              notificationType,
              deadlineDate
            );
            if (!alreadySentToBegeleider) {
              logger.info(
                `[Deadline Debug] Creating todo for ${isToday ? "today's" : 'past'} PDCA phase ${name} for begeleider ${preventief.Begeleider.id}`
              );
              await createTodoItem({
                userId: preventief.Begeleider.id,
                title: `${name}-fase Deadline ${isToday ? 'Vandaag' : 'Verstreken'} (Begeleider) - ${formattedTitle}`,
                description: message,
                meldingId: melding.id,
                deadline: deadlineDate,
                type: notificationType,
                volgNummer: melding.VolgNummer
              });

              notificationChannel.sendNotification({
                type: 'system',
                message: `Als begeleider: ${message}`,
                data: {
                  title: `${name}-fase Deadline ${isToday ? 'Vandaag' : 'Verstreken'} (Begeleider) - ${formattedTitle}`,
                  preventief: {
                    id: preventief.id,
                    title: formattedTitle,
                    phase: name,
                    deadline: deadlineDate,
                    assignedTo: preventief.User.Name,
                    volgNummer: melding.VolgNummer || 0,
                    status: preventief.Status?.StatusNaam
                  }
                },
                url: melding.VolgNummer
                  ? `https://intalligence.nl/verbeterplein/melding/${melding.VolgNummer}`
                  : 'https://intalligence.nl/verbeterplein/overzicht',
                userId: preventief.Begeleider.id,
                needTodo: true
              });
            }
          }

          logger.info(
            `[Deadline Debug] Sent ${isToday ? "today's" : 'past'} PDCA phase deadline notifications for preventief ${preventief.id} (Melding ${melding.VolgNummer || 0}, Phase: ${name})`
          );
        }
      }
    }

    // Process todo items
    for (const preventief of todoItemDeadlines) {
      if (!preventief.Melding?.[0] || !preventief.TodoItems?.length) continue;
      const melding = preventief.Melding[0];

      for (const item of preventief.TodoItems) {
        if (!item.Deadline || item.Status === 'Done') continue;
        const deadlineDate = new Date(item.Deadline);
        const isToday = deadlineDate >= todayStart && deadlineDate < tomorrowStart;
        const isPast = deadlineDate < todayStart;

        if (isPast || isToday) {
          if (!preventief.User?.id) {
            logger.info(
              `[Deadline Debug] Skipping todo item notification for preventief ${preventief.id} - No user assigned`
            );
            continue;
          }

          const formattedTitle = formatTitle(melding.Title, melding.VolgNummer);
          const message = isToday
            ? `Let op: De deadline voor todo item "${item.Actie}" van preventieve melding ${formattedTitle} is vandaag! 
               Deadline: ${deadlineDate.toLocaleDateString()}. Impact: ${item.Impact || 'Onbekend'}`
            : `Let op: De deadline voor todo item "${item.Actie}" van preventieve melding ${formattedTitle} is verstreken! 
               De deadline was: ${deadlineDate.toLocaleDateString()}. Impact: ${item.Impact || 'Onbekend'}`;

          if (item.WieID) {
            const notificationType = isToday ? 'today_todo_item' : 'past_todo_item';
            const alreadySent = await wasNotificationSentToday(
              item.WieID,
              preventief.id,
              notificationType,
              deadlineDate
            );
            if (!alreadySent) {
              logger.info(
                `[Deadline Debug] Creating todo for ${isToday ? "today's" : 'past'} todo item ${item.id} for preventief ${preventief.id}`
              );
              await createTodoItem({
                userId: item.WieID,
                title: `Todo Item Deadline ${isToday ? 'Vandaag' : 'Verstreken'} - ${formattedTitle}`,
                description: message,
                meldingId: melding.id,
                deadline: deadlineDate,
                type: notificationType,
                volgNummer: melding.VolgNummer
              });

              notificationChannel.sendNotification({
                type: 'system',
                message,
                data: {
                  title: `Todo Item Deadline ${isToday ? 'Vandaag' : 'Verstreken'} - ${formattedTitle}`,
                  preventief: {
                    id: preventief.id,
                    title: formattedTitle,
                    todoItem: {
                      id: item.id,
                      action: item.Actie,
                      deadline: deadlineDate,
                      impact: item.Impact,
                      effectiviteit: item.Effectiviteit
                    },
                    volgNummer: melding.VolgNummer || 0,
                    status: preventief.Status?.StatusNaam
                  }
                },
                url: melding.VolgNummer
                  ? `https://intalligence.nl/verbeterplein/melding/${melding.VolgNummer}`
                  : 'https://intalligence.nl/verbeterplein/overzicht',
                userId: item.WieID,
                needTodo: true
              });
            }
          } else {
            logger.info(
              `[Deadline Debug] Skipping todo item notification for preventief ${preventief.id} - No user assigned to todo item`
            );
          }

          if (preventief.User?.id && preventief.User.id !== item.WieID) {
            const notificationType = isToday ? 'today_todo_item_owner' : 'past_todo_item_owner';
            const alreadySentToOwner = await wasNotificationSentToday(
              preventief.User.id,
              preventief.id,
              notificationType,
              deadlineDate
            );
            if (!alreadySentToOwner) {
              logger.info(
                `[Deadline Debug] Creating todo for ${isToday ? "today's" : 'past'} todo item ${item.id} for preventief owner ${preventief.User.id}`
              );
              await createTodoItem({
                userId: preventief.User.id,
                title: `Todo Item Deadline ${isToday ? 'Vandaag' : 'Verstreken'} (Eigenaar) - ${formattedTitle}`,
                description: message,
                meldingId: melding.id,
                deadline: deadlineDate,
                type: notificationType,
                volgNummer: melding.VolgNummer
              });

              notificationChannel.sendNotification({
                type: 'system',
                message: `Als eigenaar: ${message}`,
                data: {
                  title: `Todo Item Deadline ${isToday ? 'Vandaag' : 'Verstreken'} (Eigenaar) - ${formattedTitle}`,
                  preventief: {
                    id: preventief.id,
                    title: formattedTitle,
                    todoItem: {
                      id: item.id,
                      action: item.Actie,
                      deadline: deadlineDate,
                      impact: item.Impact,
                      effectiviteit: item.Effectiviteit,
                      assignedTo: item.WieID
                    },
                    volgNummer: melding.VolgNummer || 0,
                    status: preventief.Status?.StatusNaam
                  }
                },
                url: melding.VolgNummer
                  ? `https://intalligence.nl/verbeterplein/melding/${melding.VolgNummer}`
                  : 'https://intalligence.nl/verbeterplein/overzicht',
                userId: preventief.User.id,
                needTodo: true
              });
            }
          }

          logger.info(
            `[Deadline Debug] Processed ${isToday ? "today's" : 'past'} todo item deadline notifications for preventief ${preventief.id} (Melding ${melding.VolgNummer || 0}, Todo: ${item.Actie})`
          );
        }
      }
    }

    // Process past preventief deadlines
    for (const preventief of pastPreventiefDeadlines) {
      if (!preventief.Melding?.[0] || !preventief.User?.id) {
        logger.info(
          `[Deadline Debug] Skipping past preventief deadline notification for ${preventief.id} - No user assigned`
        );
        continue;
      }

      const deadlineDate = new Date(preventief.Deadline);
      const alreadySent = await wasNotificationSentToday(
        preventief.User.id,
        preventief.id,
        'past_preventief',
        deadlineDate
      );
      if (alreadySent) continue;

      const melding = preventief.Melding[0];
      const formattedTitle = formatTitle(melding.Title, melding.VolgNummer);

      const message = `Let op: De deadline voor preventieve melding ${formattedTitle} is verstreken! 
        De deadline was: ${deadlineDate.toLocaleDateString()}. Actie is vereist.`;

      logger.info(`[Deadline Debug] Creating todo for past preventief ${preventief.id}`);
      await createTodoItem({
        userId: preventief.User.id,
        title: `Deadline Verstreken - ${formattedTitle}`,
        description: message,
        meldingId: melding.id,
        deadline: deadlineDate,
        type: 'past_preventief',
        volgNummer: melding.VolgNummer
      });

      notificationChannel.sendNotification({
        type: 'system',
        message,
        data: {
          title: `Deadline Verstreken - ${formattedTitle}`,
          preventief: {
            id: preventief.id,
            title: formattedTitle,
            deadline: preventief.Deadline,
            assignedTo: preventief.User.Name,
            volgNummer: melding.VolgNummer || 0,
            status: preventief.Status?.StatusNaam
          }
        },
        url: melding.VolgNummer
          ? `https://intalligence.nl/verbeterplein/melding/${melding.VolgNummer}`
          : 'https://intalligence.nl/verbeterplein/overzicht',
        userId: preventief.User.id,
        needTodo: true
      });

      logger.info(
        `[Deadline Debug] Sent past deadline notification for preventief ${preventief.id} (Melding ${melding.VolgNummer || 0})`
      );
    }

    // Process upcoming preventief deadlines
    for (const preventief of upcomingPreventiefDeadlines) {
      if (!preventief.Melding?.[0] || !preventief.User?.id) {
        logger.info(
          `[Deadline Debug] Skipping upcoming preventief deadline notification for ${preventief.id} - No user assigned`
        );
        continue;
      }

      const deadlineDate = new Date(preventief.Deadline);
      const alreadySent = await wasNotificationSentToday(
        preventief.User.id,
        preventief.id,
        'upcoming_preventief',
        deadlineDate
      );
      if (alreadySent) continue;

      const melding = preventief.Melding[0];
      const formattedTitle = formatTitle(melding.Title, melding.VolgNummer);

      const message = `Deadline nadert voor preventieve melding: ${formattedTitle}. 
        Deadline: ${deadlineDate.toLocaleDateString()}`;

      logger.info(`[Deadline Debug] Creating todo for upcoming preventief ${preventief.id}`);
      await createTodoItem({
        userId: preventief.User.id,
        title: `Deadline Herinnering - ${formattedTitle}`,
        description: message,
        meldingId: melding.id,
        deadline: deadlineDate,
        type: 'upcoming_preventief',
        volgNummer: melding.VolgNummer
      });

      notificationChannel.sendNotification({
        type: 'system',
        message,
        data: {
          title: `Deadline Herinnering - ${formattedTitle}`,
          preventief: {
            id: preventief.id,
            title: formattedTitle,
            deadline: preventief.Deadline,
            assignedTo: preventief.User.Name,
            volgNummer: melding.VolgNummer || 0,
            status: preventief.Status?.StatusNaam
          }
        },
        url: melding.VolgNummer
          ? `https://intalligence.nl/verbeterplein/melding/${melding.VolgNummer}`
          : 'https://intalligence.nl/verbeterplein/overzicht',
        userId: preventief.User.id,
        needTodo: true
      });

      logger.info(
        `[Deadline Debug] Sent upcoming deadline notification for preventief ${preventief.id} (Melding ${melding.VolgNummer || 0})`
      );
    }

    // Process past correctief deadlines
    for (const correctief of pastCorrectiefDeadlines) {
      if (!correctief.Melding?.[0] || !correctief.User?.id) {
        logger.info(
          `[Deadline Debug] Skipping past correctief deadline notification for ${correctief.id} - No user assigned`
        );
        continue;
      }

      const deadlineDate = new Date(correctief.Deadline);
      const alreadySent = await wasNotificationSentToday(
        correctief.User.id,
        correctief.id,
        'past_correctief',
        deadlineDate
      );
      if (alreadySent) continue;

      const melding = correctief.Melding[0];
      const formattedTitle = formatTitle(melding.Title, melding.VolgNummer);

      const message = `Let op: De deadline voor correctieve melding ${formattedTitle} is verstreken! 
        De deadline was: ${deadlineDate.toLocaleDateString()}. Actie is vereist.`;

      logger.info(`[Deadline Debug] Creating todo for past correctief ${correctief.id}`);
      await createTodoItem({
        userId: correctief.User.id,
        title: `Deadline Verstreken - ${formattedTitle}`,
        description: message,
        meldingId: melding.id,
        deadline: deadlineDate,
        type: 'past_correctief',
        volgNummer: melding.VolgNummer
      });

      notificationChannel.sendNotification({
        type: 'system',
        message,
        data: {
          title: `Deadline Verstreken - ${formattedTitle}`,
          correctief: {
            id: correctief.id,
            title: formattedTitle,
            deadline: correctief.Deadline,
            assignedTo: correctief.User.Name,
            volgNummer: melding.VolgNummer || 0,
            status: correctief.Status?.StatusNaam
          }
        },
        url: melding.VolgNummer
          ? `https://intalligence.nl/verbeterplein/melding/${melding.VolgNummer}`
          : 'https://intalligence.nl/verbeterplein/overzicht',
        userId: correctief.User.id,
        needTodo: true
      });

      logger.info(
        `[Deadline Debug] Sent past deadline notification for correctief ${correctief.id} (Melding ${melding.VolgNummer || 0})`
      );
    }

    // Process upcoming correctief deadlines
    for (const correctief of upcomingCorrectiefDeadlines) {
      if (!correctief.Melding?.[0] || !correctief.User?.id) {
        logger.info(
          `[Deadline Debug] Skipping upcoming correctief deadline notification for ${correctief.id} - No user assigned`
        );
        continue;
      }

      const deadlineDate = new Date(correctief.Deadline);
      const alreadySent = await wasNotificationSentToday(
        correctief.User.id,
        correctief.id,
        'upcoming_correctief',
        deadlineDate
      );
      if (alreadySent) continue;

      const melding = correctief.Melding[0];
      const formattedTitle = formatTitle(melding.Title, melding.VolgNummer);

      const message = `Deadline nadert voor correctieve melding: ${formattedTitle}. 
        Deadline: ${deadlineDate.toLocaleDateString()}`;

      logger.info(`[Deadline Debug] Creating todo for upcoming correctief ${correctief.id}`);
      await createTodoItem({
        userId: correctief.User.id,
        title: `Deadline Herinnering - ${formattedTitle}`,
        description: message,
        meldingId: melding.id,
        deadline: deadlineDate,
        type: 'upcoming_correctief',
        volgNummer: melding.VolgNummer
      });

      notificationChannel.sendNotification({
        type: 'system',
        message,
        data: {
          title: `Deadline Herinnering - ${formattedTitle}`,
          correctief: {
            id: correctief.id,
            title: formattedTitle,
            deadline: correctief.Deadline,
            assignedTo: correctief.User.Name,
            volgNummer: melding.VolgNummer || 0,
            status: correctief.Status?.StatusNaam
          }
        },
        url: melding.VolgNummer
          ? `https://intalligence.nl/verbeterplein/melding/${melding.VolgNummer}`
          : 'https://intalligence.nl/verbeterplein/overzicht',
        userId: correctief.User.id,
        needTodo: true
      });

      logger.info(
        `[Deadline Debug] Sent upcoming deadline notification for correctief ${correctief.id} (Melding ${melding.VolgNummer || 0})`
      );
    }

    // Process today's preventief deadlines
    for (const preventief of todayPreventiefDeadlines) {
      if (!preventief.Melding?.[0] || !preventief.User?.id) {
        logger.info(
          `[Deadline Debug] Skipping today's preventief deadline notification for ${preventief.id} - No user assigned`
        );
        continue;
      }

      const deadlineDate = new Date(preventief.Deadline);
      const alreadySent = await wasNotificationSentToday(
        preventief.User.id,
        preventief.id,
        'today_preventief',
        deadlineDate
      );
      if (alreadySent) continue;

      const melding = preventief.Melding[0];
      const formattedTitle = formatTitle(melding.Title, melding.VolgNummer);

      const message = `Let op: De deadline voor preventieve melding ${formattedTitle} is vandaag! 
        Deadline: ${deadlineDate.toLocaleDateString()}`;

      logger.info(`[Deadline Debug] Creating todo for today's preventief ${preventief.id}`);
      await createTodoItem({
        userId: preventief.User.id,
        title: `Deadline Vandaag - ${formattedTitle}`,
        description: message,
        meldingId: melding.id,
        deadline: deadlineDate,
        type: 'today_preventief',
        volgNummer: melding.VolgNummer
      });

      notificationChannel.sendNotification({
        type: 'system',
        message,
        data: {
          title: `Deadline Vandaag - ${formattedTitle}`,
          preventief: {
            id: preventief.id,
            title: formattedTitle,
            deadline: preventief.Deadline,
            assignedTo: preventief.User.Name,
            volgNummer: melding.VolgNummer || 0,
            status: preventief.Status?.StatusNaam
          }
        },
        url: melding.VolgNummer
          ? `https://intalligence.nl/verbeterplein/melding/${melding.VolgNummer}`
          : 'https://intalligence.nl/verbeterplein/overzicht',
        userId: preventief.User.id,
        needTodo: true
      });

      logger.info(
        `[Deadline Debug] Sent today's deadline notification for preventief ${preventief.id} (Melding ${melding.VolgNummer || 0})`
      );
    }

    // Process today's correctief deadlines
    for (const correctief of todayCorrectiefDeadlines) {
      if (!correctief.Melding?.[0] || !correctief.User?.id) {
        logger.info(
          `[Deadline Debug] Skipping today's correctief deadline notification for ${correctief.id} - No user assigned`
        );
        continue;
      }

      const deadlineDate = new Date(correctief.Deadline);
      const alreadySent = await wasNotificationSentToday(
        correctief.User.id,
        correctief.id,
        'today_correctief',
        deadlineDate
      );
      if (alreadySent) continue;

      const melding = correctief.Melding[0];
      const formattedTitle = formatTitle(melding.Title, melding.VolgNummer);

      const message = `Let op: De deadline voor correctieve melding ${formattedTitle} is vandaag! 
        Deadline: ${deadlineDate.toLocaleDateString()}`;

      logger.info(`[Deadline Debug] Creating todo for today's correctief ${correctief.id}`);
      await createTodoItem({
        userId: correctief.User.id,
        title: `Deadline Vandaag - ${formattedTitle}`,
        description: message,
        meldingId: melding.id,
        deadline: deadlineDate,
        type: 'today_correctief',
        volgNummer: melding.VolgNummer
      });

      notificationChannel.sendNotification({
        type: 'system',
        message,
        data: {
          title: `Deadline Vandaag - ${formattedTitle}`,
          correctief: {
            id: correctief.id,
            title: formattedTitle,
            deadline: correctief.Deadline,
            assignedTo: correctief.User.Name,
            volgNummer: melding.VolgNummer || 0,
            status: correctief.Status?.StatusNaam
          }
        },
        url: melding.VolgNummer
          ? `https://intalligence.nl/verbeterplein/melding/${melding.VolgNummer}`
          : 'https://intalligence.nl/verbeterplein/overzicht',
        userId: correctief.User.id,
        needTodo: true
      });

      logger.info(
        `[Deadline Debug] Sent today's deadline notification for correctief ${correctief.id} (Melding ${melding.VolgNummer || 0})`
      );
    }

    const totalTime = Date.now() - startTime;
    logger.info(`[Deadline Debug] Deadline check completed successfully in ${totalTime}ms`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`[Deadline Debug] Deadline check failed after ${Date.now() - startTime}ms:`, err);
    throw err;
  } finally {
    isDeadlineCheckRunning = false;
  }
};

export default checkDeadlines;
