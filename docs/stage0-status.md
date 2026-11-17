# Aşama 0 — uygulama ve kabul durumu

**Tarih:** 2026-11-18

## Gerçekleştirilen kod çalışmaları
- [x] GitHub deposu, Vite/TypeScript, npm komutları ve Node 26 hedefi
- [x] Three.js, WebGL2 algılama ve hata ekranı
- [x] Ortografik 3D kamera, zemin, sabit ışık, küp Ada
- [x] WASD/ok ve yalnız zemine raycast ile tıkla-git hedef işareti
- [x] Resize, DPR <= 1.5, sekme gizliliğinde duraklatma
- [x] FPS ve renderer.info.render.calls debug paneli
- [x] GitHub Actions build, Playwright smoke, görüntü/transfer/FPS ölçümü ve Pages dağıtımı

## Doğrulama durumu
- [x] Kod GitHub main dalına aktarıldı, ilk CI çalışması lock dosyasını üretti
- [ ] Son CI typecheck ve üretim build başarılı
- [ ] Üretim preview üzerinden Playwright tarayıcı testleri başarılı
- [ ] Ölçüm raporu ve ekran görüntüleri üretildi
- [ ] GitHub Pages HTTP üzerinden açılıyor (ilk statik deploy)
- [ ] Gerçek fiziksel mobil cihaz/GPU ölçümü (otomasyon bunun yerine geçmez)

**Not:** Aşama 1'deki NavGraph, A*, engeller, GLB ve etkileşim sistemleri burada bilinçli olarak uygulanmamıştır.
