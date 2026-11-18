# SON KAYIT: 04.17

Three.js + TypeScript + Vite ile hazırlanan, web tabanlı 3D izometrik hikâye-bulmaca oyunu. **Şu an Aşama 2 yankı çekirdeği prototipi** vardır: ortografik 3D postane, güvenli NavGraph/A* yürüme, etkileşim, süreli zil yankısı, SAFE_HOLD geçit güvenliği, WebGL2 kontrolü ve performans paneli. Tam L01 hikâyesi, gerçek kaset toplama ve checkpoint henüz yoktur.

> Tasarım sözleşmesi: [`docs/game-design.md`](docs/game-design.md), özellikle **§4.2–4.3**, **§17 AŞAMA 2** ve **§18**.

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

Aşama 0'da **NavGraph/A\***, engeller, kaset, yankı, kayıt sistemi, hikâye akışı ve GLB yoktur. Tıkla-git **yalnızca boş başlangıç zemini için geçerli bir raycast prototipidir**. Aşama 1'de tüm hareket tek gezinme modeli üzerinden güvenli yola dönüştürülecektir.

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

Postane girişindeki **turkuaz yankı izine** yaklaşarak `Space` veya **Kaseti Çal** düğmesini kullan. Başlangıçta yalnız test amaçlı `bell` kaseti hazırdır; doğru mesafede çalınca silinmiş kapı 0,4 saniyede oluşur, 12 saniye açık kalır, ardından 0,6 saniyede kaybolur ve 1,5 saniyelik beklemeye girer. Tekrar Space süreyi yenilemez. Kapı geçidindeyken `SAFE_HOLD` süreyi durdurur; içeri girildiyse geri çıkış kalıcı güvenli hale gelir. Mobilde düğmeyle aynı işlem yapılabilir.

`EchoSystem` ve `EchoPassage` birim testleri ile `tests/e2e/stage2.spec.ts` tarayıcı testleri eklendi. Kayıt toplama, ikinci basamağın gerçek oyun akışı, checkpoint ve hikâye **Aşama 3** içindir. Ayrıntılı durum: [`docs/stage2-status.md`](docs/stage2-status.md).
