import {openai} from "@ai-sdk/openai";
import {anthropic} from "@ai-sdk/anthropic";
export function model(provider="openai"){if(provider==="anthropic")return anthropic(process.env.ANTHROPIC_MODEL||"claude-haiku-4-5");return openai(process.env.OPENAI_CHAT_MODEL||"gpt-5.6-luna");}
