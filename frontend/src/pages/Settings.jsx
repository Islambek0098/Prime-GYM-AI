import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, FileSpreadsheet, Bot, Download, Send, CheckCircle2, Save, HelpCircle, AlertCircle, RefreshCw, Megaphone, Key } from 'lucide-react';

export default function Settings({ settings, onRefresh, showToast }) {
  const [gymName, setGymName] = useState(settings.gymName || 'CHAMPION GYM & FITNESS');
  const [gymLogo, setGymLogo] = useState(settings.gymLogo || '');
  const [telegramToken, setTelegramToken] = useState(settings.telegramBotToken || '');
  const [sheetsId, setSheetsId] = useState(settings.googleSheetsId || '');
  const [credentialsJSON, setCredentialsJSON] = useState(settings.googleCredentialsJSON || '');
  const [testChatId, setTestChatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [sheetsStatus, setSheetsStatus] = useState(null);
  const [showChatIdGuide, setShowChatIdGuide] = useState(false);
  const [showJsonGuide, setShowJsonGuide] = useState(false);

  // Sync state if settings prop changes
  useEffect(() => {
    if (settings) {
      if (settings.gymName) setGymName(settings.gymName);
      if (settings.gymLogo !== undefined) setGymLogo(settings.gymLogo);
      if (settings.telegramBotToken !== undefined) setTelegramToken(settings.telegramBotToken);
      if (settings.googleSheetsId !== undefined) setSheetsId(settings.googleSheetsId);
      if (settings.googleCredentialsJSON !== undefined) setCredentialsJSON(settings.googleCredentialsJSON);
    }
  }, [settings]);

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Rasm hajmi 5MB dan kichik bo'lishi kerak!");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400; // max 400px width/height for optimal logo size
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/png');
          setGymLogo(resizedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymName,
          gymLogo,
          telegramBotToken: telegramToken,
          googleSheetsId: sheetsId,
          googleCredentialsJSON: credentialsJSON
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (showToast) showToast("Sozlamalar muvaffaqiyatli o'zgartirildi!", "update");
        if (onRefresh) await onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Sozlamalarni saqlashda xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      alert("Sozlamalarni saqlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!testChatId) {
      setTelegramStatus({ success: false, message: "Iltimos, sinov xabari uchun Telegram Chat ID kiriting!" });
      return;
    }
    setTelegramStatus({ loading: true, message: "Telegram botga ulanyapti..." });
    try {
      const res = await fetch('http://localhost:5000/api/settings/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: testChatId })
      });
      const data = await res.json();
      if (data.success) {
        setTelegramStatus({ success: true, message: data.message });
      } else {
        setTelegramStatus({ success: false, message: data.reason || data.rawDescription || "Bot ulanishida xatolik" });
      }
    } catch (err) {
      setTelegramStatus({ success: false, message: "Server bilan bog'lanishda xatolik yuz berdi." });
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      setBroadcastStatus({ success: false, message: "Iltimos xabar matnini kiriting!" });
      return;
    }

    setBroadcastLoading(true);
    setBroadcastStatus({ loading: true, message: "Ommaviy xabarnoma barcha mijozlarga yuborilmoqda..." });

    try {
      const res = await fetch('http://localhost:5000/api/settings/broadcast-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastStatus({ success: true, message: data.message });
        setBroadcastMessage('');
        if (showToast) showToast("Xabarnoma yuborildi!");
      } else {
        setBroadcastStatus({ success: false, message: data.message || "Xabarnoma yuborishda xatolik" });
      }
    } catch (err) {
      console.error(err);
      setBroadcastStatus({ success: false, message: "Server bilan bog'lanishda xatolik" });
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleTestSheets = async () => {
    setSheetsStatus({ loading: true, message: "Google Sheets tekshirilmoqda..." });
    try {
      const res = await fetch('http://localhost:5000/api/settings/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetsId, credentialsJSON })
      });
      const data = await res.json();
      if (data.success) {
        setSheetsStatus({ success: true, message: data.message });
      } else {
        setSheetsStatus({ success: false, message: data.error });
      }
    } catch (err) {
      setSheetsStatus({ success: false, message: "Server bilan bog'lanishda xatolik" });
    }
  };

  const handleDownloadCSV = (collectionName) => {
    window.open(`http://localhost:5000/api/settings/export-csv/${collectionName}`, '_blank');
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
          <span>Tizim Sozlamalari</span>
        </h2>
        <p className="text-xs text-slate-400">Google Sheets, Telegram Bot va Ommaviy Xabarnoma yuborish</p>
      </div>

      {/* Broadcast Message Card */}
      <div className="glass-card p-6 rounded-2xl space-y-4 border-t-4 border-t-purple-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Barcha Mijozlarga Telegram Xabarnoma Yuborish (Broadcast)</h3>
            <p className="text-xs text-slate-400">Bazada Telegram Chat ID ulangan barcha mijozlarga birdaniga e'lon yuborish</p>
          </div>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">E'lon Matni:</label>
            <textarea
              rows="3"
              placeholder="Masalan: Bugun zalimizda soat 18:00 da profilaktika bo'ladi, barcha a'zolarni kutamiz! Muscle Gym"
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-sans focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={broadcastLoading}
            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
          >
            <Megaphone className="w-4 h-4" />
            <span>{broadcastLoading ? "Yuborilmoqda..." : "Barcha Mijozlarga Yuborish"}</span>
          </button>
        </form>

        {broadcastStatus && (
          <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2 ${
            broadcastStatus.loading ? 'bg-slate-950 text-slate-300 border border-slate-800' :
            broadcastStatus.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
            'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}>
            {broadcastStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            <span>{broadcastStatus.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Google Sheets Settings Card */}
        <div className="glass-card p-6 rounded-2xl space-y-4 border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Sheets & Excel Integratsiyasi</h3>
              <p className="text-xs text-slate-400">Excel yuklab olish yoki Google Sheets avto-yozish</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs pt-2">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Google Sheet Link / ID:</label>
              <input
                type="text"
                placeholder="1ULIn_2Kt-ka0h-AfpChnjCZGbcp1znWq0FnZGvVZdaY"
                value={sheetsId}
                onChange={e => setSheetsId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Google Sheet ID: <strong className="text-emerald-400">{sheetsId || '1ULIn_2Kt-ka0h-AfpChnjCZGbcp1znWq0FnZGvVZdaY'}</strong>
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-semibold flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Service Account JSON Key (Avto-yozish uchun):</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowJsonGuide(!showJsonGuide)}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Bu nima?</span>
                </button>
              </div>

              <textarea
                rows="3"
                placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..."}'
                value={credentialsJSON}
                onChange={e => setCredentialsJSON(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* JSON Guide Box */}
            {showJsonGuide && (
              <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs space-y-2 text-slate-300">
                <p className="font-bold text-emerald-400">💡 Service Account JSON haqida ma'lumot:</p>
                <p className="text-[11px] leading-relaxed">
                  <strong>1-Usul (Eng oson):</strong> Pastdagi Excel (CSV) tugmasini bossangiz, barcha ma'lumotlar alohida kataklarga ajralgan holda darhol kompyuteringizga yuklanadi.<br/>
                  <strong>2-Usul (Onlayn Google Sheets avto-yozish):</strong> Google Cloud Console dan Service Account ochib, olingan JSON kalitini yuqoriga joylashtirasiz va Google Sheet faylingizga service account emailiga ("client_email") tahrirlash (Editor) huquqini berishingiz kerak bo'ladi.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Sozlamalarni Saqlash</span>
              </button>

              <button
                type="button"
                onClick={handleTestSheets}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ulanishni Tekshirish</span>
              </button>
            </div>
          </form>

          {sheetsStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              sheetsStatus.loading ? 'bg-slate-950 text-slate-300 border border-slate-800' :
              sheetsStatus.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
              'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}>
              {sheetsStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              <span>{sheetsStatus.message}</span>
            </div>
          )}

          {/* Export CSV Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Excel (CSV) Yuklab Olish:</h4>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Alohida katakli Excel</span>
            </div>
            
            <p className="text-[11px] text-slate-400">
              Ushbu fayllar Excel-da kataklarga avtomatik ajralib ochiladi:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleDownloadCSV('members')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center justify-between"
              >
                <span>📋 Mijozlar Bazasi</span>
                <Download className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              <button
                onClick={() => handleDownloadCSV('attendance')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center justify-between"
              >
                <span>🚪 Tashriflar Ro'yxati</span>
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              <button
                onClick={() => handleDownloadCSV('posSales')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center justify-between"
              >
                <span>🛒 POS Bar Sotuvlari</span>
                <Download className="w-3.5 h-3.5 text-amber-400" />
              </button>

              <button
                onClick={() => handleDownloadCSV('posProducts')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center justify-between"
              >
                <span>🥤 POS Mahsulotlar</span>
                <Download className="w-3.5 h-3.5 text-purple-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Telegram Bot Settings Card */}
        <div className="glass-card p-6 rounded-2xl space-y-4 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Telegram Bot Xabarnomalari</h3>
              <p className="text-xs text-slate-400">Zalga kirish va obuna tugashida avto-xabarnoma</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs pt-2">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Telegram Bot Token (BotFather):</label>
              <input
                type="password"
                placeholder="8530925503:AAGeJ-9Mum1AQS2Hr2cin..."
                value={telegramToken}
                onChange={e => setTelegramToken(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>

            {/* Fitnes Zal Nomi va Logo */}
            <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Klub / Fitnes Zal Nomi:</label>
                <input
                  type="text"
                  value={gymName}
                  onChange={e => setGymName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Fitnes Zal Logotipi (Logo Image):
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-700 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                    {gymLogo ? (
                      <img src={gymLogo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold text-center">No Logo</span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Format: PNG, JPG, WEBP, SVG. Har qanday o'lchamdagi rasm sifatli va proporsional joylashadi.
                    </p>
                    {gymLogo && (
                      <button
                        type="button"
                        onClick={() => setGymLogo('')}
                        className="text-[11px] text-rose-400 hover:underline font-semibold"
                      >
                        🗑️ Logotipni o'chirish (Reset)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Bot Sozlamalarini Saqlash</span>
            </button>
          </form>

          {/* Test Telegram Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bot Ulanishini Tekshirish:</h4>
              <button
                type="button"
                onClick={() => setShowChatIdGuide(!showChatIdGuide)}
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Chat ID qanday olinadi?</span>
              </button>
            </div>

            {/* Chat ID Help Box */}
            {showChatIdGuide && (
              <div className="p-3.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-xs space-y-2 text-slate-300">
                <p className="font-bold text-blue-400">💡 Telegram Chat ID ni olish bosqichlari:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                  <li>Telegram ilovasini oching.</li>
                  <li>Qidiruvga <strong className="text-white">@userinfobot</strong> yoki <strong className="text-white">@raw_data_bot</strong> yozib botni toping.</li>
                  <li>Botga <strong className="text-white">/start</strong> buyrug'ini yuboring.</li>
                  <li>Bot sizga bergan <strong className="text-white">Id: 123456789</strong> raqamini nusxalang.</li>
                  <li><strong className="text-amber-400">Muhim:</strong> O'zingiz yaratgan botingizga ham avval bir marta <strong className="text-white">/start</strong> bosing!</li>
                </ol>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Telegram Chat ID kiriting (masalan: 123456789)"
                value={testChatId}
                onChange={e => setTestChatId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
              <button
                type="button"
                onClick={handleTestTelegram}
                className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test Yuborish</span>
              </button>
            </div>

            {telegramStatus && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                telegramStatus.loading ? 'bg-slate-950 text-slate-300 border border-slate-800' :
                telegramStatus.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' :
                'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}>
                {telegramStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                <span>{telegramStatus.message}</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
