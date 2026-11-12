import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, MoreVertical, X, Smartphone, CheckCircle2 } from 'lucide-react';

const InstallPrompt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [platform, setPlatform] = useState(null); // 'ios' | 'android'
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // 1. Must be a touch-based mobile device — exclude laptops/desktops
    const isMobileTouchDevice = () => {
      const ua = navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /android/i.test(ua);
      // Exclude Windows touch laptops and other non-phone/tablet touch devices
      const isWindows = /windows/i.test(ua);
      return (isIOS || isAndroid) && !isWindows;
    };

    if (!isMobileTouchDevice()) return;

    // 2. Already installed as standalone — never show
    const isInstalled =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true ||
      (document.referrer && document.referrer.includes('android-app://'));

    if (isInstalled) return;

    // 3. Set platform
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('ios');
    }

    // 4. Android native deferred install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Show compact modal on every visit (not installed = always show)
    const timer = setTimeout(() => setIsOpen(true), 700);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result?.outcome === 'accepted') setIsOpen(false);
    } catch (err) {
      console.error('[PWA] Install error:', err);
    }
    setDeferredPrompt(null);
  };

  if (!isOpen || !platform) return null;

  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  return (
    <>
      {/* Dim overlay — tap to dismiss */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99998,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          animation: 'pwaFadeIn 0.25s ease forwards',
        }}
      />

      {/* Compact Card — anchored to bottom */}
      <div
        className="pwa-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'var(--color-secondary, #1c1c21)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            border: '1px solid var(--color-border, #333)',
            borderBottom: 'none',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            padding: `16px 16px calc(16px + env(safe-area-inset-bottom, 12px)) 16px`,
            boxSizing: 'border-box',
          }}
        >
          {/* Drag handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--color-border, #444)', margin: '0 auto 14px' }} />

          {/* Row: icon + text + close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* App icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              backgroundColor: '#0f0f13', border: '1px solid var(--color-border, #333)',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              <img src="/images/cobnblogonew.png" alt="COBNB+" style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary, #fff)', lineHeight: 1.2 }}>
                Add COBNB+ to Home Screen
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted, #94a3b8)', marginTop: 3, lineHeight: 1.4 }}>
                {isIOS
                  ? 'Tap Share → "Add to Home Screen"'
                  : deferredPrompt
                    ? 'Install the app for a faster experience'
                    : 'Tap Menu → "Add to Home Screen"'}
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Dismiss"
              style={{
                flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                border: '1px solid var(--color-border, #444)',
                backgroundColor: 'var(--color-bg-main, #0f0f13)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--color-text-muted, #94a3b8)', padding: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {/* Android: 1-tap native install */}
            {isAndroid && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none',
                  backgroundColor: 'var(--color-accent, #c4a265)', color: '#fff',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: '0 3px 10px rgba(196,162,101,0.35)',
                }}
              >
                <Download size={15} /> Install App
              </button>
            )}

            {/* How to install — toggle steps */}
            <button
              onClick={() => setShowSteps(v => !v)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10,
                border: '1px solid var(--color-border, #444)',
                backgroundColor: 'var(--color-bg-main, #0f0f13)',
                color: 'var(--color-primary, #fff)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {isIOS ? <Share size={14} /> : <Smartphone size={14} />}
              {showSteps ? 'Hide Steps' : 'How to Install'}
            </button>

            {/* Not now */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--color-border, #444)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-muted, #94a3b8)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Not Now
            </button>
          </div>

          {/* Step-by-step instructions (toggled) */}
          {showSteps && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isIOS && (
                <>
                  <Step n={1} icon={<Share size={13} color="var(--color-accent,#c4a265)" />}
                    text={<>Tap the <strong>Share</strong> icon in Safari's bottom bar</>} />
                  <Step n={2} icon={<PlusSquare size={13} color="var(--color-accent,#c4a265)" />}
                    text={<>Select <strong>"Add to Home Screen"</strong></>} />
                  <Step n={3} icon={<CheckCircle2 size={13} color="#10b981" />}
                    text={<>Tap <strong>"Add"</strong> in the top-right corner</>} last />
                </>
              )}
              {isAndroid && (
                <>
                  <Step n={1} icon={<MoreVertical size={13} color="var(--color-accent,#c4a265)" />}
                    text={<>Tap the <strong>⋮ Menu</strong> in Chrome's top-right</>} />
                  <Step n={2} icon={<Smartphone size={13} color="var(--color-accent,#c4a265)" />}
                    text={<>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></>} />
                  <Step n={3} icon={<CheckCircle2 size={13} color="#10b981" />}
                    text={<>Tap <strong>"Install"</strong> or <strong>"Add"</strong> to confirm</>} last />
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

/** Compact numbered step row */
const Step = ({ n, icon, text, last }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 11px', borderRadius: 10,
    backgroundColor: 'var(--color-bg-main, #0f0f13)',
    border: `1px solid ${last ? 'rgba(16,185,129,0.25)' : 'var(--color-border, #2a2a2a)'}`,
  }}>
    <div style={{
      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
      backgroundColor: last ? 'rgba(16,185,129,0.12)' : 'rgba(196,162,101,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 12,
      color: last ? '#10b981' : 'var(--color-accent,#c4a265)',
    }}>
      {n}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--color-primary,#fff)', lineHeight: 1.4 }}>
      {icon} {text}
    </div>
  </div>
);

export default InstallPrompt;
