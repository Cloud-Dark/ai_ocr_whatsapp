require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const request = require('request');

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
            const messageType = Object.keys(msg.message)[0];
            const caption = msg.message.imageMessage?.caption || '';

            console.log(`Pesan diterima dari ${senderNumber}: ${caption}`);

            if (messageType === 'imageMessage' && caption.startsWith('/ocr')) {
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
                    const { data: { text: ocrText } } = await Tesseract.recognize(tempPath, 'eng+ind');
                    console.log('Hasil OCR:', ocrText);

                    if (caption === '/ocr') {
                        // Perintah: /ocr
                        await sock.sendMessage(senderNumber, {
                            text: `Isi dari gambar Anda adalah:\n\n${ocrText.trim()}`,
                        });
                    } else if (caption.startsWith('/ocr /ai')) {
                        // Perintah: /ocr /ai atau /ocr /ai (text command)
                        const customPromptMatch = caption.match(/\(.*?\)/);
                        const customPrompt = customPromptMatch
                            ? customPromptMatch[0].slice(1, -1) // Ambil isi dalam tanda kurung
                            : null;

                        await sock.sendMessage(senderNumber, {
                            text: 'Hasil OCR diterima, sedang diproses oleh AI...',
                        });

                        const aiResponse = customPrompt
                            ? await processWithAI(ocrText, customPrompt) // Prompt khusus
                            : await processWithAI(ocrText); // Prompt default

                        await sock.sendMessage(senderNumber, {
                            text: `Hasil AI:\n\n${aiResponse}`,
                        });
                    }

                    // Hapus file sementara
                    fs.unlinkSync(tempPath);
                } catch (err) {
                    console.error('Gagal memproses OCR:', err.message);
                    await sock.sendMessage(senderNumber, {
                        text: 'Maaf, terjadi kesalahan saat memproses gambar Anda.',
                    });
                }
            }
        }
    });
}

// Fungsi untuk memproses OCR dengan AI
async function processWithAI(ocrResult, customPrompt = null) {
    const systemPrompt = 'Kamu adalah asisten pribadi yang dapat merapikan hasil OCR. Jangan gunakan format markdown. Berikan hasil yang rapi dan mudah dibaca tanpa menambahkan kata-kata lain.';
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            url: process.env.AI_API_URL, // URL dari ENV
            headers: {
                Authorization: `Bearer ${process.env.AI_API_TOKEN}`, // Token dari ENV
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: customPrompt || systemPrompt, // Gunakan prompt default atau khusus
                    },
                    {
                        role: 'user',
                        content: ocrResult,
                    },
                ],
            }),
        };

        request(options, (error, response, body) => {
            if (error) {
                console.error('Gagal memproses AI:', error.message);
                reject('Gagal memproses AI');
            } else {
                try {
                    const aiResponse = JSON.parse(body);
                    const result = aiResponse.result?.response || 'AI tidak memberikan respons yang valid.';
                    const resultFormatted = result
                        .replace(/\*\*([^*]+)\*\*/g, '*$1*') // Ganti ** dengan 1 bintang *
                        .replace(/^\s*\*\s/gm, '- ') // Ganti * di awal baris dengan -
                        .replace(/(\*\s[^*]+):/g, '$1 :'); // Tambahkan spasi setelah bintang sebelum titik dua
                    console.log('Respons dari AI:', resultFormatted);
                    resolve(resultFormatted);
                } catch (err) {
                    console.error('Kesalahan saat memparsing respons AI:', err.message);
                    reject('Kesalahan saat memproses respons AI.');
                }
            }
        });
    });
}

// Buat folder untuk menyimpan unduhan jika belum ada
if (!fs.existsSync('./downloads')) {
    fs.mkdirSync('./downloads');
}

// Jalankan bot
startBot().catch((err) => console.error('Terjadi kesalahan:', err));
