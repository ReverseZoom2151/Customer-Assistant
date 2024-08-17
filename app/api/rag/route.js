import { NextResponse } from 'next/server';
import {chain} from "@/utils/chain";
//import {Message} from "@/types/message";

export async function POST(request) {

    const body = await request.json();
    const question = body.query;
    const history = [{role: "assistant", content: "Hello, how can I help you?"}]
    console.log(history)
    const res = await chain.call({
            question: question,
            chat_history: history.map(h => h.content).join("\n"),
        });


    return NextResponse.json({role: "assistant", content: res.text})
}