// gzw.js
// 引入 Meting 核心功能
import Meting from './src/meting.js';

// 创建一个简单的 HTTP 服务器（使用 Node.js 内置模块，无需额外安装）
import http from 'http';

const meting = new Meting('netease'); // 使用网易云音乐
meting.format(true);                 // 让返回的数据格式统一

// ==========================================
// ★★★ 关键配置：请替换为你的 Cookie ★★★
// ==========================================
meting.cookie('MUSIC_U=00ECEB8AD0DFA934090D8AF16BEB104D94F4DD909D900FD4F9762F8ECF180DCE9AF2B59C6FFDD41296D016EB41AB6828F94E1FF73F9AB483A6F084D3EACED3963F3098E3C4D6BA55AA8B15CC56C3B975D1B215CB3838D7EEEAE114B4384F4206D0EBC63DA6B9EE4313ADA7F92FC26E427EFDC9316CACB04ED9C4168A2E3EA619FAE693961E937DB57BCA83249718DF60C3D2DF7D2E14F4E6500A390F66CAF25F3042AF11BE1DB75586ACEBF5B86D2E2D85AD4832D86A959F6D1150729AE8F33F8F87D1BB27B46AB9E2EC78EDF401FBD832D8254E0CED39BAC4CF4C57D7359ECF644277B372316C68122DB0CEDD0C952427B8D0622414FAF8A4A05563272A37F6358FB45CCDAE38B7078456214CD18AADA218AE85A799158422D49773ED8A3F9C260C19F5DB96F32F8E815A25DC78B1D784348ED303C00170F5176917277A4CC50B133F4AF8CF3629BA9A6D8F4FBBE30334DB3BE9634C8F26AD8D4B7A3AFAE15F4CF9D03A64411DB9029ACD24579FC47298DAAFA5B634EF9BAD64E8FAC3FD282E5DAA14DBDAED4799F2B93899182EEF94FA3CB796A5BD3E893EC5D00B0EA3027EB4');
// ★★★ 注意：此 Cookie 是敏感信息，请勿分享 ★★★

const server = http.createServer(async (req, res) => {
  // ✅ 使用现代 WHATWG URL API 替代过时的 url.parse()
  const myURL = new URL(req.url, `http://${req.headers.host}`);
  const songName = myURL.searchParams.get('Love');

  // 设置返回 JSON 格式，解决中文乱码
  res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });

  if (!songName) {
    res.end(JSON.stringify({ error: '请在 URL 后面加上 ?Love=歌名' }));
    return;
  }

  try {
    // 1. 搜索歌曲，只取第一条结果
    const searchRes = await meting.search(songName, { page: 1, limit: 1 });
    const songs = JSON.parse(searchRes);
    if (songs.length === 0) {
      res.end(JSON.stringify({ error: '没找到这首歌' }));
      return;
    }
    const song = songs[0];

    // 2. 获取播放链接（请求 320kbps 高品质）
    const urlRes = await meting.url(song.url_id, 320);
    const urlData = JSON.parse(urlRes);

    // 3. 返回给用户的数据
    res.end(JSON.stringify({
      code: 200,
      data: {
        name: song.name,
        artist: song.artist,
        music_url: urlData.url || '暂无可用链接',
      }
    }));
  } catch (err) {
    res.end(JSON.stringify({ error: '服务器出错：' + err.message }));
  }
});

// 监听 3000 端口
server.listen(3000, () => {
  console.log('🎵 你的点歌 API 已启动！访问 http://localhost:3000/?Love=晴天 试试');
  console.log('当前已配置 Cookie，理论上可以获取完整歌曲（非VIP歌曲）。');
});