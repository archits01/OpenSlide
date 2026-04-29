import { type ToolProvider, type AgentTool, registerProvider } from "./index";
import { createSlideTool } from "./create-slide";
import { updateSlideTool } from "./update-slide";
import { deleteSlideTool } from "./delete-slide";
import { reorderSlidesTool } from "./reorder-slides";
import { setThemeTool } from "./set-theme";
import { createOutlineTool } from "./create-outline";
import { fetchLogoTool } from "./fetch-logo";
import { updateBrandSkillTool } from "./update-brand-skill";
import { readBrandKitTool } from "./read-brand-kit";

class SlideToolProvider implements ToolProvider {
  name = "slides";

  async getTools(): Promise<AgentTool[]> {
    return [
      createOutlineTool,
      createSlideTool,
      updateSlideTool,
      deleteSlideTool,
      reorderSlidesTool,
      setThemeTool,
      fetchLogoTool,
      updateBrandSkillTool,
      readBrandKitTool,
    ];
  }
}

// Auto-register on import
registerProvider(new SlideToolProvider());

export { SlideToolProvider };
