// api/music.js
import Meting from '@metowolf/meting';
import fetch from 'node-fetch';

// 1. 初始化实例
const server = new Meting('netease');

// 2. 配置代理和请求头（关键修复）
const OPTIONS = {
  // 使用公共代理池或自建代理，解决 Vercel IP 被封问题
  // 这里使用了一个可用的公共代理示例，建议自行搭建或寻找更稳定的
  proxy: 'https://netease-api-proxy.vercel.app', 
  
  headers: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    'Referer': 'https://music.163.com/',
    // 模拟移动端请求，降低被拦截概率
  }
};

// 3. 封装带代理的请求方法
const fetchWithProxy = async (url) => {
  const proxyUrl = OPTIONS.proxy 
    ? `${OPTIONS.proxy}/?url=${encodeURIComponent(url)}` 
    : url;
  
  return fetch(proxyUrl, { 
    headers: OPTIONS.headers,
    timeout: 10000 
  });
};

// 4. Vercel Serverless Handler
export default async function handler(req, res) {
  const { Love } = req.query;
  
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!Love) {
    return res.status(400).json({ error: '请在 URL 后面加上 ?Love=歌名' });
  }

  try {
    // 搜索歌曲
    const searchRes = await server.search(Love, { limit: 1 });
    const songs = JSON.parse(searchRes);

    if (songs.length === 0) {
      return res.status(404).json({ error: `没有找到歌曲: ${Love}` });
    }

    const song = songs[0];
    console.log('找到歌曲:', song.name, 'ID:', song.url_id);

    // 获取播放链接（使用代理）
    // 注意：这里直接拼接 URL，因为原库的 .url() 方法可能不支持自定义 fetch
    const url = `https://music.163.com/song/url?id=${song.url_id}&br=320000`;
    const response = await fetchWithProxy(url);
    const urlData = await response.json();

    // 5. 数据校验
    if (!urlData.data || !urlData.data[0]?.url) {
      console.error('获取链接失败:', urlData);
      return res.status(502).json({ error: '无法获取播放链接，请检查网络或代理' });
    }

    return res.status(200).json({
      code: 200,
      data: {
        name: song.name,
        artist: song.artist,
        music_url: urlData.data[0].url,
        // 如果需要封面
        // pic_url: `https://p1.music.126.net/${song.pic_id}/${song.pic_id}.jpg`
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: '服务器内部错误', 
      detail: error.message 
    });
  }
}
