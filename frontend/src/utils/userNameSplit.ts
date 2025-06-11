/**
 * Generates initials from a user object's Name property.
 * Handles various edge cases like null/undefined user or name, empty strings,
 * extra whitespace, single names, and multiple-part names.
 *
 * @param user - The user object, expected to have a 'Name' property.
 * @returns A string containing the uppercased initials (e.g., "JD") or undefined if initials cannot be determined.
 */
const userNameSplit = (user: any | null | undefined): string | undefined => {
  if (!user || typeof user.Name !== 'string' || user.Name.trim().length === 0) {
    return undefined;
  }

  const trimmedName = user.Name.trim();

  const parts = trimmedName.split(' ').filter((part: string) => part.length > 0);

  if (parts.length === 0) {
    return undefined;
  }

  if (parts.length === 1) {
    const namePart = parts[0];
    if (namePart.length === 1) {
      return (namePart + namePart).toUpperCase();
    } else {
      return namePart.substring(0, 2).toUpperCase();
    }
  }

  const firstInitial = parts[0][0];
  const lastInitial = parts[parts.length - 1][0];
  return (firstInitial + lastInitial).toUpperCase();
};

export default userNameSplit;
