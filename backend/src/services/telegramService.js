const { loadCollection } = require('../config/dataStore');

async function sendTelegramMessage(chatId, text) {
  const settings = await loadCollection('settings');
  const token = settings.telegramBotToken;

  if (!token) {
    return {
      success: false,
      reason: "Telegram Bot Token kiritilmagan! Iltimos, BotFather bergan tokenni Sozlamalar bo'limida kiriting."
    };
  }

  if (!chatId) {
    return {
      success: false,
      reason: "Telegram Chat ID kiritilmagan!"
    };
  }

  try {
    const fetch = (await import('node-fetch')).default || globalThis.fetch;
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.toString().trim(),
        text: text,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();

    if (data.ok) {
      return {
        success: true,
        message: "✅ Telegram bot orqali xabar muvaffaqiyatli yuborildi!",
        data: data.result
      };
    } else {
      let friendlyError = data.description || "Noma'lum xatolik";
      if (data.error_code === 401) {
        friendlyError = "Bot Token yaroqsiz yoki xato kiritilgan (401 Unauthorized). BotFather bergan tokenni tekshiring.";
      } else if (data.error_code === 400 && data.description.includes('chat not found')) {
        friendlyError = "Chat ID topilmadi (400 Bad Request). Botga /start bosilganini tekshiring.";
      } else if (data.error_code === 403) {
        friendlyError = "Bot foydalanuvchi tomonidan bloklangan (403 Forbidden).";
      }

      return {
        success: false,
        reason: friendlyError,
        rawDescription: data.description,
        errorCode: data.error_code
      };
    }
  } catch (error) {
    console.error("Telegram API Error:", error.message);
    return {
      success: false,
      reason: `Tarmoq yoki server xatoligi: ${error.message}`
    };
  }
}

async function broadcastTelegramMessage(text) {
  const members = await loadCollection('members');
  const targetMembers = members.filter(m => m.telegramId && m.telegramId.trim() !== '');

  if (targetMembers.length === 0) {
    return {
      success: false,
      message: "Bazada Telegram ID ulangan birorta ham mijoz topilmadi. Mijoz profilida Telegram ID kiritilgan bo'lishi kerak.",
      sentCount: 0,
      totalCount: 0
    };
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const member of targetMembers) {
    const settings = await loadCollection('settings');
    const personalizedText = `📢 *${settings.gymName || 'GYM & FITNESS'} E'LONI*\n\nHurmatli *${member.fullName}*!\n\n${text}`;
    const result = await sendTelegramMessage(member.telegramId, personalizedText);
    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
    }
  }

  return {
    success: true,
    message: `Xabarnoma yuborildi! Jami Telegram ulangan mijozlar: ${targetMembers.length} ta. Yetib bordi: ${sentCount} ta, Muvaffaqiyatsiz: ${failedCount} ta.`,
    sentCount,
    failedCount,
    totalCount: targetMembers.length
  };
}

async function notifyCheckIn(member, lockerNumber) {
  const settings = await loadCollection('settings');
  if (!settings.autoTelegramCheckIn) return;

  const msg = `🏋️‍♂️ *${settings.gymName || 'GYM & FITNESS'}*\n` +
              `Xush kelibsiz, *${member.fullName}*!\n\n` +
              `✅ Zalga kirishingiz qayd etildi.\n` +
              `🔑 Biriktirilgan shkaf: *${lockerNumber || 'Biriktirilmadi'}*\n` +
              `📅 Obunangiz tugash muddati: *${member.endDate}*\n` +
              `⚡ Qolgan tashriflar: *${member.remainingVisits}* ta\n\n` +
              `Yaxshi mashg'ulot tilaymiz! 💪`;

  if (member.telegramId) {
    return await sendTelegramMessage(member.telegramId, msg);
  }
}

async function notifyExpiryWarning(member, daysLeft) {
  const settings = await loadCollection('settings');
  if (!settings.autoTelegramExpiryWarning) return;

  const msg = `⚠️ *${settings.gymName || 'GYM & FITNESS'}*\n` +
              `Hurmatli *${member.fullName}*!\n\n` +
              `Obunangiz tugashiga *${daysLeft} kun* qoldi.\n` +
              `📅 Tugash sanasi: *${member.endDate}*\n\n` +
              `Mashg'ulotlarni to'xtatib qo'ymaslik uchun obunani yangilashingizni so'raymiz! 😊`;

  if (member.telegramId) {
    return await sendTelegramMessage(member.telegramId, msg);
  }
}

async function checkAndSendExpiringReminders() {
  const members = await loadCollection('members');
  const today = new Date();
  let count = 0;

  for (const m of members) {
    if (!m.telegramId || !m.endDate) continue;
    const end = new Date(m.endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 3 || diffDays === 1) {
      await notifyExpiryWarning(m, diffDays);
      count++;
    }
  }
  return count;
}

module.exports = {
  sendTelegramMessage,
  broadcastTelegramMessage,
  notifyCheckIn,
  notifyExpiryWarning,
  checkAndSendExpiringReminders
};
