# SON KAYIT: 04.17

Three.js + TypeScript + Vite ile hazırlanan web tabanlı 3D izometrik hikâye-bulmaca oyunu. **Aşama 3 / L01 Çalmayan Zil** geliştirme dalında: posta kutusundan kaset edinme, iki yankı izi, iç checkpoint, Efe kaydı, Türkçe altyazı, kayıt yönetimi ve menüler kodlandı. Çıkış için kör oyuncu testi, gerçek mobil ölçüm ve yayın doğrulaması halen gereklidir.

> Tasarım sözleşmesi: [`docs/game-design.md`](docs/game-design.md), özellikle **§4.2–4.3**, **§6.1**, **§17 AŞAMA 3** ve **§18**.

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
```

`npm run test:e2e` öncesi `npx playwright install chromium` gerekir. Playwright testleri `dist/` çıktısını Vite preview üzerinden sınar.

## Dağıtım

`main` dalına push, `.github/workflows/deploy.yml` aracılığıyla derleme, tarayıcı smoke testi, ekran görüntüsü/performans raporu ve GitHub Pages dağıtımını dener. Repo Pages kaynağı **GitHub Actions** olarak seçilmelidir (Settings → Pages → Build and deployment → Source). Site etkinleştiğinde hedef URL: https://yunusugdul.github.io/son-kayit-0417/.

Workflow ilk çalışmada, kilit dosyası yoksa npm ile `package-lock.json` üretip repo'ya commit eder. Sonraki çalışmalarda `npm ci` kullanılır; sürüm güncellemesi ayrı PR ile yapılır. Kullanıcı/test verileri hiçbir sunucuya gönderilmez.

## Bilinçli kapsam sınırı

Aşama 0–2 tarihsel prototip aşamalarıdır; mevcut L01 sahnesinde nav/A*, iki ankraj ve kaset akışı birleştirilmiştir. L02–L06 oynanabilir değildir; final A/B henüz geliştirilmemiştir. Üretim cihazı FPS, ilk oyuncu süresi ve 5 kişilik bağımsız oyuncu testi tamamlanmamıştır.

## Dosyalar

- `src/main.ts`: başlatma, WebGL2 kontrolü, ortografik sahne, kontroller, tek sabit adımlı loop, debug.
- `src/style.css`: DOM katmanı, mobil görünüm ve hata ekranı.
- `tests/e2e/stage0.spec.ts`: görünürlük, klavye, tıklama, resize, WebGL2 fallback, mobil smoke kontrolleri.
- `docs/decisions.md`: mimari karar günlüğü.
- `docs/test-plan.md`: Aşama 0 doğrulama ve test sınırları.


## Aşama 1 — yürünebilir postane graybox

Sahne açıldığında Ada'yı WASD veya oklarla kamera yönünde yürüt. Zemine tıklama 10×10 nav grafiği ve A* üzerinden güvenli yol bulur; postane kapalı olduğundan içine rota çizilmez. Posta kutusuna tıkla (uzaktan yaklaşır) veya yakında `E` tuşuna bas. Olay, `game:interact` olarak yayınlanır; Aşama 2 öncesinde bulmaca etkinleştirmez.

Kontroller: `npm run check:assets`, `npm run test:unit`, `npm run build`, `npm run test:e2e`.

Üretim dosyası `public/content/l01/geometry.glb` yalnızca adlandırılmış bir graybox modelidir; kaynak `source-assets/levels/generate-graybox.py` içinde. Blender'dan kalıcı export yapılması ayrı sanat görevidir; bkz. `docs/stage1-status.md`.

## Aşama 2 — yankı çekirdeği

Postane girişindeki **turkuaz yankı izine** yaklaşarak `Space` veya **Kaseti Çal** düğmesini kullan. Aşama 2 test gösteriminde `bell` kaseti hazırdı; doğru mesafede çalınca silinmiş kapı 0,4 saniyede oluşur, 12 saniye açık kalır, ardından 0,6 saniyede kaybolur ve 1,5 saniyelik beklemeye girer. Tekrar Space süreyi yenilemez. Kapı geçidindeyken `SAFE_HOLD` süreyi durdurur; içeri girildiyse geri çıkış kalıcı güvenli hale gelir. Mobilde düğmeyle aynı işlem yapılabilir.

`EchoSystem` ve `EchoPassage` birim testleri ile `tests/e2e/stage2.spec.ts` tarayıcı testleri eklendi. Kayıt toplama, ikinci basamağın gerçek oyun akışı, checkpoint ve hikâye **Aşama 3** içindir. Ayrıntılı durum: [`docs/stage2-status.md`](docs/stage2-status.md).

## Aşama 3 — Çalmayan Zil (geliştirme devam ediyor)

`npm ci && npm run dev` sonrası ana menüden **Yeni Oyun** seç. Posta kutusundaki zil kasetini al, A izinde çal, postaneye gir, tezgâh notunu `E` ile oku, A yankısı soğuduktan sonra B izini etkinleştir ve üst raftaki Efe kaydına ulaş. Ses yalnız kullanıcı etkileşiminden sonra başlar; tüm anlatı Türkçe metin ve altyazıyla sunulur. Duraklat: `Esc`; ipucu: `H`; yankı: `Space`. Dokunmatik zemine dokunarak yürür ve ekrandaki büyük kaset düğmesini kullanır.

- **Yerel ilerleme:** `localStorage` üzerinden güvenli checkpoint kaydı; Yeni Oyun/Devam Et; JSON dışa/içe aktarım; bozuk kayıtta geri dönüş. Depolama engelliyse oturum-içi kayıt ve uyarı.
- **İçerik:** `public/content/l01/level.json` ve `manifest.json`; metinler `src/content/locales/tr.json` içindedir. V1 aksiyonları whitelist'le doğrulanır, dinamik betik yürütülmez.
- **Test:** `npm run check` ve `npm run test:e2e`. Geliştirici tanılama: `?debug=1` (temiz oyun); `?debug=1&continue=1` (kaydedilen checkpoint).
- **Durum ve açık kabul maddeleri:** [`docs/stage3-status.md`](docs/stage3-status.md).

Aşama 3 henüz tamamlandı kabul edilmez: 8–12 dakika hedefi, 5 oyunculu kör test, mobil GPU testi ve güncel canlı yayın ölçülmelidir.
