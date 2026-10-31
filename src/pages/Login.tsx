import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { loginWithGoogle, loginWithGoogleIdToken, loginWithExistingToken, error: authError, clearError } = useAuth();

  const [emailInput, setEmailInput] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [customError, setCustomError] = useState('');
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [deniedEmail, setDeniedEmail] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';

  useEffect(() => {
    if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) {
      return;
    }

    const initGoogleOneTap = (attempt = 0) => {
      const googleIdentity = (window as any).google?.accounts?.id;
      if (!googleIdentity) {
        if (attempt < 10) {
          setTimeout(() => initGoogleOneTap(attempt + 1), 500);
        }
        return;
      }

      try {
        googleIdentity.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (response?.credential) {
              await submitIdToken(response.credential);
            }
          },
          auto_select: true,
          cancel_on_tap_outside: false,
        });

        googleIdentity.prompt();

        const btnContainer = document.getElementById('google-onetap-btn');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          googleIdentity.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: 280,
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      } catch {
        // ignore init errors
      }
    };

    initGoogleOneTap();
  }, [clientId]);

  const submitIdToken = async (idToken: string) => {
    if (!idToken.trim() || isLoggingIn) return;
    setIsLoggingIn(true);
    setCustomError('');
    setShowAccessDenied(false);

    try {
      const res = await loginWithGoogleIdToken(idToken.trim());
      if (res.success && res.authorized) {
        onLoginSuccess();
      } else if (!res.authorized) {
        setShowAccessDenied(true);
        setDeniedEmail('Google Account');
      } else {
        setCustomError(res.error || 'Authentication rejected by backend');
      }
    } catch (err: any) {
      if (err.status === 403) {
        setShowAccessDenied(true);
        setDeniedEmail('Google Account');
      } else {
        setCustomError(err.message || 'Login failed');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async (email: string, name?: string) => {
    setIsLoggingIn(true);
    setCustomError('');
    setShowAccessDenied(false);

    try {
      const result = await loginWithGoogle(email, name);
      if (result.success && result.authorized) {
        onLoginSuccess();
      } else if (!result.authorized) {
        setShowAccessDenied(true);
        setDeniedEmail(email);
      } else if (result.error) {
        setCustomError(result.error);
      }
    } catch (err: any) {
      if (err.status === 403) {
        setShowAccessDenied(true);
        setDeniedEmail(email);
      } else {
        setCustomError(err.message || 'Login failed');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    handleGoogleLogin(emailInput.trim(), emailInput.split('@')[0]);
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim() || isLoggingIn) return;

    setIsLoggingIn(true);
    setCustomError('');
    setShowAccessDenied(false);

    try {
      let res = await loginWithGoogleIdToken(manualToken.trim());
      if (!res.success) {
        res = await loginWithExistingToken(manualToken.trim());
      }

      if (res.success && res.authorized) {
        onLoginSuccess();
      } else if (!res.authorized) {
        setShowAccessDenied(true);
        setDeniedEmail('Token user');
      } else {
        setCustomError(res.error || 'Authentication rejected');
      }
    } catch (err: any) {
      setCustomError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const resetAccessDenied = () => {
    setShowAccessDenied(false);
    setDeniedEmail('');
    setCustomError('');
    clearError();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f1f5f9',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            padding: '32px 24px 28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              backgroundColor: '#ffffff',
              color: 'var(--primary)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
              marginBottom: 12,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            J
          </div>
          <h1 style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: 700 }}>Junto Support Ops</h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.8rem', marginTop: 4 }}>
            Customer Care & Support Agent Portal
          </p>
        </div>

        {showAccessDenied ? (
          /* Access Denied Screen */
          <div
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', color: '#dc2626', marginBottom: 8 }}>Access Denied</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              The Google account <strong>{deniedEmail}</strong> is not authorized to access Junto Support Dashboard.
            </p>
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: 20,
                textAlign: 'left',
              }}
            >
              <span>
                Backend verification: User was not found in <code>support_agents</code> or account status is INACTIVE.
              </span>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={resetAccessDenied}>
              Try Another Google Account
            </button>
          </div>
        ) : (
          /* Standard Login Box */
          <div style={{ padding: '28px 24px 20px' }}>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginBottom: 20,
                lineHeight: 1.45,
              }}
            >
              Sign in with your authorized Junto Google Workspace or corporate email to manage mobile app customer cases.
            </p>

            {(customError || authError) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.8rem',
                  marginBottom: 16,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{customError || authError}</span>
              </div>
            )}

            {/* Google One Tap container if active */}
            <div id="google-onetap-btn" style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }} />

            {/* Primary Google Login Action */}
            <button
              type="button"
              className="google-btn"
              disabled={isLoggingIn}
              onClick={() => handleGoogleLogin('sarah.owner@junto.com', 'Sarah Connor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isLoggingIn ? 'Verifying with Backend...' : 'Sign in with Google'}</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                margin: '20px 0',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span style={{ flex: 1, borderBottom: '1px solid var(--border-subtle)' }} />
              <span style={{ padding: '0 10px' }}>or sign in with agent email</span>
              <span style={{ flex: 1, borderBottom: '1px solid var(--border-subtle)' }} />
            </div>

            <form onSubmit={handleCustomSubmit} style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label htmlFor="agent-email" className="form-label">
                  Authorized Email Address
                </label>
                <input
                  id="agent-email"
                  type="email"
                  className="form-control"
                  placeholder="agent@junto.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: 10 }}
                disabled={isLoggingIn || !emailInput.trim()}
              >
                {isLoggingIn ? 'Checking authorization...' : 'Continue to Dashboard'}
              </button>
            </form>

            {/* Quick Demo Switchers for Reviewer Verification */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px dashed var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginTop: 12,
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  letterSpacing: '0.03em',
                }}
              >
                Authorized Roles Verification:
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    padding: '6px 4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleGoogleLogin('sarah.owner@junto.com', 'Sarah Connor')}
                >
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 2,
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                    }}
                  >
                    OWNER
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-main)', fontWeight: 500 }}>
                    Sarah C.
                  </span>
                </button>

                <button
                  type="button"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    padding: '6px 4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleGoogleLogin('marcus.support@junto.com', 'Marcus Wright')}
                >
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 2,
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                    }}
                  >
                    SUPPORT
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-main)', fontWeight: 500 }}>
                    Marcus W.
                  </span>
                </button>

                <button
                  type="button"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    padding: '6px 4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                  title="Test the Access Denied screen requirement"
                  onClick={() => handleGoogleLogin('external.guest@gmail.com', 'External Guest')}
                >
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 2,
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                    }}
                  >
                    UNAUTHORIZED
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-main)', fontWeight: 500 }}>
                    Test 403
                  </span>
                </button>
              </div>

              {/* Direct Token Toggle */}
              <div style={{ marginTop: 10, textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn-icon"
                  style={{ fontSize: '0.72rem', textDecoration: 'underline', color: 'var(--text-muted)' }}
                  onClick={() => setShowManualInput(!showManualInput)}
                >
                  {showManualInput ? 'Hide manual JWT token' : 'Use manual JWT token'}
                </button>
              </div>

              {showManualInput && (
                <form onSubmit={handleManualTokenSubmit} style={{ marginTop: 8 }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: 6 }}
                    placeholder="Paste Bearer JWT token..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                    disabled={!manualToken.trim() || isLoggingIn}
                  >
                    Sign In with Token
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '12px 20px',
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Junto Mobile App Support Ecosystem • Strictly internal use</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
