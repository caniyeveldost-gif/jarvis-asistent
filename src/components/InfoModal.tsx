import React from 'react';
import { X, Info, ShieldCheck, Mail, Sparkles, Lock, Cpu, Globe, ExternalLink, MessageSquare } from 'lucide-react';

export type InfoModalTab = 'about' | 'privacy' | 'contact';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: InfoModalTab;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'about',
}) => {
  const [activeTab, setActiveTab] = React.useState<InfoModalTab>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel-glow border border-cyan-500/40 p-5 sm:p-6 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              {activeTab === 'about' && <Info className="w-4 h-4" />}
              {activeTab === 'privacy' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              {activeTab === 'contact' && <Mail className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-tech font-bold text-cyan-200">
                {activeTab === 'about' && 'HAQQINDA'}
                {activeTab === 'privacy' && 'MƏXFİLİK SİYASƏTİ'}
                {activeTab === 'contact' && 'ƏLAQƏ VƏ DƏSTƏK'}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                JARVIS AI SYSTEM INFORMATION
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 pt-3 pb-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech font-semibold transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Haqqında</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech font-semibold transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Məxfilik Siyasəti</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech font-semibold transition-all cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-amber-950/90 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Əlaqə</span>
          </button>
        </div>

        {/* Tab Contents - Scrollable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {/* TAB 1: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20">
                <h3 className="font-tech font-bold text-cyan-200 text-sm sm:text-base flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  J.A.R.V.I.S. Səsli Köməkçi Nədir?
                </h3>
                <p>
                  J.A.R.V.I.S. (Just A Rather Very Intelligent System) — Azərbaycan dilində və çoxdilli rejimdə istifadəçilərlə təbii səsli dialoq quran, Google Gemini süni intellekt mühərriki ilə təchiz olunmuş qabaqcıl səsli köməkçi platformasıdır.
                </p>
              </div>

              <div>
                <h4 className="font-tech font-bold text-cyan-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Əsas Üstünlüklər və İmkanlar
                </h4>
                <ul className="space-y-2 text-slate-300 list-disc list-inside">
                  <li>
                    <strong className="text-cyan-200">Azərbaycan Dilində Təbii Nitq Tanıma:</strong> Dəqiq nitq tanıma mühərriki ilə səsinizi anında mətnə çevirir.
                  </li>
                  <li>
                    <strong className="text-cyan-200">Google Gemini AI İntellekti:</strong> Dərin analiz, sürətli cavablandırma və zəngin bilik bazası.
                  </li>
                  <li>
                    <strong className="text-cyan-200">Gemini AI Səs Generasiyası (Audio TTS):</strong> Cavablar birbaşa AI modeli tərəfindən axıcı və səlis audio olaraq səsləndirilir.
                  </li>
                  <li>
                    <strong className="text-cyan-200">Bütün Cihazlarda Uyğunluq:</strong> Mobil telefonlar (iOS Safari, Android Chrome) və kompüterlərdə əlavə quraşdırma tələb etmədən tam işləkdir.
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                Sistem Versiyası: <span className="text-cyan-300 font-mono">v2.4.0 (Gemini 3.7 & Flash TTS)</span>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                <h3 className="font-tech font-bold text-emerald-200 text-sm sm:text-base flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Məxfilik və Təhlükəsizlik Zəmanəti
                </h3>
                <p className="text-xs text-emerald-300/90">
                  İstifadəçilərimizin məxfiliyi bizim üçün prioritetdir. Aşağıda məlumatların toplanması və istifadə qaydaları ilə tanış ola bilərsiniz.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    1. Google Gemini API və Sorğuların İşlənməsi
                  </h4>
                  <p className="text-slate-300 pl-3">
                    İstifadəçinin daxil etdiyi və ya mikrofondan oxunan suallar cavabın formalaşdırılması və səs generasiyası məqsədilə təhlükəsiz HTTPS protokolu vasitəsilə <strong>Google Gemini API</strong> xidmətinə göndərilir. Bu məlumatlar yalnız dialoqu təmin etmək üçün anlıq emal olunur və üçüncü şəxslərə satılmır.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-100 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    2. Danışıq Tarixçəsi və Lokal Saxlanma
                  </h4>
                  <p className="text-slate-300 pl-3">
                    Danışıq tarixçəniz heç bir xarici server verilənlər bazasında saxlanılmır. Bütün dialoqlar yalnız istifadəçinin öz cihazında (brauzerin <code>LocalStorage</code> yaddaşında) qalır. İstədiyiniz an «Təmizlə» düyməsinə toxunaraq bütün tarixçəni tam silə bilərsiniz.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-100 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    3. Mikrofon İstifadəsi və İcazələr
                  </h4>
                  <p className="text-slate-300 pl-3">
                    Mikrofon yalnız istifadəçi mikrofon düyməsinə basdıqda və səsli sual vermək istədikdə aktivləşir. İstifadəçidən xəbərsiz və ya arxa fonda heç bir gizli səs yazısı aparılmır.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-100 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    4. Reklamlar və Google AdSense
                  </h4>
                  <p className="text-slate-300 pl-3">
                    Tətbiqin server xərclərini qarşılamaq və pulsuz xidmət təqdim etmək məqsədilə saytda <strong>Google AdSense</strong> və digər üçüncü tərəf reklam şəbəkələri yerləşdirilə bilər. Bu xidmətlər istifadəçilərə uyğun reklamlar göstərmək üçün kuki (cookies) fayllarından istifadə edə bilər. İstifadəçilər brauzer tənzimləmələrindən kuki fayllarını idarə edə bilərlər.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20">
                <h3 className="font-tech font-bold text-amber-200 text-sm sm:text-base flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-amber-400" />
                  Bizimlə Əlaqə Saxlayın
                </h3>
                <p className="text-xs text-amber-200/90">
                  Suallarınız, təklifləriniz və ya əməkdaşlıq üçün bizimlə birbaşa əlaqə qura bilərsiniz.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-400 uppercase">E-Poçt Dəstəyi</span>
                    <h5 className="font-semibold text-slate-100 mt-1">Dəstək & Məlumat</h5>
                    <p className="text-xs text-slate-400 mt-1">İstənilən rəy və sualınız üçün yazın</p>
                  </div>
                  <a
                    href="mailto:caniyeveldost@gmail.com?subject=JARVIS%20S%C9%99sli%20K%C3%B6m%C9%99k%C3%A7i%20%C6%8Flaq%C9%99"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 px-3 py-1.5 rounded-lg w-fit transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>caniyeveldost@gmail.com</span>
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-emerald-400 uppercase">İntellekt & Texnologiya</span>
                    <h5 className="font-semibold text-slate-100 mt-1">Süni İntellekt Platforması</h5>
                    <p className="text-xs text-slate-400 mt-1">Google AI Studio və Gemini texnologiyaları əsasında</p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400 font-mono">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Azərbaycan & Qlobal Dəstək</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <h5 className="font-semibold text-slate-200 text-xs uppercase font-tech tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Sürətli Əlaqə
                </h5>
                <p className="text-xs text-slate-400 mb-3">
                  Tətbiqin inkişafı ilə bağlı yeni ideyalarınız varsa, e-poçt vasitəsilə bizə göndərə bilərsiniz. Cavab ən qısa müddətdə veriləcəkdir.
                </p>
                <a
                  href="mailto:caniyeveldost@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>E-Poçt Göndər</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            © {new Date().getFullYear()} JARVIS AI. Bütün hüquqlar qorunur.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-tech text-xs uppercase transition-all cursor-pointer"
          >
            Bağla
          </button>
        </div>
      </div>
    </div>
  );
};
