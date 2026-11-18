# Aşama 2 — Yankı çekirdeği

**Kapsam:** Tasarım yönergesi §4.2–4.3, §17 AŞAMA 2. Aşama 3'ün envanter, hikâye, checkpoint ve kayıt dosyası bu geliştirmeye dahil değildir.

## Kurulan sistemler

- `src/gameplay/EchoSystem.ts`: tam deterministik `inactive → materializing (0,4 sn) → active (12 sn) → safe_hold → fading (0,6 sn) → cooldown (1,5 sn)` akışı. `safe_hold`, yalnız kullanıcı kapanacak geçitte veya geçici destekteyken devreye girer; tekrar Space süreyi sıfırlamaz.
- `src/gameplay/Stage2EchoData.ts`: L01 için `bell` ile çalışan A ve B ankrajları; B, `l01_note_read` bayrağı gerektirir. B'nin fiziksel basamakları ve bölüm bulmacası **Aşama 3** kapsamında olduğundan bu aşamada yalnız veri/saf sistem testleri hazırlanmıştır.
- `src/gameplay/EchoPassage.ts`: değişen nav link ve fiziksel çarpışmayı tek noktadan günceller. Ada kapı geçidinde kalırsa `SAFE_HOLD` kaybolmayı önler. İç mekâna girdiğinde güvenli geri çıkış kalıcı açılır (`entryLatched`, geçici oturum verisi).
- `src/main.ts` ve `src/input/InputManager.ts`: yakın mesafeden Space veya ekran düğmesiyle yankıyı başlatma, turkuaz ankraj, düşük maliyetli kapı materyalizasyonu, HUD kalan süre ve açıklayıcı mesajlar.
- **Aşama 2 gösterimi için** `bell` kaseti başlangıçta hazırdır. Aşama 3'te posta kutusundan edinilecek; kaydedilen envanter, metin ve checkpoint daha sonra eklenecek.

## Güvenlik invariants

1. `materializing` sırasında kapalı link ve fiziksel kapı çarpışması korunur; ancak `active` başladığında nav link açılır ve çarpışma aynı çağrıda kaldırılır.
2. Oyuncu kapanacak geçit hacmindeyse süre dolduğunda `safe_hold` ile açık kalır; sabit zemine ulaşmadan kapanmaz.
3. İçeri geçildiğinde, yankı sönse bile güvenli çıkış bağlantısı açık kalır; oyuncu içeride mahsur kalmaz.
4. Tarayıcı sekmesi gizliyken `fixedUpdate` durur ve geri döndüğünde birikmiş duvar saati deltası işlenmez.
5. Bir ankraj/echoGroup referansı yanlışsa sistem hata verir; bölge dışı veya yanlış kaset etkinleştiremez.

## Doğrulama

Yerel birim testi: `node --experimental-strip-types --test tests/unit/*.test.ts`.
CI: `npm run check` (asset, birim testler, tip denetimi, production build) ardından `npm run test:e2e` (Playwright).

Gerçek cihaz 30 FPS testi henüz yoktur. Aşama 3'te B'nin fiziksel basamakları, `l01_note_read` bayrağı, save/checkpoint ve ses/hikâye ayrı işlenecektir.

## GitHub Actions doğrulaması — 18 Kasım 2026

- [Aşama 2 koduyla başarılı CI çalışması](https://github.com/yunusugdul/son-kayit-0417/actions/runs/44209276854): 16 birim testi, 11 Playwright tarayıcı testi; TypeScript, Vite derleme ve asset doğrulaması geçti.
- Tarayıcı testleri: yankıyı sadece yakınken başlatma, tekrar Space ile sürenin yenilenmemesi, kapının açılıp geçilebilir olması, süre sonunda iç mekândan güvenli çıkış, sekme gizlendiğinde sayacın durması.
- GitHub Pages otomatik etkinleştirmesi Resource not accessible by integration uyarısı verdiğinden Pages dağıtımı gerçekleşmedi; kaynak ve CI bundan bağımsızdır.
- Render'da Aşama 2 canlı yayını doğrulanmadı. Bu çalışmada bir Render deploy'u tetiklenmedi.
