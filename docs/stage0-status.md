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
- [ ] **İsteğe bağlı GitHub Pages:** Depo ayarı henüz etkin değil; workflow otomatik etkinleştirme yetkisizliğinde deploy'u atlar. Kullanıcı Settings → Pages → Source: GitHub Actions seçebilir
- [ ] Gerçek Android/iOS cihaz, Safari/Firefox ve fiziksel GPU/FPS ölçümü (CI bunların yerine geçmez)
- [ ] Bağımlılık audit ayrıntıları değerlendirilecek (ilk npm kurulumunda 4 yüksek öncelikli uyarı raporlandı)

**Sınır:** 38 FPS, GitHub'ın yazılımsal WebGL kullanan headless Chrome ortamında örnektir; gerçek kullanıcı FPS'i değildir.

**Bir sonraki teknik aşama:** Yalnız kullanıcı talimat verdiğinde Aşama 1 (NavGraph + A*). L01 bulmaca, yankı, kayıt ve GLB bu aşamada bilinçli olarak yapılmadı.
