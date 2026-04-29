import fs from "fs";
import path from "path";
import type { Skill } from "@/lib/skills-loader";
import { type SlideCategory, resolveSkillName, allSlideSkillNames } from "@/skills/slide-categories/slide-classifier";
import { type DocCategory, docCategoryToSkillName, allDocSkillNames } from "@/skills/DocSkills/doc-classifier";
import { type SheetCategory, sheetCategoryToSkillName, allSheetSkillNames } from "@/skills/SheetSkills/sheet-classifier";

export type SkillsFilterInput =
  | { mode: 'docs'; docCategory?: DocCategory; deepResearch?: boolean }
  | { mode: 'sheets'; sheetCategory?: SheetCategory }
  | { mode: 'slides'; slideCategory?: SlideCategory; deepResearch?: boolean; hasBrand: boolean; presentationType?: string };

export function filterSkillsForMode(allSkills: Skill[], input: SkillsFilterInput): Skill[] {
  switch (input.mode) {
    case 'docs': {
      // Docs mode: exclude slide skills, load only the matched doc skill
      const slideSkillNames = allSlideSkillNames();
      const docSkillNames = allDocSkillNames();
      const selectedDocSkill = input.docCategory ? docCategoryToSkillName(input.docCategory) : null;

      return allSkills.filter((s) => {
        if (s.name === "deep-research" && !input.deepResearch) return false; // only load when deep research is active
        if (slideSkillNames.includes(s.name)) return false; // exclude all slide skills
        if (docSkillNames.includes(s.name)) {
          if (!selectedDocSkill) return true; // no category → keep all doc skills
          return s.name === selectedDocSkill; // only the matched doc skill
        }
        return true; // keep non-slide, non-doc utilities
      });
    }
    case 'sheets': {
      // Sheets mode: exclude slide and doc skills, load only the matched sheet skill
      const slideSkillNames = allSlideSkillNames();
      const docSkillNames = allDocSkillNames();
      const sheetSkillNames = allSheetSkillNames();
      const selectedSheetSkill = input.sheetCategory ? sheetCategoryToSkillName(input.sheetCategory) : null;

      return allSkills.filter((s) => {
        if (s.name === "deep-research") return false;
        if (slideSkillNames.includes(s.name)) return false;
        if (docSkillNames.includes(s.name)) return false;
        if (sheetSkillNames.includes(s.name)) {
          if (!selectedSheetSkill) return true;
          return s.name === selectedSheetSkill;
        }
        return true;
      });
    }
    case 'slides': {
      // Slide mode: keep all non-slide skills + ONLY the matching slide skill
      // Doc skills are excluded — they belong to docs mode only
      const selectedSkill = input.slideCategory ? resolveSkillName(input.slideCategory) : null;
      const slideSkillNames = allSlideSkillNames();
      const docSkillNames = allDocSkillNames();

      const skills = allSkills.filter((s) => {
        if (s.name === "deep-research" && !input.deepResearch) return false; // only load when deep research is active
        if (docSkillNames.includes(s.name)) return false; // doc skills only belong in docs mode
        if (s.name === "brand-template" && !input.hasBrand) return false; // only load if user has a brand config
        if (!slideSkillNames.includes(s.name)) return true; // keep research, categories, etc.
        if (!selectedSkill) return true; // no category → keep all (backward compat)
        return s.name === selectedSkill; // only the matched one
      });

      // Append type-specific content to the matched domain skill
      if (selectedSkill && input.presentationType) {
        const typeFilePath = path.join(process.cwd(), "src", "skills", selectedSkill, "types", `${input.presentationType}.md`);
        if (fs.existsSync(typeFilePath)) {
          const typeContent = fs.readFileSync(typeFilePath, "utf-8").trim();
          const matchedSkill = skills.find((s) => s.name === selectedSkill);
          if (matchedSkill) {
            matchedSkill.body += `\n\n---\n\n## Presentation Type: ${input.presentationType}\n\n${typeContent}`;
          }
        }
      }

      return skills;
    }
  }
}
