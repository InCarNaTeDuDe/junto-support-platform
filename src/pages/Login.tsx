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
  const DEFAULT_CLIENT_ID = '310875006924-5dsprg0oqeivq38pam5glqeb9hkslf9k.apps.googleusercontent.com';
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string)?.trim() || DEFAULT_CLIENT_ID;

  useEffect(() => {
    let isMounted = true;

    if (!clientId) {
      setCustomError('Google OAuth Client ID is missing. Check VITE_GOOGLE_CLIENT_ID in your environment variables.');
      return;
    }

    const initGoogleIdentity = (attempt = 0) => {
      if (!isMounted) return;
      const google = (window as any).google;

      if (!google?.accounts?.id) {
        if (attempt < 15) {
          setTimeout(() => initGoogleIdentity(attempt + 1), 350);
        } else {
          setCustomError('Google Identity Services script did not load. Please check your network connection.');
        }
        return;
      }

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          use_fedcm_for_prompt: false,
          callback: async (response: { credential?: string }) => {
            try {
              google.accounts.id.cancel();
              google.accounts.id.disableAutoSelect();
            } catch {
              // Ignore
            }

            if (!response?.credential) {
              setCustomError('Google did not return an ID token.');
              return;
            }

            setIsLoggingIn(true);
            setCustomError('');
            setShowAccessDenied(false);

            try {
              const res = await loginWithGoogleIdToken(response.credential);
              if (res.success && res.authorized) {
                try {
                  google.accounts.id.cancel();
                } catch {
                  // Ignore
                }
                onLoginSuccess?.();
              } else if (!res.authorized) {
                setShowAccessDenied(true);
              } else {
                setCustomError(res.error || 'Authentication rejected by backend');
              }
            } catch (err: any) {
              setCustomError(err.message || 'Login failed');
            } finally {
              setIsLoggingIn(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Only prompt One Tap when not framed, to prevent iframe credential-management restrictions
        const isInIframe = window.self !== window.top;
        if (!isInIframe) {
          try {
            google.accounts.id.prompt((notification: any) => {
              if (notification?.isNotDisplayed?.()) {
                // Silently handled: user can use the standard button
              }
            });
          } catch {
            // Silently fall back to standard button
          }
        }

        // Render official Google Sign In button
        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      } catch (err: any) {
        setCustomError('Failed to initialize Google Sign-In: ' + (err.message || 'Unknown error'));
      }
    };

    initGoogleIdentity();

    return () => {
      isMounted = false;
      try {
        const google = (window as any).google;
        google?.accounts?.id?.cancel();
      } catch {
        // Ignore
      }
    };
  }, [clientId]);

  const handleManualSubmit = async (e: React.FormEvent) => {
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
        onLoginSuccess?.();
      } else if (!res.authorized) {
        setShowAccessDenied(true);
      } else {
        setCustomError(res.error || 'Authentication rejected');
      }
    } catch (err: any) {
      setCustomError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Brand Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            fontWeight: 800,
            marginBottom: 18,
          }}
        >
          J
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>
          Junto Support Management
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 28 }}>
          Internal operations portal for authorized Junto agents and owners.
        </p>

        {/* Access Denied Warning */}
        {showAccessDenied && (
          <div
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              color: '#b91c1c',
              fontSize: '0.85rem',
              textAlign: 'left',
              marginBottom: 20,
            }}
          >
            <strong>Access Denied:</strong> Your Google account is authenticated, but not registered with active permissions in the support agents directory.
          </div>
        )}

        {/* Error message */}
        {(customError || authError) && !showAccessDenied && (
          <div
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: 'var(--radius-md)',
              color: '#c2410c',
              fontSize: '0.85rem',
              textAlign: 'left',
              marginBottom: 20,
            }}
          >
            {customError || authError}
          </div>
        )}

        {isLoggingIn ? (
          <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="spinner" />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Verifying Google identity and authenticating session...
            </p>
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Real Google Button Container */}
            <div
              ref={googleBtnRef}
              id="google-onetap-btn"
              style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }}
            />

            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                maxWidth: 320,
                lineHeight: 1.4,
              }}
            >
              Sign in with your authorized Google Workspace account.
            </div>

            {/* Manual JWT entry option */}
            <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 12 }}>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowManualInput(!showManualInput)}
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
              >
                {showManualInput ? 'Hide token entry' : 'Paste Google ID Token or JWT manually'}
              </button>

              {showManualInput && (
                <form onSubmit={handleManualSubmit} style={{ width: '100%', marginTop: 12 }}>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Paste ID Token (eyJhbGciOi...)"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                    disabled={!manualToken.trim() || isLoggingIn}
                  >
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
