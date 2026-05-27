// api/music.js
import Meting from '../src/meting.js';

// 初始化网易云音乐实例
const meting = new Meting('netease');
meting.format(true);

// 从 Vercel 环境变量中获取 Cookie，更安全
meting.cookie(process.env.MUSIC_U);

export default async function handler(req, res) {
  // 从查询参数中获取歌名 (黄白助手默认使用 ?name= 参数)
  const songName = req.query.name || req.query.Love;
  console.log('搜索歌名:', songName);

  // 设置响应头，支持中文
  res.setHeader('Content-Type', 'application/json;charset=utf-8');

  if (!songName) {
    return res.status(400).json({ code: 400, error: '请在 URL 后面加上 ?name=歌名' });
  }

  try {
    // 1. 搜索歌曲，只取第一条结果
    console.log('开始搜索...');
    const searchRes = await meting.search(songName, { page: 1, limit: 1 });
    const songs = JSON.parse(searchRes);
    
    if (!songs || songs.length === 0) {
      console.log('搜索结果为空');
      return res.status(404).json({ code: 404, error: `没有找到歌曲: ${songName}` });
    }
    
    const song = songs[0];
    console.log('找到歌曲:', song.name, '-', song.artist);
    console.log('歌曲完整数据:', JSON.stringify(song));

    // 2. 获取封面图片
    let cover = '';
    try {
      if (song.pic_id) {
        const coverRes = await meting.pic(song.pic_id);
        const coverData = JSON.parse(coverRes);
        cover = coverData.url || '';
      }
    } catch (err) {
      console.error('获取封面失败:', err.message);
    }

    // 3. 获取音乐链接 (H5端页面链接)
    const link = `https://music.163.com/song?id=${song.id}`;

    // 4. 获取播放链接
    console.log('开始获取播放链接...');
    const urlRes = await meting.url(song.url_id, 320);
    const urlData = JSON.parse(urlRes);
    const musicUrl = urlData.url || '';
    console.log('播放链接:', musicUrl);

    // 5. 返回符合黄白助手格式的数据
    const result = {
      code: 200,
      title: song.name || '',
      singer: Array.isArray(song.artist) ? song.artist.join(',') : (song.artist || ''),
      cover: cover,
      link: link,
      music_url: musicUrl
    };
    
    console.log('返回数据:', JSON.stringify(result));
    return res.status(200).json(result);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ code: 500, error: '服务器内部错误: ' + error.message });
  }
}