import { Configuration, OpenAIApi } from "openai";
//--- For a connection with openai api ----
const configuration = new Configuration({
    organisation: process.env["OPENAI_ORG"],
    apiKey: process.env.OPENAI_API,
});
export const openai = new OpenAIApi(configuration);