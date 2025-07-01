# SPS Sürücü Değerlendirme Sistemi

## Proje Dokümanı

---

## 1. Proje Amacı

Bu proje, sürücülerin çok kriterli karar verme yöntemleriyle (AHP ve TOPSIS) objektif olarak değerlendirilmesini ve sıralanmasını sağlayan bir web uygulamasıdır. Amaç, sürücü performansını etkileyen farklı kriterleri dikkate alarak, adil ve şeffaf bir puanlama ve sıralama sistemi sunmaktır. Böylece, filo yönetimi, ödüllendirme, eğitim ihtiyaçlarının belirlenmesi gibi süreçlerde veri odaklı kararlar alınabilir.

---

## 2. Çalışma Mantığı

Uygulama, kullanıcıdan sürücülere ait verileri (Excel dosyası olarak) ve kriter ağırlıklarını (AHP yöntemiyle veya eşit ağırlık seçeneğiyle) alır. Ardından, bu veriler üzerinde TOPSIS algoritmasını çalıştırarak sürücüleri en iyi performanstan en düşük performansa doğru sıralar.

### Temel Adımlar:
1. **Kriterlerin Tanımlanması:**  
   Sürücü performansını etkileyen kriterler belirlenir (ör. sağlık devamsızlığı, hatalı hızlanma, sefer sayısı, vb.).

2. **AHP ile Kriter Ağırlıklarının Hesaplanması:**  
   Kullanıcı, AHP ölçme aracı ile kriterler arası ikili karşılaştırmalar yapar. Sonuçta her kriter için bir ağırlık (önem derecesi) elde edilir.  
   Alternatif olarak, kullanıcı "Varsayılan Eşit Ağırlıkları Kullan" seçeneğiyle tüm kriterleri eşit önemde değerlendirebilir.

3. **Veri Yükleme:**  
   Kullanıcı, sürücülere ait verileri içeren bir Excel dosyası yükler. Dosyada her sürücü için kriterlere karşılık gelen değerler bulunur.

4. **TOPSIS ile Sıralama:**  
   Yüklenen veriler ve kriter ağırlıkları kullanılarak TOPSIS algoritması çalıştırılır ve sürücüler puanlanır/sıralanır.

5. **Sonuçların Görselleştirilmesi ve Dışa Aktarımı:**  
   Sıralama sonuçları tablo ve grafiklerle gösterilir. Kullanıcı, sonuçları Excel veya PDF olarak dışa aktarabilir.

---

## 3. Kullanılan Algoritmalar

### 3.1. AHP (Analitik Hiyerarşi Süreci)
- Kriterler arası ikili karşılaştırmalar yapılır.
- Tutarlılık oranı hesaplanır.
- Her kriter için ağırlık (önem derecesi) bulunur.
- Sonuçlar, TOPSIS'te kullanılmak üzere kaydedilir.

### 3.2. TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)
- Kriter değerleri normalize edilir.
- Kriter ağırlıkları uygulanır (AHP'den veya eşit ağırlık).
- Her sürücü için ideal ve anti-ideal çözümlere olan uzaklıklar hesaplanır.
- Yakınlık katsayısı (C*) ile sürücüler sıralanır.

---

## 4. Hedefler

- Sürücü performansını çok kriterli ve nesnel şekilde değerlendirmek.
- Filo yönetiminde adil, şeffaf ve tekrarlanabilir kararlar alınmasını sağlamak.
- Kriter ağırlıklarının kullanıcı tarafından esnek şekilde belirlenebilmesini sağlamak.
- Sonuçların kolayca dışa aktarılabilmesini ve raporlanabilmesini sağlamak.
- Kullanıcı dostu, modern ve erişilebilir bir arayüz sunmak.

---

## 5. Sonuçlar ve Raporlama

- Sürücüler, TOPSIS puanına göre en iyi performanstan en düşük performansa doğru sıralanır.
- Her aşamanın (normalize matris, ağırlıklı matris, ideal çözümler, uzaklıklar) detayları Excel olarak dışa aktarılabilir.
- Sonuçlar tablo ve grafiklerle görselleştirilir.
- Kullanıcı, isterse AHP değerlendirmesi yapmadan da eşit ağırlıklarla sıralama alabilir.
- Hatalar ve eksik veri durumunda kullanıcıya bilgilendirici uyarılar gösterilir.

---

## 6. Arayüz Özellikleri

- **Ana Menü:** Ana sayfa, AHP ölçme aracı, AHP sonuçları, TOPSIS verileri, toplu ağırlıklar ve tüm sonuçlar sekmeleri.
- **Veri Yükleme:** Excel dosyası yükleme alanı, dosya seçilmedi uyarısı, yükleme sonrası veri önizlemesi.
- **AHP Global Kriter Ağırlıkları:** Kriterlerin ağırlıklarını ve tipini (fayda/maliyet) gösteren tablo.
- **TOPSIS Sıralaması:** Hesaplama butonu, sonuç tablosu, dışa aktarım butonları (Excel/PDF).
- **Hata Yönetimi:** Eksik veri, hatalı dosya veya algoritma hatalarında kullanıcıya açıklayıcı uyarılar.
- **Responsive Tasarım:** Mobil ve masaüstü uyumlu, modern ve sade arayüz.

---

## 7. Teknik Notlar

- **Teknolojiler:** Next.js, React, Tailwind CSS, XLSX, jsPDF, localStorage.
- **Veri Güvenliği:** Yüklenen veriler tarayıcıda işlenir, dışarıya aktarılmaz.
- **Geliştirilebilirlik:** Kriterler, algoritmalar ve raporlama modülleri kolayca genişletilebilir.

---

## 8. Beklenen Katkılar

- Sürücü değerlendirme süreçlerinde insan hatasını ve öznelliği azaltır.
- Kurumsal raporlama ve ödüllendirme süreçlerinde şeffaflık sağlar.
- Eğitim ve iyileştirme ihtiyaçlarının tespitinde veri odaklı yaklaşım sunar.

---

Her türlü geliştirme, hata bildirimi veya yeni özellik talebi için proje ekibiyle iletişime geçebilirsiniz.

---