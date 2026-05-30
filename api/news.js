// /api/news?q=<용어>
// 1) 구글 뉴스 RSS를 서버에서 받아 파싱 (CORS 불필요, 키 불필요)
// 2) GEMINI_API_KEY 환경변수가 있으면 상위 2개 기사에 'AI 한 줄 요약'을 붙임
//    (키가 없으면 요약 없이 기사만 반환 — 앱은 요약 줄을 자동으로 숨김)
function decode(s) {
  return (s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

// 상위 기사 제목들을 받아 초보자용 한 줄 요약 배열을 생성
async function summarize(term, titles) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key || !titles.length) return null;

  const numbered = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const prompt =
    `너는 경제·금융 뉴스를 사회초년생도 이해하게 풀어주는 도우미야.\n` +
    `검색 키워드: "${term}"\n` +
    `아래 기사 제목 각각을, 키워드와 연결해 '왜 중요한지' 한국어 한 문장(35자 이내, 존댓말, 쉬운 말)으로 요약해줘.\n` +
    `추측이 필요하면 일반적인 배경 지식 선에서만 말하고, 과장하지 마.\n` +
    `반드시 JSON 배열만 출력해. 예: ["요약1","요약2"]\n\n` +
    numbered;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const text =
      j && j.candidates && j.candidates[0] &&
      j.candidates[0].content && j.candidates[0].content.parts &&
      j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text;
    if (!text) return null;
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const arr = JSON.parse(clean);
    return Array.isArray(arr) ? arr.map(x => String(x).trim()) : null;
  } catch (e) {
    return null;
  }
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

    // 상위 2개에만 AI 한 줄 요약 시도 (키가 있을 때만)
    const top = items.slice(0, 2);
    const sums = await summarize(q, top.map(i => i.title));
    if (sums) top.forEach((it, i) => { if (sums[i]) it.summary = sums[i]; });

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
    res.status(200).json({ items });
  } catch (e) {
    res.status(200).json({ items: [] });
  }
}
