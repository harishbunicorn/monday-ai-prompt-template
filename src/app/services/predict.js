import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { OpenAI } from 'langchain/llms/openai';
import { SerpAPI } from 'langchain/tools';
import { Calculator } from 'langchain/tools/calculator';

export const predict = async (prompt) => {
    const model = new OpenAI({ temperature: 0 });
    const tools = [
        new SerpAPI(process.env.SERPAPI_API_KEY, {
            location: 'Austin,Texas,United States',
            hl: 'en',
            gl: 'us',
        }),
    ];

    const executor = await initializeAgentExecutorWithOptions(tools, model, {
        agentType: 'zero-shot-react-description',
        verbose: true,
    });

    const input = prompt;

    const result = await executor.call({ input });

    return result;
};
