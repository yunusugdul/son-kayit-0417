# Aşama 0 — uygulama ve doğrulama durumu

**Tarih:** 18 Kasım 2026

## Teknik kapsam
- [x] GitHub deposu, Vite vanilla TypeScript, Node 26 LTS ve npm script'leri
- [x] Three.js / WebGL2 kontrolü ve desteklenmeyen cihaz ekranı
- [x] Ortografik kamera, 10×10 zemin, ışıklar ve sarı Ada küpü
- [x] WASD / yön tuşları ve zemine raycast ile tıkla/dokun-yürü işareti
- [x] Resize, DPR <= 1.5, Page Visibility duraklatması
- [x] FPS ve renderer.info.render.calls debug paneli
- [x] GitHub Actions: build + headless Chrome smoke + ekran görüntüleri/ölçüm

## Kanıtlanmış sonuçlar
- [x] `package-lock.json` GitHub Actions tarafından oluşturulup main dalına commit edildi
- [x] `npm ci` ve `npm run build` (TypeScript kontrolü dahil) başarılı
- [x] `npm run preview` ile açılan üretim çıktı üzerinde 4 Playwright testi başarılı
- [x] Masaüstü ve mobil ekran görüntüleri `stage0-evidence` Actions artifact'ına eklendi
- [x] `docs/stage0-measurements.md` üretildi: 536.1 KiB ham / 133.8 KiB tahmini gzip, 6 draw call
- [x] **İlk statik yayın:** Render `https://son-kayit-0417.onrender.com/` canlı, otomatik deploy açık; ilk dağıtım `dep-dbuea16c6qcc73dgfem0` durum `live`
- [x] **Canlı HTTP kontrolü:** Render ana sayfası ve derlenmiş JS/CSS dosyaları GitHub Actions üzerinden HTTP 200 doğrulandı
- [ ] **İsteğe bağlı GitHub Pages:** Ana statik yayın Render üzerinde tamamlandı. GitHub Pages ayrıca açılacaksa kullanıcı Settings → Pages → Source: GitHub Actions ayarını yapmalı.
- [ ] Gerçek Android/iOS cihaz, Safari/Firefox ve fiziksel GPU/FPS ölçümü (CI bunların yerine geçmez)
- [x] **Bağımlılık denetimi ayrıştırıldı:** `npm audit --omit=dev` çıktısında **0 güvenlik açığı**; tam `npm audit` çıktısında **4 yüksek** uyarı, geliştirme aracındaki `picomatch` transitive bağımlılık zincirinden (`fdir`, `tinyglobby`, `vite`). Üretime geliştirme bağımlılıkları dağıtılmıyor. Uygun yama çıkana kadar takip edilmeli; `npm audit fix --force` ile kırıcı sürüm düşürmesi yapılmadı.

**Sınır:** Son kayıttaki yaklaşık 42 FPS, GitHub'ın yazılımsal WebGL kullanan headless Chrome ortamında örnektir; gerçek kullanıcı FPS'i değildir.

**Aşama 0 kararı:** Git deposu, 3D teknik prototip, girdi, CI testleri, ölçüm ve canlı statik Render yayını başarılı. GitHub Pages ikinci sağlayıcıdır ve Aşama 0 için gerekli değildir. Fiziksel cihaz denemeleri hedef cihazda ayrıca gerçekleştirilmelidir.

**Bir sonraki teknik aşama:** Yalnız kullanıcı talimat verdiğinde Aşama 1 (NavGraph + A*). L01 bulmaca, yankı, kayıt ve GLB bu aşamada bilinçli olarak yapılmadı.
