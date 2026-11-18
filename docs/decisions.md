# Mimari karar kaydı

## ADR-000 | 2026-11-18 — Aşama 0 kapsamı

**Problem:** Oynanabilir vertical slice'a geçmeden önce tarayıcıda kontrol ve 3D sahne temeli doğrulanmalı.

**Karar:** Tasarım belgesi §17, §18 ve §20.1'i uygulamak için Three.js, vanilla TypeScript, Vite, CSS, küçük bir Playwright smoke testi ve GitHub Pages statik dağıtımı kullanılır. Ortografik açı sabittir; WebGL2 başarısızlığında açıklama gösterilir. İlk sahne 10×10 ve engel içermez.

**Gerekçe/test:** Motor ve backend eklemeyerek üretim dosyalarını küçük tutmak; aynı çekirdek üstünde Aşama 1 navigasyonunu inşa etmek. CI'da typecheck/build/browser smoke/ölçüm.

**Alternatifler:** React, fizik motoru, özel sunucu, WebGPU-first, serbest kamera — bu aşamada gereksiz.

**Kod/asset etkisi:** `src/main.ts` başlangıçta tek modüldür; Aşama 1'de `InputManager`, `PlayerController`, `NavGraph` ve `GameLoop` ayrılacaktır. Çevrimdışı PWA eklenmez.

## ADR-001 | 2026-11-18 — Statik base URL

**Problem:** Vite çıktısı hem repository alt dizininde (GitHub Pages) hem yerel preview'da çalışmalı.

**Karar:** `vite.config.ts` içinde `base: './'` kullanılır. Runtime'da kök dizine sabitlenmiş asset yolu bulunmaz.

**Gerekçe/test:** Derlemede üretilen asset referansları sayfa URL'sine görelidir; Pages alt dizininde farklı bir paket gerektirmez.

## Aşama 2 — 2026-11-18

- Yankı durumu tek `EchoSystem` içinde sabit deltaTime ile işlenir; saat esaslı timeout yoktur.
- `EchoPassage` giriş linkini ve fiziksel çarpışmayı birlikte değiştirecektir; geçit hacmi korunurken SAFE_HOLD, içeri ulaşıldığında kalıcı kaçış mandalı kullanılır.
- İlk demo `bell` kasetini hazır sunar; gerçek envanter, B basamakları, hikâye bayrakları ve kayıt sistemi Aşama 3 kapsamındadır.
