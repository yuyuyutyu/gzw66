// api/music.js
import Meting from '@meting/core';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json;charset=utf-8');

  const songName = req.query.keyword || req.query.name || req.query.Love || '';
  console.log('搜索歌名:', songName);

  if (!songName) {
    return res.status(400).json({ code: 400, error: '请提供歌名参数' });
  }

  // 初始化 meting，并设置 cookie
  const meting = new Meting('netease');
  meting.format(true);
  if (process.env.MUSIC_U) {
    meting.cookie(process.env.MUSIC_U);
  }

  try {
    // 1. 搜索歌曲
    const searchRes = await meting.search(songName, { page: 1, limit: 1 });
    const songs = JSON.parse(searchRes);
    if (!songs || songs.length === 0) {
      return res.status(404).json({ code: 404, error: '未找到歌曲' });
    }
    const song = songs[0];
    console.log('找到歌曲:', song.name, '-', song.artist);

    // 2. 获取封面
    let cover = '';
    try {
      if (song.pic_id) {
        const picRes = await meting.pic(song.pic_id);
        cover = JSON.parse(picRes).url || '';
      }
    } catch (e) {}

    // 3. 获取播放链接
    let musicUrl = '';
    try {
      const urlRes = await meting.url(song.url_id, 320);
      musicUrl = JSON.parse(urlRes).url || '';
    } catch (e) {}
    console.log('播放链接:', musicUrl);

    // 4. 返回黄白助手格式
    return res.status(200).json({
      code: 200,
      title: song.name,
      singer: (song.artist || []).join(','),
      cover,
      link: `https://music.163.com/song?id=${song.id}`,
      music_url: musicUrl,
      lyric: ''
    });
  } catch (err) {
    console.error('服务器错误:', err);
    return res.status(500).json({ code: 500, error: err.message });
  }
}
