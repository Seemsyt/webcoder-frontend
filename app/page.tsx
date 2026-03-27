import ChatInterface from './components/ChatInterface';
import { ProtectedRoute } from './lib/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <ChatInterface />
    </ProtectedRoute>
  );
}