/* eslint-disable @typescript-eslint/return-await */
import prisma from '../../prismaClient';

export async function addCorrespondenceID(meldingID: string, correspondenceData: string) {
  const ids = await prisma.melding.findUnique({ where: { id: meldingID } });
  const existingIDs = JSON.parse(ids?.CorrespondenceIDs?.IDs || '[]');
  let finalOutput: string;
  let finalOutputArray: any = [];
  if (existingIDs.length > 0) {
    finalOutputArray = existingIDs.concat(correspondenceData);
    finalOutput = JSON.stringify(finalOutputArray);
  } else {
    finalOutputArray = correspondenceData;
    finalOutput = JSON.stringify(finalOutputArray);
  }
  return await prisma.melding.update({
    where: {
      id: meldingID
    },
    data: {
      CorrespondenceIDs: {
        set: {
          IDs: finalOutput
        }
      }
    },
    include: {
      Status: true,
      User: {
        select: {
          Name: true,
          Email: true,
          id: true,
          Department: true
        }
      },
      ChatRoom: {
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            },
            include: {
              user: {
                select: {
                  Name: true,
                  Email: true,
                  id: true,
                  Department: true
                }
              }
            }
          }
        }
      },
      Project: {
        include: {
          ProjectLeider: true
        }
      },
      Correctief: {
        include: {
          User: true,
          Status: true
        }
      },
      Preventief: {
        select: {
          id: true,
          CorrespondenceIDs: true,
          Kernoorzaak: true,
          Why: true,
          Deadline: true,
          Title: true,
          Smart: true,
          rootCauseLevel: true,
          Steps: true,
          Strategie: true,
          Conclusie: true,
          TodoItems: true,
          PDCAStatus: true,
          ActJSON: true,
          Teamleden: {
            select: {
              IDs: true
            }
          },
          Status: {
            select: {
              id: true,
              StatusNaam: true,
              StatusColor: true,
              StatusType: true
            }
          },
          User: {
            select: {
              id: true,
              Name: true,
              Department: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });
}

export async function addCorrespondenceIDPreventief(id: string, correspondenceData: string) {
  const ids = await prisma.preventief.findUnique({ where: { id } });
  const existingIDs = JSON.parse(ids?.CorrespondenceIDs?.IDs || '[]');
  let finalOutput: string;
  let finalOutputArray: any = [];
  if (existingIDs.length > 0) {
    finalOutputArray = existingIDs.concat(correspondenceData);
    finalOutput = JSON.stringify(finalOutputArray);
  } else {
    finalOutputArray = correspondenceData;
    finalOutput = JSON.stringify(finalOutputArray);
  }
  return await prisma.preventief.update({
    where: {
      id
    },
    data: {
      CorrespondenceIDs: {
        set: {
          IDs: finalOutput
        }
      }
    }
  });
}

export async function setCorrespondenceIDs(meldingID: string, correspondenceData: any) {
  const safeData = Array.isArray(correspondenceData) ? correspondenceData : [];
  const finalOutput = JSON.stringify(safeData);

  return await prisma.melding.update({
    where: {
      id: meldingID
    },
    data: {
      CorrespondenceIDs: {
        set: {
          IDs: finalOutput
        }
      }
    },
    include: {
      Status: true,
      User: {
        select: {
          Name: true,
          Email: true,
          id: true,
          Department: true
        }
      },
      ChatRoom: {
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            },
            include: {
              user: {
                select: {
                  Name: true,
                  Email: true,
                  id: true,
                  Department: true
                }
              }
            }
          }
        }
      },
      Project: {
        include: {
          ProjectLeider: true
        }
      },
      Correctief: {
        include: {
          User: true,
          Status: true
        }
      },
      Preventief: {
        select: {
          id: true,
          CorrespondenceIDs: true,
          Kernoorzaak: true,
          Why: true,
          Deadline: true,
          Title: true,
          Smart: true,
          rootCauseLevel: true,
          Steps: true,
          Strategie: true,
          Conclusie: true,
          TodoItems: true,
          PDCAStatus: true,
          ActJSON: true,
          Teamleden: {
            select: {
              IDs: true
            }
          },
          Status: {
            select: {
              id: true,
              StatusNaam: true,
              StatusColor: true,
              StatusType: true
            }
          },
          User: {
            select: {
              id: true,
              Name: true,
              Department: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });
}

export async function removeCorrespondenceID(meldingID: string, correspondenceData: any) {
  const melding = await prisma.melding.findUnique({
    where: {
      id: meldingID
    }
  });
  const meldingIDS: any = JSON.parse(melding?.CorrespondenceIDs?.IDs || '[]');
  const correspondenceID = correspondenceData;
  let correspondence: any;
  let deletedCorrespondence: any = null;

  if (meldingIDS[0]?.length > 0) {
    correspondence = meldingIDS[0].find((corr: any) => corr.key === correspondenceID);
  } else {
    correspondence = meldingIDS.find((corr: any) => corr.key === correspondenceID);
  }

  if (correspondence) {
    deletedCorrespondence = { ...correspondence };
    const ids: any[] = [];
    let filtered: any;
    if (meldingIDS[0]?.length > 0) {
      filtered = meldingIDS[0]?.filter((corr: any) => corr.key !== correspondenceID);
    } else {
      filtered = meldingIDS?.filter((corr: any) => corr.key !== correspondenceID);
    }
    filtered?.forEach((corr: any) => {
      ids.push(corr);
    });

    const updatedMelding = await prisma.melding.update({
      where: {
        id: meldingID
      },
      data: {
        CorrespondenceIDs: {
          set: {
            IDs: JSON.stringify(ids)
          }
        }
      },
      include: {
        Status: true,
        User: {
          select: {
            Name: true,
            Email: true,
            id: true,
            Department: true
          }
        },
        ChatRoom: {
          include: {
            messages: {
              orderBy: {
                createdAt: 'asc'
              },
              include: {
                user: {
                  select: {
                    Name: true,
                    Email: true,
                    id: true,
                    Department: true
                  }
                }
              }
            }
          }
        },
        Project: {
          include: {
            ProjectLeider: true
          }
        },
        Correctief: {
          include: {
            User: true,
            Status: true
          }
        },
        Preventief: {
          select: {
            id: true,
            CorrespondenceIDs: true,
            Kernoorzaak: true,
            Why: true,
            Deadline: true,
            Title: true,
            Smart: true,
            rootCauseLevel: true,
            Steps: true,
            Strategie: true,
            Conclusie: true,
            TodoItems: true,
            PDCAStatus: true,
            ActJSON: true,
            Teamleden: {
              select: {
                IDs: true
              }
            },
            Status: {
              select: {
                id: true,
                StatusNaam: true,
                StatusColor: true,
                StatusType: true
              }
            },
            User: {
              select: {
                id: true,
                Name: true,
                Department: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    return { updatedRecord: updatedMelding, deletedItem: deletedCorrespondence };
  }
  return { updatedRecord: null, deletedItem: null };
}

export async function deleteCorrespondenceIDs(meldingId: string) {
  return prisma.melding.update({
    where: { id: meldingId },
    data: {
      CorrespondenceIDs: null
    },
    include: {
      Status: true,
      User: {
        select: {
          Name: true,
          Email: true,
          id: true,
          Department: true
        }
      },
      ChatRoom: {
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            },
            include: {
              user: {
                select: {
                  Name: true,
                  Email: true,
                  id: true,
                  Department: true
                }
              }
            }
          }
        }
      },
      Project: {
        include: {
          ProjectLeider: true
        }
      },
      Correctief: {
        include: {
          User: true,
          Status: true
        }
      },
      Preventief: {
        select: {
          id: true,
          CorrespondenceIDs: true,
          Kernoorzaak: true,
          Why: true,
          Deadline: true,
          Title: true,
          Smart: true,
          rootCauseLevel: true,
          Steps: true,
          Strategie: true,
          Conclusie: true,
          TodoItems: true,
          PDCAStatus: true,
          ActJSON: true,
          Teamleden: {
            select: {
              IDs: true
            }
          },
          Status: {
            select: {
              id: true,
              StatusNaam: true,
              StatusColor: true,
              StatusType: true
            }
          },
          User: {
            select: {
              id: true,
              Name: true,
              Department: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });
}

export async function removeCorrespondenceIDPreventief(id: string, correspondenceData: string) {
  const preventief = await prisma.preventief.findUnique({
    where: {
      id
    }
  });
  const preventiefIDS: any = JSON.parse(preventief?.CorrespondenceIDs?.IDs || '[]');
  const correspondenceID = correspondenceData;
  let correspondence: any;
  let deletedCorrespondence: any = null;

  if (preventiefIDS[0]?.length > 0) {
    correspondence = preventiefIDS[0].find((corr: any) => corr.key === correspondenceID);
  } else {
    correspondence = preventiefIDS.find((corr: any) => corr.key === correspondenceID);
  }

  if (correspondence) {
    deletedCorrespondence = { ...correspondence };
    const ids: any[] = [];
    let filtered: any;
    if (preventiefIDS[0]?.length > 0) {
      filtered = preventiefIDS[0]?.filter((corr: any) => corr.key !== correspondenceID);
    } else {
      filtered = preventiefIDS?.filter((corr: any) => corr.key !== correspondenceID);
    }
    filtered?.forEach((corr: any) => {
      ids.push(corr);
    });

    const updatedPreventief = await prisma.preventief.update({
      where: {
        id
      },
      data: {
        CorrespondenceIDs: {
          set: {
            IDs: JSON.stringify(ids)
          }
        }
      }
    });
    return { updatedRecord: updatedPreventief, deletedItem: deletedCorrespondence };
  }
  return { updatedRecord: null, deletedItem: null };
}

export async function setCorrespondenceIDsPreventief(id: string, correspondenceData: any) {
  const finalOutput = JSON.stringify(correspondenceData);
  return await prisma.preventief.update({
    where: { id },
    data: { CorrespondenceIDs: { set: { IDs: finalOutput } } }
  });
}
