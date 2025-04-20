
const fs = require("fs");

// Fungsi untuk menentukan pemenang
function determineWinner(player1Choice, player2Choice) {
  if (player1Choice === player2Choice) return "draw";
  if (
    (player1Choice === "batu" && player2Choice === "gunting") ||
    (player1Choice === "gunting" && player2Choice === "kertas") ||
    (player1Choice === "kertas" && player2Choice === "batu")
  ) {
    return "player1";
  }
  return "player2";
}

// Mode melawan bot
async function handleSuitBot(sock, from, senderId, body, userData, saveUserData) {
  const args = body.split(" ");
  if (args.length < 3) {
    await sock.sendMessage(from, {
      text: "❌ Format salah! Gunakan: !suit [taruhan] [batu/gunting/kertas]",
    });
    return;
  }

  const bet = parseInt(args[1]);
  const playerChoice = args[2].toLowerCase();

  if (isNaN(bet) || bet <= 0) {
    await sock.sendMessage(from, {
      text: "❌ Taruhan harus berupa angka positif.",
    });
    return;
  }

  if (!["batu", "gunting", "kertas"].includes(playerChoice)) {
    await sock.sendMessage(from, {
      text: "❌ Pilihan harus batu, gunting, atau kertas.",
    });
    return;
  }

  if (!userData[senderId] || userData[senderId].money < bet) {
    await sock.sendMessage(from, {
      text: "❌ Uang Anda tidak cukup untuk taruhan ini.",
    });
    return;
  }

  const botChoice = ["batu", "gunting", "kertas"][
    Math.floor(Math.random() * 3)
  ];
  const result = determineWinner(playerChoice, botChoice);

  let message = `🤖 Bot memilih: ${botChoice}\n`;
  if (result === "draw") {
    message += "⚖️ Hasil: Seri!";
  } else if (result === "player1") {
    userData[senderId].money += bet;
    userData[senderId].winrate = userData[senderId].winrate || { win: 0, lose: 0 };
    userData[senderId].winrate.win += 1;
    message += `🎉 Anda menang! Anda mendapatkan $${bet}.`;
  } else {
    userData[senderId].money -= bet;
    userData[senderId].winrate = userData[senderId].winrate || { win: 0, lose: 0 };
    userData[senderId].winrate.lose += 1;
    message += `❌ Anda kalah! Anda kehilangan $${bet}.`;
  }

  saveUserData();
  await sock.sendMessage(from, { text: message });
}
// Cek winrate
async function handleCheckWinrate(sock, from, senderId, body, userData) {
  const args = body.split(" ");
  let targetId = senderId;

  if (args.length > 1) {
    const mentionedId = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (mentionedId) targetId = mentionedId;
  }

  if (!userData[targetId] || !userData[targetId].winrate) {
    await sock.sendMessage(from, {
      text: "❌ Pengguna ini belum memiliki data winrate.",
    });
    return;
  }

  const { win, lose } = userData[targetId].winrate;
  const total = win + lose;
  const winrate = total > 0 ? ((win / total) * 100).toFixed(2) : 0;

  await sock.sendMessage(from, {
    text: `📊 Winrate ${targetId.replace("@s.whatsapp.net", "")}:\nMenang: ${win}\nKalah: ${lose}\nWinrate: ${winrate}%`,
  });
}
module.exports = {
  handleSuitBot,
  handleCheckWinrate, // Pastikan ini diekspor
};