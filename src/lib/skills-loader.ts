import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface Skill {
  name: string;
  description: string;
  body: string;
  sharedBody: string; // shared/ files (design-system, layout-library) — excluded when brand is active
  filePath: string;
}

let _cachedSkills: Skill[] | null = null;

export function loadSkills(skillsDir?: string): Skill[] {
  if (_cachedSkills) return _cachedSkills;

  const dir = skillsDir ?? path.join(process.cwd(), "src", "skills");

  if (!fs.existsSync(dir)) {
    _cachedSkills = [];
    return [];
  }

  const skills: Skill[] = [];

  function walk(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory() && entry.name !== "references" && entry.name !== "shared" && entry.name !== "legacy_skills") {
        walk(fullPath);
      } else if (entry.name === "SKILL.md") {
        try {
          const raw = fs.readFileSync(fullPath, "utf-8");
          const { data, content } = matter(raw);

          // Append any reference markdown files from a references/ subdirectory
          // design-system.md and layout-library.md go to sharedBody (excluded when brand active)
          // all other references go to body
          let body = content.trim();
          let sharedBody = "";
          const refsDir = path.join(path.dirname(fullPath), "references");
          if (fs.existsSync(refsDir)) {
            const refFiles = fs.readdirSync(refsDir)
              .filter((f) => f.endsWith(".md"))
              .sort();
            for (const refFile of refFiles) {
              const refContent = fs.readFileSync(path.join(refsDir, refFile), "utf-8");
              if (refFile === "design-system.md" || refFile === "layout-library.md") {
                sharedBody += `\n\n---\n\n${refContent.trim()}`;
              } else {
                body += `\n\n---\n\n${refContent.trim()}`;
              }
            }
          }

          // For subdomain skills (e.g. business_corporate/investment_finance),
          // collect shared/ markdown files from the parent domain directory separately
          // so they can be excluded when a brand config is active (brand replaces design system)
          const parentDir = path.dirname(path.dirname(fullPath));
          const sharedDir = path.join(parentDir, "shared");
          if (fs.existsSync(sharedDir)) {
            const sharedFiles = fs.readdirSync(sharedDir)
              .filter((f) => f.endsWith(".md"))
              .sort();
            for (const sharedFile of sharedFiles) {
              const sharedContent = fs.readFileSync(path.join(sharedDir, sharedFile), "utf-8");
              sharedBody += `\n\n---\n\n${sharedContent.trim()}`;
            }
          }

          skills.push({
            name: data.name ?? path.basename(path.dirname(fullPath)),
            description: data.description ?? "",
            body,
            sharedBody,
            filePath: fullPath,
          });
        } catch (err) {
          console.warn(`[skills-loader] Failed to parse ${fullPath}:`, err);
        }
      }
    }
  }

  walk(dir);
  _cachedSkills = skills;
  return skills;
}

/**
 * Build the "## Available Skills" section of the system prompt.
 *
 * When a brand skill is provided:
 *  - Disk skills' body (presentation-type rules, slide-type guidance, etc.) is kept,
 *    but their sharedBody (generic design-system + layout-library) is stripped —
 *    the brand skill replaces those with brand-specific equivalents.
 *  - The brand skill is appended last so it has highest recency in the prompt.
 *
 * When no brand skill is provided, disk skills emit their full content
 * (body + sharedBody) as before.
 */
export function buildSkillsSection(
  skills: Skill[],
  options: { brandSkill?: Skill } = {},
): string {
  const { brandSkill } = options;
  if (!skills.length && !brandSkill) return "";

  const renderSkill = (s: Skill, includeShared: boolean): string => {
    const header = `### Skill: ${s.name}${s.description ? `\n_${s.description}_` : ""}`;
    const content = includeShared ? s.body + s.sharedBody : s.body;
    return `${header}\n\n${content}`;
  };

  const sections: string[] = skills.map((s) =>
    renderSkill(s, /* includeShared */ !brandSkill),
  );

  if (brandSkill) {
    sections.push(renderSkill(brandSkill, /* includeShared */ true));
  }

  return `## Available Skills\n\n${sections.join("\n\n---\n\n")}`;
}

