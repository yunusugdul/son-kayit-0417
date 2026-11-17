# SON KAYIT: 04.17

Three.js + TypeScript + Vite ile hazırlanan, web tabanlı 3D izometrik hikâye-bulmaca oyunu. **Şu an yalnızca Aşama 0 teknik prototipi** vardır: gerçek 3D sahne, ortografik kamera, Ada küpü, WASD/ok tuşu ve tıkla/dokun-yürü hareketi, WebGL2 uyarısı, responsive görünüm ve performans debug paneli.

> Tasarım sözleşmesi: [`docs/game-design.md`](docs/game-design.md), özellikle **§17 AŞAMA 0**, **§18** ve **§20.1**.

## Geliştirme

**Node.js 26 LTS** ve npm gerektirir (öneri: `nvm use` veya `.nvmrc`).

```bash
npm ci
npm run dev
```

Yerel Vite adresini tarayıcıda açın. Kısayollar: WASD veya ok tuşları; zemine fareyle tıklama veya dokunma. Performans paneli `dev` modunda görünür. Üretim sürümünde ölçüm için `?debug=1` eklenebilir.

```bash
npm run typecheck
npm run build
npm run preview
npm run report:sizes
npm run test:e2e
npm run check:live
```

`npm run test:e2e` öncesi yerelde `npx playwright install chromium` gerekir. CI, Ubuntu çalıştırıcısında önceden kurulu Chrome ile test yapar. Playwright testleri `dist/` çıktısını Vite preview üzerinden sınar.

## Dağıtım

**Canlı Aşama 0 statik prototipi:** https://son-kayit-0417.onrender.com/ — Render, GitHub `main` otomatik dağıtım; `npm ci && npm run build`, yayın klasörü `dist/`. Canlı HTTP ve JS/CSS smoke doğrulaması `npm run check:live` ile yapılabilir.


`main` dalına push, `.github/workflows/deploy.yml` aracılığıyla derleme, tarayıcı smoke testi, ekran görüntüsü/performans raporu ve GitHub Pages dağıtımını dener. Repo Pages kaynağı **GitHub Actions** olarak kullanıcı tarafından seçilmelidir (Settings → Pages → Build and deployment → Source). Pages henüz etkin değilse derleme/test geçer, dağıtım adımı **atlanır** ve Actions özetinde yönetici ayarı belirtilir. Etkinleştirdikten sonra workflow'u yeniden çalıştırın. Site etkinleştiğinde hedef URL: https://yunusugdul.github.io/son-kayit-0417/.

Workflow ilk çalışmada, kilit dosyası yoksa npm ile `package-lock.json` üretip repo'ya commit eder. Sonraki çalışmalarda `npm ci` kullanılır; sürüm güncellemesi ayrı PR ile yapılır. Kullanıcı/test verileri hiçbir sunucuya gönderilmez.

## Bilinçli kapsam sınırı

Aşama 0'da **NavGraph/A\***, engeller, kaset, yankı, kayıt sistemi, hikâye akışı ve GLB yoktur. Tıkla-git **yalnızca boş başlangıç zemini için geçerli bir raycast prototipidir**. Aşama 1'de tüm hareket tek gezinme modeli üzerinden güvenli yola dönüştürülecektir.

## Dosyalar

- `src/main.ts`: başlatma, WebGL2 kontrolü, ortografik sahne, kontroller, tek sabit adımlı loop, debug.
- `src/style.css`: DOM katmanı, mobil görünüm ve hata ekranı.
- `tests/e2e/stage0.spec.ts`: görünürlük, klavye, tıklama, resize, WebGL2 fallback, mobil smoke kontrolleri.
- `docs/decisions.md`: mimari karar günlüğü.
- `docs/test-plan.md`: Aşama 0 doğrulama ve test sınırları.

