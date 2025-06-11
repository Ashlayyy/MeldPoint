const userSelect = {
  id: true,
  Email: true,
  Name: true,
  Department: true,
  lastLogin: true,
  CreatedAt: true,
  UpdatedAt: true,
  MicrosoftId: true,
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
};

export default userSelect;
