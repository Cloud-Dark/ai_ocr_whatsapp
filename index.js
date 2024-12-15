const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js'); // Library OCR

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
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

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify' && messages[0]?.message) {
            const msg = messages[0];
            const senderNumber = msg.key.remoteJid;
            const messageType = Object.keys(msg.message)[0]; // Dapatkan jenis pesan
            const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;

            console.log(`Pesan diterima dari ${senderNumber}: ${messageContent}`);

            // Kirim data ke webhook
            sendData(senderNumber, messageContent, messages);

            if (messageType === 'imageMessage' && msg.message.imageMessage.caption?.startsWith('/ocr')) {
                console.log('Pesan berupa gambar dengan perintah /ocr, mulai proses OCR...');

                // Kirim balasan awal
                await sock.sendMessage(senderNumber, {
                    text: 'Image diterima, sedang membaca image...',
                });

                try {
                    // Unduh gambar
                    const buffer = await downloadMediaMessage(
                        msg,
                        'buffer',
                        {},
                        {
                            logger: sock.logger,
                            reuploadRequest: sock.updateMediaMessage,
                        }
                    );

                    // Simpan sementara
                    const tempPath = path.join(__dirname, 'downloads', `${Date.now()}_ocr.jpg`);
                    fs.writeFileSync(tempPath, buffer);

                    // Proses OCR
                    const { data: { text } } = await Tesseract.recognize(tempPath, 'eng');
                    console.log('Hasil OCR:', text);

                    // Kirim hasil OCR ke pengirim
                    await sock.sendMessage(senderNumber, {
                        text: `Isi dari gambar Anda adalah:\n\n${text.trim()}`,
                    });

                    // Hapus file sementara
                    fs.unlinkSync(tempPath);
                } catch (err) {
                    console.error('Gagal memproses OCR:', err.message);
                    await sock.sendMessage(senderNumber, {
                        text: 'Maaf, terjadi kesalahan saat memproses gambar Anda untuk OCR.',
                    });
                }
            } else {
                console.log('Pesan bukan perintah /ocr.');
            }
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
