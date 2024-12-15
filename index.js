const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const axios = require('axios'); // Untuk melakukan HTTP request

async function startBot() {
    // Menggunakan MultiFileAuthState untuk menyimpan status autentikasi
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info'); // Folder tempat data disimpan

    // Ambil versi terbaru Baileys
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version, // Pastikan menggunakan versi protokol terbaru
        auth: state, // Status autentikasi
        printQRInTerminal: true, // Cetak QR code ke terminal
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const isBoomError = lastDisconnect?.error?.isBoom;
            const shouldReconnect = !isBoomError || lastDisconnect.error.output.statusCode !== 401;
    
            console.log('Koneksi terputus. Reconnect:', shouldReconnect);
            if (shouldReconnect) startBot(); // Reconnect jika bukan kesalahan autentikasi
        } else if (connection === 'open') {
            console.log('Bot berhasil terhubung!');
        }
    });
    
    // Simpan status autentikasi setiap kali diperbarui
    sock.ev.on('creds.update', saveCreds);

    // Handler untuk pesan masuk
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log('Pesan Masuk:', messages);
        if (type === 'notify' && messages[0]?.message) {
            const msg = messages[0];
            const senderNumber = msg.key.remoteJid;
            const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;

            console.log(`Pesan diterima dari ${senderNumber}: ${messageContent}`);

            // Kirim balasan
            await sock.sendMessage(senderNumber, {
                text: `Halo! Anda mengirim pesan: "${messageContent}"`,
            });
            await sendData(senderNumber, messageContent);

        }
    });
}
async function sendData(sender, message) {
    try {
        const response = await axios.post('https://webhook.site/ac259f59-5257-42df-9dc9-23cbc75d7935', {
            sender: sender,
            message: message,
        });
        console.log('Data berhasil dikirim ke webhook:', response.data);
    } catch (error) {
        console.error('Gagal mengirim data ke webhook:', error.message);
    }
}

// Jalankan bot
startBot().catch((err) => console.error('Terjadi kesalahan:', err));
