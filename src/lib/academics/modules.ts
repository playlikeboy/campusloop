import type { AcademicAttachment, AcademicModule } from "@/db/schema/academic-resources";

/**
 * Resolve the module structure to render for a resource. Older resources (uploaded before
 * modules existed) only have a flat `attachments` list — synthesize a single implicit
 * "Materials" module from it so the detail/watch UI never has to special-case "no modules".
 */
export function getEffectiveModules(resource: {
  modules?: unknown;
  attachments?: unknown;
  title?: string;
}): AcademicModule[] {
  if (Array.isArray(resource.modules) && resource.modules.length > 0) {
    return resource.modules as AcademicModule[];
  }

  const attachments = Array.isArray(resource.attachments) ? (resource.attachments as AcademicAttachment[]) : [];
  if (attachments.length === 0) return [];

  return [
    {
      id: "materials",
      title: "Materials",
      order: 0,
      attachments,
    },
  ];
}

export interface FlatAttachmentEntry {
  moduleIndex: number;
  moduleTitle: string;
  attachmentIndex: number;
  attachment: AcademicAttachment;
}

/** Flatten modules into a single ordered list, carrying module context for sidebars/switchers. */
export function flattenModules(modules: AcademicModule[]): FlatAttachmentEntry[] {
  const out: FlatAttachmentEntry[] = [];
  modules.forEach((mod, moduleIndex) => {
    mod.attachments.forEach((attachment, attachmentIndex) => {
      out.push({
        moduleIndex,
        moduleTitle: mod.title?.trim() || `Module ${moduleIndex + 1}`,
        attachmentIndex,
        attachment,
      });
    });
  });
  return out;
}
