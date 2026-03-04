# UI Redesign Plan (Non-Breaking)

Amac: Mevcut gridler, veri akis ve is kurallari korunarak arayuzu kurumsal + premium dark dile tasimak.

## Baslangic
- [x] Plan dosyasi olusturuldu
- [x] Canli tasarim onizleme ekrani eklendi (`/dashboard/ui-preview`)
- [x] Dark tasarim dili preview seviyesinde finalize edildi
- [x] Fazlara bolunmus gecis yaklasimi netlesti

## Faz 1 - Theme Foundation (Tamamlandi)
- [x] Proje dark default yapildi (`<html class="dark">`)
- [x] Global design token dark matrisi guncellendi
- [x] Dashboard shell (layout, sidebar, header) dark premium stile tasindi
- [x] Is akislarina dokunmadan sadece sunum katmani degistirildi

## Faz 2 - Shared Component Standardization
- [x] `Button`, `Card`, `Input`, `Tabs` dark visual tuning uygulandi
- [ ] `Select`, `Badge`, `Dialog` visual tuning
- [x] Motion standardi ilk seviye (hover/focus/transition timing) uygulandi
- [ ] Table surface standardi (header/body/hover/readability)

## Faz 3 - Screen Rollout (Akis Bozulmadan)
- [ ] Kargo Takibi (Gelen/Giden)
- [ ] Depolar (liste + detay)
- [ ] Cihaz Tamiri
- [ ] Teknik Servis Takibi
- [ ] Tedarikci Takibi
- [ ] Muadil Cihazlar

## Faz 4 - Polish + QA
- [ ] Responsive kontrol (desktop/tablet/mobile)
- [ ] A11y (kontrast, focus, keyboard)
- [ ] Performans (animasyon ve render)
- [ ] Son gorsel tutarlilik ve text cleanup

## Uygulama Kurali
- Veri modeli, endpoint ve is kurali degismez.
- Her faz kucuk PR mantiginda uygulanir ve tamamlandikca tiklenir.
