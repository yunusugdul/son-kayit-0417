# Aşama 1 — Gezinme ve etkileşim

Durum: Aşama 1 kodu, testleri ve Blender GLB üretimi GitHub Actions ile doğrulandı. Aşama 2 başlamadı.

## Uygulanan sınırlar

- 10×10 dünya birimi, Y yukarı, XZ zemin. 100 yürüme düğümü, dört yönlü A*.
- Postane duvarı ve dış korkuluk için sabit nav bariyerleri ve fiziksel çember/AABB çarpışması.
- `l01_link_entry` kapı bağlantısı **kapalı**; yalnız Aşama 2 yankı sistemi açabilir.
- Kamera yönüne göre WASD/yön tuşları; tıkla/yürü nav rotası; rota yoksa erişilebilir geri bildirim.
- Posta kutusu, kapalı kapı ve tabelaya uzaktan tıklayınca ulaşılabilir yaklaşma noktası.
- `E` yakın etkileşim, hover/vurgu, `game:interact` olayı; bu aşamada envanter/bulmaca değişikliği yok.
- Model GLB ID'leri yükleme sırasında ve CI'da doğrulanır. `OcclusionFade` yalnız işaretli ön duvarlarda etkin.
- `geometry.glb`, Blender 4.0.2 üzerinden `source-assets/levels/generate-graybox-blender.py` ile üretildi. Otomatik Blender dışa aktarma çalışması: https://github.com/yunusugdul/son-kayit-0417/actions/runs/44205635732. Kaynak betik kod olarak saklanır; görünüm henüz **geçici graybox** ve kalıcı sanat varlığı değildir. `generate-graybox.py` yalnızca alternatif yerel önizleme üreticisidir. Gerçek cihaz GPU/FPS doğrulaması yapılmadı.

## Otomatik doğrulama

- `npm run check:assets`: GLB biçimi, sürüm, ID benzersizliği.
- `npm run test:unit`: 10×10 ızgara, 4-yön A*, kapalı/açık link, başka kata geçiş, 50 hedef.
- `npm run test:e2e`: gerçek WebGL2 üretim önizlemesi, tıklamalar, etkileşim, duvar/kapı, hover.
- `npm run check`: varlık + birim + tip denetimi + üretim derlemesi.

## Aşama 2'ye bırakılanlar

Yankı kaset mantığı, `EchoSystem`, SAFE_HOLD, platformlar, checkpoint, senaryo ve kayıt sistemi **uygulanmadı**. Bunlar ayrı kilometre taşlarıdır.
