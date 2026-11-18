# BLOCKFRONT — Online Tactical Arena

Üç özgün haritada gerçek oyuncularla **1v1–5v5 tarayıcı tabanlı taktiksel FPS**. Three.js ile 3B grafikler, Socket.IO ile WebSocket tabanlı çok oyunculu oyun. Avatarlar kullanıcı tarafından sağlanan kübik/voxel görsel tarzına göre kodla modellenmiştir. CS 1.5'in maç ritminden esinlenir, ancak isimler, haritalar, modeller ve oyun kodu özgündür.

## Oynanış
- **Sadece çevrimiçi:** Tek oyuncu, bot veya çevrimdışı mod yok. Maça başlamak için her takımda en az bir gerçek oyuncu gerekir.
- **Maksimum 10 kişi:** Akıncılar (A) ve Muhafızlar (B) takımlarının her biri en fazla 5 oyuncu.
- **3 harita:** Dust Quarter (çöl), Dockyard (liman), Ironworks (fabrika).
- **Bomba modu:** Akıncıların rastgele bir üyesi bombayla doğar. Bombayı A veya B bölgesine kurmak için E'yi 4 saniye tut; Muhafızlar bombayı 6 saniyede çözer. Bomba 40 saniyede patlar. Bombayı taşıyan ölürse bomba düşer; takım arkadaşı E ile alabilir.
- **Silahlar:** Raven 9 tabanca, Vektor SMG, AR-41 tüfek, Longshot keskin nişancı, Bulldog 12 pompalı, Bastion ağır makineli, Combat Knife ve Frag Grenade. Her silahın hasarı, atış hızı, şarjörü, yeniden doldurma süresi ve menzili farklıdır.
- **Raunt sistemi:** 16 saniye satın alma, 135 saniye raunt, 40 saniye bomba, raunt aralarında 6 saniye. 8 raunt kazanan maçın galibi.
- **Ekonomi:** Başlangıç $800, galibiyet +$3250, mağlubiyet +$1500, üst sınır $16000. Zırh, bomba ve birincil silahlar satın alınır.
- **Çevrimiçi lobiler:** Beş karakterlik özel oda kodu; takımlar, host tarafından harita seçimi, takım değiştirme, sohbet, skor tablosu.
- **Görseller:** Three.js WebGL voxel karakterler, gölgeler, silah modelleri, izleyici kamerası, radar, patlama ve isabet efektleri.

## Başlatma

Node.js **22 veya üzeri** gerekir.

~~~bash
npm install
npm run dev
~~~

Tarayıcıda http://localhost:3000 adresine git. Aynı sunucuyu açan iki farklı **gerçek tarayıcı** veya cihazla oda kodunu paylaşarak en az 1v1 oynanabilir. Yerel sunucuda deneme geliştirme/test amaçlıdır; internet üzerinden arkadaşlarla oynamak için sunucuyu herkese açık HTTPS/WSS destekli bir Node hizmetine kurmalısın.

Üretim:
~~~bash
npm install
npm run build
npm start
~~~

Sunucu PORT ortam değişkenini kullanır (varsayılan 3000). İstemci ve Socket.IO **aynı alan adından** servis edilir; GitHub Pages tek başına yeterli değildir, çünkü WebSocket sunucusu çalıştırmaz.

## Render'da dağıtım
Bu repodaki render.yaml bir **Web Service** tanımlar. Render üzerinden New > Blueprint seçip repoyu bağla; Build: npm install && npm run build, Start: npm start, Node 22. Canlı HTTPS adresi Render tarafından atanır. Servis uykuya girerse odalar kaybolabilir; çok sayıda eşzamanlı oda için kalıcı durum depolama ve yatay ölçekleme ayrıca gerekir.

## Tuşlar

| Tuş | Eylem |
| --- | --- |
| WASD / Fare | Hareket / Nişan |
| Sol tık | Ateş / Bıçak / Bomba fırlatma |
| Shift / Ctrl | Koş / Eğil |
| Space | Zıpla |
| E | Bombayı kur, çöz veya al (basılı tut) |
| B | Satın alma menüsü (hazırlık aşamasında) |
| 1, 2, 3, 4 / G | Birincil, tabanca, bıçak, bomba |
| R | Şarjör değiştir |
| Tab | Skor tablosu |
| Enter | Genel sohbet |
| Esc | Menüden çık / fareyi bırak |

İlk tık imleci FPS kamerasına kilitler. Oyun klavye/fare ile masaüstü tarayıcıları hedefler.

## Sistem mimarisi

~~~text
index.html             Vite giriş, HUD, lobi
client/main.js         Three.js render, blok avatarlar, input, radar, UI
client/style.css       Arayüz ve responsive stiller
shared/rules.js        Haritalar, silahlar, çarpışma ve ışın testleri
server/index.js        Node/Express + Socket.IO otoriter simülasyon
tests/rules.test.js    Harita, silah, çarpışma, ışın testleri
render.yaml            Render dağıtım tanımı
~~~

Tarayıcı yalnızca tuş ve kamera yönünü gönderir. Sunucu pozisyonları, çarpışmaları, mermileri/hasarı, ekipmanı, parayı, bomba/raunt sonuçlarını doğrular ve yaklaşık 10 Hz anlık görüntüleri yayınlar. İstemci kendi yürüyüşünü öngörür ve sunucu düzeltmelerine yaklaşır. İsimler ve mesajlar sınırlanır.

## Geliştirme / test
~~~bash
npm test
npm run check
npm run build
~~~

## Bilinen üretim sınırları

Bu sürüm **oynanabilir çok oyunculu temel oyun projesidir**, CS 1.5'in tüm özelliklerinin tamamlanmış ticari muadili değildir. Henüz hesap sistemi, sıralamalı eşleştirme, sesli iletişim, mobil kontroller, oyuncu profili/kalıcı istatistik, rekabetçi seviyede hile önleme, çok sunuculu oda senkronizasyonu, geri bağlanıp maç devam ettirme ve profesyonel animasyon/ses varlıkları içermez. Oyun odaları **RAM'de tutulur** ve sunucu yeniden başladığında silinir. Birden fazla sunucu kopyası kullanılmamalı; Socket.IO uyumlu merkezi oda/mesaj altyapısı eklenmeden yatay ölçeklenmez.

Kod/varlıklar özgündür; Counter-Strike'a ait marka, model, harita, ses veya dosyalar kullanılmamıştır.
