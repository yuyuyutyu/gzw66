// api/music.js
// 引入 Meting 核心功能 (路径已相对于项目根目录)
import Meting from '../src/meting.js';

// 初始化网易云音乐实例
const meting = new Meting('netease');
meting.format(true); // 让返回的数据格式统一

// 导出 Vercel Serverless 函数处理逻辑
export default async function handler(req, res) {
  // 从查询参数中获取歌名
  const songName = req.query.Love;

  // 设置响应头，支持中文
  res.setHeader('Content-Type', 'application/json;charset=utf-8');

  if (!songName) {
    return res.status(400).json({ error: '请在 URL 后面加上 ?Love=歌名' });
  }

  try {
    // 1. 搜索歌曲，只取第一条结果
    const searchRes = await meting.search(songName, { page: 1, limit: 1 });
    const songs = JSON.parse(searchRes);
    
    if (songs.length === 0) {
      return res.status(404).json({ error: `没有找到歌曲: ${songName}` });
    }
    
    const song = songs[0];

    // 2. 请求高品质播放链接
    const urlRes = await meting.url(song.url_id, 320);
    const urlData = JSON.parse(urlRes);

    // 3. 返回歌曲信息
    return res.status(200).json({
      code: 200,
      data: {
        name: song.name,
        artist: song.artist,
        music_url: urlData.url || '暂无可用链接',
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '服务器内部错误: ' + error.message });
  }
}