import { ChatCompletionCreateParams, ChatCompletion, ChatCompletionMessageParam } from './openai-types';

const DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
};

export interface Env {
	// If you set another name in the Wrangler config file as the value for 'binding',
	// replace "AI" with the variable name you defined.
	AI: Ai;
}

function convertToCloudflareAIFormat(messages: Array<ChatCompletionMessageParam>): AiTextGenerationInput {
	const convertedMessages = messages.map(msg => ({
		role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
		content: typeof msg.content === 'string' ? msg.content :
			Array.isArray(msg.content) ?
				msg.content.find(part => part.type === 'text')?.text ?? '' : '',
	}));

	return { messages: convertedMessages };
}

function convertToOpenAIFormat(output: AiTextGenerationOutput): ChatCompletion {
	return {
		id: `chatcmpl-${Date.now()}`,
		object: "chat.completion",
		created: Math.floor(Date.now() / 1000),
		model: "llama-3-8b-instruct",
		choices: [
			{
				index: 0,
				message: {
					role: "assistant",
					content: output.response || null,
					refusal: null,
				},
				finish_reason: "stop",
				logprobs: null,
			},
		],
		usage: output.usage,
	};
}

export default {
	async fetch(request, env): Promise<Response> {
		try {
			const requestBody = await request.json() as ChatCompletionCreateParams;

			console.info("Received request:", JSON.stringify(requestBody, null, 2));

			const { messages } = requestBody;

			const textGenInput = convertToCloudflareAIFormat(messages);

			const output = await env.AI.run("@cf/meta/llama-3-8b-instruct", textGenInput);

			const openAiResponse = convertToOpenAIFormat(output);

			console.info("Sending response:", JSON.stringify(openAiResponse, null, 2));

			return new Response(JSON.stringify(openAiResponse), {
				headers: { ...DEFAULT_HEADERS },
			});
		} catch (error) {
			return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
				status: 500,
				headers: { ...DEFAULT_HEADERS },
			});

		}
	},
} satisfies ExportedHandler<Env>;