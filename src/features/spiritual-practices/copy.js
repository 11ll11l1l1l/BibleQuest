import { formatPracticeTitle } from './routine-catalog.js';
// Authored EN/TL/CEB practice copy. Scripture and private notes are never translated here.
const ROWS = `
Suggested practice|Iminungkahing pagsasanay|Gisugyot nga pagbansay
Your current session is kept. Finish it and choose another practice when ready.|Nananatili ang kasalukuyan mong session. Tapusin ito at pumili ng ibang pagsasanay kapag handa ka na.|Gipabilin ang imong kasamtangang sesyon. Taposa kini ug pagpili og laing pagbansay kon andam ka na.
Opening this guide does not start a timer. Choose when you are ready.|Hindi nagsisimula ang timer sa pagbukas ng gabay. Pumili kapag handa ka na.|Dili magsugod ang timer sa pag-abli sa giya. Pagpili kon andam ka na.
Begin suggested practice|Simulan ang iminungkahing pagsasanay|Sugdi ang gisugyot nga pagbansay
Answers are optional. Unsaved changes stay only on this page until you leave.|Opsyonal ang mga sagot. Mananatili lang sa pahinang ito ang hindi na-save na pagbabago hanggang umalis ka.|Opsyonal ang mga tubag. Ang wala ma-save nga kausaban magpabilin ra niining panid hangtod mobiya ka.
Saved reflection updated on this device.|Na-update ang naka-save na pagninilay sa device na ito.|Na-update ang gi-save nga pagpamalandong niining device.
Save changes on this device|I-save ang pagbabago sa device na ito|Tipigi ang kausaban niining device
Cancel editing|Kanselahin ang pag-edit|Kanselaha ang pag-edit
Edit saved reflection|I-edit ang naka-save na pagninilay|I-edit ang gi-save nga pagpamalandong
Reminder practice|Pagsasanay para sa paalala|Pagbansay alang sa pahinumdom
Practice days|Mga araw ng pagsasanay|Mga adlaw sa pagbansay
Sunday|Linggo|Dominggo
Monday|Lunes|Lunes
Tuesday|Martes|Martes
Wednesday|Miyerkules|Miyerkules
Thursday|Huwebes|Huwebes
Friday|Biyernes|Biyernes
Saturday|Sabado|Sabado
Choose at least one weekday and a listed practice.|Pumili ng kahit isang araw at isang pagsasanay sa listahan.|Pagpili og labing menos usa ka adlaw ug pagbansay sa listahan.
Spiritual Practices|Mga Espirituwal na Pagsasanay|Mga Espirituhanong Pagbansay
PRIVATE · THIS DEVICE|PRIBADO · SA DEVICE NA ITO|PRIBADO · NIINING DEVICE
Make space for God, reflection and a loving response.|Maglaan ng puwang para sa Diyos, pagninilay at pagtugon nang may pag-ibig.|Paggahin og luna alang sa Diyos, pagpamalandong ug mahigugmaong pagtubag.
No cloud sync. On a shared device, anyone using the same account or guest profile may access saved reflections.|Walang cloud sync. Sa shared device, maaaring makita ng gumagamit ng parehong account o guest profile ang mga na-save na pagninilay.|Walay cloud sync. Sa gipaambit nga device, makita sa naggamit sa samang account o guest profile ang natipig nga mga pagpamalandong.
Some provider details remain in their source language.|Maaaring manatili sa orihinal na wika ang ilang detalye ng provider.|Ang ubang detalye sa provider magpabilin sa ilang orihinal nga pinulongan.
English fallback|English na pamalit|English nga kapuli
Selected Scripture|Napiling Kasulatan|Gipiling Kasulatan
Library|Aklatan|Librarya
Read a passage first|Magbasa muna ng talata|Pagbasa una og bersikulo
Adapted app routine|Inangkop na gabay sa app|Gipahaom nga giya sa app
Original two-hour stage sequence|Orihinal na dalawang-oras na pagkakasunod|Orihinal nga duha-ka-oras nga han-ay
Remaining in this stage|Natitirang oras sa bahaging ito|Nahibiling oras niini nga bahin
stage|bahagi|bahin
of|sa|sa
running|tumatakbo|nagdagan
paused|nakahinto|gihunong kadiyot
completed|tapos|nahuman
ended|tinapos|gitapos
Stage guide|Gabay sa bahaging ito|Giya niini nga bahin
Resume|Ituloy|Ipadayon
Pause|Ihinto sandali|Hunong kadiyot
Skip stage|Laktawan ang bahaging ito|Laktawi kini nga bahin
End early|Tapusin nang maaga|Taposa og sayo
Turn transition sound off|Patayin ang tunog ng paglipat|Palonga ang tingog sa pagbalhin
Enable transition sound|Buksan ang tunog ng paglipat|Paandara ang tingog sa pagbalhin
Allow screen sleep|Payagang matulog ang screen|Tugoti nga mopalong ang screen
Keep screen awake|Panatilihing bukas ang screen|Ipabiling bukas ang screen
Put your phone aside if helpful. Background alerts are not guaranteed. Return here to see elapsed time.|Itabi ang telepono kung makatutulong. Hindi garantisado ang alert kapag nasa background. Bumalik dito para makita ang lumipas na oras.|Ipadaplin ang telepono kon makatabang. Dili garantiya ang alert sa background. Balik dinhi aron makita ang milabay nga oras.
The scheduled time has elapsed. Reflect on what you practiced.|Lumipas na ang itinakdang oras. Pagnilayan ang iyong isinagawa.|Milabay na ang gitakdang oras. Pamalandongi ang imong gibansay.
Session ended early. You can still reflect.|Maagang tinapos ang session. Maaari ka pa ring magnilay.|Sayong gitapos ang sesyon. Mahimo ka gihapong mamalandong.
Optional private reflection|Opsyonal na pribadong pagninilay|Opsyonal nga pribadong pagpamalandong
Save reflection on this device|I-save ang pagninilay sa device na ito|Tipigi ang pagpamalandong niining device
Choose another practice|Pumili ng ibang pagsasanay|Pagpili og laing pagbansay
Choose a practice|Pumili ng pagsasanay|Pagpili og pagbansay
Custom Silencio minutes (adapted)|Sariling haba ng Silencio sa minuto (inangkop)|Kaugalingong gidugayon sa Silencio sa minuto (gipahaom)
Start custom silence|Simulan ang sariling haba ng katahimikan|Sugdi ang kaugalingong gidugayon sa kahilom
Silence is an invitation to relationship with God. Minutes are not a measure of spiritual worth.|Ang katahimikan ay paanyaya sa pakikipag-ugnayan sa Diyos. Hindi sukatan ng espirituwal na halaga ang dami ng minuto.|Ang kahilom usa ka pagdapit sa relasyon sa Diyos. Dili sukdanan sa espirituhanong bili ang gidaghanon sa minuto.
Practice reminder plan|Plano ng paalala sa pagsasanay|Plano sa pahinumdom sa pagbansay
Shown on Home while BibleQuest is open. This device only; no closed-app alert. Uses your notification master switch, Bible reading category and device-local quiet hours.|Ipinapakita sa Home habang bukas ang BibleQuest. Sa device na ito lamang; walang alert kapag sarado ang app. Sinusunod ang pangunahing notification switch, kategorya ng pagbabasa ng Biblia at quiet hours ng device.|Ipakita sa Home samtang bukas ang BibleQuest. Niining device lamang; walay alert kon sirado ang app. Mosunod sa pangunang notification switch, kategoriya sa pagbasa sa Biblia ug quiet hours sa device.
Enable app-open reminder|Buksan ang paalala habang bukas ang app|Paandara ang pahinumdom samtang abli ang app
Time|Oras|Oras
Time zone|Time zone|Time zone
Save reminder|I-save ang paalala|Tipigi ang pahinumdom
Offline practice|Pagsasanay na offline|Offline nga pagbansay
Refresh offline status|I-refresh ang offline status|I-refresh ang offline status
Practice in daily life|Pagsasanay sa araw-araw|Pagbansay sa adlaw-adlaw
Recent reflections|Mga huling pagninilay|Bag-ong mga pagpamalandong
No written reflection.|Walang nakasulat na pagninilay.|Walay sinulat nga pagpamalandong.
Delete saved reflection|Burahin ang na-save na pagninilay|Papasa ang natipig nga pagpamalandong
No saved reflections yet.|Wala pang na-save na pagninilay.|Wala pay natipig nga pagpamalandong.
Loading selected Scripture…|Kinukuha ang napiling Kasulatan…|Gikarga ang gipiling Kasulatan…
Checking offline availability…|Sinusuri ang offline availability…|Gisusi ang offline availability…
Practice guide code is prepared in the existing offline shell.|Naihanda na ang mga gabay sa kasalukuyang offline shell.|Naandam na ang mga giya sa kasamtangang offline shell.
Offline shell is not ready. Open the app online and try again; offline launch is not guaranteed.|Hindi pa handa ang offline shell. Buksan ang app online at subukang muli; hindi pa garantisado ang pagbukas nang offline.|Dili pa andam ang offline shell. Ablihi ang app online ug sulayi pag-usab; dili pa garantiya ang pag-abli offline.
Saved Bible book has an update available.|May bagong bersyon ang na-save na aklat ng Biblia.|Adunay bag-ong bersiyon ang natipig nga basahon sa Biblia.
Selected Bible book is saved in managed offline storage.|Na-save ang napiling aklat ng Biblia sa pinamamahalaang offline storage.|Natipig ang gipiling basahon sa Biblia sa gidumalang offline storage.
Selected Bible book is not downloaded.|Hindi pa na-download ang napiling aklat ng Biblia.|Wala pa ma-download ang gipiling basahon sa Biblia.
Cancel preparation|Kanselahin ang paghahanda|Kanselaha ang pag-andam
Refresh selected Bible book|I-refresh ang napiling aklat ng Biblia|I-refresh ang gipiling basahon sa Biblia
Prepare selected Bible book|Ihanda ang napiling aklat ng Biblia|Andama ang gipiling basahon sa Biblia
Remove selected offline Bible book|Alisin ang napiling offline na aklat ng Biblia|Kuhaa ang gipiling offline nga basahon sa Biblia
Uses the Bible Reader’s verified book downloads. Removing a book affects the Bible Reader too. Browser storage can be cleared by the device.|Gumagamit ng beripikadong download ng Bible Reader. Maaapektuhan din ang Bible Reader kapag inalis ang aklat. Maaaring burahin ng device ang browser storage.|Naggamit sa napamatud-ang download sa Bible Reader. Maapektuhan usab ang Bible Reader kon kuhaon ang basahon. Mahimong papason sa device ang browser storage.
Choose a verse in the Bible Reader to prepare its book for meditation offline.|Pumili ng bersikulo sa Bible Reader para ihanda ang aklat nito sa offline na pagninilay.|Pagpili og bersikulo sa Bible Reader aron maandam ang basahon niini alang sa offline nga pagpamalandong.
The saved timer could not be restored. Your saved reflections have been kept.|Hindi maibalik ang na-save na timer. Napanatili ang iyong mga na-save na pagninilay.|Dili mauli ang natipig nga timer. Gipabilin ang imong natipig nga mga pagpamalandong.
Device storage is unavailable. This session and reflection may be lost when you leave.|Hindi magamit ang storage ng device. Maaaring mawala ang session at pagninilay kapag umalis ka.|Dili magamit ang storage sa device. Mahimong mawala ang sesyon ug pagpamalandong kon mobiya ka.
Transition sound could not play.|Hindi tumunog ang tunog ng paglipat.|Dili motingog ang tingog sa pagbalhin.
Transition sound enabled for this visit. Missed background cues are not replayed.|Bukas ang tunog ng paglipat sa pagbisitang ito. Hindi uulitin ang mga nalampasang tunog sa background.|Bukas ang tingog sa pagbalhin niining pagbisita. Dili balikon ang nalaktawang tingog sa background.
Could not enable transition sound.|Hindi mabuksan ang tunog ng paglipat.|Dili mapaandar ang tingog sa pagbalhin.
Offline preparation cancelled.|Kinansela ang offline na paghahanda.|Gikansela ang offline nga pag-andam.
Offline Bible book removed.|Inalis ang offline na aklat ng Biblia.|Gikuha ang offline nga basahon sa Biblia.
Selected Bible book verified in managed offline storage.|Naberipika ang napiling aklat ng Biblia sa pinamamahalaang offline storage.|Napamatud-an ang gipiling basahon sa Biblia sa gidumalang offline storage.
Offline preparation failed.|Hindi natuloy ang offline na paghahanda.|Napakyas ang offline nga pag-andam.
Screen awake while this page remains visible. Your browser may release it.|Bukas ang screen habang nakikita ang pahinang ito. Maaaring ihinto ito ng browser.|Bukas ang screen samtang makita kini nga panid. Mahimong hunongon kini sa browser.
Could not keep the screen awake.|Hindi mapanatiling bukas ang screen.|Dili mapabiling bukas ang screen.
Read a passage first, tap a verse, then choose Meditate on this verse.|Magbasa muna, pindutin ang bersikulo, at piliin ang Pagnilayan ang bersikulong ito.|Pagbasa una, pislita ang bersikulo, ug pilia ang Pamalandongi kini nga bersikulo.
Could not dismiss the reminder on this device.|Hindi maisara ang paalala sa device na ito.|Dili masira ang pahinumdom niining device.
App-open reminder plan saved on this device.|Na-save sa device na ito ang plano ng paalala habang bukas ang app.|Natipig niining device ang plano sa pahinumdom samtang abli ang app.
Could not save reminder.|Hindi ma-save ang paalala.|Dili matipig ang pahinumdom.
Choose a whole number from 1 to 120 minutes.|Pumili ng buong bilang mula 1 hanggang 120 minuto.|Pagpili og tibuok nga numero gikan 1 hangtod 120 minuto.
Reflection saved on this device.|Na-save ang pagninilay sa device na ito.|Natipig ang pagpamalandong niining device.
Entering silence|Pagpasok sa katahimikan|Pagsulod sa kahilom
Find a quiet place. Set aside distractions and become attentive to God.|Humanap ng tahimik na lugar. Isantabi ang mga abala at ituon ang pansin sa Diyos.|Pangita og hilom nga dapit. Ipadaplin ang mga samok ug ipunting ang pagtagad sa Diyos.
Silent sitting|Tahimik na pag-upo|Hilom nga paglingkod
Be still. When distracted, gently return your attention to God.|Manahimik. Kapag naabala, mahinahong ibalik ang pansin sa Diyos.|Paghilom. Kon mabalda, hinayhinaya pagbalik ang imong pagtagad sa Diyos.
Listening|Pakikinig|Pagpaminaw
Notice your thoughts and concerns. Consider them in light of Scripture; impressions are not verified divine speech.|Pansinin ang iyong mga iniisip at alalahanin. Suriin ang mga ito ayon sa Kasulatan; hindi tiyak na salita ng Diyos ang mga pansariling impresyon.|Matikdi ang imong mga hunahuna ug kabalaka. Timbanga kini sumala sa Kasulatan; dili napamatud-ang pulong sa Diyos ang personal nga mga impresyon.
Scripture and silence|Kasulatan at katahimikan|Kasulatan ug kahilom
Recall a short passage you have read. Let its meaning settle without rushing.|Alalahanin ang maikling talatang binasa mo. Hayaan itong lumalim nang hindi nagmamadali.|Hinumdumi ang mubo nga bahin nga imong nabasa. Pasagdi nga molalom ang kahulogan niini nga dili magdali.
Heart examination|Pagsusuri ng puso|Pagsusi sa kasingkasing
Notice fear, anger, desire or resistance honestly before God.|Tapat na kilalanin sa harap ng Diyos ang takot, galit, pagnanasa o pagtutol.|Ilha nga matinud-anon atubangan sa Diyos ang kahadlok, kasuko, tinguha o pagsukol.
Gratitude|Pasasalamat|Pagpasalamat
Remember specific gifts and offer thanks.|Alalahanin ang mga tiyak na kaloob at magpasalamat.|Hinumdumi ang piho nga mga gasa ug pagpasalamat.
Surrender|Pagsuko sa Diyos|Pagtugyan sa Diyos
Entrust a concern or expectation to God.|Ipagkatiwala sa Diyos ang isang alalahanin o inaasahan.|Itugyan sa Diyos ang usa ka kabalaka o gilaoman.
Reflection|Pagninilay|Pagpamalandong
Choose one loving response to carry into your day.|Pumili ng isang tugong may pag-ibig na isasabuhay sa araw na ito.|Pagpili og usa ka mahigugmaong tubag nga buhaton niining adlawa.
Prepare|Maghanda|Pag-andam
Set aside distractions. Become present to God.|Isantabi ang mga abala. Ituon ang sarili sa presensya ng Diyos.|Ipadaplin ang mga samok. Ipunting ang kaugalingon sa presensya sa Diyos.
Stillness|Kapanatagan|Kalinaw
Sit quietly. Gently return when your attention wanders.|Umupo nang tahimik. Mahinahong ibalik ang pansin kapag nalilihis.|Lingkod nga hilom. Hinayhinaya pagbalik kon mosimang ang imong pagtagad.
Scripture meditation|Pagninilay sa Kasulatan|Pagpamalandong sa Kasulatan
Recall a short passage. Consider what it reveals about God and your response.|Alalahanin ang maikling talata. Pagnilayan ang ipinapakita nito tungkol sa Diyos at ang iyong pagtugon.|Hinumdumi ang mubo nga bahin. Pamalandongi ang gipadayag niini bahin sa Diyos ug ang imong tubag.
Gratitude and surrender|Pasasalamat at pagsuko sa Diyos|Pagpasalamat ug pagtugyan sa Diyos
Give thanks and entrust one concern to God.|Magpasalamat at ipagkatiwala sa Diyos ang isang alalahanin.|Pagpasalamat ug itugyan sa Diyos ang usa ka kabalaka.
Choose one faithful, loving response.|Pumili ng isang tapat at mapagmahal na pagtugon.|Pagpili og usa ka matinud-anon ug mahigugmaong tubag.
Silence|Katahimikan|Kahilom
Begin quietly in God’s presence.|Magsimula nang tahimik sa presensya ng Diyos.|Sugdi nga hilom sa presensya sa Diyos.
Give thanks for this day.|Magpasalamat para sa araw na ito.|Pagpasalamat alang niining adlawa.
Scripture|Kasulatan|Kasulatan
Recall a short passage read in the Bible Reader.|Alalahanin ang maikling talatang binasa sa Bible Reader.|Hinumdumi ang mubo nga bahin nga nabasa sa Bible Reader.
Formation|Paghubog|Paghulma
What Christlike quality do you need to practice today?|Anong katangiang tulad ni Cristo ang kailangan mong isagawa ngayon?|Unsang kinaiya nga sama kang Cristo ang kinahanglan nimong buhaton karon?
Entrust your schedule to God and choose one response.|Ipagkatiwala sa Diyos ang iyong iskedyul at pumili ng isang pagtugon.|Itugyan sa Diyos ang imong iskedyul ug pagpili og usa ka tubag.
Read slowly|Magbasa nang dahan-dahan|Pagbasa nga hinayhinay
Read the selected verse in its chapter context. Notice what it says about God.|Basahin ang napiling bersikulo ayon sa konteksto ng kabanata. Pansinin ang sinasabi nito tungkol sa Diyos.|Basaha ang gipiling bersikulo sumala sa konteksto sa kapitulo. Matikdi ang gisulti niini bahin sa Diyos.
Dwell|Manatili sa talata|Pabilin sa bersikulo
Stay with a word or phrase. Consider its meaning in context without rushing.|Manatili sa isang salita o parirala. Pagnilayan ang kahulugan nito sa konteksto nang hindi nagmamadali.|Pabilin sa usa ka pulong o hugpong sa mga pulong. Pamalandongi ang kahulogan niini sa konteksto nga dili magdali.
Respond in prayer|Tumugon sa panalangin|Tubag pinaagi sa pag-ampo
Speak honestly to God about what you have read.|Tapat na sabihin sa Diyos ang tungkol sa iyong binasa.|Isulti nga matinud-anon sa Diyos ang bahin sa imong nabasa.
Rest in silence|Magpahinga sa katahimikan|Pahulay sa kahilom
Rest attentively before God. Gently return to the passage when distracted.|Magpahinga nang nakatuon sa Diyos. Mahinahong bumalik sa talata kapag naabala.|Pahulay nga nagtagad sa Diyos. Hinayhinaya pagbalik sa bersikulo kon mabalda.
Live it|Isabuhay ito|Buhata kini
Choose one concrete, loving response to this Scripture.|Pumili ng isang tiyak at mapagmahal na tugon sa Kasulatang ito.|Pagpili og usa ka piho ug mahigugmaong tubag niining Kasulatan.
Remember|Alalahanin|Hinumdumi
Pause. Acknowledge Jesus’ presence and ask for help to love faithfully in this moment.|Huminto sandali. Kilalanin ang presensya ni Jesus at humingi ng tulong para magmahal nang tapat sa sandaling ito.|Hunong kadiyot. Ilha ang presensya ni Jesus ug pangayo og tabang aron mahigugma nga matinud-anon niining higayona.
Notice|Pansinin|Matikdi
Where did I see God today?|Saan ko nakita ang pagkilos ng Diyos ngayon?|Asa nako nakita ang paglihok sa Diyos karon?
Resistance|Pagtutol|Pagsukol
Where did I resist God?|Saan ako tumutol sa Diyos?|Asa ako misukol sa Diyos?
What am I thankful for?|Ano ang ipinagpapasalamat ko?|Unsa ang akong gipasalamatan?
Confession|Pag-amin sa Diyos|Pagsugid sa Diyos
What do I need to confess?|Ano ang kailangan kong ipagtapat sa Diyos?|Unsa ang kinahanglan nakong isugid sa Diyos?
Learning and prayer|Pagkatuto at panalangin|Pagkat-on ug pag-ampo
What is God teaching me? Close in prayer.|Ano ang itinuturo sa akin ng Diyos? Magtapos sa panalangin.|Unsa ang gitudlo sa Diyos kanako? Taposa sa pag-ampo.
Digital fasting|Pag-aayuno sa digital na libangan|Pagpuasa sa digital nga kalingawan
Choose a realistic period without scrolling, videos or unnecessary notifications.|Pumili ng kayang sunding panahon na walang scrolling, video o hindi kailangang notification.|Pagpili og makaya nga panahon nga walay scrolling, video o dili kinahanglan nga notification.
Set aside the phone. Attend to God and the people with you.|Itabi ang telepono. Ituon ang pansin sa Diyos at sa mga taong kasama mo.|Ipadaplin ang telepono. Pagtagad sa Diyos ug sa mga tawo nga kauban nimo.
When you return, notice what distracted you and what helped you be present.|Pagbalik, pansinin kung ano ang umabala at kung ano ang tumulong sa iyong maging present.|Sa imong pagbalik, matikdi unsa ang nakabalda ug unsa ang nakatabang nga mahimong anaa sa higayon.
Sabbath and rest|Sabbath at pahinga|Sabbath ug pahulay
Choose a protected time to stop ordinary work and prepare what you can beforehand.|Magtakda ng oras na ilalaan sa pagtigil sa karaniwang trabaho at maghanda nang mas maaga.|Pagtakda og panahon sa paghunong sa naandang trabaho ug pag-andam daan sa imong mahimo.
Make room for worship, rest and unhurried relationships.|Maglaan ng puwang para sa pagsamba, pahinga at pakikipag-ugnayang hindi nagmamadali.|Paggahin og luna alang sa pagsimba, pahulay ug dili dinaliang pakig-uban.
Reflect on what you can entrust to God instead of controlling.|Pagnilayan kung ano ang maipagkakatiwala mo sa Diyos sa halip na kontrolin.|Pamalandongi unsa ang mahimo nimong itugyan sa Diyos imbis kontrolon.
Service|Paglilingkod|Pag-alagad
Notice one person you can help and ask what would be useful.|Pansinin ang isang taong matutulungan at itanong kung ano ang kailangan niya.|Matikdi ang usa ka tawo nga imong matabangan ug pangutan-a unsa ang mapuslanon kaniya.
Choose a practical act of care that respects their needs and consent.|Pumili ng praktikal na pag-aalaga na gumagalang sa pangangailangan at pahintulot niya.|Pagpili og praktikal nga pag-atiman nga nagtahod sa iyang panginahanglan ug pagtugot.
Serve without seeking recognition, then reflect on how you loved.|Maglingkod nang hindi naghahanap ng pagkilala, at pagnilayan kung paano ka nagmahal.|Pag-alagad nga dili mangita og pagdayeg, unya pamalandongi kon giunsa nimo paghigugma.
Simplicity|Payak na pamumuhay|Yano nga pagkinabuhi
Name one possession, commitment or habit competing for your attention.|Tukuyin ang isang gamit, pananagutan o ugaling umaagaw sa iyong pansin.|Ilha ang usa ka butang, obligasyon o batasan nga nakigkompetensya sa imong pagtagad.
Choose one small way to simplify it today.|Pumili ng isang maliit na paraan para gawing mas simple ito ngayon.|Pagpili og usa ka gamay nga paagi sa pagpasimple niini karon.
Use the space you gain for presence, generosity or rest.|Gamitin ang nabuong puwang para sa pakikipag-ugnayan, pagbibigay o pahinga.|Gamita ang nabakanteng luna alang sa pagpakig-uban, pagkamanggihatagon o pahulay.
Giving|Pagbibigay|Paghatag
Prayerfully consider time, skills or resources you can offer responsibly.|Ipanalangin at isaalang-alang ang oras, kakayahan o yamang maiaalay mo nang may pananagutan.|Hunahunaa uban sa pag-ampo ang oras, kahanas o kahinguhaan nga mahatag nimo nga responsable.
Choose a real need and a trustworthy way to help.|Pumili ng tunay na pangangailangan at mapagkakatiwalaang paraan ng pagtulong.|Pagpili og tinuod nga panginahanglan ug kasaligan nga paagi sa pagtabang.
Give freely without comparison or pressure. This app does not process payments.|Magbigay nang malaya, walang paghahambing o pamimilit. Hindi tumatanggap ng bayad ang app na ito.|Paghatag nga kinabubut-on, walay pagtandi o pagpugos. Kini nga app dili moproseso og bayad.
Fellowship|Pakikisama sa pananampalataya|Pakig-uban sa pagtuo
Reach out to someone for an unhurried conversation or shared prayer.|Makipag-ugnayan sa isang tao para sa usapang hindi nagmamadali o sama-samang panalangin.|Duola ang usa ka tawo alang sa dili dinaliang panag-istorya o hiniusang pag-ampo.
Listen attentively and encourage them from Scripture.|Makinig nang mabuti at palakasin ang loob niya mula sa Kasulatan.|Paminaw pag-ayo ug dasiga siya gikan sa Kasulatan.
Choose a simple way to stay connected; sharing private reflections is optional.|Pumili ng simpleng paraan para manatiling magkakaugnay; opsyonal ang pagbabahagi ng pribadong pagninilay.|Pagpili og yano nga paagi aron magpabiling konektado; opsyonal ang pagpaambit sa pribadong pagpamalandong.
Worship|Pagsamba|Pagsimba
Remember a truth about God from a passage you have read.|Alalahanin ang katotohanan tungkol sa Diyos mula sa talatang binasa mo.|Hinumdumi ang kamatuoran bahin sa Diyos gikan sa imong nabasa.
Respond with gratitude, a prayer or a song you may lawfully use.|Tumugon nang may pasasalamat, panalangin o awiting may pahintulot kang gamitin.|Tubag uban sa pagpasalamat, pag-ampo o awit nga may katungod kang gamiton.
Carry that attention to God into one ordinary activity.|Dalhin ang pagtutok na iyon sa Diyos sa isang karaniwang gawain.|Dad-a ang maong pagtagad sa Diyos ngadto sa usa ka ordinaryong buluhaton.
Fasting and prayer|Pag-aayuno at panalangin|Pagpuasa ug pag-ampo
Name your intention: making room for prayer and attention to God.|Tukuyin ang layunin: maglaan ng puwang para sa panalangin at pagtuon sa Diyos.|Ilha ang imong tuyo: paggahin og luna alang sa pag-ampo ug pagtagad sa Diyos.
A digital or entertainment fast is one practical option. This guide does not prescribe food restriction.|Isang praktikal na pagpipilian ang pag-aayuno sa digital o libangan. Hindi nag-uutos ng paghihigpit sa pagkain ang gabay na ito.|Usa ka praktikal nga kapilian ang pagpuasa sa digital o kalingawan. Kini nga giya dili mosugo og pagpugong sa pagkaon.
During the pause, pray, read Scripture and reflect on what you are learning.|Sa paghintong ito, manalangin, magbasa ng Kasulatan at pagnilayan ang iyong natututuhan.|Sa pagpahulay, pag-ampo, pagbasa sa Kasulatan ug pamalandongi ang imong nakat-onan.
Passage unavailable. Open the Bible Reader and retry.|Hindi magamit ang talata. Buksan ang Bible Reader at subukang muli.|Dili magamit ang bersikulo. Ablihi ang Bible Reader ug sulayi pag-usab.
Offline status unavailable. Retry after opening the passage online.|Hindi makuha ang offline status. Subukang muli matapos buksan ang talata online.|Dili makuha ang offline status. Sulayi pag-usab human ablihan ang bersikulo online.
Transition sound is unavailable in this browser.|Hindi magamit ang tunog ng paglipat sa browser na ito.|Dili magamit ang tingog sa pagbalhin niining browser.
Keep-screen-awake is not supported in this browser.|Hindi suportado ng browser na ito ang pagpapanatiling bukas ng screen.|Dili suportado niining browser ang pagpabiling bukas sa screen.
Choose a Bible verse first.|Pumili muna ng bersikulo sa Biblia.|Pagpili una og bersikulo sa Biblia.
This translation is available only in its licensed reader.|Sa lisensiyadong reader lamang magagamit ang saling ito.|Magamit lamang kini nga hubad sa lisensiyadong reader niini.
Invalid meditation passage.|Hindi wastong talata para sa pagninilay.|Dili husto ang bersikulo alang sa pagpamalandong.
Account changed. Choose the passage again.|Nagbago ang account. Piliin muli ang talata.|Nausab ang account. Pilia pag-usab ang bersikulo.
Offline context changed.|Nagbago ang offline na konteksto.|Nausab ang offline nga konteksto.
Choose a Bible passage first.|Pumili muna ng talata sa Biblia.|Pagpili una og bahin sa Biblia.
A Bible book is already being prepared.|May inihahandang aklat ng Biblia.|Aduna nay giandam nga basahon sa Biblia.
Offline preparation is closed.|Sarado na ang offline na paghahanda.|Sirado na ang offline nga pag-andam.
This Bible source cannot be downloaded.|Hindi mada-download ang pinagmulang ito ng Biblia.|Dili ma-download kini nga tinubdan sa Biblia.
Cancel preparation before removing this book.|Kanselahin muna ang paghahanda bago alisin ang aklat.|Kanselaha una ang pag-andam sa dili pa kuhaon ang basahon.
Choose a valid time and IANA time zone, such as Asia/Tokyo.|Pumili ng wastong oras at IANA time zone, gaya ng Asia/Tokyo.|Pagpili og husto nga oras ug IANA time zone, sama sa Asia/Tokyo.
Account changed. Refresh the reminder before dismissing it.|Nagbago ang account. I-refresh ang paalala bago isara ito.|Nausab ang account. I-refresh ang pahinumdom sa dili pa kini isira.
Scripture response does not match this passage.|Hindi tugma ang ibinalik na Kasulatan sa talatang ito.|Dili motakdo ang gibalik nga Kasulatan niini nga bersikulo.
Verse unavailable. Open the Bible Reader and retry when the passage is available.|Hindi magamit ang bersikulo. Buksan ang Bible Reader at subukang muli kapag available na ang talata.|Dili magamit ang bersikulo. Ablihi ang Bible Reader ug sulayi pag-usab kon magamit na ang bersikulo.
`.trim().split('\n').map(line => line.split('|'));
export const PRACTICE_TRANSLATIONS = Object.freeze({
  tl: Object.freeze(Object.fromEntries(ROWS.map(([en, tl]) => [en, tl]))),
  ceb: Object.freeze(Object.fromEntries(ROWS.map(([en, , ceb]) => [en, ceb]))),
});
export function practiceLocale(locale) { return ['en', 'tl', 'ceb'].includes(locale) ? locale : 'en'; }
export function practiceText(locale, text) { return PRACTICE_TRANSLATIONS[practiceLocale(locale)]?.[text] || text; }
export function practiceTitle(locale, title) { return formatPracticeTitle(practiceLocale(locale), title); }
export function localizePractice(practice, locale) {
  return { ...practice, title: practiceTitle(locale, practice.title), stages: practice.stages.map(row => ({ ...row, title: practiceText(locale, row.title), guide: practiceText(locale, row.guide) })) };
}
