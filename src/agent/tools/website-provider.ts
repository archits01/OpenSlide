import { type ToolProvider, type AgentTool, registerProvider } from "./index";
import { createFileTool } from "./create-file";
import { updateFileTool } from "./update-file";
import { deleteFileTool } from "./delete-file";
import { runShellCommandTool } from "./run-shell-command";
import { listFilesTool } from "./list-files";
import { readFileTool } from "./read-file";
import { readFilesTool } from "./read-files";
import { searchImagesTool } from "./search-images";
import { generateImageTool } from "./generate-image";
import { reviewOutputTool } from "./review-output";
import { patchFileTool } from "./patch-file";
import { checkTypesTool } from "./check-types";
import { fetchUrlTool } from "./fetch-url";

class WebsiteToolProvider implements ToolProvider {
  name = "website";

  async getTools(): Promise<AgentTool[]> {
    return [
      createFileTool,
      updateFileTool,
      patchFileTool,
      deleteFileTool,
      runShellCommandTool,
      listFilesTool,
      readFileTool,
      readFilesTool,
      searchImagesTool,
      generateImageTool,
      reviewOutputTool,
      checkTypesTool,
      fetchUrlTool,
    ];
  }
}

// Auto-register on import
registerProvider(new WebsiteToolProvider());

export { WebsiteToolProvider };
