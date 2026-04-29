/**
 * BrandKit version snapshotting.
 *
 * Snapshots are created in BrandKitVersion any time skillMd / designSystemMd /
 * layoutLibraryMd / brandVars changes. They're append-only and let users
 * roll back to a prior state without invoking re-extraction.
 */

import { prisma } from "@/lib/db";

export async function snapshotKit(
  kitId: string,
  changeReason: string,
): Promise<void> {
  const kit = await prisma.brandKit.findUnique({
    where: { id: kitId },
    select: {
      version: true,
      brandVars: true,
      skillMd: true,
      designSystemMd: true,
      layoutLibraryMd: true,
    },
  });
  if (!kit) return;

  await prisma.brandKitVersion.create({
    data: {
      brandKitId: kitId,
      version: kit.version,
      brandVars: kit.brandVars as object,
      skillMd: kit.skillMd,
      designSystemMd: kit.designSystemMd,
      layoutLibraryMd: kit.layoutLibraryMd,
      changeReason,
    },
  });
}
