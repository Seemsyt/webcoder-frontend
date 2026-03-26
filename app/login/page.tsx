'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { 
  LogIn, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  CheckCircle2,
  Wheat,
  Shield
} from 'lucide-react';

// Separate component that uses useSearchParams
function LoginContent() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: authLogin, token } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [token, router]);

  // Show success message if redirected from register
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Registration successful! Please log in.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFocus = (field: 'email' | 'password') => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: 'email' | 'password') => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData.email, formData.password);
      
      // Login successful
      authLogin(response.data.access_token, {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
      });

      // Redirect to home/chat
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-wheat-50 to-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-stone-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Logo/Brand area */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-600 to-amber-700 flex items-center justify-center shadow-lg">
          <Wheat className="w-5 h-5 text-amber-100" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-800">Web Agent</h1>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-amber-600" />
            <span className="text-xs text-stone-500">Secure Login</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-stone-200/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-100 to-amber-100 mb-4">
              <LogIn className="w-8 h-8 text-stone-700" />
            </div>
            <h1 className="text-3xl font-bold text-stone-800 mb-2">Welcome Back</h1>
            <p className="text-stone-500">Sign in to continue to your account</p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{successMessage}</p>
                <p className="text-sm mt-1 text-emerald-600">You can now sign in with your credentials.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all duration-200 text-stone-900 placeholder-stone-400 ${
                    isFocused.email 
                      ? 'border-amber-500 ring-2 ring-amber-200 ring-opacity-50' 
                      : 'border-stone-300 hover:border-stone-400'
                  } focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:ring-opacity-50`}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  required
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl transition-all duration-200 text-stone-900 placeholder-stone-400 ${
                    isFocused.password 
                      ? 'border-amber-500 ring-2 ring-amber-200 ring-opacity-50' 
                      : 'border-stone-300 hover:border-stone-400'
                  } focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:ring-opacity-50`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Authentication Error</p>
                  <p className="text-sm mt-1 text-red-600">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-stone-600 to-amber-700 hover:from-stone-700 hover:to-amber-800 disabled:from-stone-400 disabled:to-amber-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-200">
            <div className="text-center">
              <p className="text-stone-600">
                Don't have an account?{' '}
                <Link 
                  href="/register" 
                  className="text-amber-700 hover:text-amber-800 font-semibold transition-colors hover:underline underline-offset-4"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>256-bit SSL</span>
            </div>
            <div className="w-px h-3 bg-stone-300"></div>
            <div className="flex items-center gap-1">
              <Wheat className="w-3 h-3" />
              <span>Secure & Private</span>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-stone-500 text-sm">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        /* Custom scrollbar for the page */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

// Default export with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-wheat-50 to-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-stone-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}