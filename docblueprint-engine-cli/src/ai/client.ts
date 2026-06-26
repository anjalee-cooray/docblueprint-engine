import Anthropic from '@anthropic-ai/sdk';

export class BlueprintAIClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  // TODO: Implement streaming Claude API call.
  //
  // This method is the core generation primitive. Each document in the suite
  // is produced by one call to this method.
  //
  // Implementation notes:
  //   - Use client.messages.stream() for real-time streaming output.
  //   - systemPrompt: document-type-specific instructions (tone, structure,
  //     required sections, output format). Kept separate so each doc type
  //     has its own focused prompt without inflating the user turn.
  //   - userPrompt: the relevant portions of .docblueprint.json formatted
  //     as a structured brief for this specific document.
  //   - context: array of previously approved upstream doc contents, prepended
  //     to the user turn so Claude sees the full dependency chain.
  //   - Model: claude-sonnet-4-6 for generation speed. Upgrade to claude-opus-4-8
  //     for complex architecture docs if quality is insufficient.
  //   - Max tokens: 8192 for most docs. Sequence diagrams and flow specs may
  //     need higher limits.
  async generate(
    systemPrompt: string,
    userPrompt: string,
    context: string[]
  ): Promise<string> {
    const contextBlock = context.length > 0
      ? `\n\n<upstream_context>\n${context.join('\n\n---\n\n')}\n</upstream_context>\n\n`
      : '';

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `${contextBlock}${userPrompt}`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }
    return block.text;
  }

  // TODO: Implement correction + regeneration loop.
  //
  // This method takes a draft the user rejected and a plain-language correction
  // note, then regenerates the document incorporating the feedback.
  //
  // Implementation notes:
  //   - Send a two-turn conversation: assistant turn = the rejected draft,
  //     user turn = the correction note wrapped in clear instructions.
  //   - Instruction: "The document above has an issue. The human reviewer noted:
  //     [correction]. Regenerate the entire document incorporating this feedback.
  //     Keep everything that was correct unchanged."
  //   - Stream the regenerated doc.
  //   - This pattern preserves continuity — the AI sees what it wrote and
  //     exactly what was wrong, producing minimal-diff corrections.
  async review(draft: string, correction: string): Promise<string> {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: 'You are a technical documentation writer. Generate the document as instructed.',
        },
        {
          role: 'assistant',
          content: draft,
        },
        {
          role: 'user',
          content: `The document above has an issue. The human reviewer noted:\n\n${correction}\n\nRegenerate the entire document incorporating this feedback. Keep everything that was correct unchanged.`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }
    return block.text;
  }
}
