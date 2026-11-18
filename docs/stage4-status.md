# Aşama 4 — L01 sanat ve performans cilası

**Kaynak:** `docs/game-design.md` §9, §10, §11, §12 ve §17 AŞAMA 4. Bu belge kodlanan işleri gerçek cihaz/oyuncu kabul ölçümlerinden ayırır.

## Uygulanan sanat yönü

- [x] Palet: gece deniz mavisi, eski kâğıt, bakır/pas, fener amberi; **hatıra turkuazı yalnızca yankı mekaniğine** ayrılır.
- [x] L01 postane modüler low-poly kit: kesit/oyuncak-maket cephe, çatı, pencere, duvar, temel, ahşap çit, tabela, posta kutusu, aydınlatma, kıyı aksesuarları, 100 taş döşeme instanced mesh.
- [x] Ada için 11 civarı ayrı parçadan hiyerarşi: idle, walk (sallanma), interact, record; orijinal GLB navigasyon/çarpışma verisi bozulmadı.
- [x] Turkuaz yankı işaretlerinin etrafında aktifken beliren düşük yoğunluklu halka/12 instanced parçacık; hareket azaltma tercihi destekli.
- [x] Özgün, dosyasız Web Audio prosedürel sahil rüzgârı; kullanıcı etkileşiminden sonra açılır, duraklatmada susar, ayarlardan kapatılır.
- [x] Auto/High/Low: DPR 1.5/1.25/1.0 ve kozmetik detaylar; bulmaca/geçit/kollisyon ve altyazılar kaliteye bağlı değildir.
- [x] `tests/e2e/stage4.spec.ts`: gerçek Chrome üretim preview ekran görüntüsü, draw calls/triangles bütçesi, 390 px viewport, ayar saklama, aynı L01 sahnesine 5 yeniden girişte GPU geometri/doku sayısında artış kontrolü.

## Maliyet ve yeniden kullanım

Görsel içerik `src/visual/Stage4Art.ts` içindeki düz renk/az sayıda CanvasTexture modülünden üretilir. Sabit geometri renk başına birleştirilir, kaldırım `InstancedMesh` kullanır; dinamik gölge/4K doku/büyük ses dosyası yoktur. İşlemci/bağlantı maliyeti render loop ve render raporundan ölçülür, tahminle FPS vaadi verilmez.

`public/content/l01/geometry.glb` mevcut Blender graybox dosyasıdır: temel nav/collider ve kapı kimlikleri korunurken teknik dış cephe görünmez hale gelir. **Görsel sanat kiti henüz Blender'dan ihraç edilmiş ayrı bir GLB değildir**; TS/Three modüllerinden oluşturulur. İleride `ENV_` modüllerini Blender kaynak dosyalarıyla değiştirmek mümkündür, ancak statik model kapsamı aşılmadı.

## Henüz tamamlanmayan kabul

- [ ] Fiziksel masaüstü ve Android/iOS cihazlarında **60/30 FPS**, p95 frame time, otomatik kalite profili testleri
- [ ] Gerçek HTTPS/CDN ağ transfer raporu (gzip/brotli), ilk oynanabilir anın yükleme süresi
- [ ] Gerçek 5 kişilik kör oynanış testi ve üç takılma düzeltmesi (Aşama 3 de açık)
- [ ] Gerçek seviye değiştirme/unload/reload beş döngü ve heap snapshot: şu an tek L01 var; test aynı sahnede 5 yeni oyun başlatır
- [ ] Kontrollerin ve tabela renklerinin fiziksel cihaz/renk körlüğü okunurluğu
- [ ] Assetlerin bağımsız sanat geri bildirimine göre son görsel revizyonu

**Kabul durumu:** Teknik/ görsel önizleme geliştirildi; Aşama 4 tamamen kapatılmış değildir. `main` dalındaki sürüm ile otomatik birleşmez.
