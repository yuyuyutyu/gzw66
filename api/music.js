// api/music.js
// 这是你自定义的点歌接口，它调用你自己的 NeteaseCloudMusicApi

// 你自己的 NeteaseCloudMusicApi 地址
const MY_MUSIC_API = 'https://api-enhanced-five-alpha.vercel.app';
// 从环境变量读取 Cookie，用于传给后端API
const MUSIC_U_COOKIE = process.env.MUSIC_U || ''; 

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json;charset=utf-8');

  const songName = req.query.keyword || req.query.name || req.query.Love || '';
  console.log('搜索歌名:', songName);

  if (!songName) {
    return res.status(400).json({ code: 400, error: '请提供歌名参数' });
  }

  try {
    // 1. 调用你自己的 API 搜索歌曲
    const searchUrl = `${MY_MUSIC_API}/search?keywords=${encodeURIComponent(songName)}&limit=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const songs = searchData?.result?.songs;

    if (!songs || songs.length === 0) {
      return res.status(404).json({ code: 404, error: '未找到歌曲' });
    }
    const song = songs[0];

    // --- 字段解析 ---
    const singer = song.artists?.map(a => a.name).join(',') || '';
    const cover = song.album?.picId 
      ? `https://p3.music.126.net/${song.album.picId}.jpg?param=300y300` 
      : '';

    // 2. 获取播放链接，带上完整的 cookie 参数和音质参数
    let musicUrl = '';
    if (MUSIC_U_COOKIE) {
        // 关键修复：在请求URL中直接传入cookie，并尝试请求极高音质
        const urlApi = `${MY_MUSIC_API}/song/url?id=${song.id}&cookie=${encodeURIComponent(MUSIC_U_COOKIE)}&level=exhigh`;
        const urlRes = await fetch(urlApi);
        const urlData = await urlRes.json();
        musicUrl = urlData?.data?.[0]?.url || '';
    }

    // 3. 返回符合黄白助手格式的数据
    return res.status(200).json({
      code: 200,
      title: song.name,
      singer: singer,
      cover: cover,
      link: `https://music.163.com/song?id=${song.id}`,
      music_url: musicUrl,
      lyric: ''
    });
  } catch (err) {
    return res.status(500).json({ code: 500, error: err.message });
  }
}