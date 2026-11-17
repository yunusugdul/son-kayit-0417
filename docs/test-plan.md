# Aşama 0 test planı

Tasarım belgesi §17, §18 ve §20.1 gereği:

1. `npm ci`, `npm run typecheck` ve `npm run build` başarılı olmalı.
2. Üretim `npm run preview` ile sunulmalı; masaüstü Chromium'da WebGL2 sahne canvas'ı, sarı Ada ve grid görünmeli.
3. WASD ve oklarla pozisyon değişmeli; birden çok tuş basıldığında hareket sınırlanmalı.
4. Zemine tıklama/dokunma ile hedef işareti görülmeli ve oyuncu ulaşabilmeli.
5. Resize sonrası canvas piksel boyutu ve ortografik projeksiyon güncellenmeli; mobil yatay taşma olmamalı.
6. `visibilitychange` arka planda hareketi durdurmalı; dönüşte büyük `deltaTime` sıçraması olmamalı.
7. WebGL2 devre dışıyken anlaşılır hata ekranı görünmeli; yakalanmamış JS hata olmamalı.
8. Developer FPS/draw call paneli `dev` veya `?debug=1` seçiliyken görünmeli.
9. CI otomasyonu ekran görüntüsü, aktarım boyutu ve headless FPS örneğini `artifacts/` klasörüne kaydetmeli. Bunlar gerçek mobil performans ölçümü değildir.
10. `main` build'i GitHub Pages'e dağıtılmalı; yayın URL'si gerçek istekle doğrulanmalıdır.

**Yalnızca headless Chromium testleri**, Firefox/iOS/gerçek mobil GPU doğrulamasının yerini tutmaz. Aşama 0'daki tıkla-git engelden kaçınmaz: bu bir hata değil, §18'de açıkça belirtilmiş Aşama 1'e ertelenmiş iştir.

**Ölçüm sonuçları:** `docs/stage0-measurements.md` GitHub Actions tarafından derleme/test tamamlandığında oluşturulur. CI stdout ve ekran görüntüsü artifacts dosyaları ek kanıttır.
