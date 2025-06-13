const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint untuk fetch data dari Takoboto
app.get('/api/search/:kanji', async (req, res) => {
    try {
        const kanji = req.params.kanji;
        const response = await axios.get(`https://takoboto.jp/?q=${encodeURIComponent(kanji)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        res.json({ html: response.data });
    } catch (error) {
        console.error('Error fetching from Takoboto:', error);
        res.status(500).json({ error: 'Failed to fetch data from Takoboto' });
    }
});

// API endpoint untuk Gemini AI
app.post('/api/gemini', async (req, res) => {
    try {
        const { kanjiData } = req.body;
        
        const prompt = `Berdasarkan kanji berikut :
${kanjiData}, tolong anda cari terlebih dahulu di takoboto agar tidak bias

**INTRUKSI**
Tolong jelaskan dalam bahasa Indonesia yang rapi dan mudah dipahami:
1. Arti kanji dalam bahasa indonesia
2. Di kondisi apa dan situasi apa kanji ini digunakan? jelaskan secara singkat dan mudah dipahami
3. Berikan 3 contoh pola kalimat singkat dengan kanji ini ${kanjiData},  beserta cara baca furigana/hiragananya serta artinya dalam bahasa Indonesia.

**PENTING DIPAHAMI**
1. Jangan membuat respon atau tambahan teks bias fokus anda pada intruksi
2. Penjelasan ringkas dan to the point, Hindari penjelasan panjang
3. jangan menambahkan header atau simbol aneh hanya bold dan tulisan biasa

Format jawaban dengan rapi dan mudah dibaca.`;

        const response = await axios.post(
                  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const generatedText = response.data.candidates[0].content.parts[0].text;
        res.json({ result: generatedText });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to get response from Gemini AI' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});