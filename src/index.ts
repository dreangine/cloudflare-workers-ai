export interface Env {
	// If you set another name in the Wrangler config file as the value for 'binding',
	// replace "AI" with the variable name you defined.
	AI: Ai;
}

export default {
	async fetch(request, env): Promise<Response> {
		const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
			prompt: "What is the origin of the phrase Hello, World",
		});

		return new Response(JSON.stringify(response));
	},
} satisfies ExportedHandler<Env>;