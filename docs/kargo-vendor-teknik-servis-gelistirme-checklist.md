# Kargo -> Tedarikci -> Teknik Servis Gelistirme Checklist

Bu dokuman, istenen yeni operasyon akisini adim adim uygulamak ve ilerlemeyi tiklemek icin hazirlandi.

## 0) Kapsam ve Hedef

- Mevcut tek ekrandaki kargo yonetimini ikiye ayirmak: `Gelen Kargo` ve `Giden Kargo`.
- `Sevk Et` islemini tedarikci akisina baglamak:
- Urunler tedarikci deposuna gider.
- Tedarikci takibinde otomatik ticket olusur.
- Kargo kaydi kapaliya cekilir ve "tedarikci takibinde" bilgisi gorunur.
- Tedarikci takibinden teknik servise cekme:
- Teknik servis tarafinda yeni ticket olusur.
- Urun tekrar bizim depoya gelir.
- Tedarikci kaydi kapanir, durumu teknik servise devredildi olur.
- Teknik serviste test tamamlaninca:
- Ticket otomatik `Kargo Takibi > Giden Kargo` listesine duser.
- Durum `Gonderime Hazir` olur.
- Kargolanip musteriye sevk edilince ticket kapanir.

## 1) Net Is Akisi (Hedef Durum)

1. Gelen kargo acilir (`Kargo Takibi > Gelen Kargo`).
2. Gelen kayit icin `Sevk Et -> Tedarikci` yapilir.
3. Sistem:
- Cihaz lokasyonunu `Tedarikci Depo` yapar.
- `Tedarikci Takibi` kaydi acik olusturur.
- Kargo kaydini `Kapali (Tedarikci Takibinde)` yapar.
4. Tedarikci kaydinda `Teknik Servise Cek` islemi yapilir.
5. Sistem:
- `Cihaz Tamiri` (veya teknik servis ekrani) kaydi olusturur.
- Cihaz lokasyonunu tekrar `Merkez Depo` yapar.
- Tedarikci kaydini `Kapali (Teknik Servise Devredildi)` yapar.
6. Teknik servis kaydinda test/tamir tamamlanir.
7. Sistem:
- `Kargo Takibi > Giden Kargo` icin yeni/ilgili kargo ticketini `Gonderime Hazir` olusturur.
8. Giden kargo fiziksel gonderim yapilinca takip bilgisi girilir ve kayit kapanir.

## 2) Fazli Uygulama Plani

## Faz A - Analiz ve Modelleme

- [x] A1: Mevcut akisin kod referanslarini cikar (kargo, dispatch, vendor-tracking, repairs).
- [ ] A2: Tek bir kaynak kimlik modeli belirle (`workflowTicketId` veya benzeri baglayici alan).
- [ ] A3: Durum gecis kurallari (state machine) tanimla ve dokumante et.

## Faz B - Kargo UI Ayrimi (Gelen/Giden)

- [x] B1: `Kargo Takibi` ekranina sekme yapisi ekle: `Gelen Kargo` / `Giden Kargo`.
- [x] B2: Ust aksiyonlari ayir:
- `Yeni Gelen Kargo Girisi`
- `Yeni Giden Kargo Girisi`
- [x] B3: Filtreleri sekmeye gore otomatik uygula (`type=incoming` veya `type=outgoing`).
- [x] B4: Mevcut tasarim ve ticket tablo mantigini koru.

## Faz C - Kargodan Tedarikciye Otomatik Devir

- [x] C1: `Sevk Et` aksiyonunda hedef lokasyon `SUPPLIER` ise ozel workflow tetikle.
- [x] C2: `vendor-tracking` tarafinda otomatik ticket olustur.
- [x] C3: Kargo kaydini `closed` yap ve acik neden/metin ekle: `Kayit tedarikci takibine devredildi`.
- [x] C4: Equivalent device lokasyonunu tedarikci deposuna guncelle.
- [x] C5: Kargo detayinda "Tedarikci Takibinde" baglantisi/rozet goster.

## Faz D - Tedarikciden Teknik Servise Devir

- [x] D1: Tedarikci detay/listesine `Teknik Servise Cek` aksiyonu ekle.
- [x] D2: Aksiyon tetiginde teknik servis/tamir ticketi olustur.
- [x] D3: Cihaz lokasyonunu `Merkez Depo`ya geri cek.
- [x] D4: Tedarikci kaydini kapat ve durumu `Teknik Servise Devredildi` yap.
- [x] D5: Tedarikci kaydinda olusan teknik servis ticket baglantisini goster.

## Faz E - Teknik Servisten Giden Kargoya Donus

- [x] E1: Teknik servis/tamir tamamlandiginda workflow kaydini yakala.
- [x] E2: Otomatik `Giden Kargo` ticketi olustur veya mevcut bagli kaydi `ready_to_ship` yap.
- [x] E3: Giden kargo kartinda kaynak rozetini goster: `Kaynak: Teknik Servis`.
- [x] E4: Kargolama bilgileri girildiginde kaydi `closed`a cek.

## Faz F - API, Kurallar ve Test

- [x] F1: Tum gecislerde cift tarafli veri tutarliligini transaction ile sagla.
- [x] F2: Gecersiz gecislere guard ekle:
- Kapali kargodan tekrar sevk acilmasin.
- Teknik servise cekilmemis tedarikci kaydi kapanamasin.
- [x] F3: API seviyesinde minumum entegrasyon testleri ekle (happy path + invalid transition).
- [x] F4: Manuel UAT senaryolari:
- Gelen -> Tedarikci -> Teknik Servis -> Giden -> Kapanis.

## 3) Teknik Tasarim Notlari (Uygulama Oncesi Karar)

- Mevcut modelde `CargoTracking`, `VendorProduct`, `DeviceRepair` dogrudan birbirine bagli degil.
- Akisin izlenebilirligi icin asagidaki alanlardan biri gerekli:
- Secenek 1: Her kayda `workflowTicketId` eklemek.
- Secenek 2: Ayrica `WorkflowTicket` adli baglayici tablo acmak.
- Oneri:
- Kisa vadede hizli teslim icin `workflowTicketId` (string) alanini uc tabloya eklemek.
- Orta vadede gecis loglari icin ayri `WorkflowTransitionLog` tablosu eklemek.

## 4) Kabul Kriterleri

- [ ] KK1: Kargo ekraninda sekmelerle gelen/giden net ayrilmis olacak.
- [ ] KK2: `Yeni Gelen` ve `Yeni Giden` butonlari ayrica gorunecek.
- [ ] KK3: Kargodan tedarikciye sevkte tedarikci ticketi otomatik olusacak.
- [ ] KK4: Bu devirde cihaz lokasyonu tedarikci deposu olacak.
- [ ] KK5: Kargo kaydi kapaliya dusup "tedarikcide" bilgisi gosterecek.
- [ ] KK6: Tedarikciden teknik servise cekince yeni teknik servis ticketi olusacak.
- [ ] KK7: Bu devirde cihaz lokasyonu tekrar bizim depoya donecek.
- [ ] KK8: Tedarikci kaydi kapali + "teknik serviste" bilgisi gosterecek.
- [ ] KK9: Teknik servis tamamlaninca ticket otomatik giden kargoya dusecek.
- [ ] KK10: Giden kargoda takip bilgileri girilip musteri sevki yapilinca kayit kapanacak.

## 5) Ilerleme Kaydi

- [x] Plan ve checklist dokumani olusturuldu.
- [ ] Faz A2-A3 tamamlandi.
- [x] Faz B tamamlandi.
- [x] Faz C tamamlandi.
- [x] Faz D tamamlandi.
- [x] Faz E tamamlandi.
- [x] Faz F tamamlandi.

## 6) Arastirma ve Yorum Sonucu (Neden Bu Yonde Ilerliyoruz)

- Sorun: Mevcut durum "kayit gir + statuyu degistir" oldugu icin kullanici cihaz yolculugunu takip etmekte zorlanir.
- Cozum prensibi: Ekranlar "modul bazli" degil "is adimi bazli" davranmali.
- Bu nedenle ilk uygulanan iyilestirme:
- Kargo ekraninda fiziksel akis iki net hattan yonetiliyor: `Gelen` ve `Giden`.
- Her hat icin ayri giris aksiyonu var; kullanici yeni kaydi dogru akisla baslatabiliyor.
- Sonraki adimlar:
- `Sevk Et -> Tedarikci` bir durum degisikligi degil, iki tarafi etkileyen workflow gecisi olacak.
- `Tedarikci -> Teknik Servis` ve `Teknik Servis -> Giden Kargo` gecisleri otomatik ticket olusturarak ilerleyecek.

## 7) Faz C Uygulama Notu

- `POST /api/cargo/dispatch` icinde hedef lokasyon `SUPPLIER` ise otomatik tedarikci kaydi uretiliyor.
- Sevk edilen her cihaz icin `vendorProduct` kaydi aciliyor, ilk durum gecmisi yaziliyor.
- Kargo kaydina `[[CARGO_VENDOR_META]]` satiri ekleniyor ve kayit `CLOSED`a cekiliyor.
- Kargo liste ve detay ekraninda `Tedarikci Takibinde` rozet/baglanti gosteriliyor.

## 8) Faz D Uygulama Notu

- `POST /api/vendor-tracking/:id/move-to-repair` endpointi eklendi.
- Bu endpoint tek adimda:
- `DeviceRepair` kaydi olusturur (teknik servis ticketi).
- Seri noya gore muadil cihazi `Merkez` lokasyona geri ceker.
- `vendorProduct` kaydini `COMPLETED`a ceker ve teknik servise devredildi notu yazar.
- Vendor liste ekranina `Teknik Servise Cek` aksiyonu eklendi.
- Vendor detay ekraninda olusan teknik servis ticketina hizli gecis butonu eklendi.

## 9) Faz E Uygulama Notu

- `PATCH /api/repairs/:id` icinde vendor kaynakli repair kapanisinda otomatik giden kargo olusturuldu.
- Bu kargo:
- kaynak markeri tasiyor (`[AUTO_OUTGOING_FROM_REPAIR:<repairId>]`),
- `ready_to_ship` normalize olacak sekilde olusuyor,
- cihaz satiri otomatik ekleniyor.
- Kargo liste/detay ekraninda `Kaynak: Teknik Servis` rozeti gosteriliyor.
- `PATCH /api/cargo/:id` icine kural eklendi:
- `OUTGOING + DELIVERED` oldugunda `recordStatus` otomatik `CLOSED`a cekiliyor.

## 10) Faz F Uygulama Notu

- `POST /api/cargo/dispatch` icine guard eklendi:
- `recordStatus=CLOSED` olan kargo tekrar sevk edilemez.
- Kargo sevkinde kargo guncellemesi ayni DB transaction icine alindi.
- Vendor update endpointlerine guard eklendi:
- Teknik servise cekilme metasi olmadan `COMPLETED`a gecis reddedilir.
- API smoke test scripti eklendi:
- `scripts/workflow-api-smoke.mjs`
- Calistirma: `npm run workflow:smoke`

## 11) Ek Pratiklik Iyilestirmeleri

- [x] Vendor detay ekranina `Teknik Servise Cek` aksiyonu eklendi.
- [x] Repair detay ekranina olusan otomatik giden kargo baglantisi eklendi.
- [x] Tamir kaydi API cevabina `relatedOutgoingCargo` bilgisi eklendi.
- [x] Sol menude `Kargo Takibi Gelen` ve `Kargo Takibi Giden` olarak iki ayri ekran rotasi acildi.

## 12) Yeni Gelen Kargo Wizard (Step-by-Step)

- [x] `Yeni Gelen Kargo` butonu step-by-step wizard akisina alindi.
- [x] Kanal secimine gore takip no/kargo firmasi adimi dinamiklestirildi.
- [x] Firma -> Sube secimi ayarlardan yonetilecek sekilde yeni kaynaklar eklendi.
- [x] Bildirilen ariza secenekleri coklu secim + ayarlardan yonetilebilir hale getirildi.
- [x] Kozmetik `Kargodan Hasarli Geldi` seciminde gorsel yukleme zorunlu hale getirildi.
- [x] Wizard adim gostergesi ilerleme durumunu kart + progress bar ile daha okunur hale getirildi.
- [x] Kanal secim adimi kart tabanli secim deneyimi ile daha hizli/estetik hale getirildi.

## 13) Gelen/Giden Dashboard Sayac Duzeltmesi

- [x] Gelen/Giden kartlarindaki sayaclar sadece aktif tabdan degil tum kayitlardan hesaplanacak sekilde duzeltildi.
- [x] Ayri sol menu ekranlarinda (`Kargo Takibi Gelen`, `Kargo Takibi Giden`) sayaclarin 0 gorunme yanilgisi giderildi.

## 14) Ayarlar Kapsami Genisletme

- [x] `Kargo Firmalari` icin Ayarlar ekranina yonetim karti eklendi (ekle + aktif/pasif).
- [x] `Kargo Firmasi` secim listeleri yalnizca aktif firmalari gosterecek sekilde guncellendi.
- [x] Gelen kargo wizardinda firma listesi bossa kullaniciya "Ayarlar'dan ekleyin" yonlendirmesi eklendi.

## 15) Gelen Kargo Is Kurali Duzeltmeleri

- [x] Gelen kargoda depo bilgisi her zaman `Merkez Ofis Deposu` olacak sekilde sabitlendi.
- [x] Gelen kargo kayitlarinda `Alici` anlamsiz oldugu icin veri seviyesi ve UI seviyesinde bos/`-` olarak ele alindi.
