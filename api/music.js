// api/music.js
import Meting from '../src/meting.js';

const meting = new Meting('netease');
meting.format(true);
meting.cookie(process.env.MUSIC_U);

export default async function handler(req, res) {
  // ✅ 设置 CORS 头，允许任何来源调用
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json;charset=utf-8');

  // ✅ 支持多种可能被黄白助手使用的参数名
  const songName = req.query.name || req.query.Love || req.query.keyword || req.query.song || req.query.msg;
  console.log('接收到的歌名:', songName);

  if (!songName) {
    return res.status(400).json({ code: 400, error: '请在 URL 后面加上 ?name=歌名 (或 Love, keyword, song, msg)' });
  }

  try {
    const searchRes = await meting.search(songName, { page: 1, limit: 1 });
    const songs = JSON.parse(searchRes);
    if (!songs || songs.length === 0) {
      return res.status(404).json({ code: 404, error: `未找到歌曲: ${songName}` });
    }
    const song = songs[0];

    // 封面
    let cover = '';
    try {
      if (song.pic_id) {
        const coverRes = await meting.pic(song.pic_id);
        cover = JSON.parse(coverRes).url || '';
      }
    } catch (e) {}

    // 播放链接
    const urlRes = await meting.url(song.url_id);
    const musicUrl = JSON.parse(urlRes).url || '';

    const result = {
      code: 200,
      title: song.name,
      singer: (song.artist || []).join(','),
      cover,
      link: `https://music.163.com/song?id=${song.id}`,
      music_url: musicUrl
    };

    console.log('返回结果:', JSON.stringify(result));
    return res.status(200).json(result);
  } catch (err) {
    console.error('服务端错误:', err);
    return res.status(500).json({ code: 500, error: err.message });
  }
}
