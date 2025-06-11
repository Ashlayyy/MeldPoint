import { getSingleReportService } from '../modules/Melding/service/MeldingService';
import { TaskService } from '../modules/Task/service/TaskService';
import logger from './logger';
import { getSingleCorrectief } from '../db/queries/getSingleQueries';

async function fetchData(id: string, mode: string) {
  if (mode === 'melding') {
    const reportObject = await getSingleReportService(id);
    return reportObject;
  } else if (mode === 'correctief') {
    const correctiefObject = await getSingleCorrectief(id);
    return correctiefObject;
  }
  return null;
}

function prepareCorrectiefTaskDataReportSide(reportObject: any) {
  return {
    userId: reportObject.Correctief?.User?.id,
    url: `/verbeterplein/melding/${reportObject.VolgNummer}`,
    message: `Correctief deadine (#${reportObject.VolgNummer})`,
    action: `Correctief deadine (#${reportObject.VolgNummer})`,
    deadline: reportObject.Correctief?.Deadline,
    actionType: 'traject',
    category: 'correctief',
    correctiefId: reportObject.Correctief?.id,
    finished: false,
    level: 0
  };
}

function prepareCorrectiefTaskDataCorrectiefSide(reportObject: any) {
  console.log(reportObject);
  return {
    userId: reportObject?.User?.id,
    url: `/verbeterplein/melding/${reportObject.Melding.VolgNummer}`,
    message: `Correctief deadine (#${reportObject.Melding.VolgNummer})`,
    action: `Correctief deadine (#${reportObject.Melding.VolgNummer})`,
    deadline: reportObject?.Deadline,
    actionType: 'traject',
    category: 'correctief',
    correctiefId: reportObject?.id,
    finished: false,
    level: 0
  };
}

export async function handleCorrectiefTaskCreationReportSide(report: any, mode: string = 'report'): Promise<void> {
  try {
    logger.info(`CorrectiefTaskHandler: Processing tasks for report ${report.id}`);
    const reportObject = await fetchData(report.id, mode);
    if (reportObject?.Correctief && reportObject.Correctief.id) {
      const correctiefTaskData = prepareCorrectiefTaskDataReportSide(reportObject);

      TaskService.createTask(correctiefTaskData)
        .then((task) => {
          logger.info(`CorrectiefTaskHandler: Successfully created correctief task ${task.id} for report ${report.id}`);
        })
        .catch((error) => {
          logger.error(`CorrectiefTaskHandler: Failed to create correctief task for report ${report.id}:`, error);
        });
    } else {
      logger.info(`CorrectiefTaskHandler: No correctief data found in report ${report.id}`);
    }
  } catch (error) {
    logger.error(`CorrectiefTaskHandler: Error in handleTaskCreation for report ${report.id}:`, error);
  }
}

export async function handleCorrectiefTaskCreationCorrectiefSide(correctief: any): Promise<void> {
  try {
    logger.info(`CorrectiefTaskHandler: Processing tasks for correctief ${correctief.id}`);
    const correctiefObject = await fetchData(correctief.id, 'correctief');
    if (correctiefObject?.Correctief && correctiefObject.Correctief.id) {
      const correctiefTaskData = prepareCorrectiefTaskDataCorrectiefSide(correctiefObject);

      TaskService.createTask(correctiefTaskData)
        .then((task) => {
          logger.info(
            `CorrectiefTaskHandler: Successfully created correctief task ${task.id} for correctief ${correctief.id}`
          );
        })
        .catch((error) => {
          logger.error(
            `CorrectiefTaskHandler: Failed to create correctief task for correctief ${correctief.id}:`,
            error
          );
        });
    } else {
      logger.info(`CorrectiefTaskHandler: No correctief data found in correctief ${correctief.id}`);
    }
  } catch (error) {
    logger.error(`CorrectiefTaskHandler: Error in handleTaskCreation for correctief ${correctief.id}:`, error);
  }
}

export async function handleCorrectiefTaskUpdate(correctief: any, payload: any): Promise<void> {
  try {
    const existingTasks = await TaskService.getTasksByCorrectief(correctief.id);
    const trajectTask = existingTasks.find((task) => task.actionType === 'traject');

    if (!trajectTask) {
      logger.info(`CorrectiefTaskHandler: No traject task found for correctief ${correctief.id}, creating new task`);
      const taskData = prepareCorrectiefTaskDataCorrectiefSide(correctief);

      TaskService.createTask(taskData)
        .then((task) => {
          logger.info(
            `CorrectiefTaskHandler: Successfully created traject task ${task.id} for correctief ${correctief.id}`
          );
        })
        .catch((error) => {
          console.log(error);
          logger.error(`CorrectiefTaskHandler: Failed to create traject task for correctief ${correctief.id}:`, error);
        });
    } else {
      logger.info(`CorrectiefTaskHandler: traject task already exists for correctief ${correctief.id}`);
    }
  } catch (error) {
    logger.error(`CorrectiefTaskHandler: Error checking/creating traject task for correctief ${correctief.id}:`, error);
  }

  try {
    logger.info(
      `CorrectiefTaskHandler: Processing tasks for correctief ${correctief.id}, payload: ${JSON.stringify(payload)}`
    );

    if (payload?.User?.connect?.id) {
      logger.info(
        `CorrectiefTaskHandler: Reassigning tasks for correctief ${correctief.id} to user ${payload.User.connect.id}`
      );
      const correctiefTasks = await TaskService.getTasksByCorrectief(correctief.id);
      const trajectTasks = correctiefTasks.filter((task) => task.actionType === 'traject');
      trajectTasks.forEach((task) => {
        TaskService.updateSingleTaskByFilter(task.id, { user: { connect: { id: payload.User.connect.id } } });
      });
      logger.info(
        `CorrectiefTaskHandler: Reassigned ${correctiefTasks.length} tasks for correctief ${correctief.id} to user ${payload.User.connect.id}`
      );
    } else {
      logger.info(`CorrectiefTaskHandler: No user found in payload for correctief ${correctief.id}`);
    }

    if (payload?.Deadline) {
      logger.info(`CorrectiefTaskHandler: Updating deadline for correctief ${correctief.id} to ${payload.Deadline}`);
      const correctiefTasks = await TaskService.getTasksByCorrectief(correctief.id);
      const trajectTasks = correctiefTasks.filter((task) => task.actionType === 'traject');
      trajectTasks.forEach((task) => {
        TaskService.updateSingleTaskByFilter(task.id, { deadline: payload.Deadline });
      });
      logger.info(`CorrectiefTaskHandler: Updated deadline for correctief ${correctief.id} to ${payload.Deadline}`);
    } else {
      logger.info(`CorrectiefTaskHandler: No deadline found in payload for correctief ${correctief.id}`);
    }
  } catch (error) {
    console.log(error);
    logger.error(`CorrectiefTaskHandler: Error in handleTaskUpdate for correctief ${correctief.id}:`, error);
  }
}
