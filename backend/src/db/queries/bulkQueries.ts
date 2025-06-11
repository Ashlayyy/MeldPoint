/* eslint-disable @typescript-eslint/return-await */
import prisma from '../prismaClient';
import type { Melding } from '../../types/queryTypes';

export async function addMultipleReports(data: Melding[]) {
  return prisma.$transaction(async (tx) => {
    try {
      const results = await Promise.all(
        data.map(async (initialReport: any) => {
          const report = initialReport.data;
          report.VolgNummer = initialReport.VolgNummer;

          const meldingData: any = {
            Obstakel: report.Obstakel || '',
            Type: report.Type || 'Melding',
            Deelorder: report.Deelorder || '',
            PDCA: report.PDCA || false,
            Archived: false,
            VolgNummer: report.VolgNummer,
            // Add optional connections only if they exist
            ...(report.ProjectID && {
              Project: { connect: { id: report.ProjectID } }
            }),
            ...(report.ActiehouderID && {
              Actiehouder: { connect: { id: report.ActiehouderID } }
            }),
            ...(report.UserID && {
              User: { connect: { id: report.UserID } }
            })
          };

          const melding = await tx.melding.create({
            data: meldingData
          });

          // Handle Project updates if needed
          if (report.ProjectID) {
            const projectUpdates: any = {};

            if (report.Project?.ProjectleiderId) {
              projectUpdates.ProjectLeider = {
                connect: { id: report.Project.ProjectleiderId }
              };
            }

            if (report.Deelorder) {
              const project = await tx.project.findUnique({
                where: { id: report.ProjectID },
                select: { Deelorders: true }
              });

              if (project && !project.Deelorders.includes(report.Deelorder)) {
                projectUpdates.Deelorders = { push: report.Deelorder };
              }
            }

            if (Object.keys(projectUpdates).length > 0) {
              await tx.project.update({
                where: { id: report.ProjectID },
                data: projectUpdates
              });
            }
          }

          // Create Preventief if needed
          if (report.Preventief) {
            const preventiefData: any = {
              Deadline: report.Preventief.Deadline,
              Melding: { connect: { id: melding.id } },
              ...(report.Preventief.StatusID && {
                Status: { connect: { id: report.Preventief.StatusID } }
              }),
              ...(report.Preventief.ActiehouderID && {
                Actiehouder: { connect: { id: report.Preventief.ActiehouderID } }
              })
            };

            await tx.preventief.create({ data: preventiefData });
          }

          // Create Correctief if needed
          if (report.Correctief) {
            const correctiefData: any = {
              Deadline: report.Correctief.Deadline,
              Oplossing: report.Correctief.Oplossing || '',
              Faalkosten: Number(report.Correctief.Faalkosten) || null,
              AkoordOPS: report.Correctief.AkoordOPS || false,
              Melding: { connect: { id: melding.id } },
              ...(report.Correctief.StatusID && {
                Status: { connect: { id: report.Correctief.StatusID } }
              }),
              ...(report.Correctief.ActiehouderID && {
                Actiehouder: { connect: { id: report.Correctief.ActiehouderID } }
              })
            };

            await tx.correctief.create({ data: correctiefData });
          }

          return melding.id;
        })
      );

      return results;
    } catch (e) {
      console.error('Error in addMultipleReports:', e);
      throw e;
    }
  });
}

export async function createMultipleProjects(
  data: Array<{
    ProjectNaam: string;
    NumberID: number;
    ProjectLeiderID?: string;
  }>
) {
  return prisma.$transaction(
    data.map((project) =>
      prisma.project.create({
        data: {
          ProjectNaam: project.ProjectNaam,
          NumberID: Number(project.NumberID),
          Deelorders: [],
          ...(project.ProjectLeiderID && {
            ProjectLeider: { connect: { id: project.ProjectLeiderID } }
          })
        }
      })
    )
  );
}

export async function createMultipleProjectleiders(names: string[]) {
  return prisma.$transaction(
    names.map((name) =>
      prisma.projectleider.create({
        data: {
          Name: name
        }
      })
    )
  );
}

// Helper function to process data in chunks if needed
async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
  }

  return results;
}
