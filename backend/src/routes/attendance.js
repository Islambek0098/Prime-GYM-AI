const express = require('express');
const router = express.Router();
const { loadCollection, saveCollection } = require('../config/dataStore');
const { notifyCheckIn } = require('../services/telegramService');

function autoCheckoutMidnight() {
  let attendance = loadCollection('attendance');
  let lockers = loadCollection('lockers');
  const today = new Date().toISOString().split('T')[0];
  let modified = false;

  attendance.forEach(record => {
    if (record.status === 'Zalda') {
      const recordDate = record.checkInTime ? record.checkInTime.split('T')[0] : '';
      if (recordDate && recordDate < today) {
        record.status = 'Chiqib ketdi (Avto 00:00)';
        record.checkOutTime = record.checkOutTime || new Date().toISOString();
        modified = true;

        if (record.lockerNumber && record.lockerNumber !== "Yo'q") {
          ['male', 'female'].forEach(g => {
            if (lockers[g]) {
              const lock = lockers[g].find(l => l.number === record.lockerNumber);
              if (lock) {
                lock.status = 'Free';
                lock.assignedTo = null;
              }
            }
          });
        }
      }
    }
  });

  if (modified) {
    saveCollection('attendance', attendance);
    saveCollection('lockers', lockers);
    console.log('🕒 Avto Check-Out (00:00): Eski kun zaldagilar chiqarildi va shkaflar bo\'shatildi.');
  }
}

// Get current attendance list & lockers
router.get('/', (req, res) => {
  autoCheckoutMidnight();
  const attendance = loadCollection('attendance');
  const lockers = loadCollection('lockers');
  res.json({ attendance, lockers });
});

// Quick Check-In Member
router.post('/checkin', async (req, res) => {
  const { query, lockerNumber } = req.body; // query can be memberId or phone or name
  const members = loadCollection('members');
  const attendance = loadCollection('attendance');
  const lockers = loadCollection('lockers');

  if (!query) {
    return res.status(400).json({ error: "Mijoz ID si yoki Telefon raqami kiritilmadi" });
  }

  const cleanQuery = query.toLowerCase().trim();
  const member = members.find(m => 
    m.id.toLowerCase() === cleanQuery || 
    m.phone.replace(/\s+/g, '').includes(cleanQuery.replace(/\s+/g, '')) ||
    m.fullName.toLowerCase().includes(cleanQuery)
  );

  if (!member) {
    return res.status(404).json({ error: "Mijoz topilmadi! Telefon raqami yoki ID xato kiritilgan bo'lishi mumkin." });
  }

  // Prevent duplicate check-in if member is already in the gym ("Zalda")
  const existingAttendance = attendance.find(a => 
    (a.memberId === member.id || 
     (a.phone && member.phone && a.phone.replace(/\s+/g, '') === member.phone.replace(/\s+/g, '')) ||
     (a.memberName && a.memberName.toLowerCase() === member.fullName.toLowerCase())) && 
    a.status === 'Zalda'
  );

  if (existingAttendance) {
    return res.status(400).json({ 
      error: `Ushbu mijoz (${member.fullName}) allaqachon ZALDA! (Shkaf #${existingAttendance.lockerNumber}). Avval chiqib ketishi (check-out) kerak.`,
      member,
      existingAttendance
    });
  }

  // Check if member subscription is valid
  const today = new Date().toISOString().split('T')[0];
  if (member.endDate < today || member.status === 'Expired') {
    return res.status(400).json({ 
      error: `Obuna muddati tugagan! (${member.endDate}). Iltimos obunani uzaytiring.`,
      member 
    });
  }

  if (member.remainingVisits <= 0) {
    return res.status(400).json({ 
      error: "Mijozning qolgan tashriflar soni 0 ga teng! Obunani yangilang.",
      member 
    });
  }

  // Assign locker
  let assignedLocker = lockerNumber;
  const genderKey = member.gender === 'Ayol' ? 'female' : 'male';
  const oppositeGenderKey = genderKey === 'male' ? 'female' : 'male';
  
  if (!assignedLocker) {
    const freeLocker = lockers[genderKey].find(l => l.status === 'Free');
    if (freeLocker) {
      assignedLocker = freeLocker.number;
      freeLocker.status = 'Occupied';
      freeLocker.assignedTo = member.fullName;
    }
  } else {
    // Tekshirish: tanlangan shkaf mijozning jinsiga mos kelishini
    const cleanLocker = assignedLocker.trim().toUpperCase();
    
    // 1. Jinsga nisbatan noto'g'ri prefiks tekshiruvi (M- Erkaklar, F- Ayollar)
    if (member.gender === 'Ayol' && (cleanLocker.startsWith('M-') || cleanLocker.startsWith('M'))) {
      return res.status(400).json({ 
        error: `Xatolik! "${assignedLocker}" shkafi ERKAKLARGA tegishli. ${member.fullName} (Ayol) uchun faqat Ayollar (F-) shkaflaridan biriktirish mumkin.`,
        member 
      });
    }
    if (member.gender !== 'Ayol' && (cleanLocker.startsWith('F-') || cleanLocker.startsWith('F'))) {
      return res.status(400).json({ 
        error: `Xatolik! "${assignedLocker}" shkafi AYOLLARGA tegishli. ${member.fullName} (Erkak) uchun faqat Erkaklar (M-) shkaflaridan biriktirish mumkin.`,
        member 
      });
    }

    // 2. Qarama-qarshi jins shkaflar ro'yxatida mavjudligini tekshirish
    const wrongGenderLocker = lockers[oppositeGenderKey]?.find(l => l.number.toUpperCase() === cleanLocker);
    if (wrongGenderLocker) {
      return res.status(400).json({ 
        error: `Xatolik! "${assignedLocker}" shkafi ${member.gender === 'Ayol' ? 'ERKAKLAR' : 'AYOLLAR'}ga tegishli. ${member.fullName} (${member.gender}) uchun ${member.gender === 'Ayol' ? 'Ayollar (F-)' : 'Erkaklar (M-)'} shkafini tanlang.`,
        member 
      });
    }

    // 3. O'z jinsidagi shkafni topish va bandligini tekshirish
    const targetLocker = lockers[genderKey].find(l => l.number.toUpperCase() === cleanLocker);
    if (targetLocker) {
      if (targetLocker.status === 'Occupied') {
        return res.status(400).json({
          error: `Xatolik! "${assignedLocker}" shkafi allaqachon BAND (${targetLocker.assignedTo || 'boshqa mijoz'}). Iltimos, bo'sh shkaf tanlang.`,
          member
        });
      }
      targetLocker.status = 'Occupied';
      targetLocker.assignedTo = member.fullName;
      assignedLocker = targetLocker.number;
    }
  }

  // Deduct visit count
  member.remainingVisits = Math.max(0, member.remainingVisits - 1);
  saveCollection('members', members);

  // Add attendance record
  const newAttendance = {
    id: `att_${Date.now()}`,
    memberId: member.id,
    memberName: member.fullName,
    phone: member.phone,
    lockerNumber: assignedLocker || 'Yo\'q',
    checkInTime: new Date().toISOString(),
    status: 'Zalda'
  };

  attendance.unshift(newAttendance);
  saveCollection('attendance', attendance);
  saveCollection('lockers', lockers);

  // Send Telegram bot notification
  notifyCheckIn(member, assignedLocker);

  res.json({
    success: true,
    message: `${member.fullName} zalga kirdi! Shkaf #${assignedLocker || 'Ajratilmadi'}`,
    attendance: newAttendance,
    member
  });
});

// Check-out (Free locker)
router.post('/checkout/:id', (req, res) => {
  let attendance = loadCollection('attendance');
  let lockers = loadCollection('lockers');

  const record = attendance.find(a => a.id === req.params.id);
  if (record) {
    record.status = 'Chiqib ketdi';
    record.checkOutTime = new Date().toISOString();

    // Free locker
    ['male', 'female'].forEach(g => {
      const lock = lockers[g].find(l => l.number === record.lockerNumber);
      if (lock) {
        lock.status = 'Free';
        lock.assignedTo = null;
      }
    });

    saveCollection('attendance', attendance);
    saveCollection('lockers', lockers);
  }

  res.json({ success: true, record });
});

module.exports = {
  router,
  autoCheckoutMidnight
};

