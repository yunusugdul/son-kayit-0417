# SON KAYIT: 04.17
## Web tabanlı 3D izometrik hikâye-bulmaca oyunu — oyun tasarım belgesi + teknik mimari + üretim planı

**Belge sürümü:** 1.0 (uygulamaya başlama temeli)  
**Tarih:** 18 Kasım 2026  
**Platform:** Web tarayıcısı; masaüstü öncelikli, dokunmatik ekran desteği hedefli  
**Teknoloji kararı:** **Three.js + TypeScript + Vite + Blender**  
**Çıktı:** Statik dosyalarla yayınlanan, yüklemesi hafif, sunucusuz çalışabilen tek oyunculu oyun  
**Önceki belge:** `izometrik_hikaye_oyunu_arastirma_ve_konsept.md`

> **Bu dosya bir “kodlamaya başlama sözleşmesi”dir.** [KESİN] onaylanmış tasarım kararı, [HEDEF] ölçülmesi gereken performans/kalite eşiği, [VARSAYIM] oyun testinde değişebilecek sayı, [GELECEK] ilk sürümde yapılmayacak özellik demektir. Kod yazarken belirsiz alanlar için önce bu dosyadaki en basit seçeneği uygula; kanıt olmadan yeni bağımlılık veya alt sistem ekleme. Resmî teknik kaynak bağlantıları en sondadır.

---

# 0. Bir sayfalık yönetici özeti

**Oyuncu vaadi:** Ada adlı arşiv görevlisi olarak unutulup fiziksel dünyadan silinmiş mekânları eski ses kayıtlarıyla geçici biçimde geri getir, el yapımı izometrik diorama bölümlerindeki bulmacaları çöz ve on iki yıl önce kaybolan kardeşin Efe'nin ne yaptığını öğren.

**Oyun döngüsü:** Gözlemle → yankı noktasını ve ihtiyaç duyduğu sesi bul → sesi etkinleştir → açılan geçitten ilerle / bir düzeni değiştir → geçmişe dair kayıt keşfet → sonraki bölümü aç.

**Ürün tanımı:** 6 bölüm + kısa giriş/final; toplam **90–150 dakika [HEDEF]**. Bölüm başına yaklaşık 10–20 dakika. Tek oyunculu, çevrimdışı sunucu gerektirmeyen *single-player* deneyim. Oyun sitesinin ilk açılışı internet ister; isteğe bağlı çevrimdışı önbellek sonraki sürümün konusu.

**Teknik seçim [KESİN]:** WebGL2 destekli Three.js renderer; TypeScript; Vite; minimal HTML/CSS arayüz; 3D sahneler `.glb` ve/veya Three.js primitifleri; Blender üretim hattı. React, Unity, Godot web export, ağır fizik motoru, sunucu, hesap sistemi, çok oyunculu, açık dünya, savaş yok.

**İlk yapılacak ürün:** *Çalmayan Zil* bölümünün başı-sonu oynanabilir, yaklaşık **8–12 dakikalık vertical slice**. Önce bir karakter, tek diorama, tek kaset, iki yankı alanı, bir kontrol paneli, bir hikâye kaydı, kayıt/yükleme ve çalışan web build. Diğer 5 bölüme başlamadan bu kesit performans, okunabilirlik ve eğlence testinden geçmeli.

**Öncelik sırası:** (1) Bulmaca ve kontrol hissi (2) çökmeden çalışan web deneyimi (3) hikâye / ses / erişilebilirlik (4) görsel cilalama (5) yeni içerik.

## 0.1 Kesin kapsam sınırları

| Dahil (v1) | Hariç (v1) |
|---|---|
| 3D, ortografik izometrik kamera | Serbest dönen açık dünya kamerası |
| 6 elle tasarlanmış diorama bölüm | Prosedürel kasaba, çok geniş harita |
| Yürüme + etkileşim + yankı çalma | Zıplama, dövüş, düşman AI, beceri ağacı |
| Klavye/fare + temel dokunma | Çok oyunculu / çevrimiçi eşitleme |
| Türkçe metin ve altyazı | Zorunlu profesyonel seslendirme |
| Yerel kayıt + manuel kayıt dışa aktarımı | Hesap, veritabanı, skor sunucusu |
| İki anlatısal final | 10+ dallı hikâye, değişen onlarca görev |
| GLB modüler varlıklar ve basit animasyon | Gerçekçi PBR tarama, sinematik CGI |

## 0.2 Başarıyı nasıl anlayacağız?

- [HEDEF] Modern masaüstü tarayıcıda kare hızı **60 FPS'e yakın**, orta düzey mobilde **30 FPS tutarlı**; gerçek cihazda ölçülmeli.
- [HEDEF] İlk oynanabilir ekran için transfer edilen toplam **sıkıştırılmış** veri ≲ **3 MB**; tam ilk bölüm ≲ **6 MB**; diğer bölümler yalnız seçildiğinde indirilsin. Bunlar teknik hedef, mevcut ölçüm değil.
- [HEDEF] İlk 2 dakikada oyuncu “ses bir geçidi geri getiriyor” fikrini anlayabilsin.
- [HEDEF] İlk testte 5 oyuncudan en az 4'ü bölümü dış yardımsız bitirsin; başarısızlık varsa tasarım düzeltilsin, oyuncu suçlanmasın.
- [KESİN] Bulmacada geri dönülemez kilitlenme, destek yok olurken oyuncunun aşağı düşmesi ve bozuk kayıt yüzünden bölümün açılmaması olmamalı.

---

# 1. Oyunun kimliği, deneyim sütunları ve ton

## 1.1 Tür ve hissiyat

- **Tür:** Tek oyunculu anlatısal çevresel bulmaca / keşif.
- **Kamera:** Gerçek 3D dünya, sabit ortografik izometriye yakın açı. Perspektif illüzyonu değil, gerçekten 3D sahne ve 3D hareket.
- **Ton:** Hüzünlü ama huzurlu, gizemli ama korku oyunu değil. Analog kaset, yağmur sonrası taş, sahil rüzgârı, sarı sokak lambaları, soluk turkuaz hatıra ışığı.
- **Ritim:** Sakin gözlem → tek bir kurala ilişkin deneme → çözüm / kısa görsel ödül → 20–60 saniyelik hikâye keşfi.
- **Duygu:** Korku ve şok yerine merak, özlem, küçük keşif, anlamlı veda.

## 1.2 Üç tasarım sütunu

1. **Mekânın kendisi bilmecedir.** Harita büyüklüğü değil, bir odanın okunabilirliği ve değişimi önemlidir.
2. **Ses mekanik olarak iş görür.** Kaset sadece hikâye metni taşımaz; bulmacayı fiziksel olarak değiştirir.
3. **Her çözülen bulmaca bir insanın hikâyesini açar.** Ödül rastgele puan değil, anlatısal keşiftir.

## 1.3 Oyuncu kitlesi ve zorluk

- Atmosferik bulmaca, bağımsız macera ve gizem seven oyuncular; kısa oturumlarda oynamak isteyen kişiler.
- İlk bölüm kolay, 2–4 orta, son iki bölüm kademeli birleştirme. **Refleks baskısı ikincil.**
- Bulmacanın çözümü mantıktan gelsin; rastgele kör nokta tıklamaktan veya net duyulamayan sesleri ayırt etmekten değil.
- Bir sahnede aynı anda **en fazla 2–3 yeni kavram**; tek seferde bir yeni mekanik.

## 1.4 Fark yaratan cümle

**“Burada kapılar anahtarla değil, o kapının bir zamanlar çıkardığı sesle açılır.”** Pazarlama görseli ve ilk 90 saniye bu fikri göstermeli.

---

# 2. Web teknik mimarisi ve teknoloji kararı

## 2.1 Neden bu yığın?

| Bileşen | Seçim | Gerekçe |
|---|---|---|
| Oyun sahnesi | `three` (WebGLRenderer) | Doğrudan tarayıcıda WebGL2; özel küçük oyun için kontrol ve hafif kurulum |
| Dil | `TypeScript` | Bulmaca durumlarını, seviye verilerini ve kayıt şemasını güvenle tanımlamak |
| Derleme / geliştirme | `Vite` | Hızlı yerel sunucu, üretim için statik `dist/` çıktısı |
| 3D üretim | Blender → glTF 2.0 / `.glb` | Açık araç, yaygın web formatı |
| UI | HTML + CSS + TypeScript | Erişilebilir altyazı ve butonlar; 3D sahne üstünde küçük DOM katmanı |
| Ses | Web Audio API / Three.Audio | Ses kilidini ilk kullanıcı etkileşiminde açabilme, kademeli ses yükleme |
| Depolama | `localStorage` + JSON | Küçük tek oyunculu durum kayıtları; sunucu gerektirmez |
| Birim test | `Vitest` | Echo/state/save/nav kuralları için küçük ve hızlı test |
| Tarayıcı test | `Playwright` (kritik akışlar) | Chrome/Firefox/WebKit tabanlı otomasyon; gerçek cihaz ölçümünü yerine geçirmez |
| Yayın | Cloudflare Pages / Netlify / GitHub Pages gibi statik servis | Sunucu kodu olmadan CDN üzerinden dağıtım |

**Not:** Başlangıçta belirli bir en güncel paket sürümü varsayma. Projeyi başlatırken Node'un aktif LTS sürümünü ve uyumlu `three`, `vite`, `typescript` sürümlerini kur; `package-lock.json` dosyasını depoya dahil et. Sürüm yükseltmesini ayrı PR/görev olarak yönet. WebGL2 mevcut Three.js `WebGLRenderer` için gerekli; uyumluluk başlangıçta kontrol edilmeli. [T1]

## 2.2 Neden Godot veya Unity Web değil?

- Bu proje, tarayıcı için **küçük statik dosyalar ve seçici bölüm yükleme** hedefliyor.
- Three.js ile motorun genel amaçlı sahne/editör/çalışma zamanı paketini indirmeden, ihtiyacımız olan minimum sistemleri yazabiliriz.
- **Bedeli:** Editörde hazır çarpışma, navigation, state machine ve inspector gelmiyor; bunları kendi küçük modüllerimizle kurmalıyız. Belge bu sorumlulukları açıkça tanımlar.
- İleride gerçek zamanlı fizik, kalabalık NPC, karmaşık 3D animasyon, büyük dünyaya geçersek seçim yeniden değerlendirilir. Sırf tarayıcı hedefinden dolayı “her durumda Three.js üstündür” iddiası yok.

## 2.3 Ağ / barındırma modeli

1. Tarayıcı `index.html`, JS/CSS ve ilk sahneye ait varlıkları CDN'den indirir.
2. Oyun ana menüyü gösterir; ses ancak oyuncu **Başla**ya bastığında etkinleşir.
3. Seçilen bölümün `manifest.json` ve `.glb`, ses, görselleri talep üzerine indirilir.
4. Tamamlanan bölümün verisi silinebilir; ortak malzemeler/asset'ler tekrar kullanılır.
5. Kayıt dosyası tarayıcıda tutulur; istenirse JSON dışarı aktarılabilir.
6. Tüm ana oynanış ağ bağlantısı olmadan bellekte yürür; canlı servis çağrıları yoktur.

**V1'de backend, kullanıcı hesabı, e-posta, ödeme ve analitik izleyici olmayacak.** Bu sayede operasyon, mahremiyet, hata yüzeyi ve ilk yük azalır.

## 2.4 Web kısıtları (tasarımda kabul edilen gerçekler)

- **WebGL2 yoksa:** Çökme veya siyah ekran değil; desteklenmeyen tarayıcı/cihaz açıklaması ve yeniden deneme önerisi.
- **Ses otomatik başlamaz:** `AudioContext` kullanıcı tıklaması/dokunması sırasında `resume()` edilir. [T3]
- **Sekme arka plana geçerse:** `requestAnimationFrame` duraklayabilir; yankı sayaçları duvar saatine göre işlememeli. Görünürlük değiştiğinde oyun ve ses kontrollü duraklamalı. [T4]
- **Yerel kayıt kalıcı garanti değildir:** Gizli sekme, depolama izni veya kullanıcı tarayıcı verilerini silmesi kayıtları silebilir. Manuel dışa aktarım bu yüzden önemlidir. [T5]
- **WebGL kaynakları:** Bir bölüm çıkartıldığında geometri, materyal ve doku referansları yönetilerek `dispose()` edilmeli; aksi hâlde uzun oyun oturumlarında bellek birikir. [T6]
- **Mobil destek:** Dokunmatik kontroller, küçük ekran görünürlüğü ve düşük GPU bellek sınırı ayrıca test edilir; her cihazda 60 FPS vaadi verilmez.

---

# 3. Ekranlar, oyun döngüsü, kontroller

## 3.1 Ekran akışı

```text
Siteye giriş
  ├─ WebGL2 kontrolü → uyumsuzluk ekranı (gerekirse)
  └─ Hafif ana menü
       ├─ Yeni Oyun / Devam Et
       ├─ Bölümler (yalnız açılanlar)
       ├─ Ayarlar / Erişilebilirlik / Kayıt Yönetimi
       └─ Hakkında / jenerik
                ↓
          Bölüm yükleme ekranı
                ↓
     Diorama + karakter + oyun içi HUD
       ├─ Duraklat / ayarlar / ana menü
       ├─ Etkileşim / kaset / ipucu
       └─ Hikâye bulgusu / bölüm sonu
                ↓
       İlerlemeyi kaydet → sonraki bölüm
                ↓
       L06 final seçimi → final sahnesi
```

## 3.2 Temel kontrol şeması [KESİN]

| Eylem | Masaüstü | Dokunmatik |
|---|---|---|
| Hareket | `W/A/S/D` veya ok tuşları; ayrıca boş zemine sol tıkla yürü | Zemine dokun: git |
| Etkileşim | Nesne yakınında `E` veya nesneye tıkla | Nesneye dokun, gerekiyorsa yaklaşınca otomatik etkileşim |
| Yankıyı çalıştır | `Space` veya ekrandaki kaset düğmesi | Büyük kaset düğmesi |
| Kaset seçimi | `1–3` veya HUD'daki kaset simgesi | HUD'daki kaset simgesi |
| Duraklat | `Esc` | Duraklat düğmesi |
| İpucu | `H` veya ipucu simgesi | İpucu simgesi |
| Altyazıyı geç | `Enter` / tıklama | Dokunma |

**Hareketin teknik anlamı:** WASD, ekran yönlerine göre yerdeki XZ düzlemini hareket ettirir. Tıklama, zemine raycast + gezinme grafiği yolunu kullanır. Oyuncu engelden geçemez; hedef alan erişilemiyorsa tıklama bir başarısızlık sesi/işareti verir, rastgele bir yere ışınlamaz.

**Etkileşim kuralı:** En fazla `1.6` dünya birimi [VARSAYIM] uzaklıktaki ve görüşü engellenmeyen etkileşimli nesne vurgulanır. Uzak nesneye tıklanınca önce güvenli yaklaşma noktası aranır, sonra `E` etkileşimi tetiklenir. Aynı anda 2 nesne varsa en yakın ve imlece en uygun olan seçilir.

**Kamera:** Dünyada yukarı `Y`; zemin `XZ`. Başlangıçta kamera azimut 45°, yükseklik 35°, ortografik frustum yüksekliği yaklaşık 12 birim [VARSAYIM]. Karakteri ve asıl hedefi aynı anda kadraja alacak şekilde bölüm bazında konumlandır; oyuncu serbest açı döndürmez. İleride yalnız zorunlu sahnelerde kontrollü açı değişimi ayrı mekanik olarak eklenebilir. Başlangıçta Q/E kamera dönüşü **yok**; E etkileşime ayrılmıştır.

## 3.3 Oyuncunun hissetmesi gereken dönüşler

- Hareket 2.5–3 dünya birimi/sn [VARSAYIM], çarpışma basit ve stabil.
- Karakter dönerken 0.1–0.2 sn yumuşak yön değiştirme; hareketi bloke eden animasyon yok.
- Etkileşim sonrası en geç 0.15 sn içinde görünür/işitsel geri bildirim.
- Yankının ortaya çıkışı 0.4 sn animasyon; yok oluşu 0.6 sn. **Çarpışma durumları görsel animasyonun gerisinde kalmamalı.**
- Hatalı etkileşim mesajı kısa, açık ve ekranda kaybolabilir: “Bu noktaya uygun kayıt seçili değil.”

## 3.4 Bölüm başına önerilen dakika ritmi

- İlk 30–60 sn: amaç görülsün, kısa görsel merak.
- 1–3 dk: oyuncu yeni kurala güvenli ortamda dokunsun.
- 3–8 dk: 1–2 bulmaca varyasyonu.
- 1–3 dk: hikâye kaydı veya karakter etkileşimi.
- Son 20–40 sn: kapı/ışık/mesaj ödülü, sonraki soru.

Bu süreler üretim bütçesidir; oyun testinde gerçek sürelere göre revize edilecek.

---

# 4. Ana mekanik: yankıyla geçici olarak hatırlanan mekân

## 4.1 Kavram sözlüğü

| Terim | Anlamı |
|---|---|
| **Kaset** `Tape` | Oynatılabilen ses/hafıza kaydı; benzersiz `tapeId` |
| **Yankı noktası** `EchoAnchor` | Kaydın etkileşime girebildiği önceden yerleştirilmiş düğüm |
| **Yankı grubu** `EchoGroup` | Ortaya çıkacak kapı, basamak, platform, merdiven gibi objeler |
| **Dayanak** `Support` | Oyuncunun üzerinde durduğu, geçici olarak var olabilen zemin |
| **Kalıcı anahtar** `Latch` | Doğru hamle yapıldığında bulmaca ilerlemesini kaydeden mekanizma |
| **Güvenli nokta** `Checkpoint` | Kaydedilebilir sabit zemin ve tutarlı bulmaca durumu |
| **Hikâye bayrağı** `StoryFlag` | Olayın yaşandığını belirten kalıcı mantıksal kayıt |

Bir kaset tüm kasabayı değiştirmez. Hangi ankrajın hangi kasetle eşleştiği seviye verisinde açıkça tanımlanır. Aynı kaset bir bölümde iki farklı ankraja bağlanabilir; böylece içerik maliyeti artmadan bulmaca çeşitlenir.

## 4.2 Yankı durum makinesi

```text
INACTIVE
  oyuncu uygun ankrajda doğru kaseti çalıştırır
      ↓
MATERIALIZING (0.4 sn görsel oluşum)
      ↓
ACTIVE (12 sn [VARSAYIM]; nesneler görünür, yürünebilir)
      ├─ tekrar basma → etkisiz; süre sıfırlanmaz ve kaset kapanmaz
      └─ süre doldu → oyuncu geçici dayanakta mı?
          ├─ Evet: SAFE_HOLD (zamanlayıcı durur; geçit/dayanak kalır)
          │         └─ sabit zemine ulaşınca → FADING
          └─ Hayır → FADING (0.6 sn)
                         ↓
                     COOLDOWN (1.5 sn)
                         ↓
                     INACTIVE
```

**Kritik güvenlik:** SAFE_HOLD, oyuncu **geçici zemin üzerinde veya kapanacak kapının geçiş hacmi içinde** ise devreye girer. Kapı kasetten güç alıyorsa içeride kilitlenen oyuncuya sürekli açık kaçış veya otomatik geri dönüş sun. Üzerinde oyuncu varken geçici zemin yok olamaz; oyuncu geçidi tamamlarken kapı çarpışması yeniden açılamaz. Taşıma platformundaki oyuncu, yolculuk bitene veya güvenli iniş gerçekleşene kadar korunur. Aktif yankıda Space tuşuna tekrar basmak yankıyı yenilemez/kapatmaz; bu, süre sınırlı bulmacayı belirgin ve tekrar üretilebilir tutar.

**İlk bölümde bir etkin yankı grubu**; sonraki bölümde seçili kaset değiştirilebilir. Aynı anda iki yankıyı etkin tutmak v1'in *temel* kuralı değil; yalnız L04–L06'da açıkça tasarlanmış bir alan gerektiriyorsa seviye özel davranış olur.

## 4.3 Bir yankının veri sözleşmesi

```ts
type TapeId = 'bell' | 'oven' | 'tram' | 'clock' | 'harbor' | 'archive';
type EchoPhase = 'inactive' | 'materializing' | 'active' | 'safe_hold' | 'fading' | 'cooldown';

interface EchoAnchorDef {
  id: string;
  tapeId: TapeId;
  echoGroupId: string;
  activeSeconds: number;        // başlangıç: 12
  cooldownSeconds: number;      // başlangıç: 1.5
  activationRadius: number;     // örn. 1.6
  oneShot?: boolean;            // kalıcı bayraklı bir kez açılan olay
  requiredFlags?: string[];
}

interface EchoGroupDef {
  id: string;
  objectIds: string[];          // sahnedeki objelerle ID eşlemesi
  navigationLinkIds?: string[]; // etkinleşince açılacak yollar
  supportObjectIds?: string[];  // üstünde oyuncu olabilir
  protectedVolumeIds?: string[]; // kapanırsa oyuncuyu sıkıştıran kapı geçidi vb.
}
```

**Deterministik kural:** Aynı girdi ve aynı durum aynı sonucu üretir. Bulmaca çözümü gelişi güzel `setTimeout` zincirlerine bağlanmaz; tüm zamanlama oyun döngüsündeki `deltaTime` ile güncellenir.

## 4.4 Bulmaca ilkeleri

1. Oyuncunun hangi nesneyi etkileyeceği görsel ipucu (turkuaz yankı lekesi, kaset etiketi) ile anlaşılır.
2. Her bölümün ilk kullanımında risk yoktur; oyuncu mekanik denemesinden dolayı cezalandırılmaz.
3. Bir yeni kural önce tek başına, sonra önceki kuralla birlikte kullanılır.
4. Çözüm kısa tutulur, geri yürüyüş gereksiz uzatılmaz.
5. Yanlış kaset seçildiğinde açıklayıcı geri bildirim vardır; düşman veya zarar yoktur.
6. Kritik hikâye ipuçları salt sese emanet edilmez; altyazı ve kayıtlarda yazılı metin vardır.
7. Bulmaca çözüldüğünde bir olay `flag`'i yazılır; devam etmek için aynı zor hamleyi ikinci kez tekrar gerektirmez.
8. Her bulmaca için **sıfırlama**, **güvenli respawn** ve **ipucu** belirlenir.

## 4.5 İpucu sistemi

- `H`/ikon → 1. ipucu: hedef nesneyi tarif eder.
- 25–40 sn sonra aynı yerde → 2. ipucu: hangi kasetin işe yaradığı.
- İsteğe bağlı 3. ipucu: hareket sırası; **çözümü zorla gerçekleştirmez**.
- İpuçları ekranda metin olarak görünür; bir kez gösterilince aynı bilgiyi spam'lemez.
- İpucu sistemi oyuncuya saygılıdır: zaman baskısı, ceza veya alaycı mesaj yok.

## 4.6 Zamanlama ve hareketli platformu güvenle uygulama

- Hareketli platform v1'de fizik motoruna dayalı serbest rigid-body değildir. Platformun yolu **önceden tasarlanmış, iki uç noktalı spline/doğrusal hareket**tir.
- Oyuncu platforma bindiği anda karakterin konumu platform koordinatına bağlanır; inerken dünya koordinatına güvenli aktarılır.
- Platform orta noktadayken tıklamayla erişilemeyen yere yürüme komutu verilmez.
- Platform uç noktaya yanaşınca `NavLink` açılır; diğer zamanlarda kapalıdır.
- Duraklatma, sekme kaybı ve yankı SAFE_HOLD sırasında platformun durum makinesi de durur.
- Kısıtlı otomatik test: üstündeyken yankı biter, tab gizlenir, devam edilir, bölüm yeniden yüklenir; karakter hiçbir koşulda boşluğa doğmaz.

---

# 5. Hikâye incili (narrative bible) — ekip için bağlayıcı dünya kuralları

## 5.1 Hikâye özeti

Sisli kıyı kasabasında her gece **04.17**'de bir sokak, oda veya yapı parçalanarak görünmez olmaktadır. Kasaba halkı kaybolmuş yerleri de hatırlayamaz. Belediye ses arşivinde çalışan **Ada**, analog kaset kayıtlarının bazı yok olmuş mekânları kısa süreliğine geri çağırabildiğini keşfeder. On iki yıl önce ortadan kaybolan kardeşi **Efe**'nin sesi, yeni bulunan bir kasettedir: **“Ada, beni hatırla.”**

Ada, kayıt izlerinden hareketle kasabanın geçmişindeki büyük kıyı felaketinin ardından kurulan **Hatıra Arşivi**ne ulaşır. Arşiv, dayanılmaz anıları ve bunlarla bağlanan mekânları insanların bilincinden saklamak için kurulmuştur. Efe, yıllar önce sistemin kontrolsüz silinmesini önlemek üzere kendini arşivin ses örüntüsüne bağlamıştır. Arşiv zamanla bozulmuş ve artık yeni yerleri de silmeye başlamıştır. Ada finalde arşivi açıp kasabayı acı gerçekle yüzleştirmekle, kapalı tutup bazı yerleri ve Efe'nin sesini kayıp bırakmak arasında karar verir.

## 5.2 Fantastik dünyanın 7 değişmez kuralı

1. **Silinme mekânsaldır:** Unutturulmuş toplumsal bir anıyla güçlü biçimde bağlantılı yerin fiziksel izleri silinir; tüm gerçeklik rastgele yeniden yazılmaz.
2. **İnsanlar kaybolmuş yerlerin ayrıntılarını unutur;** çevresinde oluşan tutarsızlığı gündelik hayatın bir parçası sanabilir. İnsanlar birbirlerinin varlığını doğrudan unutmak zorunda değildir.
3. **Analog kayıtlar istisnadır:** Arşiv dışında kalmış bazı kasetler, silinen mekâna ait ses izlerini koruyabilir. Bunlar anıyı *geçici ve yerel* canlandırabilir.
4. **Her kaset her şeyi açamaz:** Kayıt, ait olduğu ankrajın işaretlenmiş nesne grubuna cevap verir.
5. **Ada'nın hatırası tam değil:** Efe'yi kayıp kardeşi olarak hatırlar; onun nerede ve neden kaybolduğu konusunda parçalı anıları vardır. Bu, 12 yıllık gizemi tutarlı kılar.
6. **04.17, arşivin gece eşitleme saati:** İlk felaketin kritik dakikasıdır ve sistem bu anda bir kez daha bütünlüğünü kontrol eder. Arıza bu döngüde büyür.
7. **Final bir hayat kurtarma düğmesi değildir:** Her iki kararın açık yararı ve bedeli bulunur; hikâye tek “iyi” seçeneği gizlemez.

## 5.3 Karakterler

| Karakter | İstek / korku | Oyun içi sunum | Dönüşüm |
|---|---|---|---|
| **Ada** (oynanabilir) | Kardeşine gerçekte ne olduğunu öğrenmek; geçmişi değiştirememe korkusu | Stilize 3D model, kısa altyazılı iç konuşma | Kayıt tutan gözlemciden karar verebilen tanığa |
| **Efe** (kayıp kardeş) | Unutmanın kasabaya zarar vermesini durdurmak; Ada'nın gerçeği bilmesini istemek | Kısa analog kasetler, isteğe bağlı ses + zorunlu metin | Soyut izden bilinçli fedakârlığa |
| **Nermin** (eski istasyon görevlisi) | Kendi suskunluğuyla yüzleşmek | Tek düşük poligonlu karakter veya 2D portre + altyazı | Gerçekleri saklayan kişiden açıklayan tanığa |
| **Kasaba sakinleri** | Gündelik hayatın kaybolan parçaları | Nesne etiketleri, notlar, kayıtlar; kalabalık NPC yok | Her bölümde bir insan hikâyesinin izi |

**Sinematik kural:** Uzun ara sahne yok. 10–25 saniyelik kamera yaklaşması, obje animasyonu, altyazı ve çevre sesleri ana araçlar. Oyuncunun kontrolü mümkün olduğunca elinde kalır.

## 5.4 Duygu ve anlatım çizgisi

| Bölüm | Tematik soru | Verilen bilgi | Bırakılan yeni soru |
|---|---|---|---|
| L01 Çalmayan Zil | “Kaybolan bir kapı niye hatırlanır?” | Ada, Efe'nin izini gerçekten bulur | Kayıt neden bugün ortaya çıktı? |
| L02 Kapatılan Fırın | “Bir anıyı saklamak korumak mıdır?” | Efe birilerini korumaya çalışmış | Kimden, neden? |
| L03 Boş Durak | “Bir kasaba neyi beraber unutabilir?” | Kıyı felaketinin izleri | Hatırlamama kararı kimindi? |
| L04 Saat Kulesi | “Silinmeyi kim başlattı?” | Arşiv bir insan kararıyla kuruldu | Sistem neden artık kontrolden çıktı? |
| L05 Kıyı İstasyonu | “Fedakârlık kimin adına yapılır?” | Efe kendi isteğiyle arşive bağlandı | Ada aynı bedeli kabul edecek mi? |
| L06 04.17 Arşivi | “Hatırlamanın da unutmanın da bedeli var mı?” | Bütün kayıtlar bir bütün olur | Oyuncunun seçimi finali belirler |

## 5.5 Final seçenekleri — kesin sonuçları

**A / Arşivi aç:** Silinen mekânlar ve olayların kayıtları zamanla geri görünür olur; kasaba felaketin acısıyla yüzleşir. Ada Efe'nin sesini bir kez daha tam olarak duyar; fakat Efe fiziksel olarak dönmez. Son görüntü: yeni bir kapı ve beraber okunan isimler.

**B / Arşivi mühürle:** Yeni silinmeler durur ama önceden silinmiş bazı yerler ve Efe'nin son sesi kalıcı olarak yitirilebilir. Ada kasabayı bugünkü hayatına koruyarak bırakır, özel arşivini kapatır. Son görüntü: aynı meydan, üzerinde artık bulunmayan bir evin boşluğu.

**Yazım prensibi:** İki sonun da sonuçları final seçimi öncesi anlaşılır iki cümleyle tarif edilir; oyuncuya sürpriz ahlaki ceza verilmez. Kapanış epilogu 1–2 dakika. Kaydedilmiş bir önceki checkpoint'ten farklı sonu görmek mümkün; oyuncuya bu imkân açıkça söylenir.

## 5.6 Metin ve ses üretimi

- Tüm hikâye satırları `locales/tr.json` içinde `story.l01.*` gibi kimliklerle tutulur; doğrudan kod içine yazılmaz.
- İlk dil **Türkçe**, mimari ikinci dil eklenebilir biçimde. İngilizce çeviri daha sonra içerik kontrolünden geçerek eklenir.
- Efe'nin kayıtları seslendirme olmadan da anlaşılmalı: **altyazı zorunlu**. Bütçe varsa 6–10 kısa Türkçe replik kaydedilir.
- Metin bütçesi [HEDEF]: bölüm başına 150–350 kelime hikâye; uzun belge okutmadan anlat.
- Ana bilgiyi gizleyen rastgele koleksiyon yok; ek hatıra parçaları sadece dünyayı zenginleştirir.

---
# 6. Altı bölümün uygulanabilir tasarımı

## 6.0 Ortak level üretim kuralı

- Her bölüm **tek merkezî diorama**, küçük 3D alan ve 2–3 okunaklı yol düğümü içerir.
- Seviye taban alanı ilk sürümde genellikle **12×12 ile 20×16 dünya birimi** [VARSAYIM]. Büyük kasaba fonuna ihtiyaç duyulursa oynanamaz silüet dekoru kullanılır.
- Bir bölümde **en fazla 3 bulmaca durumu**, **1–2 yeni etkileşim**, **2–5 hikâye nesnesi**.
- Sabit zemin, etkileşim yüzeyleri, duvar/engel, yankı grubu ve hikâye tetikleyicileri ayrı katmanda yönetilir.
- Her seviye tasarımında şu altı başlık zorunlu: giriş ve hedef, oyun mekaniği, state/flag, tıkanma riski/çözümü, ses-görsel ödül, checkpoint.
- L01 dışındaki sahneler L01 motorunu *kullanır*; benzersiz tekil sistem gerekiyorsa nedenini ve bütçesini yazmadan geliştirme yapılmaz.

## 6.1 L01 — Çalmayan Zil (önce yapılacak vertical slice)

**Duygusal amaç:** Ada ilk kez Efe'nin izini duyar.  
**Mekân:** Kıyıya inen dar taş sokak, yarısı silinmiş küçük postane, saat 04.17'yi gösteren durmuş tabela saati.  
**İlk görüntü:** Postaneye çıkan merdiven var ama giriş kapısının yerinde boşluk ve ince turkuaz parçacıklar var.

**Varlıklar:** Ada, zemin (5–8 modül), postane dış duvarı, iki kapı çerçevesi, bir silinmiş kapı, posta kutusu, küçük tezgâh, iki yankı ankrajı, kayıt cihazı. İlk üretimde hepsi üçgen/primitif olabilir.

**Ana kaset:** `bell` (eski posta zili).  
**Bulmaca:** Aynı ses kaydı iki farklı iz üzerinde farklı *yerel* objeleri geri getirir.

**Düğüm ve checkpoint akışı:**

```text
Dış Sokak [CP_START]
   ↓ (posta kutusunun önündeki kaset bul)
Kaseti edin: inventory.bell = true
   ↓ (yankı izi A'ya yaklaş)
Zil kasetini oynat → postanenin giriş kapısı görünür
   ↓ (güvenli geçiş)
Postane İç [CP_INTERIOR]
   ↓ (tezgâhtaki kaydı oku → ikinci ankrajın ışığı belirir)
Yankı izi B'de aynı kaseti çal → unutulmuş kısa basamak dizisi görünür
   ↓
Üst Arşiv Rafı → Efe'nin 'Ada, beni hatırla' kaseti
   ↓
Hikâye satırı + bölüm tamamlandı → L02 açılır
```

**Durum tablosu:**

| Durum | Koşul | Görünür sonuç | Kaydedilecek bayrak |
|---|---|---|---|
| `S0` | Yeni bölüm | İlk kapı silik; kaset kutuda | `l01_started` |
| `S1` | Kaset alındı | HUD'da zil kaseti; A parlıyor | `l01_tape_found` |
| `S2` | A'da doğru oynatım | Giriş geçici olarak geri gelir | Geçici echo; kalıcı bayrak yok |
| `S3` | Oyuncu içeri ulaştı | İç checkpoint; A tekrar gerekmez | `l01_interior_reached` |
| `S4` | Tezgâh notu okundu | B belirginleşir | `l01_note_read` |
| `S5` | B'de çal ve rafa ulaş | Efe kaydı bulunur | `l01_record_found` |
| `S6` | Kayıt izlendi | Bölüm biter, L02 açılır | `l01_complete` |

**Softlock korumaları:** Girişten içeri geçince iç tarafın sabit geçidi/checkpoint'i vardır; A kaybolunca içerde hapsolunmaz. B'nin basamaklarının üzerinde oyuncu varsa süre SAFE_HOLD olur. Kaset yanlış ankrajda kullanılırsa sarı yönlendirme metni görünür. Kaset kaybedilemez; checkpoint öncesine dönünce yeniden alınabilir.

**İpucu basamakları:** (1) “Postanede hâlâ bir zil sesi duyuluyor olabilir.” (2) “Posta kutusundaki kaseti al ve turkuaz çizgiye yaklaş.” (3) “Zil sesini girişte çal; içeride ikinci yankı izini ara.”

**Bölüm sonu mikro-senaryosu:** Ada rafı açar; makara dönmeye başlar. Cızırtının ardından Efe'nin sesi: “Ada, beni hatırla.” Ada: “Efe? Bu kaset... buraya nasıl geldi?” Kameranın çok hafif yaklaşması, ışığın sönmesi, kayıt kartının HUD'da arşive eklenmesi. 15–25 saniye.

**L01'in kabul testi:** Oyuncu fare/klavye veya dokunmayla başlayabilmeli; ilk ankraj bulmacasını anlamalı; ikinci yankı basamağına çıkabilmeli; tıklama + WASD tutarlı çalışmalı; sekme arka plandayken sayaç durmalı; yenileme sonrası son checkpoint'ten devam etmeli.

## 6.2 L02 — Kapatılan Fırın

**Duygusal amaç:** Efe'nin rastgele kaybolmadığını, olay öncesi insanların anılarını korumaya çalıştığını anlamak.

**Mekân:** Dar alt dükkân, üstte küçük fırın ve çatıya çıkan servis yolu; sıcak amber ve soğuk turkuaz karşıtlığı.

**Yeni mekanik:** İki kasetten **birini seçme** ve bir işlemi kalıcı olarak kilitleme. `oven` kaseti fırın rafını geri getirir; önceki `bell` kaseti servis kapısını geri getirir. **Aynı anda iki yankı zorunlu değil.**

**Bulmaca A:** Fırın rafı `oven` ile görünür → raf üstündeki mekanik kilit anahtarı aktive edilir → `l02_latch_open` kalıcı olur.  
**Bulmaca B:** `bell` ile servis kapısı geçici görünür → açık kilitten geç → çatıdaki fırıncının notunu bul.

**Akış:** Meydan → kaset → yankı rafı → kalıcı kilit → servis kapısı → çatı → not / kayıt.  
**Bulmaca ve bayraklar:** `l02_oven_found`, `l02_latch_open`, `l02_roof_reached`, `l02_complete`.

**Softlock:** Yanlış sırada kaset seçmek yalnız denemeyi tüketir; kilit kapanmaz. Raf kaldırıldığında oyuncu raf üstünde kalırsa SAFE_HOLD. Kapı ardında kalıcı kaçış yolu var.

**Hikâye ödülü:** Fırıncının yazılmamış sipariş fişinde Efe'nin el yazısı: “Kaybolanların isimlerini yazın. Seslerini kaybetmeyin.”

## 6.3 L03 — Boş Durak

**Duygusal amaç:** Kasabanın birlikte bastırdığı kıyı felaketini sezdirmek.

**Mekân:** Kısa ray hattı ve su kanalı; rayların orta segmenti silinmiş. Bir tarafta bilet gişesi, diğer tarafta kıyı belleği panosu.

**Yeni mekanik:** `tram` sesi ile tek **önceden tanımlı hareketli platform** çalışır. Fizik simülasyonu yok; deterministik iki durak arasında gidip gelir.

**Bulmaca A:** Tramvay zili ankrajı → platformun var olması → binme alanını keşfet.  
**Bulmaca B:** Platform varış noktasına geldiğinde güvenli inme bölgesine geç → pano üzerindeki tarih/rakam eşlemesini çöz.

**Akış:** Gişe → `tram` kaseti → birinci iskele → platform → ikinci iskele → pano → Nermin'in mesajı.  
**Bayraklar:** `l03_tape_found`, `l03_platform_boarded`, `l03_other_side`, `l03_board_read`, `l03_complete`.

**Platform spesifikasyonu [VARSAYIM]:** Duraklar arası 5 birim, hız 1.5 birim/sn, uçta bekleme 1 sn. Yankı süresi yolculuğu tamamlayacak kadar uzun olmalı; platformda yolcu varsa bitiş koruması çalışır.

**Softlock:** Oyuncu düşerse `CP_PLATFORM_START` noktasına geri konur; bilet gişesine dönmek gerekmez. Platformun üzerindeyken kaydetme, yerine sabit iniş noktasına varınca kaydet.

**Hikâye ödülü:** Nermin'in yarım kalmış duyurusu ve silinmiş felaket tarihinin ilk işareti.

## 6.4 L04 — Saat Kulesi

**Duygusal amaç:** Unutmanın kaza değil, kurulan bir düzen olduğunu fark ettirmek.

**Mekân:** İç içe 3 katlı minyatür saat kulesi; tek kamera kadrajında okunur, ön duvar karakteri örtünce yarı saydamlaşır.

**Yeni mekanik:** İki farklı anda `clock` yankısı; yankı etkinleştiğinde **düzenek durumunu değiştiren kalıcı mandal**.

**Bulmaca A:** Saat sesini alt ankrajda çal → dişli geçidi görünür → mandalı çekerek orta kata sabit merdiveni aç.  
**Bulmaca B:** Üst ankrajda tekrar çal → kayıp bir ibre görünür → ibreyi 04.17 yönüne çevir; kule arşivi açılır.

**Bayraklar:** `l04_lower_latch`, `l04_mid_checkpoint`, `l04_clock_aligned`, `l04_complete`.

**Softlock:** Birinci mandal kalıcı, geri dönüş yolu var. İbre 04.17 konumuna sürüklemeyle değil, 4 ayrık tıklama konumuyla ayarlanır; küçük dokunmatik ekranda piksel hassasiyeti gerekmez.

**Hikâye ödülü:** Arşivin kuruluş tutanağı: “Toplu unutma protokolü, kasaba meclisinin kararıyla başlatıldı.” Arıza ilk kez görünür olur.

## 6.5 L05 — Kıyı İstasyonu

**Duygusal amaç:** Efe'nin fedakârlığını öğrenmek ve Ada'nın seçimini kişisel hale getirmek.

**Mekân:** Tek parça iskele, eski istasyon ve küçük fener odası; uzak deniz düzlem, kıyı düşük poligon.

**Yeni mekanik:** Önceki kuralların 2 adımlı birleştirilmesi; yeni temel oyun fiili yok.

**Bulmaca A:** `harbor` yankısıyla kayıp iskele köprüsünü çıkar; sabit taraftaki vinç mandalını etkinleştir.  
**Bulmaca B:** `tram` sesiyle kısa ray arabasını devindir; fener odasına erişim ver. Sahne, oyuncunun mekanik kullanım sırasını anlamasına dayanır; saniye hassasiyetli yarış yok.

**Bayraklar:** `l05_bridge_latched`, `l05_car_arrived`, `l05_lantern_open`, `l05_complete`.

**Softlock:** İkinci sahnede arabadan inilince sabit basamak açılır. Köprü kaybolurken oyuncu üstündeyse SAFE_HOLD. Yanlış sıralama puzzle reset düğmesiyle düzeltilir.

**Hikâye ödülü:** Efe'nin kendi sesi: “Kayıtları içeride tutarsam hiçbirinin sesi sonsuza dek yok olmayacak. Beni arama, Ada. Doğru zamanı bekle.” Nermin daha önce sakladığı bilgiyi kabul eder.

## 6.6 L06 — 04.17 Arşivi

**Duygusal amaç:** Bütün mekaniklerin tek bir anlaşılır final düzeninde birleşmesi; seçimle kapanış.

**Mekân:** Kasabanın 3 katmanını temsil eden küçük merkezi arşiv maketi; ortada 04.17 göstergesi, çevresinde üç kayıt kaidesi.

**Final bulmacası:** Kayıtları rastgele 6 eşleştirmeye zorlamıyoruz. Önceki 3 tema net: `bell` (günlük yaşam), `clock` (karar), `harbor` (kayıp). Oyuncu bu üç kaydı uygun üç simgeli kaideye koyar; her doğru eşleştirmede kasabanın küçük bir parçası geri görünür. Sonra konsol açılır.

**Konsol:** İki seçenek; seçmeden önce sonuçların kısa özeti gösterilir. Yanlış kasete basınca sadece bilgilendirme olur, ilerleme silinmez. Seçim ekranı klavye ve dokunma ile erişilebilir.

**Bayraklar:** `l06_pedestal_1`, `l06_pedestal_2`, `l06_pedestal_3`, `l06_choice_ready`, `ending_reveal` **veya** `ending_seal`, `game_complete`.

**Softlock:** Kaideler kalıcı; geriye dönmek gerekmez. Final seçiminden hemen önce otomatik **`CP_FINAL_CHOICE`** checkpoint kaydedilir. İstenirse farklı sonu görmek için buradan yeniden başlatılabilir.

**Hikâye ödülü:** Seçime göre farklı 1–2 dakikalık diorama dönüşümü, aynı ana ortamı farklı ışık, yazı ve 2–3 nesneyle değiştiren ekonomik bir final. Ayrı büyük sinematik bölüm üretimi yok.

## 6.7 Bölümler arası kaset ve nesne politikası

| Kaset | İlk görünüş | Sonraki kullanım | Görsel işareti |
|---|---|---|---|
| `bell` | L01 | L02, L06 | Posta damgalı etiket |
| `oven` | L02 | L02 | Buğulu amber bant |
| `tram` | L03 | L05 | Metalik mavi etiket |
| `clock` | L04 | L06 | Saat dişlisi etiketi |
| `harbor` | L05 | L06 | Soluk yeşil dalga etiketi |
| `archive` | L06 / olay kaydı | Yalnız final anlatısı | Beyaz boş etiket |

Kaset HUD'ında bir anda en fazla 3 aktif seçim görünür. Her bölümün gerekli kayıtları “aktif çanta”ya otomatik alınır; tüm envanter için karmaşık sürükle-bırak menüsü yoktur. Daha önce edinilen kayıtlar arşiv ekranında metin olarak tekrar okunabilir.

---

# 7. Somut oyun veri modeli ve içerik üretim standardı

## 7.1 Birim ve koordinat sözleşmesi

- 1 dünya birimi = **yaklaşık 1 metre [KESİN]**.
- `Y` yukarı; `XZ` yatay gezinme düzlemi. `Vector3(x, y, z)`.
- Zemin seviyeleri `floorIndex: 0|1|2` gibi ayrı nav katmanı olarak işlenir.
- Modüler zemin karo önerisi: `1×1`; dış/ana görsel bloklar `2×2`, `2×4` olabilir.
- Karakter çarpışma yarıçapı `0.26`, yüksekliği `1.4` [VARSAYIM].
- Bölüm koordinatları küçük tam sayılarla tasarlanır; Blender'da transform uygula (`Apply Scale`) ve eksen/pivot doğrula.

## 7.2 ID sözleşmesi

- Seviye: `l01_post_office`, `l02_bakery`, ...
- Objeler: `l01_door_main`, `l01_echo_a`, `l01_echo_b`, `l01_note_counter`.
- Kaset: `bell`, `oven`, `tram`, `clock`, `harbor`, `archive`.
- Flag: `l01_tape_found`, `l01_complete` vb.
- Checkpoint: `cp_l01_start`, `cp_l01_interior`, `cp_l06_final_choice`.
- Asset: `env_post_office_a.glb`, `prop_mailbox_a.glb`, `char_ada_a.glb`.
- UI çevirisi: `ui.interact`, `ui.echo_play`, `story.l01_efe_01`.

İki seviyede aynı mantıksal nesne ID'si kullanılmaz; benzersizlik doğrulayıcı test ile kontrol edilir.

## 7.3 Seviye JSON sözleşmesi (örnek)

```json
{
  "schemaVersion": 1,
  "id": "l01_post_office",
  "titleKey": "levels.l01.title",
  "assetManifest": "/content/l01/manifest.json",
  "camera": {
    "target": [0, 1.2, 0],
    "orthoHeight": 12,
    "azimuthDeg": 45,
    "elevationDeg": 35
  },
  "spawn": { "checkpointId": "cp_l01_start", "position": [-4, 0, 3] },
  "checkpoints": [
    { "id": "cp_l01_start", "position": [-4, 0, 3] },
    { "id": "cp_l01_interior", "position": [1, 0, 1], "requiredFlags": ["l01_interior_reached"] }
  ],
  "echoAnchors": [
    { "id": "l01_echo_a", "tapeId": "bell", "echoGroupId": "l01_entry", "activeSeconds": 12, "cooldownSeconds": 1.5, "activationRadius": 1.6 },
    { "id": "l01_echo_b", "tapeId": "bell", "echoGroupId": "l01_stairs", "activeSeconds": 12, "cooldownSeconds": 1.5, "activationRadius": 1.6, "requiredFlags": ["l01_note_read"] }
  ],
  "echoGroups": [
    { "id": "l01_entry", "objectIds": ["l01_door_main"], "navigationLinkIds": ["l01_link_entry"], "supportObjectIds": [], "protectedVolumeIds": ["l01_door_main_passage"] },
    { "id": "l01_stairs", "objectIds": ["l01_stair_a", "l01_stair_b"], "navigationLinkIds": ["l01_link_upper"], "supportObjectIds": ["l01_stair_a", "l01_stair_b"], "protectedVolumeIds": [] }
  ],
  "puzzles": [
    { "id": "l01_reach_interior", "when": { "triggerId": "l01_interior_trigger" }, "then": [ { "type": "setFlag", "flag": "l01_interior_reached" }, { "type": "checkpoint", "id": "cp_l01_interior" } ] },
    { "id": "l01_finish", "when": { "interactId": "l01_efe_tape" }, "then": [ { "type": "setFlag", "flag": "l01_record_found" }, { "type": "story", "key": "story.l01_efe_01" }, { "type": "completeLevel" } ] }
  ]
}
```

**Önemli:** Bu şema, geliştirilecek seviyenin **tasarım kontratıdır**; henüz oluşturulmuş motorun okuyacağı bitmiş veri değildir. `when/then`, `navigationLinkIds`, asset manifest ve `checkpoint` işleyicilerini yazmadan bu JSON tek başına oynanabilir değildir. Yeni olay türü eklemeden önce mevcut komut setini kullan.

## 7.4 Olay eylemleri (v1 whitelist)

```ts
type GameAction =
  | { type: 'setFlag'; flag: string }
  | { type: 'grantTape'; tapeId: TapeId }
  | { type: 'activateEcho'; anchorId: string }
  | { type: 'setObjectVisible'; objectId: string; visible: boolean }
  | { type: 'setNavLink'; linkId: string; enabled: boolean }
  | { type: 'story'; key: string }
  | { type: 'checkpoint'; id: string }
  | { type: 'completeLevel' }
  | { type: 'showMessage'; key: string };
```

“Yazım gerektiren olay” tipi olarak `eval`, çalışma zamanında keyfi JavaScript veya HTML kabul **edilmez**. İçerik tanımı koda değil, izinli eylemlere çağrı yapar. Kayıt verileri, UI metinleri ve import edilen dosyalar güvenli şekilde doğrulanır; altyazı için `innerHTML` kullanılmaz.

## 7.5 Bölüm geçişi ve kaynak sahipliği

```text
LevelManager.load(levelId)
  1. input/gameplay kilitle, menüde yükleme göstergesi aç
  2. mevcut bölümün güvenli durumunu SaveManager'a ver
  3. eski LevelSession event listener'larını kaldır
  4. eski sahne nesnelerini ayır ve level'e ait kaynakları dispose et
  5. yeni manifest + level JSON oku, şemayı doğrula
  6. yalnız gerekli GLB ve sesleri yükle (hata varsa tekrar dene)
  7. static nav graph + dynamic nav links kur
  8. checkpoint, story flags ve puzzle state uygula
  9. Ada'yı güvenli spawn'a koy, kamera kadrajını ayarla
  10. HUD güncelle, input kilidini aç, oyun döngüsüne katıl
```

**Sahiplik kuralı:** Paylaşılan asset'ler `AssetCache` altında referans sayımıyla tutulur; level'in ürettiği materyal/geometri/texture yalnız seviyesi bitince bırakılır. Paylaşılan texture'ı rastgele `dispose` edip başka level'in modelini bozma.

## 7.6 Seviye oluşturma kontrol listesi

- [ ] ID ve yükleme manifest'i var.
- [ ] Başlangıç checkpoint'i sabit zeminde.
- [ ] Son hedef ilk kamera kadrajından okunuyor veya 1 dakikada işaret ediliyor.
- [ ] Her etkileşimin bir `interactId` ve yakınlık pozisyonu var.
- [ ] EchoGroup objeleri ve NavLink ID'leri sahnede eşleşiyor.
- [ ] Tüm kritik hikâye satırları TR çeviri dosyasında.
- [ ] Bulmaca reset edilebilir veya kalıcı latch ile güvenli.
- [ ] Oyuncunun geçici destek üstünde kalması test edildi.
- [ ] Seviye, yeni oyun ve kayıt geri yükleme ile aynı şekilde çalışıyor.
- [ ] Düşük grafik ayarı seviyeyi oynanamaz yapmıyor.

---

# 8. Kod tabanı, modüller ve sorumlulukları

## 8.1 Önerilen repo dizini

```text
son-kayit-0417/
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ vite.config.ts
├─ index.html
├─ README.md
├─ .gitignore
├─ docs/
│  ├─ game-design.md              # bu belgenin repo kopyası
│  ├─ decisions.md                # değişiklik kaydı
│  ├─ asset-guide.md              # sanat üretim kılavuzu
│  └─ test-plan.md
├─ public/
│  ├─ content/
│  │  ├─ common/                 # ortak karakter, materyal, ses
│  │  ├─ l01/                    # yalnız L01 için dosyalar
│  │  │  ├─ manifest.json
│  │  │  ├─ level.json
│  │  │  ├─ geometry.glb
│  │  │  └─ audio/
│  │  ├─ l02/ ...
│  │  └─ l06/ ...
│  └─ icons/
├─ source-assets/                  # Blender kaynakları; build'e girmez
│  ├─ characters/
│  ├─ modular-town/
│  └─ levels/
├─ src/
│  ├─ main.ts
│  ├─ style.css
│  ├─ app/
│  │  ├─ App.ts
│  │  └─ GameConfig.ts
│  ├─ core/
│  │  ├─ GameLoop.ts
│  │  ├─ EventBus.ts
│  │  ├─ AssetManager.ts
│  │  ├─ LevelManager.ts
│  │  └─ LevelSession.ts
│  ├─ rendering/
│  │  ├─ Renderer.ts
│  │  ├─ CameraRig.ts
│  │  ├─ SceneFactory.ts
│  │  ├─ OcclusionFade.ts
│  │  └─ VisualEffects.ts
│  ├─ gameplay/
│  │  ├─ PlayerController.ts
│  │  ├─ NavGraph.ts
│  │  ├─ Pathfinding.ts
│  │  ├─ InteractionSystem.ts
│  │  ├─ EchoSystem.ts
│  │  ├─ PuzzleSystem.ts
│  │  ├─ MovingPlatform.ts
│  │  └─ StoryDirector.ts
│  ├─ input/
│  │  ├─ InputManager.ts
│  │  └─ PointerMovement.ts
│  ├─ audio/
│  │  └─ AudioManager.ts
│  ├─ persistence/
│  │  ├─ SaveManager.ts
│  │  └─ SaveValidation.ts
│  ├─ ui/
│  │  ├─ HUD.ts
│  │  ├─ Menus.ts
│  │  ├─ Subtitles.ts
│  │  ├─ Settings.ts
│  │  └─ MobileControls.ts
│  ├─ content/
│  │  ├─ levelSchema.ts
│  │  └─ locales/tr.json
│  └─ utils/
│     ├─ math.ts
│     └─ logger.ts
├─ scripts/
│  ├─ check-assets.mjs
│  └─ report-sizes.mjs
├─ tests/
│  ├─ echo.test.ts
│  ├─ save.test.ts
│  ├─ nav.test.ts
│  ├─ puzzle.test.ts
│  └─ e2e/
│     └─ l01.spec.ts
└─ dist/                         # üretim dosyası, git'e eklenmez
```

`source-assets/` gerçek projede büyük `.blend` dosyaları üretebilir: **bunlar oyun sitesine yayınlanmaz**. Gerekirse Git LFS veya ayrı sanat deposuna alınır. `public` içindeki dosyalar Vite ile statik olarak kopyalanır; burada *gereksiz* dosya bırakmak üretim çıktısını şişirebilir.

## 8.2 Sorumluluk tablosu

| Modül | Yapar | Yapmaz |
|---|---|---|
| `App` | Menüler, oyun başlatma, ekran değiştirme | Bulmaca mantığı içermez |
| `GameLoop` | Tek `requestAnimationFrame` döngüsü, deltaTime, pause | Rastgele timer dağıtmaz |
| `Renderer` | WebGL, resize, kalite ve render | Oyuncu checkpoint'i bilmez |
| `LevelManager` | Dosya yükleme, bölüm geçişi, unload | Hikâye metni kodlamaz |
| `NavGraph` | Walkable noktalar, yükseklik/bağlantı, A* | 3D fizik simülasyonu yapmaz |
| `PlayerController` | Girdi isteği → güvenli yürüyüş/konum/rotasyon | UI butonlarını çizmez |
| `InteractionSystem` | Yakınlık, hit testing, odak, etkileşim | Kaset süresi tutmaz |
| `EchoSystem` | Yankı durum makinesi, süre, görünürlük, nav link | Kaydı tarayıcıya yazmaz |
| `PuzzleSystem` | İzinli olaylar, bayraklar, latch | Keyfi JS kodu çalıştırmaz |
| `StoryDirector` | Hikâye sıra, altyazı, seçim | Oyun dünyasını doğrudan yeniden çizmez |
| `AudioManager` | Ses kanalları, mute, ses açma, ducking | Sese bağlı tek başına puzzle kararı vermez |
| `SaveManager` | JSON şema, migration, safe commit | 3D Mesh serialize etmez |

## 8.3 Tek oyun döngüsü

```ts
const FIXED_STEP = 1 / 60;
const MAX_FRAME = 0.1;
let accumulator = 0;
let last = performance.now();
let paused = false;

function frame(now: number) {
  requestAnimationFrame(frame);
  const dt = Math.min(MAX_FRAME, (now - last) / 1000);
  last = now;
  if (!paused) {
    accumulator += dt;
    while (accumulator >= FIXED_STEP) {
      // input.snapshot();
      // echoSystem.fixedUpdate(FIXED_STEP);
      // puzzleSystem.fixedUpdate(FIXED_STEP);
      // playerController.fixedUpdate(FIXED_STEP);
      accumulator -= FIXED_STEP;
    }
    // animation.update(dt);
    // renderer.render(scene, camera);
  }
}
requestAnimationFrame(frame);
```

Bu kod **mimari iskelet örneği**; tek başına çalışan oyun değildir. Başlangıç sahnesi/döngüsü Aşama 0'da birleştirilir. Oyunun duraklatıldığında render durması menünün DOM olarak görünmesini engellemez. Görünürlük geri geldiğinde `last = performance.now()` atanmalı; böylece delta birikimi yankıyı bir anda bitirmez.

## 8.4 Olay akışı (örnek)

```text
Pointer/Keyboard → InputManager
  → PlayerController: moveTo(navTarget)
  → InteractionSystem: interact(anchorId)
  → PuzzleSystem: check tape + flags
  → EchoSystem: activate(anchorId)
      → sahne objeleri görsel olarak çıkar
      → NavGraph ilgili linkleri açar
      → AudioManager yankı sesini çalar
      → HUD sayaç/ikon günceller
  → Player reaches trigger
      → PuzzleSystem setFlag
      → SaveManager safe checkpoint
      → StoryDirector altyazı/kayıt
```

**Kritik ayrım:** UI butonu bulmaca bayrağı yazmaz; gameplay servisine eylem talebi gönderir. Kaydedilecek “gerçek durum” renderer'daki renk değil `flags + echo states + checkpoint` gibi mantıksal modeldir.

## 8.5 Hareket / navigation tasarımı (fizik motoru olmadan)

**V1 tercihi:** Çok küçük bölümler için **katmanlı kare grid + A\***. Görsel modeller özgür olabilir; üzerinde yürünebilir düğümler grid üzerinden tanımlanır.

```ts
interface NavNode {
  id: string;                  // örn. "floor0:4:7"
  x: number;
  z: number;
  worldY: number;
  floorIndex: number;
  walkable: boolean;
}
interface NavLink {
  id: string;
  from: string;
  to: string;
  enabled: boolean;
  requiredEchoGroup?: string;
  kind: 'floor' | 'stairs' | 'door' | 'platform';
}
```

- Yer karosu üzerinde tıklandığında raycast sonucu XZ ve katman tespit edilir.
- Grid hücreleri yatay/dikey komşudur; diyagonal adım sadece köşe kesme engelleniyorsa açılır. Başlangıçta 4 yön daha basit.
- İki kat ancak explicit `stairs`/`platform` NavLink ile bağlanır. Oyuncu duvarı/boşluğu raycast ile geçemez.
- WASD için kısa hareket isteğini grafikte yürünebilir bölgeye projekte et; click-to-move için A* tüm yol hesaplar.
- Her karede A* hesaplama; yol yalnız hedef veya dinamik nav değişince yeniden hesaplanır.
- Yürünen nokta seviye y değerine oturtulur; zıplama ve fiziksel sürüklenme yok.
- Geçici yankı sönünce nav link kapanır, fakat oyuncu link/zemin üzerindeyse SAFE_HOLD korunur.
- Hareketli platform kendi lokal gezinme bağlamına sahiptir; yalnız uç noktada nav bağlantısı açılır.

**Test:** 10×10 zeminde 50 tıklama; farklı katlar; kapalı kapı; yankı aktif/pasif; oyuncu engelin yanından dolaşma; geçici destek üstündeyken süre bitimi. A* bulunamazsa karakter yerinde kalır ve arayüz ipucu verir.

## 8.6 Bölüm verisi doğrulama

Önce TypeScript `interface` tanımları, sonra **runtime validator** ekle. TypeScript derleme zamanında JSON'un doğru olduğunu *garanti etmez*. İlk aşamada elle yazılmış birkaç şema denetimi veya hafif bir doğrulama kütüphanesi kullanılabilir. En azından:

- `schemaVersion` destekleniyor mu?
- Her `objectId`, `echoGroupId`, `navLinkId`, `checkpointId` gerçek mi?
- `activeSeconds` 2–60 aralığında mı?
- Aynı ID iki kere geçiyor mu?
- Başlangıç ve bitiş checkpoint'i yürünebilir mi?
- Flag bağımlılıkları tutarlı mı?
- Çözülemeyen kritik nesne referansı derleme/test aşamasında **hata** vermeli; sessizce atlanmamalı.

---
# 9. Görsel sanat yönetimi ve 3D model üretimi

## 9.1 Görsel hedef

**“Eski kıyı kasabasının oyuncak maketi, gece lambası, kasetçaların turkuaz yankısı.”** Fotoğraf gerçekçiliği değil, silüet ve duygu. Küçük dosya + düşük donanım gereksinimi bunun doğal sonucu olmalı; pahalı efekti optimize etmeye çalışmak yerine baştan üretmemeli.

**Sanat ilkeleri:**

- Bir bölüm tek bakışta tanınan mimari silüete sahip (postane, fırın, durak, kule, iskele, arşiv).
- Sahnenin %70–80'i sabit ve tekrar kullanılan modüler yapılar; özel detay yalnız bulmacayı anlatan eşyalarda.
- Katı gerçekçi doku kullanma; çoğu nesne için **vertex color veya birkaç ortak düz renk materyal** yeterli.
- Koyu deniz mavisi / paslı turuncu / kırık krem ana palet; **yankı turkuazı** sadece etkileşimli geçmiş objelerinde.
- Ekranda yankı renginin görüldüğü yer oyuncuya oynanış sözü verir. Dekoratif parıldama, gerçek bulmaca işaretiyle karışmamalı.
- Kalın okunabilir silüet, hafif kenar aşınması ve basit yüzeyler. Çok ufak vida/pencere kolu gibi detaylar ancak yakın planda görünürse yapılır.

## 9.2 Palette ve tasarım token'ları (öneri)

| Rol | HEX | Kullanım |
|---|---|---|
| Gece deniz mavisi | `#1D2C3A` | Arka plan / uzak dünya |
| Kasaba taş grisi | `#75848C` | Zemin, tuğla maketi |
| Eski kâğıt | `#D9C9AA` | Duvar açık ton, kartlar |
| Bakır/pas | `#B87552` | Çatı, metal, sıcak detay |
| Hatıra turkuazı | `#58D7C4` | EchoAnchor, silinmiş nesne |
| Fener amberi | `#E5B363` | Hedef / sıcak ışık |
| Koyu metin | `#17222B` | UI metin ve ikon konturu |
| UI açık metin | `#F4F3EA` | Altyazı / HUD |

Renkleri ekran görüntüsünde ve renk görme farklılıklarında test et. Durum bilgisi yalnız renge bağlı olmamalı: ankraj şekli, ikon ve hareket de değişir.

## 9.3 Blender modelleme kuralları [KESİN]

1. **Çalışma ölçüsü:** 1 Blender unit = 1 m; `Y up` olan Three.js'e export/loader dönüşümünü tek örnek asset ile doğrula. Sahneye özgü rotasyonu rastgele kodla düzeltme.
2. **Low-poly hedef:** Küçük parçaların geometrisi gerçek formu taşısın; görünmeyen arka yüz ve iç yüzeyi üretme.
3. **Yüzeyler:** Düz renk malzemeler; çok fazla ayrı material slot oluşturma (draw call artar).
4. **Doku:** İlk aşamada **dokusu olmayan** düz renk stil. Gerektiğinde tek küçük ortak atlas kullan. 4K doku, 8 ayrı PBR haritası, büyük normal map yok.
5. **Pivot:** Kapı menteşesi kapının yanına, kol/saat ibresi dönüş eksenine, platform pivotu merkezine. Sonradan kodda telafi etme.
6. **İsimlendirme:** Godot veya Unity'ye özgü isim yok. `ENV_`, `PROP_`, `ECHO_`, `COL_`, `NAV_`, `CHAR_` gibi grup prefiksi ve level ID kullan.
7. **Çarpışma:** Görsel mesh'lerden otomatik karmaşık `trimesh` collider türetme. Basit kutu/kapı/zemin blok verileri ayrıdır.
8. **Modeli kontrol et:** Normaller, uygulanmış transform, pivot, gereksiz animasyon, boş malzeme ve viewport'ta görünmeyen objeleri temizle.
9. **Kaynak vs yayın:** `.blend` kaynakları yayın paketine girmez; sadece optimize `.glb` ve gerekli medya `public/` altında.
10. **Lisans:** Oyun içine eklenen her dış asset'in ticari kullanıma ve değiştirmeye izin veren lisansını `docs/asset-licenses.md` dosyasında tut; marka, telifli oyun modeli/sesini kopyalama.

## 9.4 İlk model seti — gereken her şey

**Önce yalnız aşağıdakileri yap:**

| Model | Temel yapım tekniği | Yaklaşık karmaşıklık [HEDEF] |
|---|---|---|
| Ada karakteri | 8–12 basit parçadan gövde/kafa/bacak/kol/çanta | 1–3 bin üçgen |
| 1×1 ve 2×2 zemin modülü | Bevel'li küp/prizma | 12–150 üçgen |
| Kısa merdiven modülü | 3–5 basamaklı basit prizma | 100–300 üçgen |
| Duvar pencere modülü | Tek panel, oyuk veya iç içe katmanlar | 50–300 üçgen |
| Kapı / çerçeve | 2–3 kutu | 50–200 üçgen |
| Çatı | Dörtgen yüzey veya 2 prizma | 20–150 üçgen |
| Posta kutusu | Kutular + ufak silüet kapağı | 100–400 üçgen |
| Kasetçalar | Ana gövde, 2 makara, 2 düğme | 300–800 üçgen |
| Yankı işaretleyici | Şeffaf daire + 2 halka / çizgi | 30–150 üçgen |
| Çevre dekoru | 4–8 tekrar kullanılan varlık (lamba, tabela, varil, korkuluk...) | Her biri 50–500 üçgen |

Bu sayılar sert engine limitleri değil, iyi bir başlangıç kontrol listesidir. Bir dioramayı 100 binlerce üçgenle kurmaya ihtiyaç yok.

## 9.5 Ada'nın düşük maliyetli animasyonu

**İlk sürümde iskelet rig zorunlu değil.** Blender'da modelin parçalarını ayrı node olarak dışa aktar veya Three.js içinde hiyerarşi kur:

```text
AdaRoot
 ├─ Body
 ├─ Head
 ├─ LeftArm
 ├─ RightArm (kasetçalar elde)
 ├─ LeftLeg
 ├─ RightLeg
 └─ Bag
```

- `idle`: Gövde 0.02–0.04 birim yavaş hareket / kafada hafif yön değişimi.
- `walk`: Bacakların zıt yönde sinüs dönüşü, hafif gövde sekmesi; karakter yüzünün hareket yönüne dönmesi.
- `interact`: Sağ kol ve kasetçalar biraz öne gelir, 0.3 saniye.
- `record`: Omuzlar hafif durur, kaset makarası 1–2 saniye döner.
- `ending`: Ayrı uzun animasyon gerekmez; gövde yönü ve kameranın yavaş yaklaşması yeterli.

**Kalite ilkesi:** Karakterin eli mükemmel IK kullanmasa da nesneyle etkileşim net anlaşılsın. İskelet+animation mixer yalnız görsel test buna ihtiyaç gösterirse eklensin.

## 9.6 Animasyon ve yankı VFX (düşük maliyet)

**Yankı materyalizasyonu:** Nesne ilk başta görünmez; renk tonu soğuk turkuazdan normal tona geçer, opaklık artar; aynı anda az sayıda küçük çizgi parçacığı görünür. Tam ekran bloom, volumetric fog, pahalı postprocess yok.

**Pratik seçenekler:**

- Nesne mesh'inin `scale.y` değerini çok hafif (0.96→1.0) oynat + saydamlığı 0→1 (0.4 sn).
- Silinmiş obje yerinde **çok ince, düşük opaklıkta** sabit bir iz önceden göster; oyuncu tıklanabilir olduğunu anlar.
- Yankı simgeleri 2D sprite veya iki basit halka mesh ile yapılır.
- Toz/rüzgâr için az sayıda düzlem ve yavaş UV/pozisyon hareketi; partikül motoru gereksiz.
- Sahte yumuşak zemin gölgesi: Ada altında transparan 2D elips; gerçek zamanlı gölgeler ilk prototipte kapalı.

**Saydam nesne notu:** Çok sayıda üst üste transparan mesh mobil GPU'da pahalı olabilir ve sıralama artefaktı üretir. Sadece kritik yankı objelerinde kısa süreli kullan; gerekirse “silinmiş iz” için ayrı çok basit emissive mesh tut.

## 9.7 Işıklandırma ve kamera

| Parametre | İlk öneri [VARSAYIM] | Sebep |
|---|---|---|
| Kamera | `OrthographicCamera` | Diorama / izometrik kimlik, az perspektif bozulması |
| Kamera yönü | 45° azimut / 35° yükseklik | Ekranda düzlem ve yükseklik okunabilirliği |
| Ortam | Bir `HemisphereLight` | Geniş ve ucuz genel aydınlatma |
| Ana ışık | Bir düşük maliyetli `DirectionalLight` | Yüzey formu ve sıcak-soğuk ayrımı |
| Dinamik gölge | Başlangıçta `false` | GPU maliyetini azaltmak |
| Materyal | `MeshLambertMaterial` veya `MeshBasicMaterial` | Düz renk stili; ağır PBR gerekmez |
| Arka plan | Düz renk / hafif scene fog | Uzak geometri maliyetini düşürür |
| Postprocess | Yok | Başlangıç yükü ve GPU süresini korur |

**Occlusion:** Kamera ile Ada arasına giren ön duvar parçaları `OcclusionFade` ile 0.15–0.25 sn içinde saydamlaşır veya gizlenir; bu kontrol **yalnız belirlenmiş duvar mesh'lerinde** çalışır. Sürekli bütün sahneyi raycast etmek yerine oyuncu-kamera arasında birkaç tanımlı engel kontrolü yeterli.

**Kamera etkileşimi:** Ortografik `orthoHeight` seçilen ekranın en dar boyutuna göre hesaplanır. Mobil ekran dar olduğunda kamera hedefi hafif kaydırılır ve ortografik yükseklik artar; tüm bölüm ve UI birlikte görünmüyorsa oyuncunun hedefi kaybolmadan kadraj güncellenir.

## 9.8 `.glb` ve optimizasyon hattı

```text
Blender .blend (kaynak / repoda veya LFS)
  → modüler model ve isim kontrolü
  → glTF 2.0 binary .glb export
  → dosya boyutu / malzeme / mesh sayısını ölç
  → gerekiyorsa glTF Transform ile optimize et
  → Three.js GLTFLoader ile test et
  → public/content/l0x/geometry.glb
  → LevelManager yalnız bölüm açıldığında yükler
```

**Başlangıç stratejisi:** Dokuların olmadığı, az mesh'li prototipte Draco, Meshopt ve KTX2 decoder'larının tümünü sırf moda diye ekleme. Decoder kendisi de indirme ve decode maliyeti yaratır. Ölçüm sonucu geometri transferi büyürse `Meshopt`, yüksek çözünürlüklü dokular kaçınılmazsa `KTX2` değerlendir. Üretim GLB içine bu uzantılardan biri girdiyse Three.js `GLTFLoader` için ilgili decoder da **zorunludur**. [T2, T7]

**Resmî CLI örnekleri** (sürümüne göre yardım çıktısını kontrol et):

```bash
# Bir modelin yapısını / boyutunu incele
npx @gltf-transform/cli inspect source-assets/export/l01.glb

# Doku olan bir asset için WebP ile genel optimizasyon örneği
npx @gltf-transform/cli optimize source-assets/export/l01.glb public/content/l01/geometry.glb --texture-compress webp

# Geometri ağırsa meshopt ayrı deney; ardından loader decoder'ını bağla
npx @gltf-transform/cli meshopt source-assets/export/l01.glb public/content/l01/geometry-meshopt.glb --level medium
```

**Kural:** Komutun çıkışı dosyayı küçülttü diye işi bitmiş sayma; tarayıcıda görünüm, materyal, yükleme süresi, bellek ve decode performansını karşılaştır. Sonuç daha kötüyse sıkıştırmayı geri al.

## 9.9 Sahneye özel 3D üretim listesi

| Bölüm | Ayırt edici özel modeller | Tekrar kullanılan parçalar |
|---|---|---|
| L01 Postane | Kutu, tabela, kayıt tezgâhı | Zemin, duvar, kapı, basamak, lamba |
| L02 Fırın | Fırın gövdesi, ekmek rafı | Zemin, kapı, çatı, sandalye, lamba |
| L03 Durak | Tram platformu, ray, bilet gişesi | Zemin, korkuluk, lamba, tabela |
| L04 Kule | Büyük saat, ibre, dişli, mandal | Duvar, merdiven, kapı, platform |
| L05 İstasyon | İskele, küçük vinç, fener | Ray, korkuluk, zemin, lamba |
| L06 Arşiv | 3 kaide, merkez konsol, kaset rafı | Önceki altı bölümden küçük silüet parçaları |

**L06 ekonomik çözüm:** Tüm kasabayı sıfırdan modellemek yerine eski bölüm maketlerini %20–30 boyuta indirip arşiv masasında kompozisyon olarak yeniden kullan.

---

# 10. Dosya boyutu, FPS ve bellek için teknik bütçe

## 10.1 Hedef tabloları (kesin garanti değil)

| Metrik | Masaüstü [HEDEF] | Orta mobil [HEDEF] | Not |
|---|---:|---:|---|
| FPS | 60 | 30 | Gerçek cihazda medyan ve kötü anlar ölçülür |
| Render draw call / kare | ≤ 100, tercihen 60 | ≤ 60, tercihen 40 | `renderer.info.render.calls` |
| Görünen üçgen / kare | ≤ 100 bin | ≤ 50 bin | Stilize küçük sahne için makul hedef |
| Aktif büyük texture | ≤ 8 | ≤ 4 | Varsayılan dokusuz yaklaşım |
| Texture çözünürlüğü | Genelde 512 px, en çok 1024 px | Genelde 256–512 px | Ortak atlas istisnası ölçülür |
| Etkin gerçek zamanlı gölge | 0 | 0 | Sahte blob gölge |
| Dahili çözünürlük ölçeği | DPR tavanı 1.5 | DPR tavanı 1.25 | FPS düşerse 1.0'a inebilir |
| 3D bölüm varlıklarının transferi | ≤ 3 MB | ≤ 3 MB | Bölüm başına sıkıştırılmış veri |
| İlk oynanabilir ekran transferi | ≤ 3 MB | ≤ 3 MB | Ağ/HTTP sıkıştırmasına bağlı |
| Tam v1 toplam indirilebilir içerik | ≤ 25 MB | ≤ 25 MB | Tüm bölümler toplam, gerektiğinde iner |

**Önemli ayrım:** Diskteki `.glb` boyutu, ağda sıkıştırılmış transfer boyutu ve GPU belleğinde açılmış doku boyutu aynı değildir. 400 KB sıkıştırılmış bir texture, GPU'da çok daha fazla bellek kullanabilir. Bütçelerin her biri ayrıca ölçülür. 3 MB hedefi ilk ekranın *oynanabilir hale gelene kadarki* ağ transferine ilişkindir; tüm v1'in indirilmesini istemiyoruz.

## 10.2 Bir dioramanın içerik bütçesi [HEDEF]

- 1 ana sahne GLB: kaba hedef **150 KB–1.5 MB**; sahne karmaşıklığına bağlı.
- 1 Ada ortak modeli: kaba hedef **50–300 KB**.
- 1 bölüm sesleri: 0.3–1.5 MB sıkıştırılmış; konuşma/müzik varsa büyüyebilir.
- Birkaç ikon/altyazı/font: mümkünse sistem fontu; ekstra font dosyası zorunlu değil.
- Kalan ağ bütçesi JS runtime ve UI'ya ayrılır; `dist/` build raporu olmadan rakamlar garanti edilmez.

## 10.3 Önce yapılacak optimizasyonlar (öncelik sırası)

1. **Hiç üretme:** Uzak dekoru modellemek yerine basit silüet / düşük poligon.
2. **Az dosya değil az iş:** Aynı materyal kullanan ve hareket etmeyen parçaları uygun yerlerde birleştir; fazla draw call azalt.
3. **Tekrarlı nesneleri örnekle:** 15+ benzer lamba/taş varsa `InstancedMesh` değerlendir; bu yaklaşım draw call azaltır. [T8]
4. **Seçici yükleme:** L02 dosyasını L01 oynanırken indirmek zorunda değiliz. İleriki bölüm kısa ön-yükleme sadece kullanıcı beklemeyecekse ve bağlantı uygunsa.
5. **Doku ve ses sıkıştırması:** WebP/KTX2 ihtiyaca göre; kısa SFX OGG/AAC alternatifleri ile tarayıcı desteği doğrulanır. Dosya büyümesinin çoğu zaman kaynağı seslerdir.
6. **DPR düşürme:** Mobilde ekrandaki CSS çözünürlüğü aynı kalıp GPU iç çözünürlüğü azalabilir.
7. **Işık/gölge:** Dinamik gölge kapalı; “güzel görünsün” diye her objeye yeni ışık eklenmez.
8. **Scene disposal:** Bölüm çıkınca kaynak temizle; eski üç bölümün dokuları bellekte kalmasın.
9. **DOM güncellemesi:** Her karede bütün HUD'ı yeniden render etme; yalnız değer değişince güncelle.
10. **Ölçüm:** Chrome Performance, Network, Memory, Three.js renderer istatistikleri; tahminle optimizasyon yapma.

## 10.4 Kalite ayarları

**Automatic (önerilen):** İlk 5–10 saniyede ortalama ve en kötü kare sürelerini izle; 30 FPS altına belirgin iniyorsa “Düşük”e geçmek için isteğe bağlı öneri göster. FPS'yi gizlice agresif değiştirmek oyuncuyu şaşırtabilir.

| Ayar | Yüksek | Düşük |
|---|---|---|
| DPR | 1.5 | 1.0 |
| Yankı parçacığı | 12–20 | 0–5 |
| Dekor uzaklık | Tümü | Uzak kozmetik nesneler gizli |
| Ambient animasyon | Açık | Azaltılmış |
| UI/metin | Aynı okunurluk | **Aynı okunurluk** |
| Bulmaca/çarpışma | Aynı | **Aynı** |

Görsel ayarı bulmaca işaretleyicisini, yankı görünürlüğünü, hikâye kaydını, nav yolunu veya oyuncunun nereye basabildiğini değiştiremez.

## 10.5 Ölçüm tablosu şablonu

| Tarih / build | Cihaz + tarayıcı | Ağ profili | İlk oynanış (sn) | Ortalama FPS | p95 frame ms | Draw calls | Transfer MB | Sorun |
|---|---|---|---:|---:|---:|---:|---:|---|
| _ölçülmedi_ | _cihaz_ | _Wi-Fi/4G_ | — | — | — | — | — | — |

**p95 frame ms** = karelerin %95'inin bunun altında tamamlandığı süre. Masaüstü 60 FPS için yaklaşık 16.7 ms/kare, mobil 30 FPS için yaklaşık 33.3 ms/kare zaman bütçesidir; yükleme ve kısa geçişlerde aşılabilir, sürekli olmamalıdır.

---

# 11. Ses tasarımı, hikâye kayıtları ve web ses kuralları

## 11.1 Ses deneyimi

Üç ses katmanı yeterli:

1. **Ambiyans:** Hafif sahil rüzgârı, uzak martı, mekanik uğultu, yağmur sonrası damla. Her bölümde bir döngü; düşük ses düzeyi.
2. **Oynanış SFX:** Kaset takma, düğme, yankı oluşumu, yanlış seçim, kapı/latch, bölüm sonu. Kısa, temiz, tanınır.
3. **Hikâye kayıtları:** Efe ve Nermin için kısa, altyazılı kasetler. Seslendirme bütçesi yoksa tipografi + mekanik ses dahi çalışmalı.

**Tam zamanlı uzun müzik parçası şart değil.** Gerekirse 20–40 sn'lik kısa, telif hakkı temiz özgün atmosfer döngüleri; şarkı yükü dosya boyutunu büyütmemeli. Audio ve görüntü senkronizasyonu kritik bulmacalarda görsel sinyal de eşlik eder.

## 11.2 Web autoplay ve ses başlatma

- Site açıldığında otomatik arka plan müziği deneme.
- İlk `Başla / Devam` tıklamasında `AudioContext.resume()` çağır; ses o noktadan sonra kullanılabilir olmalı. [T3]
- Tarayıcı oynatmayı engellerse “Sesi açmak için dokun” düğmesi göster; oyun sessiz de oynanabilir.
- Sekme gizlendiğinde oyun ve ses pause; geri döndüğünde ses otomatik patlamasın, gerekirse oyuncunun `Devam` tıklamasını bekle.
- `master/music/ambience/sfx/voice` kanalları ayrı seviye ayarıyla sunulsun; `mute` tercihi kaydedilsin.

## 11.3 Ses dosyası üretim kuralları

| Tür | Başlangıç önerisi | Neden |
|---|---|---|
| Kısa SFX | Mono, 44.1/48 kHz kaynak; dağıtımda test edilmiş `.ogg` veya `.mp3` | Hafif, net |
| Ortam döngüsü | Mono veya gerektiğinde stereo; 64–96 kbps civarında dene | Arka planda yüksek bitrate gereksiz |
| Anlatım / kayıt | Mono, konuşmaya uygun sıkıştırma; yazılı transkript | Web yükünü azaltır, erişilebilir |
| Ses boşluğu | SFX başında/sonunda uzun sessizlik yok | Tepki hissi |

Bu örnek format/bitrate'ler kalite testine açıktır; Safari/Firefox/Chrome destek matrisi kontrol edilir. Tek codec'e güvenmek yerine dönüştürücü çıktılarının hedef tarayıcılarda oynadığını otomatik ve gerçek cihazla sınamak gerek.

## 11.4 Ses varlık listesi (ilk prototip)

- `sfx_ui_click`, `sfx_tape_insert`, `sfx_tape_play`, `sfx_echo_start`, `sfx_echo_end`, `sfx_invalid`, `sfx_latch`, `sfx_checkpoint`, `amb_l01`, `voice_efe_l01` (opsiyonel).
- Her sesin yazılı alternatif/altyazı ihtiyaç durumu `audio-manifest.json` içine not edilir.
- Özgün üretim yoksa çok kısa placeholder tonları/prosedürel Web Audio sinyalleri kullan. Son varlık eklenince lisans kaydı yapılır.

---

# 12. UI/UX, erişilebilirlik ve mobil tasarım

## 12.1 Oyun HUD'ı

```text
┌─────────────────────────────────────────────────────────────┐
│ [Geri/menü]     BÖLÜM: ÇALMAYAN ZİL           [Ayar] [İpucu]│
│                                                             │
│               3D DİORAMA + ADA + BULMACA                    │
│                                                             │
│         [E - Kaseti çal] (yakındaki ankraj)                 │
│                                                             │
│ [Kasetler: Zil  Fırın  Tram]  [▶ Yankı]     [Hikâye kayıtları]│
│                                                             │
│       Altyazı: “Ada, beni hatırla.”                         │
└─────────────────────────────────────────────────────────────┘
```

**Mobil düzen:** Üst bar 2 küçük ama dokunulabilir ikon; alt solda en fazla 2 kaset simgesi, alt sağda 48×48 CSS px veya daha büyük `Yankı/Etkinleştir`; etkileşim nesneye dokunarak gerçekleşir. DOM arayüzü ekrana sığmalı; güvenli alan (`env(safe-area-inset-*)`) dikkate alınmalı. Ekran dar olduğunda uzayan metin altyazı kutusunda sarılır.

## 12.2 UI ilkeleri

- İlgili buton aktifken ayrı şekil ve yazı ile anlaşılır; yalnız turkuaz renge dayanmaz.
- Gerçek etkileşimler HTML `<button>` ile; Tab/Enter/Space klavye desteği ve odak halkası korunur.
- Altyazı okunabilir kontrastta, arka planı kısmen koyu panel içinde. Boyut seçeneği: normal/büyük.
- Oyun ipuçları 6–10 kelimeyle başlayıp gerektiğinde açıklanır; uzun duvar metni yok.
- Son kayıt/checkpoint oluşunca kısa “Kaydedildi” gösterilir; veri gerçekten kaydedilmediyse başarı yazma.
- Başlat/Duraklat ses yönetimi açık; kayıt saklama ve veri temizleme seçeneği menüde.
- Oyunda fare tıklaması için hedefler en az rahat tıklanabilir ölçekte; görünmez mikroskopik collider yok.

## 12.3 Erişilebilirlik [KESİN]

- Türkçe altyazılar her zaman açık veya varsayılan açık; ses kapalıyken bütün kritik bilgi erişilir.
- `prefers-reduced-motion` varsa sarsıntı, kamera zoom ve partikül azalır; ayarlardan manuel seçim de mümkün.
- Yanıp sönen hızlı ışık / strobe yok. Bütün kritik geçmiş objeleri yanıp sönme olmadan seçilebilir.
- Sesli doğru/yanlış sinyali aynı anda ikon/metin değişimiyle desteklenir.
- Bulmacalar yalnız renk kodlu değildir; simge/etiket de içerir.
- Klavyede hareket + etkileşim + menü tam çalışır; fare zorunluluğu yok.
- Hareket refleksi gereken L03, fiziksel hassasiyetten ziyade konum/timing mantığı olarak tasarlanır; isteğe bağlı daha yavaş platform ayarı ileride eklenebilir.
- Bütün temel menüler ekran okuyucular için semantik HTML kullanır; 3D kanvas içindeki tüm nesnelere ekran okuyucu desteği sağlamak karmaşık olduğundan, etkileşimli nesne listesi/isimleri ve klavye menüsü için ayrı erişilebilir DOM karşılığı planlanmalıdır.

## 12.4 Dokunmatik ve kamera sorunları

- 3D tuvalin üzerinde oyun alanı için `touch-action: none` kullan; yalnız UI butonlarında normal dokunma davranışı korunsun. Pointer event'leriyle `pointerdown/move/up/cancel` doğru yönetilir. [T9]
- Mobilde oyun alanında iki parmak zoom yok; bölümler sabit kamera ile tasarlandığı için pinch/rotate gereksiz.
- Tıklama ile gitte hedef işareti göster; oyuncu komutunun alındığı belli olsun.
- Çok küçük ekranda önemli etkileşimler ekran kenarında kalırsa UI yerleşimini düzelt; her cihazda aynı kadraja zorlama.
- Mobil test: 360×740 civarı dar ekran, tablet 768×1024, masaüstü 1366×768 ve geniş ekran. Bu çözünürlükler örnek test profilleridir, tek destek kümesi değildir.

---

# 13. Kayıt, sürümleme, bölüm checkpoint'leri ve kullanıcı verisi

## 13.1 Kayıt formatı

```ts
interface SaveDataV1 {
  schemaVersion: 1;
  slotId: 'main';
  currentLevelId: string;
  lastCheckpointId: string;
  unlockedLevelIds: string[];
  acquiredTapeIds: TapeId[];
  flags: Record<string, boolean>;
  completedLevelIds: string[];
  seenStoryKeys: string[];
  ending?: 'reveal' | 'seal';
  settings: {
    masterVolume: number;     // 0..1
    musicVolume: number;
    sfxVolume: number;
    subtitleSize: 'normal' | 'large';
    reducedMotion: boolean;
    graphics: 'auto' | 'high' | 'low';
  };
  updatedAt: string;          // ISO 8601
}
```

**Not:** `currentLevelId + lastCheckpointId`, sayısız kayan nokta koordinatı kaydetmekten daha güvenlidir. Oyuncu ne zaman isterse bölümün belirlenmiş checkpoint'inden devam eder; ara sahnede kaydedilmiş bir kameranın anlamsız konumuna dönmez. `flags` yalnız oyunun whitelist ettiği tanımlı anahtarları kabul eder.

## 13.2 Kaydetme tetikleri

- Yeni kaset edinimi.
- Kalıcı bir latch/kapı açıldığında.
- Sabit checkpoint'e ilk ulaşıldığında.
- Bölüm başarıyla bittiğinde.
- Oyuncu menüye dönmeyi seçtiğinde **güvenli** durum üzerinde.
- Final seçiminden önce ve sonra.

**Anlık yankı zaman sayacı kaydedilmez.** Reload sonrası oyuncu en son **sabit checkpoint** zemininden, geçici echo pasif olarak geri döner; kapalı bulmacalar doğru bayraklarla yeniden kurulur. Hareketli platformun ortasında oyun yüklenmez.

## 13.3 Güvenli yerel kayıt akışı

1. Durumun JSON serileştirilebilir, küçük ve şemaya uygun olduğunu doğrula.
2. `localStorage.setItem('sonKayit_save_v1_pending', payload)` ile geçici kopya yaz.
3. Okuyup parse ederek doğrula; başarılıysa `sonKayit_save_v1` olarak kaydet.
4. Hata/`QuotaExceededError`/storage disabled durumunu yakala; görünür uyarı göster, oyunun geri kalanı RAM'de çalışabilsin.
5. Bozuk kayıtta son geçerli kopyayı dene; hiç yoksa “Yeni oyun / yedek içe aktar” sun.
6. İleride şema değişirse `migrateV1ToV2` gibi açık sürüm geçişi yaz; sessiz veri silme yok.

**Sınır:** `localStorage` işlemleri senkron olduğu için yalnız birkaç KB'lık durum kaydı sakla; ses/model/doku veya tüm sahne JSON'u asla burada tutulmaz. Browser verisi temizlenince kayıt kaybolabilir. [T5]

## 13.4 Manuel kayıt dışa/içe aktarımı

- **Dışa aktar:** İndirilebilir `son-kayit-save-YYYY-MM-DD.json`, kullanıcı tıklamasıyla oluşturulur.
- **İçe aktar:** `input[type=file]` ile seçilen JSON, şema ve boyut sınırı (ör. 100 KB) denetiminden geçer; oynanış sırasında HTML/JS olarak değerlendirilmez.
- **Veriyi sil:** Geri alınamaz olduğunu açıklayan onay diyaloğu sonrası yalnız bu oyunun kayıt anahtarlarını temizle.
- **Bulut kayıt:** v1'de yok. Farklı cihazlarda otomatik eşitleme vaat edilmez.

---

# 14. Güvenlik, gizlilik ve telif

- Oyun çalışması için kullanıcı hesabı veya kişisel bilgi toplanmaz.
- Kullanıcıdan gelen `save JSON` ve URL parametreleri runtime validation olmadan işlenmez.
- Yerel metinler `textContent` ile DOM'a eklenir; altyazı ve kayıtlarda ham `innerHTML` / kod çalıştırma yok.
- Dış CDN'den kontrolsüz üçüncü taraf script almak yerine bağımlılıkları kilitle ve Vite build içine al.
- Geliştirme sırasında `npm audit`/bağımlılık güvenliği kontrolü yap, ama kör güncelleme ile build bozma.
- Telemetri/analytics daha sonra eklenirse aydınlatma/gizlilik metni ve gerekli izin süreci ayrıca ele alınır. v1'de bunlar yok.
- Bağımsız tasarlanmış modeller, sesler, fontlar ve isimler kullan. “SON KAYIT: 04.17” çalışma adıdır; yayımlamadan önce marka/isim benzerliği araştırılır.
- Kaydedilen verinin cihaz dışına çıkmayacağını söylemek için platformdaki üçüncü taraf hizmetleri de gözden geçir. Oyun kendi backend'ini kullanmayacak; hosting altyapısının olağan erişim günlükleri ayrı konudur.

---
# 15. Web yayını, tarayıcı uyumluluğu ve yükleme deneyimi

## 15.1 Destek hedefi

**Hedef cihaz ve tarayıcılar:** Güncel Chrome, Edge, Firefox, Safari masaüstü; güncel Android Chrome ve iOS Safari için temel dokunmatik oynanış. **Asgari teknik koşul: WebGL2 + modern JavaScript modülleri.** Eski tarayıcılar için ikinci bir render motoru yazılmayacak. Her tarayıcı sürümüyle kesin uyumluluk ancak test sonrası açıklanabilir.

**Çalışma biçimi:** HTTPS üzerinden statik site; geliştirmede `http://localhost` Vite sunucusu. Dosyayı çift tıklayarak `file://` üzerinden açmayı destekleme beklentisi yoktur; fetch ve tarayıcı güvenliği nedeniyle geliştirme sunucusu kullanılır.

## 15.2 İlk açılış akışı

1. HTML + CSS + küçük menü görünür; 3D içeriğin yüklenmesi menüyü kilitlemez.
2. JS, WebGL2'yi kontrol eder ve `graphics=auto` tercihini okur.
3. Oyuncu `Başla` dediğinde ilk bölüm için manifest ve asset'ler istenir; izinli kullanıcı etkileşimiyle ses açılır.
4. Yükleme durumu **gerçek indirme ilerlemesi ölçülebiliyorsa** yüzdeyle; ölçülemiyorsa etkinlik göstergesi ve sahne adıyla ifade edilir. Sahte yüzde kullanma.
5. Başarılı yüklemede 3D oyun açılır. Başarısızlıkta sebep ve `Tekrar dene` düğmesi.
6. Bir bölüm bitince L02 için indirme yalnız gerektiğinde yapılır; bağlantı hızlıysa arka planda ön yükleme [GELECEK].

## 15.3 Asset manifest örneği

```json
{
  "levelId": "l01_post_office",
  "version": "2026-11-18-a",
  "assets": [
    { "id": "geometry", "url": "/content/l01/geometry.glb", "kind": "gltf", "required": true },
    { "id": "ambience", "url": "/content/l01/audio/ambience.ogg", "kind": "audio", "required": false },
    { "id": "efeRecord", "url": "/content/l01/audio/efe01.ogg", "kind": "audio", "required": false }
  ]
}
```

`required: false` olan bir ses açılmazsa oyun yine oynanır; altyazı varsa anlatı bozulmaz. Geometri yüklenemezse oyun sahnesinin eksik yarısını göstermek yerine hata ekranı aç. Public asset yollarını `import.meta.env.BASE_URL` ile bağlama göre üret; `base` alt dizine kurulacaksa başında `/` sabiti varsayma. Yani bu JSON kök-yol örneğidir; **GitHub Pages alt yol dağıtımında asset URL üreticisi gerçek base ile birleştirilmelidir.**

## 15.4 Vite yapılandırması ve scriptler

```bash
npm create vite@latest son-kayit-0417 -- --template vanilla-ts
cd son-kayit-0417
npm install
npm install three
npm install -D @types/three vitest @playwright/test
npm run dev
npm run build
npm run preview
```

Şablonun varsayılan `package.json` scriptleri `dev`, `build`, `preview` sunar. `test` ve `typecheck` scriptlerini ayrıca ekle (örnek):

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

**Not:** Bu JSON, mevcut `package.json` dosyasındaki `scripts` alanına eklenir; tüm dosyanın yerine yapıştırılmaz. Bazı Vite şablonlarında build script'i `tsc -b && vite build` olabilir; mevcut TS yapılandırmasına uygun komutu koru. `npx playwright install` tarayıcı testleri için gerektiğinde kurulur. Kod ve sürümler birlikte doğrulanır.

## 15.5 Statik deploy

**V1 öneri:** Cloudflare Pages veya Netlify'da Git bağlı statik dağıtım; GitHub Pages de uygundur.

- Build komutu: `npm ci && npm run build`
- Publish/output klasörü: `dist`
- Base path: alan adının kökündeyse `/`; alt path'deyse örn. `/son-kayit/` ve `vite.config.ts` buna göre ayarlanmalı.
- `index.html` ve `manifest.json` gibi içerik tanımları kısa süreli/no-cache; hash'li JS/CSS/asset dosyaları uygun uzun immutable cache. **Public asset'ler Vite tarafından otomatik hash'lenmeyebilir**, bunun için sürümlü dosya adı veya kontrollü önbellek stratejisi uygula.
- Level URL'leri SPA router olmadan menü içi state ile yönetilebilir; doğrudan deep link gerekiyorsa `#/level/l01` hash route basittir, sunucu fallback gerektirmez.
- HTTPS, doğru MIME türleri ve `gzip`/Brotli HTTP sıkıştırması açık olmalı; `.glb` gibi zaten sıkıştırılmış dosyada kazanç küçük olabilir.
- Deploy sonrası tarayıcının *Network* paneliyle `404`, `CORS`, decode, MIME, cache, asset yolu ve toplam transferi denetle.

Vite'ın üretim derlemesi ve statik dağıtım kılavuzu için bkz. [T10].

## 15.6 Çevrimdışı/PWA kararı

**V1'de service worker ve PWA yok.** Yanlış cache stratejisi yeni bölüm dosyalarıyla eski kodu karıştırıp oyun durumunu bozabilir. Oyunun internet bağlantısı yokken menüden mutlaka açılacağı iddia edilmeyecek. İlk oynanış kararlı hale geldikten sonra offline install, önbellek sürümleme ve güncelleme ekranı ayrı proje gereksinimi olarak değerlendirilebilir.

## 15.7 WebGL context loss ve sayfa görünürlüğü

- `webglcontextlost` olayında oyun döngüsünü durdur ve “Görüntü bağlantısı kesildi, geri yükleniyor” bildirimi ver.
- `webglcontextrestored` olayında sahnenin yeniden çizilebildiğini kontrol et; gereken kaynaklar yoksa son checkpoint'ten güvenli yeniden yükleme sun.
- `visibilitychange → hidden` durumunda `pauseReason = 'tab-hidden'`; efektler/ses/zamanlayıcılar durur. Sekme görünür olunca oyuncunun kontrollü biçimde devam etmesine izin ver. [T4]
- Pencere boyut değişiminde `renderer.setSize`, kamera aspect/ortho boyutları ve UI birlikte güncellenir. Her mouse hareketinde resize hesaplanmaz.

---

# 16. Test stratejisi ve hata sınıfları

## 16.1 Kod testleri

| Alan | Asgari otomatik test |
|---|---|
| `EchoSystem` | Doğru kaset etkinleştirir; yanlış kaset etkilemez; süre sınırları; tekrar etkinleştirme; SAFE_HOLD |
| `NavGraph` | Duvar geçilmez; kapalı link geçilmez; yankı açıkken rota açılır; farklı katlar sadece explicit linkle bağlanır |
| `PuzzleSystem` | Doğru sırada flag; yanlış sırada durum bozulmaz; aynı olay iki kere oynanmaz |
| `SaveManager` | Yaz/oku; bozuk JSON; eski sürüm; bilinmeyen flag; storage kapalı; yanlış checkpoint |
| `AssetManager` | Eksik required asset hatası; optional ses yoksa devam; level değişince kaynakları serbest bırakma |
| `StoryDirector` | Kayıt altyazısı doğru; tamamlanmış kayıt atlanabilir; final kararı tekrar edilebilir |

## 16.2 E2E test senaryoları

1. Yeni oyun → L01 kaset al → A yankısı → içeri gir → not → B yankısı → Efe kaydı → L02 açıldı.
2. L01 iç checkpoint → sayfayı yenile → içerden başla, doğru nesneler/bayraklar duruyor.
3. Yankı merdivenindeyken süre bitti → düşme yok; sabit zemine çıkınca güvenle söndü.
4. Yankı çalışırken sekmeyi gizle, birkaç saniye sonra aç → timer oyundayken geçen süre kadar ilerledi, arka plan süresi kadar değil.
5. Yanlış kaset dene → anlamlı geri bildirim, softlock yok.
6. 5 defa bölüm gir/çık → GPU geometry/texture sayısı sınırsız yükselmez.
7. Yavaş ağ taklidi → yükleme ekranı takılmadan gösterilir; tek asset hatasında retry çalışır.
8. Tarayıcı localStorage kapalı → oyun en azından o oturumda çalışır, kayıt hatası kullanıcıya gösterilir.
9. Mobil ekranda tap-to-move + yankı + altyazı + pause erişilebilir.
10. WebGL2 yok (mock/cihaz) → uygun hata ekranı, JS exception'ı yok.
11. L06 final A/B → doğru metin ve kayıt; tekrar seçim checkpoint'i korunur.

## 16.3 Performans ve kullanılabilirlik testleri

- **Fonksiyon testi** masaüstü Chrome/Firefox/Edge/Safari; mümkünse gerçek Android ve iPhone.
- **Performans testi** düşük güçte dizüstü ve orta sınıf telefon; üretim `npm run build` + `preview` veya deploy üzerinden, geliştirme HMR üzerinden değil.
- **Ağ testi:** Chrome DevTools yavaş 4G simülasyonu ve gerçek mobil bağlantı; ilk oynanışa kadar toplam transfer ve süre.
- **Kullanıcı testi:** Tasarımcı olmayan 5 kişi ilk bölümde neyi tıkladığını açıklamadan oynasın. Kaydedilecek: ilk anlaşılma anı, takılma, yanlış tıklama, ipucu kullanımı, bölüm süresi, devam etme isteği.
- **Görsel test:** Kamera nesne örtüşmesi, metin kontrastı, küçülen ekran, düşük kalite ve `prefers-reduced-motion`.

## 16.4 Hata öncelik sınıflaması

| Öncelik | Tanım | Yayın kararı |
|---|---|---|
| P0 | Oyun açılmıyor, kayıt kaybı, kritik bölüm softlock, final erişilemez | **Yayın engeli** |
| P1 | Sık görülen çarpışma/arayüz hatası, mobilde kontrol çalışmıyor, ciddi FPS çöküşü | **Yayın engeli** |
| P2 | Küçük animasyon/hikâye senkron hatası, kozmetik çakışma | Planlı düzeltme |
| P3 | İsteğe bağlı küçük görsel cilalar | Ertelenebilir |

## 16.5 Kabul ölçütleri (Definition of Done)

Bir özellik ancak şu beş şartla **bitti** sayılır: (1) kod çalışıyor; (2) ilgili testler geçiyor; (3) dosya/performans bütçesi ihlali yok veya gerekçesi yazılı; (4) yeniden yükleme / düşük kalite / klavye-fare temel testi yapıldı; (5) içerik/JSON/kod ve bu yönergenin ilgili satırı uyumlu.

---

# 17. Geliştirme yol haritası — kodlamaya hangi sırayla başlayacağız?

Bu aşamalar **tarih vaadi değil, bağımlılık sırası**dır. Bir aşama kabul testinden geçmeden sonraki aşamanın içerik üretimine başlamıyoruz.

## AŞAMA 0 — Teknik çekirdek / tarayıcı bootstrap

**Amaç:** Tarayıcıda tek bir izometrik sahne, resize ve karakter hareketi.

**Görevler:**

- [ ] Git deposu + Vite vanilla-ts kur; TypeScript ve npm scripts doğrula.
- [ ] Three.js ekle; WebGL2 destek kontrolü ve desteklenmeme ekranı.
- [ ] Ortografik kamera, arka plan, zemin, ilk sabit ışık.
- [ ] Basit küp Ada; WASD ile zemin içinde hareket.
- [ ] Tıkla-git için raycast hedef işareti (başlangıçta engel yok).
- [ ] Pencere resize, DPR üst sınırı, `visibilitychange` pause.
- [ ] `npm run build`, `npm run preview`, ilk statik deneme deploy'u.
- [ ] `renderer.info.render.calls`, FPS debug paneli (geliştirme modunda).

**Kabul:** Tarayıcıda 3D alan görünür; klavye ve fare ile gezilir; mobilde sayfa ölçeklenir; ilk build deploy edilir. Oyun mekaniği henüz yok. **Bir sonraki adım: navigation + etkileşim.**

## AŞAMA 1 — Kontrol ve yürünebilir diorama

**Görevler:**

- [ ] Grid tabanlı `NavGraph`, A* ve kapalı yol linkleri.
- [ ] Kamera yönüne göre WASD, click-to-move, duvar engelleri.
- [ ] Objeye tıklanınca yaklaş ve `interact` olayı gönder.
- [ ] `InputManager`, hover highlight, yürüyememe geri bildirimi.
- [ ] Blender'dan ilk `geometry.glb` yükle; mesh ID eşlemelerini doğrula.
- [ ] Occlusion fade yalnız ön duvarlarda.

**Kabul:** Postane etrafı duvardan geçmeden gezilir; yakın/uzak tıklama düzgün çalışır, kapalı kapıya yol bulunmaz, engellerin arkasına karakter ışınlanmaz.

## AŞAMA 2 — Yankı çekirdeği

**Görevler:**

- [ ] `EchoSystem` state machine; ankraj-kaset-eşleşme mantığı.
- [ ] 0.4 sn materyalizasyon, 12 sn ACTIVE, 0.6 sn FADING, cooldown.
- [ ] Yankı görünürlüğü ve nav linklerinin zamanlama ile açılıp kapanması.
- [ ] `SAFE_HOLD` / `supportObjectIds` güvenlik kontrolü.
- [ ] HUD'da kaset ve yankı süresi.
- [ ] Yankı testleri (özellikle tıklama, pause, platform üstü).

**Kabul:** Zil kaseti kapıyı geri getirir; karakter geçebilir; süresi dolunca güvenli kapanır; oyuncu üzerinde durduğu basamakla beraber yok olmaz.

## AŞAMA 3 — L01 vertical slice (en önemli kilometre taşı)

**Görevler:**

- [ ] `l01_post_office` JSON + manifest + basit graybox GLB.
- [ ] Posta kutusundan kaset alma, ankraj A ve B.
- [ ] İç checkpoint, not okuma, Efe kaseti.
- [ ] `PuzzleSystem` ve `StoryDirector` bağla.
- [ ] Web Audio başlangıcı + SFX; tüm kritik ses için altyazı.
- [ ] SaveManager v1; otomatik save, devam et, manual export/import.
- [ ] Başlat / devam / duraklat / bölüm sonu menüleri.
- [ ] Basit mobil tap-to-move + yankı butonu.
- [ ] 5 kişi ile kör oyuncu testi; en kritik 3 takılmayı düzelt.

**Kabul:** **8–12 dakikalık başı sonu oynanan bölüm**; yeniden yüklenince ilerleme korunur; 5 oyuncunun çoğu dış yardımsız bitirir; transfer ve FPS raporu tabloya yazılır.

## AŞAMA 4 — Sanat ve performans cilası (L01'e yatırım)

**Görevler:**

- [ ] Graybox primitiflerin yerine modüler düşük poligon setini koy.
- [ ] Ada karakterini 8–12 parça model olarak sonlandır; basit walk/idle/interact.
- [ ] Renk paleti, dekor, zayıf yankı VFX, ambiyans sesi.
- [ ] Mobil çözünürlük ve düşük kalite ayarları.
- [ ] 5 kez bölüm gir/çık memory leak kontrolü, statik build transfer raporu.
- [ ] Asset lisansları, TR metin doğrulama ve 1 ekran görüntüsü.

**Kabul:** L01 kod, hikâye, görsel ve teknik ölçüleriyle **yeniden kullanılabilir şablon** olur. Bundan önce altı bölümün tüm modellemelerini yapma.

## AŞAMA 5 — L02–L03 içerik üretimi

- [ ] L02 iki kaset seçme + latch sistemi.
- [ ] L03 iki uçlu hareketli platform; güvenli taşıma ve nav linkleri.
- [ ] Ortak dekor/ışık/seslerin seviye manifest'lerinde tekrar kullanımı.
- [ ] Her bölüm için JSON, 3D, hikâye, ipucu ve yeniden yükleme testleri.

**Kabul:** 3 bölüm baştan sona oynanır; yeni gameplay sistemi sadece hareketli platform için eklenmiştir; L01 gerilemesi yoktur.

## AŞAMA 6 — L04–L06 ve sonlar

- [ ] L04 kule mandalı ve saat ibresi; alt/üst kat occlusion.
- [ ] L05 eski kasetlerin birleştirilmesi, Efe büyük açıklaması.
- [ ] L06 3 kayıt kaidesi, son karar ve 2 epilog.
- [ ] Tüm hikâye tutarlılığı, kayıt mantığı ve bölüm açılma akışı.

**Kabul:** Oyun açılış → final A/B akışını tamamlar; bir sonu gördükten sonra diğerine dönmek mümkündür.

## AŞAMA 7 — Yayın hazırlığı

- [ ] Tam tarayıcı cihaz matrisi ve responsive denetimi.
- [ ] 25 MB toplam içerik/3 MB ilk oynanış hedeflerinin ölçümü, gerekirse trim.
- [ ] Kayıt migrasyonu, save bozulması, görsel context loss, tab geri dönüşü.
- [ ] Telif/lisans, gizlilik, jenerik, haklar, oyun açıklaması.
- [ ] Statik deploy ve üretim kaynak 404 kontrolü.
- [ ] Gerçek oyuncu testleri, P0/P1 bug sıfır.

**Kabul:** Stabil v1 yayın. Daha fazla içerik veya teknik özellik ancak oyuncu geri bildirimine göre.

---

# 18. İlk kodlama oturumu: gerçekten çalışan başlangıç sahnesi

Bu bölüm, **Aşama 0** için kopyalanıp çalıştırılabilecek minimal bir sahne verir. Böylece soyut dokümanla kalmadan oyunun kamera ve kontrol temelini test etmeye başlarız. **Bilinçli eksikler:** Henüz nav grid, engel, GLB, yankı sistemi, kayıt, ses, hikâye yok. Bu kodu tam oyun motoru sanmayın. Sonraki aşamada modüllere ayıracağız.

## 18.1 Başlangıç komutları

```bash
npm create vite@latest son-kayit-0417 -- --template vanilla-ts
cd son-kayit-0417
npm install
npm install three
npm install -D @types/three
npm run dev
```

`index.html` Vite şablonundaki `#app` elementini içermeli. `src/main.ts` ve `src/style.css` dosyalarını aşağıdaki örnekle değiştir.

## 18.2 `src/main.ts` — ortografik kamera, küp Ada, WASD + tıkla git

```ts
import * as THREE from 'three';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('#app bulunamadı');

const supportCanvas = document.createElement('canvas');
if (!supportCanvas.getContext('webgl2')) {
  root.textContent = 'Bu oyunu çalıştırmak için WebGL2 destekli güncel bir tarayıcı gerekiyor.';
  throw new Error('WebGL2 unsupported');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#1D2C3A');

const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 100);
camera.position.set(9, 9, 9);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight('#E5E3D7', '#425565', 2));
const keyLight = new THREE.DirectionalLight('#E5B363', 2);
keyLight.position.set(-4, 8, 5);
scene.add(keyLight);

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.35, 10),
  new THREE.MeshLambertMaterial({ color: '#75848C' })
);
ground.position.y = -0.175;
scene.add(ground);

const ada = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 1.3, 0.5),
  new THREE.MeshLambertMaterial({ color: '#E5B363' })
);
ada.position.y = 0.65;
scene.add(ada);

const moveTarget = new THREE.Vector3();
let hasMoveTarget = false;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pressed = new Set<string>();
let paused = false;

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  pressed.add(e.code);
});
window.addEventListener('keyup', (e) => pressed.delete(e.code));
window.addEventListener('blur', () => pressed.clear());

document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  pressed.clear();
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(plane, hit)) return;
  moveTarget.copy(hit);
  moveTarget.x = THREE.MathUtils.clamp(moveTarget.x, -4.7, 4.7);
  moveTarget.z = THREE.MathUtils.clamp(moveTarget.z, -4.7, 4.7);
  hasMoveTarget = true;
});

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const worldHeight = 12;
  const aspect = width / Math.max(1, height);
  camera.left = -worldHeight * aspect / 2;
  camera.right = worldHeight * aspect / 2;
  camera.top = worldHeight / 2;
  camera.bottom = -worldHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
const forward = new THREE.Vector3(-1, 0, -1).normalize();
const right = new THREE.Vector3(1, 0, -1).normalize();
const direction = new THREE.Vector3();
const speed = 2.7;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (paused) return;

  direction.set(0, 0, 0);
  if (pressed.has('KeyW') || pressed.has('ArrowUp')) direction.add(forward);
  if (pressed.has('KeyS') || pressed.has('ArrowDown')) direction.sub(forward);
  if (pressed.has('KeyD') || pressed.has('ArrowRight')) direction.add(right);
  if (pressed.has('KeyA') || pressed.has('ArrowLeft')) direction.sub(right);

  if (direction.lengthSq() > 0) {
    hasMoveTarget = false;
    direction.normalize();
    ada.position.addScaledVector(direction, dt * speed);
  } else if (hasMoveTarget) {
    direction.set(moveTarget.x - ada.position.x, 0, moveTarget.z - ada.position.z);
    const distance = direction.length();
    if (distance < 0.03) {
      hasMoveTarget = false;
    } else {
      ada.position.addScaledVector(direction.normalize(), Math.min(distance, speed * dt));
    }
  }

  ada.position.x = THREE.MathUtils.clamp(ada.position.x, -4.7, 4.7);
  ada.position.z = THREE.MathUtils.clamp(ada.position.z, -4.7, 4.7);
  renderer.render(scene, camera);
}
requestAnimationFrame(tick);
```

## 18.3 `src/style.css`

```css
:root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #f4f3ea;
  background: #1d2c3a;
}
* { box-sizing: border-box; }
html, body, #app { width: 100%; height: 100%; margin: 0; overflow: hidden; }
canvas { display: block; width: 100%; height: 100%; touch-action: none; }
button { min-height: 44px; cursor: pointer; }
```

**Bu başlangıç sahnesinin testleri:** `npm run dev` açılır, sarı karakter görünür, WASD/ok ile çapraz olarak doğru hareket eder, zemine tıklanarak gider, pencere boyutunda bozulmaz. Sekme gizlendiğinde hareket durur. **Önemli eksik:** Bu örnekteki tıkla-git engelleri ve katları hesaba katmaz; duvar eklendiğinde kullanılmadan önce Aşama 1 `NavGraph` ile değiştirilmelidir. Ayrıca örnek hareket mantığı sadece debug sahnesinde kullanılacak; release `GameLoop` için sabit zaman adımlı mimariye aktarılacaktır.

## 18.4 İlk Git commit önerisi

```text
chore: bootstrap vite threejs typescript web game
feat: add orthographic diorama prototype and basic movement
feat: add webgl2 fallback and resize handling
```

Aşama 0 tamamlandıktan sonra sonraki kodlama görevi “`NavGraph` + A* + click-to-move ve WASD ortak hareket modeli”dir; başka bölümün hikâye sahnesine atlanmaz.

---

# 19. Proje yönetimi: görev yazma standardı ve riskler

## 19.1 Her geliştirici görevinin formatı

```text
Başlık: [Sistem] Tek cümlede kullanıcıya görünen davranış
Amaç: Neden gerekli?
Ön koşul: Hangi modül/asset hazır olmalı?
Kapsam: Neyi değiştireceğiz?
Kapsam dışı: Neyi bu görevde yapmayacağız?
Kabul kriterleri: 3–6 test edilebilir madde
Dosya/performans etkisi: Yeni bağımlılık? yeni asset? ek KB?
Test: Birim / tarayıcı / manuel
Tamamlanma notu: Ekran görüntüsü/video veya kısa ölçüm
```

**Örnek görev:**

> `[Echo] Oyuncu doğru kaseti çalınca giriş kapısı 12 saniye görünür.` Ön koşul: `EchoSystem`, anchor verisi, `InteractionSystem`. Kabul: yanlış kaset kapıyı açmaz; 12 saniye sonra boşsa söner; oyuncu kapıyı geçerken collision aniden kaybolmaz; arka planda süre sayılmaz; test geçer. Kapsam dışı: fırın/istasyon varlıkları.

## 19.2 Başlıca 10 risk ve önlem

| Risk | Etki | Önlem |
|---|---|---|
| Three.js hazır oyun motoru değil | Kod karmaşası | Az sayıda modül, yalın state machine, birim test |
| Her bölüm ayrı mekanik istemeye başlar | Kapsam şişmesi | Yeni mekanik kotası; yalnız L03 platform istisnası |
| Oyuncu nereye tıklayacağını anlamaz | Bulmaca terk edilir | EchoAnchor tek turkuaz dil; ilk 90 saniye kullanıcı testi |
| Duvar Ada'yı kapatır | Kamera hissi bozulur | OcclusionFade ve özel bölüm kadrajı |
| Platform süresi bitince düşme | Softlock / sinir | SAFE_HOLD, checkpoint, ayrı test |
| GLB doku/ses yükü artar | Uzun yükleme | Önce düz renk; level bazlı manifest; transfer bütçesi |
| 6 bölüm üretilirken L01 eğlenceli değildir | Büyük israf | Vertical slice geçiş kapısı |
| Mobilde kontrol çok küçüktür | Erişilemez oyun | Büyük hedefler, tap-to-move, safe area |
| Güncelleme save'i bozar | Oyuncu ilerleme kaybı | Şema, migration, export/import, geriye dönük test |
| Sesli hikâye erişilemez | Oyuncu anlamaz | Zorunlu altyazı/transkript, ses yoksa fallback |

## 19.3 Kapsam koruma kuralları

- Yeni kütüphane eklemek için iki soru: “Bu problem Three.js + TS ile 1–2 küçük modülde çözülür mü?” ve “Yeni bağımlılık ilk yükü, güvenliği, bakım işini nasıl etkiler?”
- Yeni 3D model için: “Oyuncu onunla etkileşecek mi, yoksa sahnenin silüetini değiştirecek mi?” İkisi de değilse mevcut modeli tekrar kullan.
- Yeni sinematik için: “Bu bilgi çevre nesnesi + 10 saniye ses + altyazıyla anlatılabilir mi?”
- Yeni mekanik için: “Mevcut kaset/anchor/latch/nav kombinasyonu yetmiyor mu?”
- İlk L01 bitmeden **düşman, savaş, serbest kamera, gelişmiş shaders, bulut kayıt, online leaderboard** üzerinde çalışma yok.

---

# 20. Uygulamaya başlangıç için kesin karar listesi

| Karar | Durum | Ne zaman değişebilir? |
|---|---|---|
| Oyun web tabanlı | **KESİN** | Proje yeniden tanımlanırsa |
| Three.js + TS + Vite | **KESİN** | Vertical slice teknik engel kanıtlarsa |
| WebGL2 renderer | **KESİN** | Tarayıcı destek stratejisi değişirse |
| Ortografik sabit kamera | **KESİN** | Oyuncu testi güçlü gerekçe sunarsa |
| Low-poly, flat renk, gölgesiz başlangıç | **KESİN** | Ölçüm bütçesi izin verirse |
| Statik host, backend yok | **KESİN** | Bulut senkron/çok oyunculu istenirse |
| İlk sürüm 6 bölüm | **HEDEF** | Üretim kapasitesine göre 3 bölümlük erken erişim düşünülebilir |
| İlk çalışılacak bölüm L01 | **KESİN** | Değişmez |
| 12 saniye yankı | **VARSAYIM** | Testte kolay/çok zor olursa |
| Masaüstü öncelikli + mobil temel | **KESİN** | Cihaz testine göre kalite düşürme gerekir |
| Kaset seslendirmesi | **OPSİYONEL** | Ses bütçesi/kalitesi uygun olursa |
| PWA, online save, achievement | **GELECEK** | Oynanabilir çekirdek teslim edildikten sonra |

## 20.1 Aşama 0 için ilk 12 iş (sırayla)

1. Node LTS, Git ve Blender kurulumu.
2. Vite vanilla-ts proje oluştur.
3. Three.js + TypeScript import'u çalıştır.
4. WebGL2 kontrolünü ekle.
5. Renderer ve ortografik kamerayı oluştur.
6. 10×10 zemin ve basit Ada karakterini göster.
7. WASD/ok tuşu hareketini ekle.
8. Tıkla-git raycast prototipini ekle.
9. Kamera resize / DPR sınırını düzelt.
10. Sekme gizleme/pause davranışını ekle.
11. Production build'i al ve statik sunucuda dene.
12. Ekran görüntüsü + Network transfer + FPS ölçümünü not et.

## 20.2 Kodlama sürecinde değişiklik kayıt biçimi

Bu dosya `docs/game-design.md` konumuna kopyalanır. Belgedeki `KESİN` kararı değiştirmek için `docs/decisions.md`'ye kısa karar yazılır:

```text
ADR-00X | 2026-..-..
Problem: ...
Eski karar: ...
Yeni karar: ...
Gerekçe/test: ...
Alternatifler: ...
Kod/asset etkisi: ...
```

Bu sayede daha sonra kod yazarken “başta ne kararlaştırmıştık?” sorusu yeniden tartışılmaz.

---

# 21. Doğrulanan teknik kaynaklar ve üretim referansları

**Kaynak kontrol tarihi:** 18 Kasım 2026. Bu bağlantılar, teknik kararın dayandığı dokümantasyondur; belirli bir paket sürümünün sonsuza kadar aynı davranacağını garanti etmez. Oyun hikâyesi, süreler, bütçeler ve bölüm tasarımları bu projeye özel **öneri/karar**dır; bağımsız teknik kaynaklardan doğrudan alınmış “kanıtlanmış” değerler değildir.

- **[T1] Three.js WebGLRenderer (WebGL2 gereksinimi ve renderer yapılandırması):** https://threejs.org/docs/pages/WebGLRenderer
- **[T2] Three.js GLTFLoader (glTF 2.0, Meshopt/KTX2/Draco entegrasyonu):** https://threejs.org/docs/pages/GLTFLoader.html
- **[T3] MDN — Web Audio API best practices (autoplay ve kullanıcı jesti):** https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- **[T4] MDN — Page Visibility API, requestAnimationFrame:** https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API ve https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- **[T5] MDN — Storage quotas and eviction (yerel depolamanın sınırları):** https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- **[T6] Three.js — Dispose objects / bellek temizliği:** https://threejs.org/manual/pages/how-to-dispose-of-objects.html
- **[T7] glTF Transform — CLI, optimizasyon, Meshopt/KTX2 seçenekleri:** https://gltf-transform.dev/cli
- **[T8] Three.js — InstancedMesh (draw call azaltma):** https://threejs.org/docs/pages/InstancedMesh.html
- **[T9] MDN — Pointer events / touch-action:** https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events ve https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action
- **[T10] Vite — Production build / statik deploy:** https://vite.dev/guide/build ve https://vite.dev/guide/static-deploy.html
- **[T11] Three.js — genel manuel:** https://threejs.org/manual/
- **[T12] glTF formatı, Khronos resmî sayfa:** https://www.khronos.org/gltf/

**Oyun tasarım referansları:** Monument Valley, The Gardens Between, COCOON, The Last Campfire, Aarik and the Ruined Kingdom, Captain Toad; nitel oyuncu yorumları ve bağlantılar önceki `izometrik_hikaye_oyunu_arastirma_ve_konsept.md` araştırma belgesinde. Bu projede doğrudan o oyunların karakterleri, grafik varlıkları, haritaları veya sesleri kullanılmayacaktır.

---

# 22. SON SÖZ: Kodlama için en doğru ilk iş

> **Önce bütün kasabayı modellemiyoruz.** Önce browser'da açılan, ortografik kamerayla görülen küçük bir taş sokakta Ada'yı yürütüyoruz. Sonra ses kasetiyle geçici bir postane kapısını geri getiriyoruz. Bundan sonra sesin süresi, bulmaca güvenliği, kaydetme, altyazı ve web performansı çalışıyorsa hikâyeyi büyütüyoruz.

**Birinci geliştirme teslimatı:** `npm run dev` ile çalışan izometrik zemin + Ada + klavye/tıkla-git + resize + WebGL2 fallback + production build.  
**İkinci teslimat:** NavGraph + etkileşim + yankı kapısı.  
**Üçüncü teslimat:** L01'in baştan sona hikâyesi, checkpoint'i ve çalışan web deploy'u.  
**Ancak sonra:** diğer beş bölüm.

**Tek cümlelik ürün ilkesi:** *Az varlıkla akılda kalan mekânlar; basit kodla güvenilir bulmacalar; sesle anlatılan, oyuncuyu seçim yapmaya götüren bir hikâye.*
