import logger from './logger';
import { TaskService } from '../modules/Task/service/TaskService';

function preparePreventiefTaskDataReportSide(preventief: any) {
  console.log(preventief);
  if (!preventief.Melding) {
    return;
  }
  return {
    userId: preventief?.User?.id,
    url: `/verbeterplein/melding/${preventief.Melding[0]?.VolgNummer}`,
    message: `Preventief deadine (#${preventief.Melding[0]?.VolgNummer})`,
    action: `Preventief deadine (#${preventief.Melding[0]?.VolgNummer})`,
    deadline: preventief?.Deadline,
    actionType: 'traject',
    category: 'preventief',
    preventiefId: preventief?.id,
    finished: false,
    level: preventief?.rootCauseLevel
  };
}

export async function handlePreventiefTaskUpdate(preventief: any, payload: any): Promise<void> {
  try {
    const existingTasks = await TaskService.getTasksByPreventief(preventief.id);
    const trajectTask = existingTasks.find((task) => task.actionType === 'traject');

    if (!trajectTask) {
      logger.info(`PreventiefTaskHandler: No traject task found for preventief ${preventief.id}, creating new task`);
      const taskData = preparePreventiefTaskDataReportSide(preventief);

      if (!taskData) {
        logger.info(`PreventiefTaskHandler: No task data found for preventief ${preventief.id}`);
        return;
      }

      TaskService.createTask(taskData)
        .then((task) => {
          logger.info(
            `PreventiefTaskHandler: Successfully created traject task ${task.id} for preventief ${preventief.id}`
          );
        })
        .catch((error) => {
          logger.error(`PreventiefTaskHandler: Failed to create traject task for preventief ${preventief.id}:`, error);
        });
    }
  } catch (error) {
    logger.error(`PreventiefTaskHandler: Error checking/creating traject task for preventief ${preventief.id}:`, error);
  }

  try {
    logger.info(
      `PreventiefTaskHandler: Processing tasks for preventief ${preventief.id}, payload: ${JSON.stringify(payload)}`
    );

    if (payload?.User?.id) {
      logger.info(
        `PreventiefTaskHandler: Reassigning tasks for preventief ${preventief.id} to user ${payload.User.id}`
      );
      const preventiefTasks = await TaskService.getTasksByPreventief(preventief.id);
      const trajectTasks = preventiefTasks.filter((task) => task.actionType === 'traject');
      trajectTasks.forEach((task) => {
        TaskService.updateSingleTaskByFilter(task.id, { user: { connect: { id: payload.User.id } } });
      });
      logger.info(
        `PreventiefTaskHandler: Reassigned ${preventiefTasks.length} tasks for preventief ${preventief.id} to user ${payload.User.id}`
      );
    } else {
      logger.info(`PreventiefTaskHandler: No user found in payload for preventief ${preventief.id}`);
    }

    if (payload?.Deadline) {
      logger.info(`PreventiefTaskHandler: Updating deadline for preventief ${preventief.id} to ${payload.Deadline}`);
      const preventiefTasks = await TaskService.getTasksByPreventief(preventief.id);
      const trajectTasks = preventiefTasks.filter((task) => task.actionType === 'traject');
      trajectTasks.forEach((task) => {
        TaskService.updateSingleTaskByFilter(task.id, { deadline: payload.Deadline });
      });
      logger.info(`PreventiefTaskHandler: Updated deadline for preventief ${preventief.id} to ${payload.Deadline}`);
    } else {
      logger.info(`PreventiefTaskHandler: No deadline found in payload for preventief ${preventief.id}`);
    }
  } catch (error) {
    logger.error(`PreventiefTaskHandler: Error in handleTaskUpdate for preventief ${preventief.id}:`, error);
  }
}
