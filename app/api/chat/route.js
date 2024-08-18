import { NextResponse } from 'next/server';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Pinecone } from "@pinecone-database/pinecone";
import { config } from 'dotenv';
import OpenAI from 'openai';

config();

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index('ragworkshop');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const bedrockClient = new BedrockRuntimeClient({ 
    region: "us-west-2",
    credentials: {
        accessKeyId: process.env.BEDROCK_ACCESS_KEY_ID,
        secretAccessKey: process.env.BEDROCK_SECRET_ACCESS_KEY,
    },
 }); 

async function getQueryEmbedding(query) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: query,
    });
    return response.data[0].embedding;
}

async function queryPinecone(query) {
    const queryEmbedding = await getQueryEmbedding(query);
    const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 5,  
        includeMetadata: true,
    });
    const contexts = queryResponse.matches.map(match => match.metadata.text);
    return contexts.join("\n\n-------\n\n");
}

const systemPrompt = `Role: You are a friendly and knowledgeable virtual assistant designed to provide information and answer questions based on the Lex Fridman podcast with Aravind Srinivas from Perplexity. Your goal is to provide accurate and helpful responses to user queries based on the content of the podcast.`;

// const systemPrompt = `Role: You are the Headstarter AI Customer Support Bot, a friendly and knowledgeable virtual assistant designed to help users navigate and make the most out of the Headstarter AI platform. This platform offers AI-powered interview practice specifically tailored for software engineering (SWE) jobs. Your goal is to provide efficient, accurate, and helpful responses to user queries, ensuring a seamless experience.

// Tone and Style:

// 1. Friendly and Professional: Maintain a welcoming, approachable tone while providing clear, concise, and relevant information.
// 2. Empathetic and Supportive: Understand the stress of preparing for job interviews and offer encouragement and reassurance.
// 3. Proactive: Anticipate user needs by offering additional helpful information or resources that may be beneficial to them.
// 4. Concise and Direct: Provide clear and straightforward answers, avoiding unnecessary technical jargon unless the user is technically inclined.

// Capabilities:

// 1. User Assistance:

// - Guide users through setting up their accounts, navigating the platform, and accessing various features.
// - Help users troubleshoot common technical issues, such as login problems, audio/video setup, and connectivity issues during practice sessions.
// - Provide information on subscription plans, billing, and refund policies.
// - Offer advice on how to use the platform effectively, including tips on interview preparation, question categories, and interpreting AI feedback.

// 2. Platform Navigation:

// - Direct users to appropriate sections of the platform, such as starting a new interview session, reviewing past sessions, or accessing educational resources.
// - Explain the features and benefits of different types of interview practice available on the platform, including coding challenges, behavioral interviews, and system design interviews.

// 3. Technical Knowledge:

// - Provide guidance on common SWE interview topics like data structures, algorithms, system design, and coding best practices.
// - Explain how the AI assesses performance and what users can do to improve their interview skills based on the feedback provided.

// 4. User Engagement:

// - Encourage users to take full advantage of all platform features, including scheduling regular practice sessions and utilizing detailed feedback reports.
// - Promote new features, updates, or upcoming events related to interview preparation and SWE job opportunities.
// - Collect user feedback to help improve the platform and address any concerns or suggestions.

// Limitations:

// - You are not a human, so while you can provide general advice and support, you cannot engage in subjective or personalized career counseling.
// - You do not have access to external information or resources outside the Headstarter AI platform.

// Behavior in Uncertain Situations:

// If unsure of the answer, apologize and either provide a general suggestion, guide the user to the appropriate resources, or escalate the query to human support.`

// export async function POST(req) {
//     const data = await req.json();
//     const completion = await openai.chat.completions.create({
//         messages: [
//             {
//                 role: 'system',
//                 content: systemPrompt,
//             },
//             ...data,
//         ],
//         model: 'gpt-4o-mini',
//         stream: true,
//     });

//     const stream = new ReadableStream({
//         async start(controller) {
//             const encoder = new TextEncoder();
//             try {
//                 for await (const chunk of completion) {
//                     const content = chunk.choices[0]?.delta?.content;
//                     if (content) {
//                         const text = encoder.encode(content);
//                         controller.enqueue(text);
//                     }
//                 }   
//             } catch (err) {
//                 controller.error(err);
//             } finally {
//                 controller.close();
//             }
//         },
//     });

//     return new NextResponse(stream);
// }

// export async function POST(req) {

//     const data = await req.json();
    
//     const prompt = [
//         { role: 'system', content: systemPrompt },
//         ...data
//     ].map(msg => `${msg.role}: ${msg.content}`).join('\n\n');

//     const input = {
//         modelId: "meta.llama3-1-405b-instruct-v1:0", 
//         contentType: "application/json",
//         accept: "application/json",
//         body: JSON.stringify({
//             prompt: prompt,
//             max_gen_len: 512,
//             temperature: 0.5,
//             top_p: 0.9
//         })
//     };

//     const command = new InvokeModelCommand(input);

//     const stream = new ReadableStream({
//         async start(controller) {
//             const encoder = new TextEncoder();
//             try {
//                 const response = await client.send(command);
//                 const responseBody = JSON.parse(new TextDecoder().decode(response.body));
//                 const content = responseBody.generation;
//                 if (content) {
//                     const text = encoder.encode(content);
//                     controller.enqueue(text);
//                 }
//             } catch (err) {
//                 controller.error(err);
//             } finally {
//                 controller.close();
//             }
//         },
//     });

//     return new NextResponse(stream);
// }

export async function POST(req) {

    const data = await req.json();
    const userQuery = data[data.length - 1].content;
    const relevantContext = await queryPinecone(userQuery);

    const prompt = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: relevantContext },  
        ...data
    ].map(msg => `${msg.role}: ${msg.content}`).join('\n\n');

    const input = {
        modelId: "meta.llama3-1-405b-instruct-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
            prompt: prompt,
            max_gen_len: 512,
            temperature: 0.5,
            top_p: 0.9,
        }),
    };

    const command = new InvokeModelCommand(input);

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                const response = await bedrockClient.send(command);
                const responseBody = JSON.parse(new TextDecoder().decode(response.body));
                const content = responseBody.generation;
                if (content) {
                    const text = encoder.encode(content);
                    controller.enqueue(text);
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    return new NextResponse(stream);
}


