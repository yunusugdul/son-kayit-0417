# Aşama 0 — otomatik ölçüm raporu

**Çalıştırma:** 2026-11-17, GitHub Actions / Linux / headless Chromium (SwiftShader)

| Ölçüm | Sonuç | Not |
|---|---:|---|
| Üretim çıktısı (ham) | 536.1 KiB | Vite dist/ |
| Üretim çıktısı (tahmini gzip) | 133.8 KiB | Dosya dosya gzip, gerçek CDN transferi değil |
| Local preview yanıt gövdeleri | 536.1 KiB | Headless tarayıcı, sıkıştırılmamış |
| FPS örneği | 38 | Gerçek cihaz / GPU performansı olarak yorumlanamaz |
| Draw call | 6 | renderer.info.render.calls |
| Ekran | 1080 × 720 | Masaüstü örnek, mobil 390 × 844 |

**Ekran görüntüleri:** GitHub Actions çalışma artifact'ında `stage0-evidence/stage0-desktop.png` ve `stage0-evidence/stage0-mobile.png`.

**Sınır:** Bu rapor tarayıcı otomasyonunun teknik kanıtıdır. Gerçek Chrome/Firefox/Safari, Android/iPhone, ağ 4G ve mobil FPS testi ayrıca yapılmalıdır.
