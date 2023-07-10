import * as openai from "openai";

export async function chatGPTRequest(prompt: string) {
    const configuration = new openai.Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const openaiClient = new openai.OpenAIApi(configuration);

    try {
        const gptResponse = await openaiClient.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a programming expert. You can detect software development languages based on a set of files that represent a folder of source code." },
                { role: "user", content: prompt }
            ],
        });
        return gptResponse.data.choices[0].message?.content;
    } catch (err) {
        console.error(err);
    }
}