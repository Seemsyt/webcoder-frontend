import { Message, ChatRequest, Thread } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ==================== AUTH FUNCTIONS ====================

export async function register(
  email: string,
  username: string,
  password: string,
  confirmPassword: string
): Promise<{ message: string; user_id: number }> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password, confirm_password: confirmPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

export async function login(
  email: string,
  password: string
): Promise<{ message: string; data: { id: number; username: string; email: string; access_token: string } }> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

export async function getMe(token: string): Promise<{ id: number; username: string; email: string }> {
  const response = await fetch(`${API_BASE_URL}/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

// ==================== CHAT FUNCTIONS ====================

export async function getAllThreads(token: string): Promise<Thread[]> {
  const response = await fetch(`${API_BASE_URL}/all/threads`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch threads');
  }
  
  return response.json();
}

export async function getThreadMessages(threadId: string, token: string): Promise<Message[]> {
  console.log('📥 Fetching messages for thread:', threadId);
  console.log('   Token provided:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

  const response = await fetch(`${API_BASE_URL}/messages?thread_id=${threadId}`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  
  console.log('📊 Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Failed to fetch messages:', response.status, errorText);
    throw new Error(`Failed to fetch thread messages: ${response.status}`);
  }
  
  const rawMessages = await response.json();
  console.log('✅ Received messages:', rawMessages.length);
  
  // Transform LangChain message format to our format
  return rawMessages.map((msg: any) => ({
    role: msg.role === 'human' ? 'user' : 'assistant',
    content: msg.content,
  }));
}
// new streaming function
export async function streamChat(
  message: string,
  token: string,
  threadId?: string
): Promise<{ threadId: string; stream: AsyncGenerator<string, void, unknown> }> {

  console.log('🚀 streamChat called with:');
  console.log('  - message:', message.substring(0, 50));
  console.log('  - token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  console.log('  - threadId:', threadId);

  const response = await fetch(`${API_BASE_URL}/chat-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, thread_id: threadId }),
  });

  console.log('📊 Response status:', response.status);
  console.log('📋 Response headers:', {
    'content-type': response.headers.get('content-type'),
    'x-thread-id': response.headers.get('X-Thread-Id'),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error response:', errorText);
    throw new Error(`Chat failed: ${response.status} - ${errorText}`);
  }

  const receivedThreadId = response.headers.get('X-Thread-Id') || 'new-thread';
  console.log('✅ Received thread ID:', receivedThreadId);

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