const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const axios = require('axios');
const fs = require('fs'); // Untuk menulis file
const path = require('path'); // Untuk mengelola path file

async function startBot() {
    // Menggunakan MultiFileAuthState untuk menyimpan status autentikasi
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    // Ambil versi terbaru Baileys
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const isBoomError = lastDisconnect?.error?.isBoom;
            const shouldReconnect = !isBoomError || lastDisconnect.error.output.statusCode !== 401;

            console.log('Koneksi terputus. Reconnect:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Bot berhasil terhubung!');
        }
    });

    // Simpan status autentikasi setiap kali diperbarui
    sock.ev.on('creds.update', saveCreds);

    // Handler untuk pesan masuk
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify' && messages[0]?.message) {
            const msg = messages[0];
            const senderNumber = msg.key.remoteJid;
            const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;
            const messageType = Object.keys(msg.message)[0]; // Dapatkan jenis pesan (imageMessage, videoMessage, dll.)

            console.log(`Pesan diterima dari ${senderNumber}: ${messageContent}`);

            // Cek apakah pesan berupa gambar
            if (messageType === 'imageMessage') {
                console.log('Pesan berupa gambar, mulai proses download...');
                try {
                    const buffer = await downloadMediaMessage(
                        msg,
                        'buffer',
                        {},
                        {
                            logger: sock.logger,
                            reuploadRequest: sock.updateMediaMessage,
                        }
                    );

                    // Simpan buffer ke file
                    const filePath = path.join(__dirname, 'downloads', `${Date.now()}_image.jpg`);
                    fs.writeFileSync(filePath, buffer);
                    console.log(`Gambar berhasil diunduh dan disimpan di: ${filePath}`);
                } catch (err) {
                    console.error('Gagal mendownload gambar:', err.message);
                }
            }

            // Kirim balasan
            await sock.sendMessage(senderNumber, {
                text: `Halo! Anda mengirim pesan: "${messageContent}"`,
            });

            // Kirim data ke webhook
            await sendData(senderNumber, messageContent, msg);
        }
    });
}

async function sendData(sender, message, raw) {
    try {
        const response = await axios.post('https://webhook.site/ac259f59-5257-42df-9dc9-23cbc75d7935', {
            sender: sender,
            message: message,
            raw: raw,
        });
        console.log('Data berhasil dikirim ke webhook:', response.data);
    } catch (error) {
        console.error('Gagal mengirim data ke webhook:', error.message);
    }
}

// Buat folder untuk menyimpan unduhan jika belum ada
if (!fs.existsSync('./downloads')) {
    fs.mkdirSync('./downloads');
}

// Jalankan bot
startBot().catch((err) => console.error('Terjadi kesalahan:', err));
