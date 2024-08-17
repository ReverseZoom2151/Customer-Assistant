import {OpenAI} from "langchain/llms/openai";
import {pinecone} from "@/utils/pinecone-client";
import { PineconeStore } from "@langchain/pinecone";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import {ConversationalRetrievalQAChain} from "langchain/chains";

async function initChain() {
    const model = new OpenAI({});

    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

    /* create vectorstore*/
    const vectorStore = await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings({}),
        {
            pineconeIndex: pineconeIndex,
            textKey: 'text',
        },
    );

    return ConversationalRetrievalQAChain.fromLLM(
        model,
        vectorStore.asRetriever(),
        {returnSourceDocuments: false}
    );
}

export const chain = await initChain()

/*
import { OpenAI } from "langchain/llms/openai";
import { pinecone } from "@/utils/pinecone-client";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { HuggingFaceInference } from "langchain/llms/hf";



async function initChain() {
    const embeddingModel = new HuggingFaceTransformersEmbeddings({
        model: "Xenova/all-MiniLM-L6-v2",
    });

    const model = new HuggingFaceInference({
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
        apiKey: process.env.HUGGINGFACEHUB_API_KEY,
        maxTokens: 500,
      });
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_KEY,
        model: "gryphe/mythomist-7b:free",
    });
    
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX ?? '');

    
    const vectorStore = await PineconeStore.fromExistingIndex(
        embeddingModel,
        {
            pineconeIndex: pineconeIndex,
            textKey: 'text',
        }
    );

    return ConversationalRetrievalQAChain.fromLLM(
        new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_KEY,
            model: "gryphe/mythomist-7b:free",
        }),
        vectorStore.asRetriever(),
        { returnSourceDocuments: false }
    );
}

// Use top-level await if your environment supports it, otherwise use an async function
export const chain = await initChain().catch(console.error);
*/