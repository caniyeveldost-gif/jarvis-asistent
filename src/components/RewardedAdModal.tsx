import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Gift, CheckCircle2, Clock, PlayCircle } from 'lucide-react';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (newRemaining: number, newLimit: number) => void;
  clientId: string;
  onPlaySuccessSound?: () => void;
}

const REQUIRED_SECONDS = 15;

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
  clientId,
  onPlaySuccessSound,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(REQUIRED_SECONDS);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<any>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(REQUIRED_SECONDS);
      setIsCompleted(false);
      setIsClaiming(false);
      setClaimSuccess(false);
      setClaimError(null);

      // Start countdown
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Inject Adsterra Ad inside modal iframe
      setTimeout(() => {
        if (iframeRef.current) {
          const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
          if (doc) {
            const htmlContent = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <style>
                    body {
                      margin: 0;
                      padding: 0;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      background-color: transparent;
                      overflow: hidden;
                    }
                  </style>
                </head>
                <body>
                  <script type="text/javascript">
                    atOptions = {
                      'key' : 'ebb3423019645ee7b10c1c73e0480756',
                      'format' : 'iframe',
                      'height' : 250,
                      'width' : 300,
                      'params' : {}
                    };
                  </script>
                  <script type="text/javascript" src="https://www.highperformanceformat.com/ebb3423019645ee7b10c1c73e0480756/invoke.js"></script>
                </body>
              </html>
            `;
            doc.open();
            doc.write(htmlContent);
            doc.close();
          }
        }
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = Math.min(
    100,
    Math.round(((REQUIRED_SECONDS - secondsLeft) / REQUIRED_SECONDS) * 100)
  );

  const handleClaimReward = async () => {
    if (!isCompleted || isClaiming) return;
    setIsClaiming(true);
    setClaimError(null);

    try {
      const response = await fetch('/api/reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
        },
        body: JSON.stringify({ clientId, amount: 5 }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Mükafat alına bilmədi.');
      }

      setClaimSuccess(true);
      if (onPlaySuccessSound) onPlaySuccessSound();

      // Trigger reward callback
      onRewardClaimed(data.remaining, data.limit);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Claim reward error:', err);
      setClaimError(err?.message || 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl glass-panel-glow border border-cyan-500/50 bg-[#070c18] p-5 sm:p-6 overflow-hidden flex flex-col shadow-[0_0_40px_rgba(6,182,212,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-400/50 flex items-center justify-center text-amber-400 animate-pulse">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-tech font-bold text-amber-300 flex items-center gap-1.5">
                MÜKAFATLI REKLAM
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                5 ƏLAVƏ SUAL QAZANIN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Bağla"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Timer info */}
        <div className="my-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {isCompleted ? (
                <span className="text-emerald-400 font-semibold">Reklam İzləndi!</span>
              ) : (
                <span>Gözləyin: {secondsLeft} saniyə</span>
              )}
            </span>
            <span className="text-cyan-400 font-bold">{progressPercent}%</span>
          </div>

          {/* Progress bar line */}
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-cyan-500/20">
            <div
              className={`h-full transition-all duration-1000 ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'bg-gradient-to-r from-amber-500 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Adsterra Iframe Ad Container */}
        <div className="w-full flex flex-col items-center justify-center my-2">
          <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950/80 p-1 flex items-center justify-center min-h-[250px] min-w-[300px]">
            <iframe
              ref={iframeRef}
              title="Rewarded Adsterra Ad"
              width="300"
              height="250"
              scrolling="no"
              frameBorder="0"
              className="border-0 overflow-hidden"
              style={{ width: '300px', height: '250px' }}
            />
          </div>
        </div>

        {/* Status & Claim Action */}
        <div className="mt-3 flex flex-col gap-2">
          {claimError && (
            <p className="text-xs text-rose-400 text-center font-mono">{claimError}</p>
          )}

          {claimSuccess ? (
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-950/80 border border-emerald-400/60 text-emerald-300 font-tech font-bold text-xs uppercase tracking-wider animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>+5 SUAL BALANSINIZA ƏLAVƏ OLUNDU!</span>
            </div>
          ) : isCompleted ? (
            <button
              onClick={handleClaimReward}
              disabled={isClaiming}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-tech font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer active:scale-98"
            >
              {isClaiming ? (
                <span>TƏSDİQLƏNİR...</span>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  <span>MÜKAFATI GÖTÜR (+5 SUAL QAZAN)</span>
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-tech text-xs uppercase tracking-wider cursor-not-allowed"
            >
              <PlayCircle className="w-4 h-4 text-slate-600 animate-spin" />
              <span>Reklam izlənilir ({secondsLeft} san qaldı)...</span>
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-500 text-center mt-2.5 font-mono">
          Reklamı 15 saniyə izlədikdən sonra gündəlik limitinizə dərhal 5 sual əlavə olunur.
        </p>
      </div>
    </div>
  );
};
