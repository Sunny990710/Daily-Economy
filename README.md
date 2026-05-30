# 오늘의 경제 한 단어 📘

하루 한 단어씩, 한국은행 『2024 경제금융용어 700선』을 사회초년생 눈높이로 쉽게 풀어주는 모바일 웹앱입니다.

- **오늘의 단어** — 매일 한 단어가 자동으로 바뀝니다. 자주 쓰는 핵심 용어 61개는 쉬운 설명·예시가 내장돼 있어 항상 즉시 표시됩니다.
- **관련 기사** — 카드 하단에 그 용어의 최신 뉴스 헤드라인이 바로 나타납니다. (서버에서 구글 뉴스 RSS를 받아옵니다 — API 키 불필요)
- **단어장** — 694개 용어를 가나다·검색으로 탐색. "✦쉬운풀이" 필터로 쉽게 풀어둔 용어만 모아 볼 수 있어요.
- **AI 쉬운 풀이(선택)** — 내장 설명이 없는 용어는 버튼을 눌러 AI로 쉽게 풀어볼 수 있습니다. (Anthropic API 키 필요, 아래 참고)

기술 스택: React + Vite, Vercel Serverless Functions(`/api`).

---

## 🚀 Vercel에 배포하기

### 방법 A — GitHub 연동 (권장)
1. 이 폴더를 GitHub 저장소에 올립니다.
   ```bash
   git init && git add . && git commit -m "init"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) → **Add New → Project → Import** 에서 저장소 선택.
3. 프레임워크는 **Vite** 로 자동 인식됩니다. 그대로 **Deploy**.
   - 빌드는 Vercel이 자동으로 실행합니다 (`npm install` → `npm run build`).
4. 배포 완료 후 주소로 접속하면 끝. 관련 기사 헤드라인이 정상적으로 표시됩니다.

### 방법 B — Vercel CLI
```bash
npm i -g vercel
vercel        # 미리보기 배포
vercel --prod # 프로덕션 배포
```

---

## 🔑 (선택) AI 쉬운 풀이 켜기

내장 설명이 없는 용어에 대해 "AI로 더 쉽게 풀어보기"를 작동시키려면 Anthropic API 키가 필요합니다.

1. Vercel 프로젝트 → **Settings → Environment Variables**
2. 추가:
   - `ANTHROPIC_API_KEY` = `sk-ant-...` (본인 키)
   - (선택) `ANTHROPIC_MODEL` = 사용할 모델명
3. **Redeploy**.

> 키를 설정하지 않아도 앱은 정상 동작합니다. 그 경우 AI 버튼 대신 한국은행 사전 뜻이 표시됩니다.
> 키는 서버리스 함수(`/api/explain`) 안에서만 쓰이며 브라우저에 노출되지 않습니다.

---

## 💻 로컬에서 실행

```bash
npm install
npm run dev      # http://localhost:5173
```

> 참고: `npm run dev` 로컬 개발 서버에서는 `/api/*` 서버리스 함수가 실행되지 않습니다.
> 로컬에서 `/api` 까지 테스트하려면 `vercel dev` 를 사용하세요.

---

## 📁 구조
```
.
├─ api/
│  ├─ news.js       # 구글 뉴스 RSS 프록시 (키 불필요)
│  └─ explain.js    # AI 쉬운 설명 (ANTHROPIC_API_KEY 필요, 선택)
├─ src/
│  ├─ App.jsx       # 앱 본체
│  ├─ data.js       # 694개 경제금융용어 데이터
│  └─ main.jsx
├─ index.html
├─ vite.config.js
└─ package.json
```

데이터 출처: 한국은행 『경제금융용어 700선』(2024).
