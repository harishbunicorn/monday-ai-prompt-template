import { NextRequest, NextResponse } from 'next/server';
import { predict } from '../openai/prompts/route';

export async function POST(req: NextRequest, res: NextResponse) {
    const reqJson = await req.json();
    console.log("🚀 ~ file: route.ts:6 ~ POST ~ reqJson:", reqJson)
    if (!reqJson.prompt) {
      return NextResponse.json({'message': 'No prompt given'}, {
        status: 400,
      })
    } else {
      const {prompt} = reqJson as {prompt: string | string[]};
      try {
        const result = await predict(prompt);
          return NextResponse.json(result, {
            status: 200
          })
      } catch (err: any) {
        console.error(err)
        return NextResponse.json(err.response.data, {
          status: 200
        })
      }
    }
}
export const dynamic = "force-static";