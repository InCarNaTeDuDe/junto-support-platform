import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { loginWithGoogleIdToken, loginWithExistingToken, error: authError } = useAuth();
  const [manualToken, setManualToken] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [customError, setCustomError] = useState('');
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string)?.trim();

  useEffect(() => {
    let isMounted = true;
    if (!clientId) {
      setCustomError('VITE_GOOGLE_CLIENT_ID is not configured in environment.');
      return;
    }

    const init = (retry = 0) => {
      if (!isMounted) return;
      const g = (window as any).google;
      if (!g?.accounts?.id) {
        if (retry < 15) setTimeout(() => init(retry + 1), 300);
        else setCustomError('Google Identity script failed to load.');
        return;
      }

      try {
        g.accounts.id.initialize({
          client_id: clientId,
          use_fedcm_for_prompt: false,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async (res: { credential?: string }) => {
            try { g.accounts.id.cancel(); g.accounts.id.disableAutoSelect(); } catch {}
            if (!res?.credential) {
              setCustomError('No credential received from Google.');
              return;
            }
            setIsLoggingIn(true);
            setCustomError('');
            setShowAccessDenied(false);

            try {
              const r = await loginWithGoogleIdToken(res.credential);
              if (r.success && r.authorized) {
                onLoginSuccess?.();
              } else if (!r.authorized) {
                setShowAccessDenied(true);
              } else {
                setCustomError(r.error || 'Authentication denied');
              }
            } catch (err: any) {
              setCustomError(err.message || 'Login failed');
            } finally {
              setIsLoggingIn(false);
            }
          },
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          g.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      } catch (err: any) {
        setCustomError(err.message || 'Error initializing Google Sign-In');
      }
    };

    init();
    return () => {
      isMounted = false;
      try { (window as any).google?.accounts?.id?.cancel(); } catch {}
    };
  }, [clientId]);

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim() || isLoggingIn) return;
    setIsLoggingIn(true);
    setCustomError('');
    setShowAccessDenied(false);

    try {
      let r = await loginWithGoogleIdToken(manualToken.trim());
      if (!r.success) r = await loginWithExistingToken(manualToken.trim());
      if (r.success && r.authorized) onLoginSuccess?.();
      else if (!r.authorized) setShowAccessDenied(true);
      else setCustomError(r.error || 'Login rejected');
    } catch (err: any) {
      setCustomError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 36, textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: 50, height: 50, borderRadius: 'var(--radius-lg)', background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>
          J
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>Junto Support Management</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 24 }}>
          Internal operations portal for authorized Junto agents and owners.
        </p>

        {showAccessDenied && (
          <div className="alert-banner" style={{ marginBottom: 16, textAlign: 'left', background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
            <strong>Access Denied:</strong> Google account authenticated, but not registered as an active agent.
          </div>
        )}

        {(customError || authError) && !showAccessDenied && (
          <div className="alert-banner" style={{ marginBottom: 16, textAlign: 'left', background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }}>
            {customError || authError}
          </div>
        )}

        {isLoggingIn ? (
          <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="spinner" />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verifying Google session...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div ref={googleBtnRef} style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sign in with your authorized Google account</span>

            <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 8 }}>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowManualInput(!showManualInput)}
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
              >
                {showManualInput ? 'Hide token entry' : 'Paste Google ID Token or JWT manually'}
              </button>

              {showManualInput && (
                <form onSubmit={handleManual} style={{ width: '100%', marginTop: 12 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="eyJhbGciOi..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginBottom: 10 }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }} disabled={!manualToken.trim() || isLoggingIn}>
                    Authenticate with Token
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
