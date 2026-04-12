// System prompts for LLM enhancement guided by level and context

import type { HistoryEntry } from "../types";

// Main enhancement prompt generator keyed by level
export function getEnhancementPrompt(level: "light" | "standard" | "deep"): string {
	const basePrompt = `You are an expert prompt engineer specializing in creating high-performance prompts for AI agents.

Your task is to enhance a user's raw prompt into a structured, agent-ready prompt that maximizes clarity, completeness, actionability, and token efficiency.

Always output a valid json object with this exact structure.
Return json only, with no markdown fences and no explanatory text before or after it:
{
  "enhanced": "<the enhanced prompt text>",
  "changes": ["<change 1>", "<change 2>", ...],
  "score": {
    "overall": <0-100>,
    "clarity": <0-100>,
    "completeness": <0-100>,
    "actionability": <0-100>,
    "agentReadiness": <0-100>,
    "tokenEfficiency": <0-100>
  },
  "metadata": {
    "originalTokens": <number>,
    "enhancedTokens": <number>,
    "compressionNote": "<brief note>"
  }
}`;

	const levelGuidance = {
		light: `Apply light touch enhancements:
- Fix grammatical/stylistic issues
- Improve clarity of intent
- Ensure basic structure
Do not over-engineer; preserve the original voice.`,

		standard: `Apply standard enhancement using the six-segment framework:
1. **Role**: Define the agent's identity and expertise
2. **Context**: Provide background and constraints
3. **Task**: Clear objective statement
4. **Constraints**: Boundaries and rules
5. **Output Format**: Expected response structure
6. **Self-Check**: Verification steps for the agent

Add error recovery and tool-use guidance for agent scenarios.`,

		deep: `Apply deep enhancement:
- Complete rewrite using six-segment framework
- Add 2-3 few-shot examples demonstrating expected behavior
- Include explicit agent instructions (tool usage, error recovery, iteration)
- Optimize for multi-turn conversations and state management
- Add success criteria and quality gates
- Detail constraints and edge case handling`,
	};

	return `${basePrompt}\n\n${levelGuidance[level]}`;
}

// Iterative refinement prompt for feedback-driven optimization
export function getIterativePrompt(
	original: string,
	current: string,
	feedback: string,
	version: number,
): string {
	return `You are refining an AI prompt based on user feedback.

**Original**: ${original}

**Current (v${version})**: ${current}

**Feedback**: ${feedback}

Apply the feedback to improve the prompt. Maintain the original intent while addressing the specific concerns.

Output the refined prompt as a json object with the same structure as before.
Return json only, with no markdown fences and no explanatory text:
{
  "enhanced": "<refined prompt>",
  "changes": ["<what changed based on feedback>", ...],
  "score": { ... },
  "metadata": { ... }
}`;
}

// Helper to build messages for chat completion
export function buildMessages(
	userPrompt: string,
	systemPrompt: string,
	history?: HistoryEntry[],
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
	const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
		{
			role: "system",
			content: systemPrompt,
		},
	];

	// Add relevant history if available
	if (history && history.length > 0) {
		const recent = history.slice(-2); // Last 2 versions for context
		for (const entry of recent) {
			messages.push({
				role: "user",
				content: `Previous attempt:\n${entry.original}`,
			});
			messages.push({
				role: "assistant",
				content: entry.enhanced,
			});
		}
	}

	messages.push({
		role: "user",
		content: userPrompt,
	});

	return messages;
}
