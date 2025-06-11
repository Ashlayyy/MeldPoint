import prisma from '../prismaClient';
import logger from '../../helpers/loggerInstance';

const deadlineSelect = {
  id: true,
  Deadline: true,
  Steps: true,
  TodoItems: true,
  StatusID: true,
  ActiehouderID: true,
  BegeleiderID: true,
  Status: {
    select: {
      id: true,
      StatusNaam: true
    }
  },
  User: {
    select: {
      id: true,
      Name: true
    }
  },
  Begeleider: {
    select: {
      id: true,
      Name: true
    }
  },
  Melding: {
    select: {
      id: true,
      Title: true,
      VolgNummer: true
    }
  }
};

const correctiefDeadlineSelect = {
  id: true,
  Deadline: true,
  StatusID: true,
  userId: true,
  Status: {
    select: {
      id: true,
      StatusNaam: true
    }
  },
  User: {
    select: {
      id: true,
      Name: true
    }
  },
  Melding: {
    select: {
      id: true,
      Title: true,
      VolgNummer: true
    }
  }
};

// Helper function to ensure ISO string format
function toISOStringWithoutMilliseconds(date: Date): string {
  return date.toISOString().split('.')[0] + 'Z';
}

// Helper function to check if a date falls within a range
function isDateInRange(date: Date | string | null | undefined, start: Date, end?: Date): boolean {
  if (!date) return false;
  const dateObj = new Date(date);
  if (end) {
    return dateObj >= start && dateObj < end;
  }
  return dateObj >= start;
}

// Helper function to check PDCA deadlines
function checkPDCADeadlines(
  steps: any,
  beforeDate: Date
): {
  hasPastDeadlines: boolean;
  hasUpcomingDeadlines: boolean;
  deadlines: Array<{ phase: string; date: Date; isPast: boolean }>;
} {
  const phases = ['Plan', 'Do', 'Check', 'Act'] as const;
  let hasPastDeadlines = false;
  let hasUpcomingDeadlines = false;
  const deadlines: Array<{ phase: string; date: Date; isPast: boolean }> = [];

  for (const phase of phases) {
    const step = steps[phase];
    if (step?.Deadline && !step.Finished) {
      const deadlineDate = new Date(step.Deadline);
      const isPast = deadlineDate < beforeDate;

      if (isPast) {
        hasPastDeadlines = true;
      } else {
        hasUpcomingDeadlines = true;
      }

      deadlines.push({
        phase,
        date: deadlineDate,
        isPast
      });
    }
  }

  return { hasPastDeadlines, hasUpcomingDeadlines, deadlines };
}

export interface BasePreventieItem {
  id: string;
  Deadline: string;
  StatusID: string | null;
  Status: {
    id: string;
    StatusNaam: string;
  } | null;
  User: {
    id: string;
    Name: string;
  } | null;
  Melding: Array<{
    id: string;
    Title: string | null;
    VolgNummer: number | null;
  }>;
}

export interface PreventieItem extends BasePreventieItem {
  Steps: {
    Obstakel: { Deadline: Date | null; Finished: boolean | null } | null;
    Plan: { Deadline: Date | null; Finished: boolean | null } | null;
    Do: { Deadline: Date | null; Finished: boolean | null } | null;
    Check: { Deadline: Date | null; Finished: boolean | null } | null;
    Act: { Deadline: Date | null; Finished: boolean | null } | null;
    Finished: { Deadline: Date | null; Finished: boolean | null } | null;
  } | null;
  TodoItems: Array<{
    id: string | null;
    WieID: string | null;
    Actie: string | null;
    Deadline: Date | null;
    Status: 'Open' | 'Progress' | 'Done' | null;
    Effectiviteit: 'Zeer' | 'Redelijk' | 'Weinig' | null;
    Impact: 'Groot' | 'Gemiddeld' | 'Klein' | null;
    Comments: string | null;
  }>;
  Begeleider: {
    id: string;
    Name: string;
  } | null;
  ActiehouderID: string | null;
  BegeleiderID: string | null;
}

export interface CorrectiefItem extends BasePreventieItem {
  userId: string | null;
}

export interface PDCADeadlineItem {
  preventief: PreventieItem;
  hasPastDeadlines: boolean;
  hasUpcomingDeadlines: boolean;
  deadlines: Array<{ phase: string; date: Date; isPast: boolean }>;
}

// Consolidated function to get all deadlines with TypeScript date validation
export async function getAllDeadlinesWithValidation(
  todayStart: string,
  tomorrowStart: string,
  tomorrowEnd: string
): Promise<
  [
    PreventieItem[],
    PreventieItem[],
    CorrectiefItem[],
    CorrectiefItem[],
    PDCADeadlineItem[],
    PreventieItem[],
    PreventieItem[],
    CorrectiefItem[]
  ]
> {
  logger.debug(
    `[Deadline Debug] Getting all deadlines with:
    - Today start: ${todayStart}
    - Tomorrow start: ${tomorrowStart}
    - Tomorrow end: ${tomorrowEnd}
    
    Date objects for verification:
    - Today start: ${new Date(todayStart).toLocaleString()}
    - Tomorrow start: ${new Date(tomorrowStart).toLocaleString()}
    - Tomorrow end: ${new Date(tomorrowEnd).toLocaleString()}`
  );

  try {
    // Convert string dates to Date objects for TypeScript validation
    const todayStartDate = new Date(todayStart);
    const tomorrowStartDate = new Date(tomorrowStart);
    const tomorrowEndDate = new Date(tomorrowEnd);

    // Convert to ISO strings for database queries
    const todayStartISO = toISOStringWithoutMilliseconds(todayStartDate);
    const tomorrowStartISO = toISOStringWithoutMilliseconds(tomorrowStartDate);
    const tomorrowEndISO = toISOStringWithoutMilliseconds(tomorrowEndDate);

    // Get all active preventief records
    const allPreventief = await prisma.preventief.findMany({
      where: {
        Status: {
          StatusNaam: { not: 'Afgerond' }
        }
      },
      select: deadlineSelect
    });

    // Get all active correctief records
    const allCorrectief = await prisma.correctief.findMany({
      where: {
        Status: {
          StatusNaam: { not: 'Afgerond' }
        }
      },
      select: correctiefDeadlineSelect
    });

    logger.debug(
      `[Deadline Debug] Found ${allPreventief.length} preventief and ${allCorrectief.length} correctief records to process`
    );

    // Process preventief records
    const pastPreventief = allPreventief.filter((p) => p.Deadline && new Date(p.Deadline) < todayStartDate);
    const todayPreventief = allPreventief.filter(
      (p) => p.Deadline && isDateInRange(p.Deadline, todayStartDate, tomorrowStartDate)
    );
    const upcomingPreventief = allPreventief.filter((p) => p.Deadline && new Date(p.Deadline) >= tomorrowStartDate);

    // Process correctief records
    const pastCorrectief = allCorrectief.filter((c) => c.Deadline && new Date(c.Deadline) < todayStartDate);
    const todayCorrectief = allCorrectief.filter(
      (c) => c.Deadline && isDateInRange(c.Deadline, todayStartDate, tomorrowStartDate)
    );
    const upcomingCorrectief = allCorrectief.filter((c) => c.Deadline && new Date(c.Deadline) >= tomorrowStartDate);

    // Process PDCA phases
    const pdcaDeadlines = allPreventief
      .filter((p) => p.Steps)
      .map((p) => {
        const { hasPastDeadlines, hasUpcomingDeadlines, deadlines } = checkPDCADeadlines(p.Steps, todayStartDate);
        return {
          preventief: p,
          hasPastDeadlines,
          hasUpcomingDeadlines,
          deadlines
        };
      })
      .filter((p) => p.hasPastDeadlines || p.hasUpcomingDeadlines);

    // Process todo items
    const todoDeadlines = allPreventief
      .filter((p) => p.TodoItems?.length > 0)
      .map((p) => {
        const items = p.TodoItems.filter(
          (item: any) =>
            item.Deadline &&
            item.Status !== 'Done' &&
            (new Date(item.Deadline) < todayStartDate || // Past
              isDateInRange(item.Deadline, todayStartDate, tomorrowEndDate)) // Today or upcoming
        );
        return items.length > 0 ? { ...p, TodoItems: items } : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // Log results
    logger.debug(
      `[Deadline Debug] Summary:
      - Past preventief: ${pastPreventief.length}
      - Today's preventief: ${todayPreventief.length}
      - Upcoming preventief: ${upcomingPreventief.length}
      - Past correctief: ${pastCorrectief.length}
      - Today's correctief: ${todayCorrectief.length}
      - Upcoming correctief: ${upcomingCorrectief.length}
      - PDCA phases with deadlines: ${pdcaDeadlines.length}
      - Preventief with todo deadlines: ${todoDeadlines.length}
      
      Total items: ${
        pastPreventief.length +
        todayPreventief.length +
        upcomingPreventief.length +
        pastCorrectief.length +
        todayCorrectief.length +
        upcomingCorrectief.length +
        pdcaDeadlines.length +
        todoDeadlines.length
      }`
    );

    // Log detailed PDCA information
    pdcaDeadlines.forEach((p) => {
      logger.debug(`[Deadline Debug] PDCA deadlines for preventief ${p.preventief.id}:`);
      p.deadlines.forEach((d) => {
        logger.debug(`- ${d.phase} phase: ${d.date.toISOString()} (${d.isPast ? 'past' : 'upcoming'})`);
      });
    });

    // Log detailed todo information
    todoDeadlines.forEach((p) => {
      logger.debug(`[Deadline Debug] Todo deadlines for preventief ${p.id}:`);
      p.TodoItems.forEach((item: any) => {
        const deadline = new Date(item.Deadline);
        const status =
          deadline < todayStartDate
            ? 'past'
            : isDateInRange(deadline, todayStartDate, tomorrowStartDate)
              ? 'today'
              : 'upcoming';
        logger.debug(`- Todo ${item.id}: ${item.Deadline} (${status})`);
      });
    });

    /*
    return [
      pastPreventief,
      upcomingPreventief,
      pastCorrectief,
      upcomingCorrectief,
      pdcaDeadlines,
      todoDeadlines,
      todayPreventief,
      todayCorrectief
    ];
    */
    return [[], [], [], [], [], [], [], []];
  } catch (error) {
    logger.error(`[Deadline Debug] Error getting all deadlines: ${error}`);
    return [[], [], [], [], [], [], [], []];
  }
}

// Keep the old function for backward compatibility
export async function getAllDeadlines(
  todayStart: string,
  tomorrowStart: string,
  tomorrowEnd: string
): Promise<
  [
    PreventieItem[],
    PreventieItem[],
    CorrectiefItem[],
    CorrectiefItem[],
    PDCADeadlineItem[],
    PreventieItem[],
    PreventieItem[],
    CorrectiefItem[]
  ]
> {
  return getAllDeadlinesWithValidation(todayStart, tomorrowStart, tomorrowEnd);
}

export async function getPastPreventiefDeadlines(beforeDate: string) {
  logger.debug(`[Deadline Debug] Getting past preventief deadlines before: ${beforeDate}`);
  try {
    const beforeDateObj = new Date(beforeDate);
    const beforeDateISO = toISOStringWithoutMilliseconds(beforeDateObj);

    const results = await prisma.preventief.findMany({
      where: {
        Deadline: {
          lt: beforeDateISO
        },
        Status: {
          StatusNaam: { not: 'Afgerond' }
        }
      },
      select: deadlineSelect
    });
    logger.debug(`[Deadline Debug] Found ${results.length} past preventief deadlines`);
    results.forEach((p) => {
      logger.debug(`[Deadline Debug] Past preventief ${p.id}: deadline ${p.Deadline}, status: ${p.Status?.StatusNaam}`);
    });
    return results;
  } catch (error) {
    logger.error(`[Deadline Debug] Error getting past preventief deadlines: ${error}`);
    return [];
  }
}

export async function getUpcomingPreventiefDeadlines(startDate: string, endDate: string) {
  logger.debug(`[Deadline Debug] Getting upcoming preventief deadlines between ${startDate} and ${endDate}`);
  try {
    const startDateObj = new Date(startDate);
    const startDateISO = toISOStringWithoutMilliseconds(startDateObj);

    const results = await prisma.preventief.findMany({
      where: {
        Deadline: {
          gte: startDateISO
        },
        Status: {
          StatusNaam: { not: 'Afgerond' }
        }
      },
      select: deadlineSelect
    });
    logger.debug(`[Deadline Debug] Found ${results.length} upcoming preventief deadlines`);
    results.forEach((p) => {
      logger.debug(
        `[Deadline Debug] Upcoming preventief ${p.id}: deadline ${p.Deadline}, status: ${p.Status?.StatusNaam}`
      );
    });
    return results;
  } catch (error) {
    logger.error(`[Deadline Debug] Error getting upcoming preventief deadlines: ${error}`);
    return [];
  }
}

export async function getPastCorrectiefDeadlines(beforeDate: string) {
  logger.debug(`[Deadline Debug] Getting past correctief deadlines before: ${beforeDate}`);
  try {
    const beforeDateObj = new Date(beforeDate);
    const beforeDateISO = toISOStringWithoutMilliseconds(beforeDateObj);

    const results = await prisma.correctief.findMany({
      where: {
        Deadline: {
          lt: beforeDateISO
        },
        Status: {
          StatusNaam: { not: 'Afgerond' }
        }
      },
      select: correctiefDeadlineSelect
    });
    logger.debug(`[Deadline Debug] Found ${results.length} past correctief deadlines`);
    results.forEach((c) => {
      logger.debug(`[Deadline Debug] Past correctief ${c.id}: deadline ${c.Deadline}, status: ${c.Status?.StatusNaam}`);
    });
    return results;
  } catch (error) {
    logger.error(`[Deadline Debug] Error getting past correctief deadlines: ${error}`);
    return [];
  }
}

export async function getUpcomingCorrectiefDeadlines(startDate: string, endDate: string) {
  logger.debug(`[Deadline Debug] Getting upcoming correctief deadlines between ${startDate} and ${endDate}`);
  try {
    const startDateObj = new Date(startDate);
    const startDateISO = toISOStringWithoutMilliseconds(startDateObj);

    const results = await prisma.correctief.findMany({
      where: {
        Deadline: {
          gte: startDateISO
        },
        Status: {
          StatusNaam: { not: 'Afgerond' }
        }
      },
      select: correctiefDeadlineSelect
    });
    logger.debug(`[Deadline Debug] Found ${results.length} upcoming correctief deadlines`);
    results.forEach((c) => {
      logger.debug(
        `[Deadline Debug] Upcoming correctief ${c.id}: deadline ${c.Deadline}, status: ${c.Status?.StatusNaam}`
      );
    });
    return results;
  } catch (error) {
    logger.error(`[Deadline Debug] Error getting upcoming correctief deadlines: ${error}`);
    return [];
  }
}

export async function getPDCAPhaseDeadlines(beforeDate: string, endDate: string) {
  logger.debug(`[Deadline Debug] Getting PDCA phase deadlines with beforeDate: ${beforeDate}, endDate: ${endDate}`);
  try {
    return await prisma.preventief
      .findMany({
        where: {
          Status: {
            StatusNaam: { not: 'Afgerond' }
          }
        },
        include: {
          Status: {
            select: {
              id: true,
              StatusNaam: true
            }
          },
          User: {
            select: {
              id: true,
              Name: true
            }
          },
          Begeleider: {
            select: {
              id: true,
              Name: true
            }
          },
          Melding: {
            select: {
              id: true,
              Title: true,
              VolgNummer: true
            }
          }
        }
      })
      .then((preventief) => {
        logger.debug(`[Deadline Debug] Found ${preventief.length} preventief records to check for PDCA deadlines`);
        return preventief.filter((p) => {
          if (!p.Steps) {
            logger.debug(`[Deadline Debug] Preventief ${p.id} has no Steps, skipping`);
            return false;
          }

          const steps = p.Steps as {
            Plan?: { Deadline?: Date; Finished?: boolean };
            Do?: { Deadline?: Date; Finished?: boolean };
            Check?: { Deadline?: Date; Finished?: boolean };
            Act?: { Deadline?: Date; Finished?: boolean };
          };

          logger.debug(`[Deadline Debug] Checking PDCA deadlines for preventief ${p.id}:`);
          logger.debug(
            `- Plan phase: ${steps.Plan?.Deadline ? new Date(steps.Plan.Deadline).toISOString() : 'not set'} (Finished: ${steps.Plan?.Finished})`
          );
          logger.debug(
            `- Do phase: ${steps.Do?.Deadline ? new Date(steps.Do.Deadline).toISOString() : 'not set'} (Finished: ${steps.Do?.Finished})`
          );
          logger.debug(
            `- Check phase: ${steps.Check?.Deadline ? new Date(steps.Check.Deadline).toISOString() : 'not set'} (Finished: ${steps.Check?.Finished})`
          );
          logger.debug(
            `- Act phase: ${steps.Act?.Deadline ? new Date(steps.Act.Deadline).toISOString() : 'not set'} (Finished: ${steps.Act?.Finished})`
          );

          const beforeDateObj = new Date(beforeDate);

          logger.debug(`[Deadline Debug] Comparing against beforeDate: ${beforeDateObj.toISOString()}`);

          const phases = ['Plan', 'Do', 'Check', 'Act'] as const;
          let hasUpcomingDeadline = false;

          for (const phase of phases) {
            const step = steps[phase];
            if (step?.Deadline && !step.Finished) {
              const deadlineDate = new Date(step.Deadline);
              const isPast = deadlineDate < beforeDateObj;
              const isUpcoming = deadlineDate >= beforeDateObj; // Remove upper bound check

              logger.debug(`[Deadline Debug] ${phase} phase deadline ${deadlineDate.toISOString()}:`);
              logger.debug(`- Is past deadline: ${isPast}`);
              logger.debug(`- Is upcoming deadline: ${isUpcoming}`);

              if (isPast || isUpcoming) {
                hasUpcomingDeadline = true;
                logger.debug(
                  `[Deadline Debug] Found relevant ${isPast ? 'past' : 'upcoming'} deadline for ${phase} phase`
                );
              }
            }
          }

          return hasUpcomingDeadline;
        });
      });
  } catch (error) {
    logger.error(`[Deadline Debug] Error in getPDCAPhaseDeadlines: ${error}`);
    return [];
  }
}

export async function getTodoItemDeadlines(beforeDate: string, endDate: string) {
  logger.debug(`[Deadline Debug] Getting todo item deadlines between ${beforeDate} and ${endDate}`);
  try {
    const results = await prisma.preventief.findMany({
      where: {
        TodoItems: {
          some: {
            OR: [
              {
                Deadline: { lt: beforeDate },
                Status: { not: 'Done' }
              },
              {
                Deadline: {
                  gte: beforeDate,
                  lt: endDate
                },
                Status: { not: 'Done' }
              }
            ]
          }
        },
        Status: {
          StatusNaam: { not: 'Afgerond' }
        }
      },
      include: {
        Status: {
          select: {
            id: true,
            StatusNaam: true
          }
        },
        User: {
          select: {
            id: true,
            Name: true
          }
        },
        Begeleider: {
          select: {
            id: true,
            Name: true
          }
        },
        Melding: {
          select: {
            id: true,
            Title: true,
            VolgNummer: true
          }
        }
      }
    });
    logger.debug(`[Deadline Debug] Found ${results.length} preventief records with todo deadlines`);
    results.forEach((p) => {
      const todoItems = p.TodoItems || [];
      logger.debug(`[Deadline Debug] Preventief ${p.id} has ${todoItems.length} todo items:`);
      todoItems.forEach((item) => {
        if (item.Deadline) {
          const deadlineDate = new Date(item.Deadline);
          const isPast = deadlineDate < new Date(beforeDate);
          logger.debug(
            `[Deadline Debug] - Todo item ${item.id}: deadline ${item.Deadline}, status: ${item.Status}, is past: ${isPast}`
          );
        }
      });
    });
    return results;
  } catch (error) {
    logger.error(`[Deadline Debug] Error getting todo item deadlines: ${error}`);
    return [];
  }
}

export async function getTodayPreventiefDeadlines(startDate: string, endDate: string) {
  logger.debug(`[Deadline Debug] Getting today's preventief deadlines between ${startDate} and ${endDate}`);
  try {
    const results = await prisma.preventief.findMany({
      where: {
        Deadline: {
          gte: startDate,
          lt: endDate
        },
        Status: {
          StatusNaam: { not: 'Afgerond' }
        }
      },
      select: deadlineSelect
    });
    logger.debug(`[Deadline Debug] Found ${results.length} today's preventief deadlines`);
    results.forEach((p) => {
      logger.debug(
        `[Deadline Debug] Today's preventief ${p.id}: deadline ${p.Deadline}, status: ${p.Status?.StatusNaam}`
      );
    });
    return results;
  } catch (error) {
    logger.error(`[Deadline Debug] Error getting today's preventief deadlines: ${error}`);
    return [];
  }
}

export async function getTodayCorrectiefDeadlines(startDate: string, endDate: string) {
  logger.debug(`[Deadline Debug] Getting today's correctief deadlines between ${startDate} and ${endDate}`);
  try {
    const results = await prisma.correctief.findMany({
      where: {
        Deadline: {
          gte: startDate,
          lt: endDate
        },
        Status: {
          StatusNaam: { not: 'Afgerond' }
        }
      },
      select: correctiefDeadlineSelect
    });
    logger.debug(`[Deadline Debug] Found ${results.length} today's correctief deadlines`);
    results.forEach((c) => {
      logger.debug(
        `[Deadline Debug] Today's correctief ${c.id}: deadline ${c.Deadline}, status: ${c.Status?.StatusNaam}`
      );
    });
    return results;
  } catch (error) {
    logger.error(`[Deadline Debug] Error getting today's correctief deadlines: ${error}`);
    return [];
  }
}
