# Aşama 3 — L01 Çalmayan Zil: geliştirme durumu

**Kaynak:** `docs/game-design.md` §6.1, §7, §13, §16, §17 AŞAMA 3. Bu belge geliştirici notudur; gerçek oyuncu testi ve yayın kanıtı değildir.

## Kodlanan özellikler

- [x] `l01_post_office` JSON ve manifest, mevcut Blender çıkışı `geometry.glb` (15.436 B) ve küçük runtime graybox aksesuarları
- [x] Gerçek posta kutusu kaseti; A giriş ve not sonrası B üst raf ankrajı
- [x] Sabit iç checkpoint; A kapı kalıcı kaçışı; B desteği üzerindeyken `SAFE_HOLD`
- [x] Whitelist `PuzzleSystem`, `StoryDirector` ve Türkçe yazılı Efe kaydı
- [x] Kullanıcı jestiyle açılan Web Audio sentetik SFX; hikâye ses olmadan anlaşılır
- [x] V1 `localStorage` JSON kaydı, Devam Et, manuel export/import, hatalı veri reddi, oturum içi fallback
- [x] Başlat / devam / duraklat / bitiş menüleri; H ipucu ve mobil tap-to-move/ekran kaseti
- [x] Birim ve Chrome Playwright test senaryoları; PR tabanlı CI

## Henüz kabul edilmeyen veya ölçülmeyen maddeler

- [ ] **5 kişilik kör oyuncu testi** ve en kritik üç takılmanın düzeltilmesi
- [ ] Bölüm süresinin **8–12 dakika** hedefine ulaşması; halen tasarım hedefidir, ölçülmedi
- [ ] Gerçek Android/iOS cihazlarda dokunma, altyazı ve tutarlı FPS ölçümü
- [ ] Statik önizleme dışında güncel Aşama 3 sürümünün canlı Render/Pages yayını
- [ ] Türkçe seslendirme (opsiyonel) ve L01 görsel cilası (Aşama 4)

## Ölçüm — GitHub Actions Chrome/Ubuntu (fiziksel cihaz değil)

2026-11-18 CI üretim derlemesinin boyut raporunda: `dist/` toplam **691.784 bayt ham**, **174.707 bayt tahmini gzip**. Dosyalar arasında oyun JS **658.657 B ham / 167.007 B gzip tahmini**, GLB **15.436 B ham**. Bu *sıkıştırılmış statik dosya tahminidir*; gerçek HTTP transferi veya mobil FPS garantisi değildir. Yönergedeki ilk oynanış ≤ 3 MB hedefinin altında görünen bir build bulunuyor, fakat CDN transferi tekrar ölçülmelidir.

`npm run check` aşamasında **22 birim testi geçti**, TypeScript ve Vite üretim build başarılı (CI çalışması: https://github.com/yunusugdul/son-kayit-0417/actions/runs/44212643588). O çalışmada yeni L01 E2E senaryolarından not etkileşimiyle ilgili ikisi başarısızdı; notun güvenli checkpoint'ten `E` ile okunabilmesi düzeltildi. Güncel sonuç için PR Checks sekmesini kontrol et.

`npm audit` aynı CI'da 4 adet yüksek önem seviyeli bağımlılık uyarısı verdi; paket yükseltmesi tasarım sözleşmesine göre ayrı değerlendirilmelidir.

**Yayın kapısı:** gerçek oyuncu + cihaz ve canlı sürüm kontrolleri tamamlanmadan PR draft ve Aşama 3 açık kalır.
