import { type ToolProvider, type AgentTool, registerProvider } from "./index";
import { createSheetTool } from "./create-sheet";
import { updateSheetTool } from "./update-sheet";

class SheetToolProvider implements ToolProvider {
  name = "sheets";

  async getTools(): Promise<AgentTool[]> {
    return [createSheetTool, updateSheetTool];
  }
}

// Auto-register on import
registerProvider(new SheetToolProvider());

export { SheetToolProvider };
