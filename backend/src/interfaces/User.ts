import { User as PrismaUser } from '@prisma/client';

export interface User extends PrismaUser {
  Department?: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  userPermissions?: Array<{
    permission: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
  userRoles?: Array<{
    role: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
  userGroups?: Array<{
    group: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
}
