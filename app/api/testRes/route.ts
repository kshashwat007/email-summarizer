import { NextResponse, NextRequest } from "next/server";


export async function GET(request: NextRequest) {
  try {
    return Response.json({ message: 'Email summarization tasks enqueued.' });
} catch (error) {
    console.error(error);
    return Response.json({error: error})
}
}
