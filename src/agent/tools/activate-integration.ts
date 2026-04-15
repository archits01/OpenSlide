// src/agent/tools/activate-integration.ts
// Meta-tool that lazily loads integration tools on demand.
// Instead of sending all integration schemas to Claude on every turn,
// we send this single lightweight tool. When Claude needs an integration,
// it calls activate_integration({ provider: "gmail" }) and the actual
// tools get injected into the tools list for the next iteration.

import type { AgentTool } from './types';
import { getIntegrationTools, getAvailableProviders } from './tool-registry';

export type ActivationCallback = (provider: string, tools: AgentTool[]) => void;

let _onActivate: ActivationCallback | null = null;

/** Called from loop.ts to wire up the callback that injects tools into the live array */
export function setActivationCallback(cb: ActivationCallback): void {
  _onActivate = cb;
}

export const activateIntegrationTool: AgentTool = {
  name: 'activate_integration',
  description: buildDescription(),
  input_schema: {
    type: 'object',
    properties: {
      provider: {
        type: 'string',
        enum: getAvailableProviders(),
        description: 'The integration provider to activate',
      },
    },
    required: ['provider'],
  },
  async execute(input) {
    const { provider } = input as { provider: string };

    const tools = getIntegrationTools(provider);
    if (tools.length === 0) {
      return { error: `Unknown provider "${provider}". Available: ${getAvailableProviders().join(', ')}` };
    }

    // Tell the loop to inject these tools
    if (_onActivate) {
      _onActivate(provider, tools);
    }

    return {
      activated: provider,
      tools: tools.map(t => t.name),
      message: `${provider} tools are now available. You can use them in your next action.`,
    };
  },
};

function buildDescription(): string {
  const providers = getAvailableProviders();
  const lines = providers.map(p => {
    const tools = getIntegrationTools(p);
    const toolNames = tools.map(t => t.name).join(', ');
    return `  - ${p}: ${toolNames}`;
  });

  return [
    'Activate an external integration to use its tools. Call this BEFORE using any integration tool.',
    'Available integrations:',
    ...lines,
    'After activation, the tools become available for your next action in this turn.',
  ].join('\n');
}
