import Meting from ‘../src/meting.js’;

// 初始化 Meting
const meting = new Meting(‘netease’);

// 开启格式化
meting.format(true);

// 设置网易云 Cookie
// Vercel 环境变量:
// MUSIC_COOKIE = MUSIC_U=xxxx; __csrf=xxxx;
if (process.env.MUSIC_COOKIE) {
meting.cookie(process.env.MUSIC_COOKIE);
console.log(‘网易云 Cookie 已加载’);
} else {
console.log(‘未设置 MUSIC_COOKIE’);
}

export default async function handler(req, res) {

// =========================
// CORS
// =========================
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET’);
res.setHeader(‘Content-Type’, ‘application/json;charset=utf-8’);

// =========================
// 获取歌曲名
// =========================
const songName =
req.query.name ||
req.query.Love ||
req.query.keyword ||
req.query.song ||
req.query.msg;

console.log(‘接收到的歌名:’, songName);

if (!songName) {
return res.status(400).json({
code: 400,
error: ‘请提供歌名参数(name / keyword / Love)’
});
}

try {

// =========================
// 1. 搜索歌曲
// =========================
console.log('开始搜索歌曲...');
const searchRes = await meting.search(songName, {
  page: 1,
  limit: 1
});
console.log('搜索返回:', searchRes);
let songs = [];
try {
  songs = JSON.parse(searchRes);
} catch (e) {
  console.error('搜索结果 JSON 解析失败:', e);
  return res.status(500).json({
    code: 500,
    error: '搜索结果解析失败'
  });
}
if (!songs || songs.length === 0) {
  return res.status(404).json({
    code: 404,
    error: '没找到这首歌'
  });
}
const song = songs[0];
console.log('歌曲对象:', JSON.stringify(song, null, 2));
// =========================
// 2. 获取歌曲 ID
// =========================
const songId = song.id || song.url_id;
console.log('最终使用歌曲ID:', songId);
if (!songId) {
  return res.status(500).json({
    code: 500,
    error: '歌曲ID获取失败'
  });
}
// =========================
// 3. 获取封面
// =========================
let cover = '';
try {
  if (song.pic_id) {
    console.log('开始获取封面...');
    const coverRes = await meting.pic(song.pic_id);
    console.log('封面返回:', coverRes);
    const coverJson = JSON.parse(coverRes);
    cover = coverJson.url || '';
  }
} catch (e) {
  console.error('封面获取失败:', e);
  cover = '';
}
// =========================
// 4. 获取播放链接
// =========================
let musicUrl = '';
try {
  console.log('开始获取播放链接...');
  // 使用 128K 音质
  const urlRes = await meting.url(songId, 128000);
  console.log('播放链接返回:', urlRes);
  const urlJson = JSON.parse(urlRes);
  // 兼容不同返回格式
  if (urlJson.url) {
    musicUrl = urlJson.url;
  } else if (
    Array.isArray(urlJson.data) &&
    urlJson.data.length > 0
  ) {
    musicUrl = urlJson.data[0].url || '';
  }
  console.log('最终播放链接:', musicUrl);
} catch (e) {
  console.error('播放链接获取失败:', e);
  musicUrl = '';
}
// =========================
// 5. 返回结果
// =========================
const result = {
  code: 200,
  title: song.name || '',
  singer: (song.artist || []).join(','),
  cover: cover,
  link: `https://music.163.com/song?id=${songId}`,
  music_url: musicUrl,
  lyric: ''
};
console.log('最终返回结果:', JSON.stringify(result, null, 2));
return res.status(200).json(result);

} catch (err) {

console.error('服务器错误:', err);
return res.status(500).json({
  code: 500,
  error: '服务器内部错误',
  message: err.message
});

}
}
