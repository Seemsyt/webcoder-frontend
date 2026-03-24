import { Message, ChatRequest, Thread } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getAllThreads(): Promise<Thread[]> {
  const response = await fetch(`${API_BASE_URL}/all/threads`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch threads');
  }
  
  return response.json();
}

export async function getThreadMessages(threadId: string): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/messages?thread_id=${threadId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch thread messages');
  }
  
  const rawMessages = await response.json();
  
  // Transform LangChain message format to our format
  return rawMessages.map((msg: any) => ({
    role: msg.role === 'human' ? 'user' : 'assistant',
    content: msg.content,
  }));
}
// new streaming function
export async function streamChat(
  message: string,
  threadId?: string
): Promise<{ threadId: string; stream: AsyncGenerator<string, void, unknown> }> {

  const response = await fetch(`${API_BASE_URL}/chat-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, thread_id: threadId }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const receivedThreadId = response.headers.get('X-Thread-Id') || 'new-thread';

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No reader available');
  }

  async function* streamGenerator() {
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split SSE messages
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // keep incomplete chunk

        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const data = part.replace('data: ', '');

            if (data === '[DONE]') return;

            yield data;
          }
        }
      }
    } finally {
      reader!.releaseLock();
    }
  }

  return {
    threadId: receivedThreadId,
    stream: streamGenerator(),
  };
}