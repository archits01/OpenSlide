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

export function buildSkillsSection(skills: Skill[], stripShared = false): string {
  if (!skills.length) return "";

  const sections = skills.map((s) => {
    const header = `### Skill: ${s.name}${s.description ? `\n_${s.description}_` : ""}`;
    const content = stripShared ? s.body : s.body + s.sharedBody;
    return `${header}\n\n${content}`;
  });

  return `## Available Skills\n\n${sections.join("\n\n---\n\n")}`;
}

