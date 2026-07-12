import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { memberships, organizations } from "@/db/schema/org";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";

export type PersonalWorkspaceUser = {
  id: string;
  name: string;
};

export async function createPersonalWorkspace(user: PersonalWorkspaceUser) {
  const firstName = user.name.trim().split(/\s+/)[0] || "My";
  const name = `${firstName}'s workspace`;
  const slug = user.id;

  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name, slug })
      .returning();

    if (!org) {
      throw new Error("Failed to create personal workspace organization");
    }

    await tx.insert(memberships).values({
      orgId: org.id,
      userId: user.id,
      role: "owner",
    });

    return org;
  });
}

/**
 * Called from Better Auth user.create.after (post-commit).
 * Org+membership are transactional; on failure we compensate by deleting the user
 * because BA after-hooks cannot participate in the signup SQL transaction.
 */
export async function provisionPersonalWorkspaceOnSignup(
  user: PersonalWorkspaceUser,
) {
  try {
    return await createPersonalWorkspace(user);
  } catch (provisionError) {
    try {
      await db.delete(users).where(eq(users.id, user.id));
    } catch (cleanupError) {
      logger.error("ORPHAN_USER_NO_WORKSPACE", {
        userId: user.id,
        provisionError:
          provisionError instanceof Error
            ? provisionError.message
            : String(provisionError),
        cleanupError:
          cleanupError instanceof Error
            ? cleanupError.message
            : String(cleanupError),
      });
      throw cleanupError;
    }
    throw provisionError;
  }
}
