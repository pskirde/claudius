// app/api/claude/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Define types for the message structure
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
}

interface ApiResponse {
  content: string;
}

interface ApiErrorResponse {
  error: string;
}

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Add this to your .env.local file
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse | ApiErrorResponse>> {
  try {
    // Parse and validate the request body
    const body: RequestBody = await request.json();
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid request body: messages array is required' },
        { status: 400 }
      );
    }

    // Validate message format
    const isValidMessage = (message: Message): boolean => {
      return (
        typeof message.content === 'string' &&
        (message.role === 'user' || message.role === 'assistant')
      );
    };

    if (!body.messages.every(isValidMessage)) {
      return NextResponse.json(
        { error: 'Invalid message format in request body' },
        { status: 400 }
      );
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: body.messages,
    });

    // Ensure we have a response with content
    if (!response.content || response.content.length === 0) {
      throw new Error('Empty response from Claude API');
    }

    return NextResponse.json({
      content: response.content[0].text,
    });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    
    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API Error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    // Handle rate limiting errors
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Handle authentication errors
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'Authentication failed. Please check your API key.' },
        { status: 401 }
      );
    }

    // Generic error handling
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
        { status: 500 }
    );
  }
}