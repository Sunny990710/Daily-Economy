// /api/news?q=<용어>
// 서버에서 직접 구글 뉴스 RSS를 받아 파싱합니다. (브라우저 CORS 문제 없음, API 키 불필요)
function decode(s) {
  return (s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

export default async function handler(req, res) {
  const q = (req.query.q || "").toString().slice(0, 60);
  if (!q) {
    res.status(200).json({ items: [] });
    return;
  }
  try {
    const rss = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`;
    const r = await fetch(rss, { headers: { "User-Agent": "Mozilla/5.0 (compatible; DailyEconWords/1.0)" } });
    const xml = await r.text();

    const items = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRe.exec(xml)) && items.length < 5) {
      const block = m[1];
      const pick = tag => {
        const mm = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        return mm ? decode(mm[1]) : "";
      };
      let title = pick("title");
      const url = pick("link");
      const source = pick("source");
      if (source && title.endsWith(" - " + source)) title = title.slice(0, -(source.length + 3));
      if (title && url) items.push({ title, url, source });
    }

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
    res.status(200).json({ items });
  } catch (e) {
    res.status(200).json({ items: [] });
  }
}
