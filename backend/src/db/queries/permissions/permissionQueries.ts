/* eslint-disable no-return-await */
import type { Permission, PermissionGroup, Role } from '@prisma/client';
import prisma from '../../prismaClient';
import userSelect from '../helpFunctions/userSelect';
// Create operations
export async function createPermission(data: Partial<Permission>) {
  return await prisma.permission.create({
    data: {
      name: data.name!,
      description: data.description,
      action: data.action!,
      resourceType: data.resourceType!
    }
  });
}

export async function createPermissionGroup(data: Partial<PermissionGroup>) {
  return await prisma.permissionGroup.create({
    data: {
      name: data.name!,
      description: data.description
    }
  });
}

export async function createRole(data: Partial<Role>) {
  return await prisma.role.create({
    data: {
      name: data.name!,
      description: data.description,
      department: data.department
    }
  });
}

// Assignment operations
export async function assignPermissionToUser(userId: string, permissionId: string) {
  try {
    return await prisma.usersOnPermissions.create({
      data: {
        userId,
        permissionId
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Permission is already assigned to this user');
    }
    throw error;
  }
}

export async function assignPermissionToRole(roleId: string, permissionId: string) {
  try {
    return await prisma.rolesOnPermissions.create({
      data: {
        roleId,
        permissionId
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Permission is already assigned to this role');
    }
    throw error;
  }
}

export async function assignPermissionToGroup(groupId: string, permissionId: string) {
  try {
    // Check if the assignment already exists
    const existing = await prisma.permissionGroupsOnPermissions.findUnique({
      where: {
        groupId_permissionId: {
          groupId,
          permissionId
        }
      }
    });

    if (existing) {
      throw new Error('Permission is already assigned to this group');
    }

    return await prisma.permissionGroupsOnPermissions.create({
      data: {
        groupId,
        permissionId
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002' || error.message === 'Permission is already assigned to this group') {
      throw new Error('Permission is already assigned to this group');
    }
    throw error;
  }
}

export async function assignRoleToUser(userId: string, roleId: string) {
  try {
    return await prisma.usersOnRoles.create({
      data: {
        userId,
        roleId
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Role is already assigned to this user');
    }
    throw error;
  }
}

export async function assignGroupToUser(userId: string, groupId: string) {
  try {
    return await prisma.usersOnPermissionGroups.create({
      data: {
        userId,
        groupId
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Group is already assigned to this user');
    }
    throw error;
  }
}

export async function assignGroupToRole(roleId: string, groupId: string) {
  try {
    return await prisma.rolesOnPermissionGroups.create({
      data: {
        roleId,
        groupId
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Group is already assigned to this role');
    }
    throw error;
  }
}

// Removal operations
export async function removePermissionFromUser(userId: string, permissionId: string) {
  return await prisma.usersOnPermissions.delete({
    where: {
      userId_permissionId: {
        userId,
        permissionId
      }
    }
  });
}

export async function removePermissionFromRole(roleId: string, permissionId: string) {
  return await prisma.rolesOnPermissions.delete({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId
      }
    }
  });
}

export async function removePermissionFromGroup(groupId: string, permissionId: string) {
  return await prisma.permissionGroupsOnPermissions.delete({
    where: {
      groupId_permissionId: {
        groupId,
        permissionId
      }
    }
  });
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  return await prisma.usersOnRoles.delete({
    where: {
      userId_roleId: {
        userId,
        roleId
      }
    }
  });
}

export async function removeGroupFromUser(userId: string, groupId: string) {
  return await prisma.usersOnPermissionGroups.delete({
    where: {
      userId_groupId: {
        userId,
        groupId
      }
    }
  });
}

export async function removeGroupFromRole(roleId: string, groupId: string) {
  return await prisma.rolesOnPermissionGroups.delete({
    where: {
      roleId_groupId: {
        roleId,
        groupId
      }
    }
  });
}

// Get operations with includes
export async function getPermissionWithRelations(id: string) {
  return await prisma.permission.findUnique({
    where: { id },
    include: {
      userPermissions: {
        include: {
          user: { select: userSelect }
        }
      },
      rolePermissions: {
        include: {
          role: true
        }
      },
      permissionGroupRelations: {
        include: {
          group: true
        }
      }
    }
  });
}

export async function getPermissionGroupWithRelations(id: string) {
  return await prisma.permissionGroup.findUnique({
    where: { id },
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      roles: {
        include: {
          role: true
        }
      },
      userGroups: {
        include: {
          user: { select: userSelect }
        }
      }
    }
  });
}

export async function getRoleWithRelations(id: string) {
  return await prisma.role.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: {
          user: { select: userSelect }
        }
      },
      rolePermissions: {
        include: {
          permission: true
        }
      },
      rolePermissionGroups: {
        include: {
          group: true
        }
      }
    }
  });
}

// Update operations
export async function updatePermission(id: string, data: Partial<Permission>) {
  return await prisma.permission.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.action && { action: data.action }),
      ...(data.resourceType && { resourceType: data.resourceType })
    }
  });
}

export async function updatePermissionGroup(id: string, data: Partial<PermissionGroup>) {
  return await prisma.permissionGroup.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description })
    }
  });
}

export async function updateRole(id: string, data: Partial<Role>) {
  return await prisma.role.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.department && { department: data.department })
    }
  });
}

// Delete operations
export async function deletePermission(id: string) {
  return await prisma.$transaction([
    prisma.usersOnPermissions.deleteMany({ where: { permissionId: id } }),
    prisma.rolesOnPermissions.deleteMany({ where: { permissionId: id } }),
    prisma.permissionGroupsOnPermissions.deleteMany({ where: { permissionId: id } }),
    prisma.permission.delete({ where: { id } })
  ]);
}

export async function deletePermissionGroup(id: string) {
  return await prisma.$transaction([
    prisma.permissionGroupsOnPermissions.deleteMany({ where: { groupId: id } }),
    prisma.rolesOnPermissionGroups.deleteMany({ where: { groupId: id } }),
    prisma.usersOnPermissionGroups.deleteMany({ where: { groupId: id } }),
    prisma.permissionGroup.delete({ where: { id } })
  ]);
}

export async function deleteRole(id: string) {
  return await prisma.$transaction([
    prisma.usersOnRoles.deleteMany({ where: { roleId: id } }),
    prisma.rolesOnPermissions.deleteMany({ where: { roleId: id } }),
    prisma.rolesOnPermissionGroups.deleteMany({ where: { roleId: id } }),
    prisma.role.delete({ where: { id } })
  ]);
}

// Get single items
export async function getSinglePermission(id: string) {
  return await prisma.permission.findUnique({
    where: { id },
    include: {
      userPermissions: {
        include: { user: { select: userSelect } }
      },
      rolePermissions: {
        include: { role: true }
      },
      permissionGroupRelations: {
        include: { group: true }
      }
    }
  });
}

export async function getSinglePermissionGroup(id: string) {
  return await prisma.permissionGroup.findUnique({
    where: { id },
    include: {
      permissions: {
        include: { permission: true }
      },
      roles: {
        include: { role: true }
      },
      userGroups: {
        include: { user: { select: userSelect } }
      }
    }
  });
}

export async function getSingleRole(id: string) {
  return await prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: { permission: true }
      },
      rolePermissionGroups: {
        include: { group: true }
      },
      userRoles: {
        include: { user: { select: userSelect } }
      }
    }
  });
}

// Get all items
export async function getAllPermissions() {
  return await prisma.permission.findMany({
    orderBy: { name: 'asc' },
    include: {
      userPermissions: {
        include: { user: { select: userSelect } }
      },
      rolePermissions: {
        include: { role: true }
      },
      permissionGroupRelations: {
        include: { group: true }
      }
    }
  });
}

export async function getAllPermissionGroups() {
  return await prisma.permissionGroup.findMany({
    orderBy: { name: 'asc' },
    include: {
      permissions: {
        include: { permission: true }
      },
      roles: {
        include: { role: true }
      },
      userGroups: {
        include: { user: { select: userSelect } }
      }
    }
  });
}

export async function getAllRoles() {
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
    include: {
      userRoles: {
        include: { user: { select: userSelect } }
      },
      rolePermissions: {
        include: {
          permission: true
        }
      },
      rolePermissionGroups: {
        include: {
          group: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Check for null permissions and handle accordingly
  roles.forEach((role) => {
    if (!role.rolePermissions || role.rolePermissions.some((rp) => !rp.permission)) {
      console.warn(`Role ${role.name} has null permissions.`);
    }
  });

  return roles;
}

// Add this new function
export async function getUserWithPermissions(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userPermissions: {
        include: {
          permission: true
        }
      },
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              },
              rolePermissionGroups: {
                include: {
                  group: {
                    include: {
                      permissions: {
                        include: {
                          permission: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      userGroups: {
        include: {
          group: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });
}
