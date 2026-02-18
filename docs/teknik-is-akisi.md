# Destek Projesi Teknik Is Akisi

Bu dokumanin amaci, projede "ne yapiyoruz, nasil yapiyoruz, neden yapiyoruz" sorularini tek bir yerde netlestirmektir.

## 1) Sistem Ozeti

- Uygulama: Next.js App Router (`src/app`)
- API: Next.js Route Handlers (`src/app/api/**/route.ts`)
- Veri tabani: Prisma + SQLite (`prisma/schema.prisma`)
- Kimlik: dashboard layout seviyesinde auth kontrolu (`src/app/dashboard/layout.tsx`)
- Ana domainler:
- Kargo Takibi
- Cihaz Tamiri
- Muadil Cihaz Envanteri
- Kurulumlar
- Teknik Servis / Tedarikci
- Ayarlar (Teknisyen, Cihaz Turu, Model)

## 2) Neden Bu Yapida

- Tek panelden saha + depo + tamir + envanter akisini yonetmek.
- Seri numarasini merkez veri noktasi yapip cihaz gecmisini kaybetmemek.
- Gelen kargo, giden kargo, tamir ve envanter hareketlerini bagli ilerletmek.
- Operasyonel hatayi azaltmak icin otomatik kurallar kullanmak (or. gelen kargo -> merkez depo).

## 3) Temel Varliklar ve Sorumluluklari

- `CargoTracking` + `CargoDevice`: kargo kaydi ve kargodaki cihaz satirlari.
- `DeviceRepair`: tamamlanan/aktif tamir kayitlari.
- `EquivalentDevice` + `EquivalentDeviceHistory`: envanterdeki muadil cihaz ve hareket gecmisi.
- `Technician`: onceden tanimli teknisyen listesi.
- `DeviceBrand` + `DeviceModel`: cihaz turu/model sozlukleri.
- `Location` + `Warehouse`: depo/lokasyon hedefleri.

## 4) Uctan Uca Is Akislari

### 4.1 Yeni Kargo Girisi

Ilgili UI/API:
- UI: `src/components/cargo-form-dialog.tsx`
- API: `src/app/api/cargo/route.ts`

Nasil:
1. Takip no girilirken sistem conflict kontrolu yapar (`/api/cargo/check-tracking`).
2. Takip no zaten varsa API `409 Conflict` doner.
3. Kargo tipi `incoming` ise:
- hedef otomatik `HEADQUARTERS`
- varsayilan depo/merkez otomatik secilir
- teslimat adresi merkez olarak set edilir
4. Cihaz satiri icin cihaz turu ve model onceden tanimli listelerden secilir.
5. Seri no yazilirken cihaz lookup oneri ve gecmis datasi cekilir (`/api/devices/lookup`).

Neden:
- Manuel depo/adres secimindeki hatalari azaltmak.
- Tekrarlayan takip no kayitlarini engellemek.
- Cihaz tanimlarini standardize edip raporlamayi duzgunlestirmek.

### 4.2 Gelen Kargonun Depoya Otomatik Islenmesi

Ilgili API:
- `src/app/api/cargo/route.ts`

Nasil:
1. Gelen kargo create edildikten sonra sistem hedef lokasyonu belirler.
2. Cihaz satiri `sourceType=equivalent` ise ilgili muadil cihazin lokasyonu guncellenir.
3. Envanter hareketi `EquivalentDeviceHistory` tablosuna yazilir.
4. Islem basarisiz olsa bile kargo kaydi fail edilmez; loglanir.

Neden:
- Operasyon durmasin, kritik veri (kargo kaydi) kaybolmasin.
- Depo hareketleri izlenebilir olsun.

### 4.3 Kargodan Cihaz Tamirine Gecis

Ilgili UI/API:
- UI: `src/app/dashboard/cargo/page.tsx`
- API: `src/app/api/cargo/[id]/route.ts`
- Meta yardimcisi: `src/lib/cargo-repair.ts`

Nasil:
1. Kargo kaydi `recordStatus=device_repair` yapilir.
2. Sistem not alanina `[[CARGO_REPAIR_META]]` ile tamir metasi yazar.
3. Aktif meta varsa listeleme tarafinda kayit `device_repair` olarak normalize gorunur.

Neden:
- Ayrica tablo acmadan mevcut kargo kaydina tamir surecini baglamak.
- Tamir tamamlanana kadar kaydi aktif-is listesinde tutmak.

### 4.4 Kargodan Gelen Cihaz Tamiri Ticketi Yonetimi

Ilgili UI/API:
- UI liste: `src/app/dashboard/repairs/page.tsx`
- UI detay: `src/app/dashboard/repairs/cargo/[id]/page.tsx`
- API: `src/app/api/cargo-repairs/route.ts`, `src/app/api/cargo-repairs/[id]/route.ts`

Nasil:
1. Kargodaki aktif tamir ticketlari "Kargodan Gelen Cihaz Tamiri Ticketlari" alaninda listelenir.
2. Teknisyen, islem adimlari, yedek parca ve maliyet girilir.
3. `Kaydet` ile ticket acik kalir, gecmise ara kayit dusulur.
4. `Onarimi Tamamla` ile:
- ticket aktif listeden duser
- her cihaz icin `DeviceRepair` kaydi olusturulur (duplicate marker kontrolu var)
- kargo kaydindaki meta `completed` olur
- kargo `recordStatus` acik duruma cekilir

Neden:
- Aktif is kuyrugu ile tamamlanan tamir arsivini ayirmak.
- Tamir tamamlandiginda standard tamir listesine otomatik gecis saglamak.

### 4.5 Tamir Listesi ve Kapanan Kayitlar

Ilgili UI/API:
- UI: `src/app/dashboard/repairs/page.tsx`, `src/app/dashboard/repairs/[id]/page.tsx`
- API: `src/app/api/repairs/route.ts`, `src/app/api/repairs/[id]/route.ts`

Nasil:
1. Tamir listesi acik kayitlari ustte, `completed/unrepairable` kayitlari altta siralar.
2. Tamamlanan kayitlar kapanmis olarak gorunur, ama listede kalir.
3. Detay ekranindan kayit tekrar duzenlenebilir (`PATCH /api/repairs/[id]`).
4. Teknisyen secimi `technicianId` ile kaydedilir; listede teknisyen adi relation uzerinden gorunur.

Neden:
- Cihaz gecmisini kaybetmeden raporlama ve arama yapabilmek.
- "Tamamlandiysa kaybolmasin" beklentisini karsilamak.

### 4.6 Kargo Cihazi Sevk

Ilgili UI/API:
- UI: `src/components/cargo-dispatch-dialog.tsx`
- API: `src/app/api/cargo/dispatch/route.ts`

Nasil:
1. Sevk icin `cargoId`, `deviceIds[]`, `targetLocationId` zorunludur.
2. `targetLocationId` yoksa API `400 Bad Request` doner.
3. Seri numarasi olan cihazlar muadil envantere baglanir/guncellenir.
4. Hareket gecmisi `EquivalentDeviceHistory` olarak yazilir.

Neden:
- Sevk edilen cihazin lokasyon izi kaybolmasin.
- Kargo kaydi ile envanterin ayrismasi engellensin.

### 4.7 Seri No Merkezli Cihaz Gecmisi

Ilgili API/UI:
- API: `src/app/api/devices/lookup/route.ts`
- UI kullanim: kargo formu seri no alanlari

Nasil:
1. `q=` ile typeahead oneri (tamir, kurulum, muadil envanter kaynaklarindan merge).
2. `serial=` ile detay gecmis (kargo + tamir + kurulum + envanter hareketi) doner.
3. Formda seri no yazarken eski cihaz kayitlari gorunur.

Neden:
- Ayni cihaz tekrar geldiginde onceki islemleri gorerek hizli karar vermek.
- Kurum hafizasini kisiye degil dataya baglamak.

## 5) Ayarlarin Moduler Yapisi

Ilgili UI:
- `src/app/dashboard/settings/page.tsx`
- `src/components/settings/technicians-settings-card.tsx`
- `src/components/settings/device-types-settings-card.tsx`
- `src/components/settings/device-models-settings-card.tsx`

Nasil:
- Teknisyenler ayarlardan tanimlanir ve tamir ekranlarinda secilir.
- Cihaz turleri ayarlardan tanimlanir ve kargo formunda secilir.
- Cihaz modelleri ayarlardan tanimlanir ve secilen ture gore filtrelenir.

Neden:
- Sabit listeye kod gommek yerine operasyonun kendisinin yonetmesini saglamak.
- Yeni cihaz/tur/model geldiginde kod degistirmeden sistemde kullanmak.

## 6) Ekran -> API Esleme Ozeti

- Kargo listesi: `GET /api/cargo`
- Yeni kargo: `POST /api/cargo`
- Kargo guncelle: `PATCH /api/cargo/:id`
- Takip no kontrol: `GET /api/cargo/check-tracking`
- Kargo sevk: `POST /api/cargo/dispatch`
- Kargo tamir ticket listesi: `GET /api/cargo-repairs`
- Kargo tamir ticket detay/guncelle: `GET/PATCH /api/cargo-repairs/:id`
- Tamir listesi: `GET /api/repairs`
- Tamir kaydi guncelleme: `PATCH /api/repairs/:id`
- Seri no lookup: `GET /api/devices/lookup?q=...` ve `GET /api/devices/lookup?serial=...`
- Teknisyen listesi: `GET /api/technicians`
- Cihaz tur/model sozlukleri: `GET /api/brands`, `GET /api/models/all`

## 7) Isletim Kurallari (SOP)

- Kural 1: Takip no tekildir; duplicate olursa yeni kayit acilmaz.
- Kural 2: Gelen kargo merkez depo odakli islenir.
- Kural 3: Tamire alinacak kayitlarda seri no zorunlulugu operasyonel olarak takip edilmelidir.
- Kural 4: Tamir tamamlandiginda kayit silinmez, tamir listesinde kapali/tamamlandi olarak kalir.
- Kural 5: Teknisyen secimleri serbest yazi degil tanimli listeden olmalidir.

## 8) Bilinen Durumlar ve Teknik Notlar

- `409 Conflict` genelde duplicate tracking number nedeniyledir.
- `400 Bad Request` sevkte cogu zaman `targetLocationId` eksikliginden gelir.
- Kargo tamir metasi su an `notes` icinde etiketli JSON olarak tutulur (`[[CARGO_REPAIR_META]]`).
- Bu yaklasim hizli ilerleme saglar; orta vadede ayri tabloya tasinmasi bakimi kolaylastirir.

## 9) Orta Vade Teknik Iyilestirme Onerileri

1. Kargo tamir metasi icin ayri tablo (`cargo_repair_ticket`) acmak.
2. Tum "durum" gecisleri icin state-transition guard katmani eklemek.
3. API seviyesinde ortak validation (zod vb.) ile 400/409 hata mesajlarini standartlamak.
4. Seri no bazli timeline endpointini tek formatta versiyonlamak.
5. Raporlama icin "acik is", "tamamlanan is", "teknisyen performansi" gorunumlerini netlestirmek.

## 10) Kisa Operasyon Ozeti

- Kargo gir -> cihazlari seri no ile kaydet -> gerekirse tamire cek.
- Tamir ticketini teknisyen + islem + maliyet ile yonet.
- Tamamlayinca standart tamir kaydina otomatik dusur.
- Kayitlar kapaninca silme, arsivde tut.
- Seri no ile gecmisi her zaman gor.

Bu dokuman, ekipte karar alirken "tek dogru referans" olarak kullanilmalidir ve yeni kural eklendikce ayni dosyada guncellenmelidir.
