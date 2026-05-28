// api/music.js
import Meting from '@meting/core';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json;charset=utf-8');

  let songName = req.query.keyword || req.query.name || req.query.Love || '';
  console.log('搜索歌名:', songName);

  if (!songName) {
    return res.status(400).json({ code: 400, error: '请提供歌名参数' });
  }

  const meting = new Meting('netease');
  meting.format(true);
  if (process.env.MUSIC_U) {
    meting.cookie(process.env.MUSIC_U);
  }

  async function tryGetMusic(searchKeyword) {
    try {
      const searchRes = await meting.search(searchKeyword, { page: 1, limit: 5 });
      const songs = JSON.parse(searchRes);
      if (!songs || songs.length === 0) return null;
      
      for (const song of songs) {
        try {
          const urlRes = await meting.url(song.url_id, 320);
          const musicUrl = JSON.parse(urlRes).url;
          if (musicUrl) {
            let cover = '';
            if (song.pic_id) {
              try {
                const picRes = await meting.pic(song.pic_id);
                cover = JSON.parse(picRes).url || '';
              } catch (e) {}
            }
            return {
              code: 200,
              title: song.name,
              singer: (song.artist || []).join(','),
              cover,
              link: `https://music.163.com/song?id=${song.id}`,
              music_url: musicUrl,
              lyric: ''
            };
          }
        } catch (e) {}
      }
      return null;
    } catch (err) {
      console.error('搜索出错:', err);
      return null;
    }
  }

  // 先尝试原关键词搜索
  let result = await tryGetMusic(songName);
  
  // 如果没有链接，尝试加上“原唱”
  if (!result) {
    console.log('原关键词无可用链接，尝试添加"原唱"');
    result = await tryGetMusic(songName + ' 原唱');
  }

  if (result) {
    return res.status(200).json(result);
  } else {
    return res.status(404).json({ code: 404, error: '未找到可播放的歌曲' });
  }
}
