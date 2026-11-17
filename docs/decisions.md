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

## ADR-002 | 2026-11-18 — İlk statik yayın sağlayıcısı

**Problem:** GitHub Pages kurulumu GitHub Actions GITHUB_TOKEN ile etkinleştirilemedi (Resource not accessible by integration); sadece yönetici ayarından açılabilir.

**Eski karar:** Aşama 0'da ilk statik deploy'un GitHub Pages üzerinden yapılması planlandı.

**Yeni karar:** İlk statik deploy, mevcut bağlı Render çalışma alanındaki ücretsiz statik site olarak yapıldı: https://son-kayit-0417.onrender.com/. GitHub Pages iş akışı depoda hazır, ancak yönetici ayarı tamamlanana kadar beklemede.

**Gerekçe/test:** Tasarım belgesi §17'nin ilk statik yayını, sunucusuz `dist/` ve temel kontrol doğrulama hedefi sağlanır. Node 26, `npm ci && npm run build`, `main` otomatik deploy; Render deploy `dep-dbuea16c6qcc73dgfem0` durum: live.

**Alternatifler:** GitHub Pages'i yönetici ayarından etkinleştirmek; Cloudflare Pages veya Netlify. Backend, veritabanı ve kullanıcı hesabı eklenmedi.

**Kod/asset etkisi:** Vite `base: './'` aynen korunur; derleme çıktı klasörü `dist/`. Render statik host değişikliği oyun mekaniğini etkilemez.
