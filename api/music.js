// api/music.js
import Meting from '../src/meting.js';

const meting = new Meting('netease');
meting.format(true);
meting.cookie(process.env.MUSIC_U);

export default async function handler(req, res) {
  // CORS 跨域头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json;charset=utf-8');

  // 支持 name, Love, keyword, song, msg 等参数
  const songName = req.query.name || req.query.Love || req.query.keyword || req.query.song || req.query.msg;
  console.log('接收到的歌名:', songName);

  if (!songName) {
    return res.status(400).json({
      code: 400,
      error: '请提供歌名参数 (name / keyword / Love 等)'
    });
  }

  try {
    // 1. 搜索歌曲
    const searchRes = await meting.search(songName, { page: 1, limit: 1 });
    const songs = JSON.parse(searchRes);
    if (!songs || songs.length === 0) {
      return res.status(404).json({ code: 404, error: '没找到这首歌' });
    }
    const song = songs[0];

    // 2. 封面
    let cover = '';
    try {
      if (song.pic_id) {
        const coverRes = await meting.pic(song.pic_id);
        cover = JSON.parse(coverRes).url || '';
      }
    } catch (e) {
      console.log('封面获取失败，使用空值');
    }

    // 3. 播放链接（不指定码率，避免空链接）
    let musicUrl = '';
    try {
      const urlRes = await meting.url(song.url_id);
      musicUrl = JSON.parse(urlRes).url || '';
    } catch (e) {
      console.log('播放链接获取失败');
    }

    // 4. 返回黄白助手要求的字段顺序（code, title, singer, cover, link, music_url）
    const result = {
      code: 200,
      title: song.name || '',
      singer: (song.artist || []).join(','),
      cover: cover,
      link: `https://music.163.com/song?id=${song.id}`,
      music_url: musicUrl,
      lyric: ''           // 顺便给个空歌词字段，避免某些插件报错
    };

    console.log('返回结果:', JSON.stringify(result));
    return res.status(200).json(result);

  } catch (err) {
    console.error('服务器错误:', err);
    return res.status(500).json({
      code: 500,
      error: '服务器内部错误: ' + err.message
    });
  }
}
