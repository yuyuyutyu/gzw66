// api/music.js
// 这是你自定义的点歌接口，它调用你自己的 NeteaseCloudMusicApiEnhanced

const MY_MUSIC_API = 'https://api-enhanced-five-alpha.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json;charset=utf-8');

  const songName = req.query.keyword || req.query.name || req.query.Love || '';
  console.log('搜索歌名:', songName);

  if (!songName) {
    return res.status(400).json({ code: 400, error: '请提供歌名参数' });
  }

  try {
    // 1. 搜索歌曲
    const searchUrl = `${MY_MUSIC_API}/search?keywords=${encodeURIComponent(songName)}&limit=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const songs = searchData?.result?.songs;

    if (!songs || songs.length === 0) {
      return res.status(404).json({ code: 404, error: '未找到歌曲' });
    }
    const song = songs[0];

    // 2. 获取播放链接
    const urlRes = await fetch(`${MY_MUSIC_API}/song/url?id=${song.id}`);
    const urlData = await urlRes.json();
    const musicUrl = urlData?.data?.[0]?.url || '';

    // 3. 获取封面 - 优先使用专辑中的 picId 拼接
    let cover = '';
    if (song.album && song.album.picId) {
      cover = `https://p3.music.126.net/${song.album.picId}.jpg`;
    } else {
      // 备用：调用 detail 接口
      try {
        const detailRes = await fetch(`${MY_MUSIC_API}/song/detail?ids=${song.id}`);
        const detailData = await detailRes.json();
        cover = detailData?.songs?.[0]?.al?.picUrl || '';
      } catch (e) {}
    }

    // 4. 歌手 - 注意字段名是 artists 而不是 ar
    const singer = song.artists?.map(a => a.name).join(',') || '';

    // 5. 返回符合黄白助手格式的数据
    return res.status(200).json({
      code: 200,
      title: song.name,
      singer: singer,
      cover,
      link: `https://music.163.com/song?id=${song.id}`,
      music_url: musicUrl,
      lyric: ''
    });
  } catch (err) {
    return res.status(500).json({ code: 500, error: err.message });
  }
}