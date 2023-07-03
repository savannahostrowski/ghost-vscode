const {Configuration, OpenAIApi} = require("openai");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(Configuration);

// Make a ChatGPT request with a custom prompt that returns a response and handles errors
async function chat(prompt: String) {
    try {
        const gptResponse = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{role: "user", content: prompt}],
        });
        return gptResponse.data.choices[0].text;
    } catch (err) {
        throw err;
    }
}