const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/download', async (req, res) => {
  const { url } = req.query;
  if (!url || !ytdl.validateURL(url)) return res.status(400).send('Invalid URL');

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').trim() || 'audio';
    res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    const stream = ytdl(url, { quality: 'highestaudio' });

    ffmpeg(stream)
      .audioBitrate(320)
      .format('mp3')
      .on('error', err => {
        if (!res.headersSent) {
          res.status(500).send('FFmpeg error: ' + err.message);
        }
      })
      .pipe(res, { end: true });

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).send('Error processing URL');
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
