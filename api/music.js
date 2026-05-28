// api/music.js → 完全替换为以下代码
import Meting from '@metowolf/meting';

export default async function handler(req, res) {
  // 1. 参数校验（必加！防无效请求崩溃）
  if (!req.query.id) {
    return res.status(400).json({ error: "缺少歌曲ID" });
  }

  try {
    // 2. ESM 专用导入方式（核心修复点！）
    const api = new Meting("netease");
    const result = await api.song(req.query.id);

    // 3. 安全返回数据（防空响应崩溃）
    if (!result?.url) throw new Error("音频链接无效");
    
    res.status(200).json({ url: result.url });
  } catch (error) {
    // 终极防护：任何错误都返回 500 但不崩溃
    console.error("音乐API失败:", error.message);
    res.status(500).json({ error: "服务不可用" });
  }
}
