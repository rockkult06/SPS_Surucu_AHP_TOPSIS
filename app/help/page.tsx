"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Zap,
  Gauge,
  Clock,
  Users,
  Car,
  FileWarning,
  ClockIcon,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="card-shadow overflow-hidden border-0">
          <CardHeader className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-8">
            <CardTitle className="text-2xl font-bold">Yardım ve Bilgi</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              AHP yöntemi, proje ve algoritma hakkında detaylı bilgiler
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs defaultValue="ahp" className="space-y-6">
              <TabsList className="grid grid-cols-4 p-1 rounded-full bg-secondary">
                <TabsTrigger value="ahp" className="rounded-full">
                  AHP Yöntemi
                </TabsTrigger>
                <TabsTrigger value="criteria" className="rounded-full">
                  Değerlendirme Kriterleri
                </TabsTrigger>
                <TabsTrigger value="algorithm" className="rounded-full">
                  Algoritma
                </TabsTrigger>
                <TabsTrigger value="topsis" className="rounded-full">
                  TOPSIS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ahp" className="space-y-4 p-4">
                <h2 className="text-xl font-semibold">Analitik Hiyerarşi Süreci (AHP) Nedir?</h2>
                <p>
                  Analitik Hiyerarşi Süreci (AHP), 1970'lerde Thomas L. Saaty tarafından geliştirilen çok kriterli karar
                  verme yöntemidir. Bu yöntem, karmaşık karar problemlerini hiyerarşik bir yapıda ele alarak,
                  kriterlerin ikili karşılaştırmalarına dayalı olarak her bir kriterin göreceli önemini belirler.
                </p>

                <h3 className="text-lg font-medium mt-4">AHP'nin Temel Adımları</h3>
                <ol className="list-decimal pl-6 space-y-2 mt-2">
                  <li>Karar probleminin hiyerarşik yapısını oluşturma</li>
                  <li>İkili karşılaştırma matrislerini oluşturma</li>
                  <li>Kriterlerin ağırlıklarını hesaplama</li>
                  <li>Tutarlılık oranını kontrol etme</li>
                  <li>Sonuçları değerlendirme ve karar verme</li>
                </ol>

                <h3 className="text-lg font-medium mt-4">Saaty'nin 1-9 Ölçeği</h3>
                <p>AHP'de kriterlerin ikili karşılaştırmaları için Saaty'nin 1-9 ölçeği kullanılır:</p>
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full border-collapse rounded-xl overflow-hidden shadow-sm">
                    <thead>
                      <tr className="bg-accent">
                        <th className="border border-border px-4 py-2">Değer</th>
                        <th className="border border-border px-4 py-2">Tanım</th>
                        <th className="border border-border px-4 py-2">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="even:bg-secondary/30">
                        <td className="border border-border px-4 py-2 text-center">1</td>
                        <td className="border border-border px-4 py-2">Eşit derecede önemli</td>
                        <td className="border border-border px-4 py-2">İki kriter eşit derecede öneme sahip</td>
                      </tr>
                      <tr className="odd:bg-secondary/10">
                        <td className="border border-border px-4 py-2 text-center">3</td>
                        <td className="border border-border px-4 py-2">Biri diğerine göre hafif daha önemli</td>
                        <td className="border border-border px-4 py-2">
                          Tecrübe ve yargı bir kriteri diğerine göre biraz daha fazla tercih ettiriyor
                        </td>
                      </tr>
                      <tr className="even:bg-secondary/30">
                        <td className="border border-border px-4 py-2 text-center">5</td>
                        <td className="border border-border px-4 py-2">Orta derecede daha önemli</td>
                        <td className="border border-border px-4 py-2">
                          Tecrübe ve yargı bir kriteri diğerine göre çok daha fazla tercih ettiriyor
                        </td>
                      </tr>
                      <tr className="odd:bg-secondary/10">
                        <td className="border border-border px-4 py-2 text-center">7</td>
                        <td className="border border-border px-4 py-2">Güçlü şekilde daha önemli</td>
                        <td className="border border-border px-4 py-2">
                          Bir kriter diğerine göre çok güçlü bir şekilde tercih ediliyor
                        </td>
                      </tr>
                      <tr className="even:bg-secondary/30">
                        <td className="border border-border px-4 py-2 text-center">9</td>
                        <td className="border border-border px-4 py-2">Aşırı derecede daha önemli</td>
                        <td className="border border-border px-4 py-2">
                          Bir kriterin diğerine göre tercih edilmesine ilişkin kanıtlar maksimum güvenilirlikte
                        </td>
                      </tr>
                      <tr className="odd:bg-secondary/10">
                        <td className="border border-border px-4 py-2 text-center">2, 4, 6, 8</td>
                        <td className="border border-border px-4 py-2">Ara değerler</td>
                        <td className="border border-border px-4 py-2">Uzlaşma gerektiğinde kullanılır</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="criteria" className="space-y-4 p-4">
                <h2 className="text-xl font-semibold">Değerlendirme Kriterleri</h2>
                <p className="mb-4">
                  Sürücü performans değerlendirmesinde kullanılan kriterlerin detaylı açıklamaları aşağıda verilmiştir:
                </p>

                <Accordion type="single" collapsible className="space-y-4">
                  {/* İdari Değerlendirme */}
                  <AccordionItem value="admin" className="border rounded-xl overflow-hidden">
                    <AccordionTrigger className="px-6 py-4 hover:bg-secondary/20">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-lg font-semibold">1. İdari Değerlendirme</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 pt-2">
                      <div className="space-y-4">
                        {/* Sağlık Sebebiyle Devamsızlık Durumu */}
                        <div className="bg-card p-5 rounded-xl border shadow-sm">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 mr-3">
                              <Users className="h-5 w-5 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold">1.1. Sağlık Sebebiyle Devamsızlık Durumu</h3>
                            <span className="ml-2 text-red-600">
                              <TrendingDown className="h-4 w-4" />
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-2">
                            Sürücünün sağlık sebebiyle devamsızlık sayısı veya oranı
                          </p>
                          <div className="bg-accent/30 p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">Teknik Tanım:</p>
                            <p>
                              Sürücünün belirli bir dönem içerisinde sağlık sorunları nedeniyle işe gelmediği gün sayısı
                              veya toplam çalışma günlerine oranı.
                            </p>
                            <p className="mt-2 text-muted-foreground">
                              Değerlendirme: <span className="text-red-600 font-medium">Negatif etki</span> - Yüksek
                              devamsızlık değerleri düşük performans puanına yol açar.
                            </p>
                          </div>
                        </div>

                        {/* Fazla Mesaili Çalışma Gayreti */}
                        <div className="bg-card p-5 rounded-xl border shadow-sm">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-3">
                              <ClockIcon className="h-5 w-5 text-purple-500" />
                            </div>
                            <h3 className="text-lg font-semibold">1.2. Fazla Mesaili Çalışma Gayreti</h3>
                          </div>
                          <p className="text-muted-foreground mb-2">Sürücünün fazla mesai yapma konusundaki gayreti</p>
                          <div className="bg-accent/30 p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">Alt Kriterler:</p>
                            <ul className="list-disc pl-5 space-y-2">
                              <li>
                                <span className="font-medium">1.2.1. Normal Fazla Mesai:</span> Normal çalışma
                                günlerinde yapılan fazla mesai saatleri
                                <span className="ml-2 text-green-600">
                                  <TrendingUp className="h-4 w-4 inline" />
                                </span>
                              </li>
                              <li>
                                <span className="font-medium">1.2.2. Hafta Tatili Mesaisi:</span> Hafta tatilinde
                                yapılan mesai saatleri
                                <span className="ml-2 text-green-600">
                                  <TrendingUp className="h-4 w-4 inline" />
                                </span>
                              </li>
                              <li>
                                <span className="font-medium">1.2.3. Resmi Tatil Mesaisi:</span> Resmi tatillerde
                                yapılan mesai saatleri
                                <span className="ml-2 text-green-600">
                                  <TrendingUp className="h-4 w-4 inline" />
                                </span>
                              </li>
                            </ul>
                            <p className="mt-2 text-muted-foreground">
                              Değerlendirme: <span className="text-green-600 font-medium">Pozitif etki</span> - Yüksek
                              fazla mesai saatleri daha iyi performans göstergesidir.
                            </p>
                          </div>
                        </div>

                        {/* Yapılan Km'ye Göre Kaza Durumu */}
                        <div className="bg-card p-5 rounded-xl border shadow-sm">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 mr-3">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold">1.3. Yapılan Km'ye Göre Kaza Durumu (Atölye Dışı)</h3>
                          </div>
                          <p className="text-muted-foreground mb-2">
                            Sürücünün yaptığı kilometreye oranla karıştığı kazalar
                          </p>
                          <div className="bg-accent/30 p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">Alt Kriterler:</p>
                            <ul className="list-disc pl-5 space-y-2">
                              <li>
                                <span className="font-medium">1.3.1. Ölümle Sonuçlanan Kaza:</span> Ölümle sonuçlanan
                                kazaların yapılan kilometreye oranı
                                <span className="ml-2 text-red-600">
                                  <TrendingDown className="h-4 w-4 inline" />
                                </span>
                              </li>
                              <li>
                                <span className="font-medium">1.3.2. Yaralanmalı Kaza:</span> Yaralanmalı kazaların
                                yapılan kilometreye oranı
                                <span className="ml-2 text-red-600">
                                  <TrendingDown className="h-4 w-4 inline" />
                                </span>
                              </li>
                              <li>
                                <span className="font-medium">1.3.3. Maddi Hasarlı Kaza:</span> Maddi hasarlı kazaların
                                yapılan kilometreye oranı
                                <span className="ml-2 text-red-600">
                                  <TrendingDown className="h-4 w-4 inline" />
                                </span>
                              </li>
                            </ul>
                            <p className="mt-2 text-muted-foreground">
                              Değerlendirme: <span className="text-red-600 font-medium">Negatif etki</span> - Düşük kaza
                              oranları daha iyi performans göstergesidir.
                            </p>
                          </div>
                        </div>

                        {/* Yapılan Km'ye Göre Disiplin Durumu */}
                        <div className="bg-card p-5 rounded-xl border shadow-sm">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 mr-3">
                              <FileWarning className="h-5 w-5 text-orange-500" />
                            </div>
                            <h3 className="text-lg font-semibold">1.4. Yapılan Km'ye Göre Disiplin Durumu</h3>
                          </div>
                          <p className="text-muted-foreground mb-2">
                            Sürücünün yaptığı kilometreye oranla aldığı disiplin ihlalleri
                          </p>
                          <div className="bg-accent/30 p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">Alt Kriterler:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-1">
                              <li>
                                1.4.1. 1'nci derece disiplin ihlallerinden sevk sayısı kilometreye oranı{" "}
                                <span className="ml-2 text-red-600">
                                  <TrendingDown className="h-3 w-3 inline" />
                                </span>
                              </li>
                              <li>
                                1.4.2. 2'nci derece disiplin ihlallerinden sevk sayısı kilometreye oranı{" "}
                                <span className="ml-2 text-red-600">
                                  <TrendingDown className="h-3 w-3 inline" />
                                </span>
                              </li>
                              <li>
                                1.4.3. 3'ncü derece disiplin ihlallerinden sevk sayısı kilometreye oranı{" "}
                                <span className="ml-2 text-red-600">
                                  <TrendingDown className="h-3 w-3 inline" />
                                </span>
                              </li>
                              <li>
                                1.4.4. 4'ncü derece disiplin ihlallerinden sevk sayısı kilometreye oranı{" "}
                                <span className="ml-2 text-red-600">
                                  <TrendingDown className="h-3 w-3 inline" />
                                </span>
                              </li>
                            </ul>
                            <p className="mt-2 text-muted-foreground">
                              Değerlendirme: <span className="text-red-600 font-medium">Negatif etki</span> - Düşük
                              disiplin ihlali oranları daha iyi performans göstergesidir.
                            </p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Teknik Değerlendirme */}
                  <AccordionItem value="technical" className="border rounded-xl overflow-hidden">
                    <AccordionTrigger className="px-6 py-4 hover:bg-secondary/20">
                      <div className="flex items-center">
                        <Car className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-lg font-semibold">2. Teknik Değerlendirme (Telemetri)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 pt-2">
                      <div className="space-y-4">
                        {/* Hatalı Hızlanma Sayısı */}
                        <div className="bg-card p-5 rounded-xl border shadow-sm">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mr-3">
                              <Zap className="h-5 w-5 text-yellow-500" />
                            </div>
                            <h3 className="text-lg font-semibold">2.1. Hatalı Hızlanma Sayısı</h3>
                            <span className="ml-2 text-red-600">
                              <TrendingDown className="h-4 w-4" />
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-2">
                            Sürekli hızlanma sonrası ani duruş ve tekrar hızlanma davranışı
                          </p>
                          <div className="bg-accent/30 p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">Teknik Tanım:</p>
                            <p>
                              120 sn içerisinde sürekli hız artışı gerçekleşen aracın ani fren yapıp 0-5 km/s aralığına
                              düşmesidir. Sürekli olarak aracın son 120 sn'si incelenecektir.
                            </p>
                            <p className="mt-2 text-muted-foreground">
                              Değerlendirme: <span className="text-red-600 font-medium">Negatif etki</span> - Düşük
                              değerler daha iyi performans göstergesidir.
                            </p>
                          </div>
                        </div>

                        {/* Hız İhlal Sayısı */}
                        <div className="bg-card p-5 rounded-xl border shadow-sm">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                              <Gauge className="h-5 w-5 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold">2.2. Hız İhlal Sayısı</h3>
                            <span className="ml-2 text-red-600">
                              <TrendingDown className="h-4 w-4" />
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-2">Uzun süre yüksek hızda seyretme davranışı</p>
                          <div className="bg-accent/30 p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">Teknik Tanım:</p>
                            <p>
                              Konum ve rota önemli olmaksızın 120 sn den fazla süre ve 80 km/s den yüksek bir hızda
                              gidilmesini ifade etmektedir.
                            </p>
                            <p className="mt-2 text-muted-foreground">
                              Değerlendirme: <span className="text-red-600 font-medium">Negatif etki</span> - Düşük
                              değerler daha iyi performans göstergesidir.
                            </p>
                          </div>
                        </div>

                        {/* Motor Uyarısı */}
                        <div className="bg-card p-5 rounded-xl border shadow-sm">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 mr-3">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold">2.3. Motor (KırmızıLamba) Uyarısı</h3>
                            <span className="ml-2 text-red-600">
                              <TrendingDown className="h-4 w-4" />
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-2">Motor arıza lambası aktifken araç kullanımı</p>
                          <div className="bg-accent/30 p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">Teknik Tanım:</p>
                            <p>
                              Motor Arıza (Kırmızı) Lambası AKTİF olduğu halde 30 dk boyunca araç kullanımı
                              gerçekleştirilmesini ifade edilmektedir.
                            </p>
                            <p className="mt-2 text-muted-foreground">
                              Değerlendirme: <span className="text-red-600 font-medium">Negatif etki</span> - Düşük
                              değerler daha iyi performans göstergesidir.
                            </p>
                          </div>
                        </div>

                        {/* Rölanti İhlal Sayısı */}
                        <div className="bg-card p-5 rounded-xl border shadow-sm">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 mr-3">
                              <Clock className="h-5 w-5 text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold">2.4. Rölanti İhlal Sayısı</h3>
                            <span className="ml-2 text-red-600">
                              <TrendingDown className="h-4 w-4" />
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-2">
                            Araç çalışır durumda uzun süre hareketsiz bekleme
                          </p>
                          <div className="bg-accent/30 p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">Teknik Tanım:</p>
                            <p>300 sn (5 dk) üstünde rölanti yapan araçlar tespit edilmektedir.</p>
                            <p className="mt-2 text-muted-foreground">
                              Değerlendirme: <span className="text-red-600 font-medium">Negatif etki</span> - Düşük
                              değerler daha iyi performans göstergesidir.
                            </p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="algorithm" className="space-y-4 p-4">
                <h2 className="text-xl font-semibold">AHP Algoritması</h2>
                <p>
                  Bu uygulamada kullanılan AHP algoritması, kriterlerin ikili karşılaştırmalarından ağırlıkların
                  hesaplanması ve tutarlılık kontrolü için standart AHP metodolojisini takip etmektedir.
                </p>

                <h3 className="text-lg font-medium mt-4">Algoritma Adımları</h3>
                <ol className="list-decimal pl-6 space-y-2 mt-2">
                  <li>
                    <strong>Karşılaştır Matrisi Oluşturma:</strong> Kullanıcının girdiği ikili karşılaştırma değerleri
                    ile n×n boyutunda bir matris oluşturulur.
                  </li>
                  <li>
                    <strong>Normalize Etme:</strong> Her sütunun toplamı hesaplanır ve matrisin her elemanı kendi
                    sütununun toplamına bölünür.
                  </li>
                  <li>
                    <strong>Ağırlık Hesaplama:</strong> Normalize edilmiş matrisin her satırının ortalaması alınarak
                    kriter ağırlıkları hesaplanır.
                  </li>
                  <li>
                    <strong>Tutarlılık Kontrolü:</strong> Consistency Ratio (CR) hesaplanarak karşılaştırmaların
                    tutarlılığı kontrol edilir.
                  </li>
                </ol>

                <h3 className="text-lg font-medium mt-4">Tutarlılık Oranı (CR)</h3>
                <p>
                  Tutarlılık oranı, ikili karşılaştırmaların ne kadar tutarlı olduğunu gösterir. CR ≤ 0.10 olması kabul
                  edilebilir tutarlılık seviyesini ifade eder.
                </p>

                <div className="bg-accent/30 p-4 rounded-lg mt-4">
                  <h4 className="font-medium mb-2">CR Hesaplama Formülü:</h4>
                  <p className="font-mono text-sm">CR = CI / RI</p>
                  <p className="text-sm mt-2">
                    <strong>CI:</strong> Consistency Index (Tutarlılık İndeksi)
                    <br />
                    <strong>RI:</strong> Random Index (Rastgele İndeks)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="topsis" className="space-y-4 p-4">
                <h2 className="text-xl font-semibold">TOPSIS Yöntemi</h2>
                <p>
                  TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution), çok kriterli karar verme
                  problemlerinde alternatifleri sıralamak için kullanılan bir yöntemdir. Bu yöntem, her alternatifin
                  ideal çözüme olan uzaklığını ve negatif ideal çözüme olan uzaklığını hesaplayarak sıralama yapar.
                </p>

                <h3 className="text-lg font-medium mt-4">TOPSIS Algoritması Adımları</h3>
                <ol className="list-decimal pl-6 space-y-2 mt-2">
                  <li>
                    <strong>Karar Matrisini Oluşturma:</strong> Sürücüler (alternatifler) ve kriterler için bir matris
                    oluşturulur.
                  </li>
                  <li>
                    <strong>Normalize Etme:</strong> Karar matrisi normalize edilir (vektör normalizasyonu).
                  </li>
                  <li>
                    <strong>Ağırlıklı Normalize Matris:</strong> AHP'den elde edilen ağırlıklar ile normalize matris
                    çarpılır.
                  </li>
                  <li>
                    <strong>İdeal ve Negatif İdeal Çözümler:</strong> Her kriter için en iyi ve en kötü değerler
                    belirlenir.
                  </li>
                  <li>
                    <strong>Uzaklık Hesaplama:</strong> Her alternatifin ideal ve negatif ideal çözümlere olan
                    uzaklıkları hesaplanır.
                  </li>
                  <li>
                    <strong>Yakınlık Katsayısı:</strong> Her alternatif için yakınlık katsayısı hesaplanır.
                  </li>
                  <li>
                    <strong>Sıralama:</strong> Yakınlık katsayısına göre alternatifler sıralanır.
                  </li>
                </ol>

                <h3 className="text-lg font-medium mt-4">Kriter Türleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Pozitif Kriterler (Fayda)
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Yüksek değerlerin daha iyi olduğu kriterler. Örnek: Fazla mesai saatleri
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Negatif Kriterler (Maliyet)
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Düşük değerlerin daha iyi olduğu kriterler. Örnek: Kaza sayısı, devamsızlık
                    </p>
                  </div>
                </div>

                <div className="bg-accent/30 p-4 rounded-lg mt-4">
                  <h4 className="font-medium mb-2">Yakınlık Katsayısı Formülü:</h4>
                  <p className="font-mono text-sm">C*ᵢ = S⁻ᵢ / (S⁺ᵢ + S⁻ᵢ)</p>
                  <p className="text-sm mt-2">
                    <strong>S⁺ᵢ:</strong> i. alternatifin pozitif ideal çözüme uzaklığı
                    <br />
                    <strong>S⁻ᵢ:</strong> i. alternatifin negatif ideal çözüme uzaklığı
                    <br />
                    <strong>C*ᵢ:</strong> 0 ile 1 arasında değer alır, 1'e yakın değerler daha iyi performansı gösterir.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
