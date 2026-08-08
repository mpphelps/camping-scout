import { prisma } from "@campingmeow/database";
import { splitName } from "../../app/lib/name";

export type CreateOwnerUserOverrides = {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string | null;
};

export async function createOwnerUser(overrides: CreateOwnerUserOverrides = {}) {
  const name = overrides.name ?? "Owner User";
  const fallback = splitName(name);
  return prisma.user.create({
    data: {
      email: overrides.email ?? "owner@example.com",
      firstName: overrides.firstName ?? fallback.firstName,
      lastName: overrides.lastName !== undefined ? overrides.lastName : fallback.lastName,
    },
  });
}
