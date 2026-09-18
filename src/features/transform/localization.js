const UI=Object.freeze({
  en:Object.freeze({
    scriptureEyebrow:'SCRIPTURE → UNDERSTAND → REFLECT → APPLY → PRAY',
    scriptureHeading:'Move from the passage to a faithful next step',
    scriptureDescription:'This private journal uses the existing Transform storage owner. It does not grade faith or create a leader-visible response.',
    scriptureField:'1 · Scripture — passage or key verse',understandField:'2 · Understand — what does it mean in context?',reflectField:'3 · Reflect — what does this reveal or challenge?',applyField:'4 · Apply — one concrete next action',prayField:'5 · Pray — respond to God',saveScripture:'Save Scripture reflection',
    completeScripture:'Complete all five Scripture reflection steps before saving.',scriptureSaved:'Scripture reflection saved.',noReflectionChanges:'No reflection changes to save.',
    personalityEyebrow:'PERSONALITY TENDENCIES',currentPattern:'Your current pattern',personalityDisclaimer:'These tendencies describe preferences, not fixed identity or spiritual maturity.',
    thinkingEyebrow:'THINKING PATTERNS',biasResult:'{helpful}/{total} bias-resistant responses',thinkingDisclaimer:'This is practice in decision quality, not an intelligence score.',helpful:'Helpful response',reviewPattern:'Review this pattern',
    fullEyebrow:'FULL TRANSFORM',fullHeading:'Understand patterns, then practice change',fullDisclaimerLead:'Important:',fullDisclaimer:'these tools are for private self-reflection and decision practice. They are not diagnosis, intelligence testing, spiritual ranking, or a substitute for pastoral or professional care.',personalityScale:'Personality ratings: 1 = strongly disagree · 5 = strongly agree',
    personalitySection:'1 · PERSONALITY',noticeTendencies:'Notice your tendencies',personalityInstructions:'Answer all 20 prompts. Results describe tendencies and include balancing practices rather than labels.',rating:'{item} rating',answered:'{answered}/{total} answered',resetPersonality:'Reset personality',personalitySaved:'Personality saved',viewPersonality:'View personality pattern',
    thinkingSection:'2 · THINKING PATTERNS',betterJudgment:'Practice better judgment',thinkingInstructions:'Choose the response that best protects decision quality in each scenario.',responses:'{title} responses',resetThinking:'Reset thinking patterns',thinkingSaved:'Thinking review saved',reviewThinking:'Review thinking patterns',
    practiceSection:'3 · PRACTICE',recommendedPractices:'Recommended next practices',practiceComplete:'Your Full Transform assessment is complete. Recommendations combine the patterns available in your saved results.',practiceIncomplete:'Complete both assessments above to finish Full Transform. Recommendations update as results become available.',
    journalSection:'4 · PRIVATE JOURNAL',journalHeading:'Turn insight into practice',journalDescription:'Your journal stays in the Transform persistence boundary used by this app.',practiceField:'Practice I am working on',noticedField:'What I noticed',actionField:'Next action',prayerField:'Prayer / reflection',clearJournal:'Clear journal',saveReflection:'Save reflection',
    historyEyebrow:'RECENT HISTORY',historyHeading:'Saved Transform activity',historyEmpty:'No saved Transform activity yet.',
    fullComplete:'Full Transform complete',fullProgress:'Full Transform in progress',fullCompleteDescription:'Your results remain editable; changing an answer invalidates only that section until recalculated.',fullProgressDescription:'Complete personality and thinking-pattern reviews to finish this milestone.',backGrow:'Back to Grow',
    recoveredFull:'Recovered completed Full Transform · +{xp} XP',completedXp:'Full Transform complete · +{xp} XP',personalityPatternSaved:'Personality pattern saved.',thinkingPatternSaved:'Thinking-pattern review saved.',
    clearPersonalityConfirm:'Clear the personality answers and current personality result?',personalityCleared:'Personality assessment cleared.',clearThinkingConfirm:'Clear the thinking-pattern answers and current result?',thinkingCleared:'Thinking-pattern review cleared.',privateSaved:'Private reflection saved.',clearJournalConfirm:'Clear the private Transform journal fields?',journalCleared:'Private journal cleared.',
    lower:'Lower expression',higher:'Higher expression',mid:'Midrange / mixed',
    observeTitle:'Start with observation',observeBody:'For one week, pause once a day and ask: “What pattern in me is shaping this choice, and what response would be faithful and wise?”',
    historySpiritual:'Faith & practice reflection',historyPersonality:'Personality reflection',historyBias:'Thinking-pattern review',historyReflection:'Private reflection'
  }),
  tl:Object.freeze({
    scriptureEyebrow:'KASULATAN → UNAWAIN → MAGNILAY → ISABUHAY → MANALANGIN',
    scriptureHeading:'Mula sa talata tungo sa tapat na susunod na hakbang',
    scriptureDescription:'Pribado ang journal na ito. Hindi nito minamarkahan ang pananampalataya at hindi ito gumagawa ng sagot na makikita ng lider.',
    scriptureField:'1 · Kasulatan — talata o mahalagang bersikulo',understandField:'2 · Unawain — ano ang ibig sabihin nito sa konteksto?',reflectField:'3 · Magnilay — ano ang ipinapakita o hinahamon nito?',applyField:'4 · Isabuhay — isang konkretong susunod na hakbang',prayField:'5 · Manalangin — tumugon sa Diyos',saveScripture:'I-save ang pagninilay sa Kasulatan',
    completeScripture:'Kumpletuhin ang limang hakbang ng pagninilay sa Kasulatan bago i-save.',scriptureSaved:'Nai-save ang pagninilay sa Kasulatan.',noReflectionChanges:'Walang pagbabago sa pagninilay na kailangang i-save.',
    personalityEyebrow:'MGA HILIG NG PERSONALIDAD',currentPattern:'Ang kasalukuyan mong pattern',personalityDisclaimer:'Inilalarawan ng mga ito ang mga hilig, hindi nakapirming pagkakakilanlan o espirituwal na antas.',
    thinkingEyebrow:'MGA PARAAN NG PAG-IISIP',biasResult:'{helpful}/{total} sagot na lumalaban sa bias',thinkingDisclaimer:'Pagsasanay ito sa kalidad ng pagpapasya, hindi pagsusukat ng talino.',helpful:'Makatutulong na tugon',reviewPattern:'Balikan ang pattern na ito',
    fullEyebrow:'KUMPLETONG PAGBABAGO',fullHeading:'Unawain ang mga pattern, saka magsanay ng pagbabago',fullDisclaimerLead:'Mahalaga:',fullDisclaimer:'ang mga tool na ito ay para sa pribadong pagninilay sa sarili at pagsasanay sa pagpapasya. Hindi ito diagnosis, pagsusulit sa talino, espirituwal na ranggo, o kapalit ng pastoral o propesyonal na pangangalaga.',personalityScale:'Rating sa personalidad: 1 = lubos na hindi sang-ayon · 5 = lubos na sang-ayon',
    personalitySection:'1 · PERSONALIDAD',noticeTendencies:'Pansinin ang iyong mga hilig',personalityInstructions:'Sagutan ang lahat ng 20 pahayag. Inilalarawan ng resulta ang mga hilig at nagbibigay ng balanseng pagsasanay sa halip na mga label.',rating:'Rating para sa {item}',answered:'{answered}/{total} nasagutan',resetPersonality:'I-reset ang personalidad',personalitySaved:'Nai-save ang personalidad',viewPersonality:'Tingnan ang pattern ng personalidad',
    thinkingSection:'2 · MGA PARAAN NG PAG-IISIP',betterJudgment:'Magsanay ng mas mabuting paghatol',thinkingInstructions:'Piliin ang tugon na pinakamainam na nagpoprotekta sa kalidad ng pagpapasya sa bawat sitwasyon.',responses:'Mga sagot para sa {title}',resetThinking:'I-reset ang paraan ng pag-iisip',thinkingSaved:'Nai-save ang pagsusuri sa pag-iisip',reviewThinking:'Suriin ang mga paraan ng pag-iisip',
    practiceSection:'3 · PAGSASANAY',recommendedPractices:'Iminungkahing susunod na mga pagsasanay',practiceComplete:'Kumpleto na ang Full Transform. Pinagsasama ng mga mungkahi ang mga pattern mula sa naka-save mong mga resulta.',practiceIncomplete:'Kumpletuhin ang dalawang pagsusuri sa itaas para matapos ang Full Transform. Nagbabago ang mga mungkahi habang may bagong resulta.',
    journalSection:'4 · PRIBADONG JOURNAL',journalHeading:'Gawing pagsasanay ang natutuhan',journalDescription:'Nananatili ang journal sa pribadong Transform storage ng app.',practiceField:'Pagsasanay na ginagawa ko',noticedField:'Ano ang napansin ko',actionField:'Susunod na hakbang',prayerField:'Panalangin / pagninilay',clearJournal:'Burahin ang journal',saveReflection:'I-save ang pagninilay',
    historyEyebrow:'KAMAKAILANG KASAYSAYAN',historyHeading:'Naka-save na aktibidad sa Transformation',historyEmpty:'Wala pang naka-save na aktibidad sa Transformation.',
    fullComplete:'Kumpleto ang Full Transform',fullProgress:'Ginagawa pa ang Full Transform',fullCompleteDescription:'Maaari mo pa ring baguhin ang mga resulta; kapag binago ang sagot, ang bahaging iyon lamang ang kailangang kalkulahin muli.',fullProgressDescription:'Kumpletuhin ang pagsusuri sa personalidad at paraan ng pag-iisip para matapos ang milestone na ito.',backGrow:'Bumalik sa Lumago',
    recoveredFull:'Nabawi ang nakumpletong Full Transform · +{xp} XP',completedXp:'Kumpleto ang Full Transform · +{xp} XP',personalityPatternSaved:'Nai-save ang pattern ng personalidad.',thinkingPatternSaved:'Nai-save ang pagsusuri sa paraan ng pag-iisip.',
    clearPersonalityConfirm:'Burahin ang mga sagot at kasalukuyang resulta ng personalidad?',personalityCleared:'Nabura ang pagsusuri sa personalidad.',clearThinkingConfirm:'Burahin ang mga sagot at kasalukuyang resulta sa paraan ng pag-iisip?',thinkingCleared:'Nabura ang pagsusuri sa paraan ng pag-iisip.',privateSaved:'Nai-save ang pribadong pagninilay.',clearJournalConfirm:'Burahin ang mga laman ng pribadong Transform journal?',journalCleared:'Nabura ang pribadong journal.',
    lower:'Mas mababang pagpapakita',higher:'Mas mataas na pagpapakita',mid:'Gitna / halo-halo',
    observeTitle:'Magsimula sa pagmamasid',observeBody:'Sa loob ng isang linggo, huminto minsan bawat araw at itanong: “Anong pattern sa akin ang humuhubog sa pasyang ito, at anong tugon ang magiging tapat at marunong?”',
    historySpiritual:'Pagninilay sa pananampalataya at pagsasabuhay',historyPersonality:'Pagninilay sa personalidad',historyBias:'Pagsusuri sa paraan ng pag-iisip',historyReflection:'Pribadong pagninilay'
  }),
  ceb:Object.freeze({
    scriptureEyebrow:'KASULATAN → SABTA → PAMALANDONG → IPADAPAT → PAG-AMPO',
    scriptureHeading:'Gikan sa teksto padulong sa matinud-anong sunod nga lakang',
    scriptureDescription:'Pribado kini nga journal. Dili kini mohatag og grado sa pagtuo ug dili maghimo og tubag nga makita sa lider.',
    scriptureField:'1 · Kasulatan — teksto o importanteng bersikulo',understandField:'2 · Sabta — unsay kahulogan niini sa konteksto?',reflectField:'3 · Pamalandong — unsay gipakita o gihagit niini?',applyField:'4 · Ipadapat — usa ka konkretong sunod nga buhat',prayField:'5 · Pag-ampo — tubag ngadto sa Dios',saveScripture:'I-save ang pagpamalandong sa Kasulatan',
    completeScripture:'Humanon ang tanang lima ka lakang sa pagpamalandong sa Kasulatan sa dili pa i-save.',scriptureSaved:'Na-save ang pagpamalandong sa Kasulatan.',noReflectionChanges:'Walay kausaban sa pagpamalandong nga i-save.',
    personalityEyebrow:'MGA HILIG SA PERSONALIDAD',currentPattern:'Imong kasamtangang pattern',personalityDisclaimer:'Kini nga mga hilig naghulagway sa mga gusto, dili permanente nga identidad o espirituwal nga lebel.',
    thinkingEyebrow:'MGA PAAGI SA PANGHUNAHUNA',biasResult:'{helpful}/{total} ka tubag nga mosukol sa bias',thinkingDisclaimer:'Praktis kini sa kalidad sa pagdesisyon, dili sukod sa intelihensiya.',helpful:'Makatabang nga tubag',reviewPattern:'Balika kini nga pattern',
    fullEyebrow:'KUMPLETONG PAGBAG-O',fullHeading:'Sabta ang mga pattern, dayon praktisa ang kausaban',fullDisclaimerLead:'Importante:',fullDisclaimer:'kini nga mga himan alang sa pribadong pagpamalandong sa kaugalingon ug praktis sa pagdesisyon. Dili kini diagnosis, intelligence test, espirituwal nga ranggo, o kapuli sa pastoral o propesyonal nga pag-atiman.',personalityScale:'Rating sa personalidad: 1 = kusganong dili mouyon · 5 = kusganong mouyon',
    personalitySection:'1 · PERSONALIDAD',noticeTendencies:'Matikdi ang imong mga hilig',personalityInstructions:'Tubaga ang tanang 20 ka pahayag. Ang resulta naghulagway sa mga hilig ug naghatag og balancing practices imbes mga label.',rating:'Rating sa {item}',answered:'{answered}/{total} natubag',resetPersonality:'I-reset ang personalidad',personalitySaved:'Na-save ang personalidad',viewPersonality:'Tan-awa ang pattern sa personalidad',
    thinkingSection:'2 · MGA PAAGI SA PANGHUNAHUNA',betterJudgment:'Praktisa ang mas maayong paghukom',thinkingInstructions:'Pilia ang tubag nga labing makapanalipod sa kalidad sa pagdesisyon sa matag sitwasyon.',responses:'Mga tubag sa {title}',resetThinking:'I-reset ang paagi sa panghunahuna',thinkingSaved:'Na-save ang review sa panghunahuna',reviewThinking:'Repasuha ang mga paagi sa panghunahuna',
    practiceSection:'3 · PRAKTIS',recommendedPractices:'Gisugyot nga sunod nga mga praktis',practiceComplete:'Kompleto na ang Full Transform. Ang mga rekomendasyon naghiusa sa mga pattern gikan sa imong na-save nga resulta.',practiceIncomplete:'Humanon ang duha ka assessment sa ibabaw aron mahuman ang Full Transform. Mausab ang rekomendasyon samtang adunay bag-ong resulta.',
    journalSection:'4 · PRIBADONG JOURNAL',journalHeading:'Himoa nga praktis ang imong nakat-onan',journalDescription:'Ang imong journal magpabilin sa pribadong Transform storage sa app.',practiceField:'Praktis nga akong gitrabaho',noticedField:'Unsay akong namatikdan',actionField:'Sunod nga buhat',prayerField:'Pag-ampo / pagpamalandong',clearJournal:'Papasa ang journal',saveReflection:'I-save ang pagpamalandong',
    historyEyebrow:'BAG-ONG KASAYSAYAN',historyHeading:'Na-save nga kalihokan sa Transformation',historyEmpty:'Wala pay na-save nga kalihokan sa Transformation.',
    fullComplete:'Kompleto ang Full Transform',fullProgress:'Nagpadayon ang Full Transform',fullCompleteDescription:'Mahimo gihapon nimong usbon ang resulta; kung usbon ang tubag, kana ra nga seksyon ang kinahanglan kalkulahon pag-usab.',fullProgressDescription:'Humanon ang personality ug thinking-pattern review aron mahuman kini nga milestone.',backGrow:'Balik sa Pagtubo',
    recoveredFull:'Nabawi ang nahuman nga Full Transform · +{xp} XP',completedXp:'Kompleto ang Full Transform · +{xp} XP',personalityPatternSaved:'Na-save ang pattern sa personalidad.',thinkingPatternSaved:'Na-save ang review sa paagi sa panghunahuna.',
    clearPersonalityConfirm:'Papason ang mga tubag ug kasamtangang resulta sa personalidad?',personalityCleared:'Napapas ang assessment sa personalidad.',clearThinkingConfirm:'Papason ang mga tubag ug kasamtangang resulta sa paagi sa panghunahuna?',thinkingCleared:'Napapas ang review sa paagi sa panghunahuna.',privateSaved:'Na-save ang pribadong pagpamalandong.',clearJournalConfirm:'Papason ang mga sulod sa pribadong Transform journal?',journalCleared:'Napapas ang pribadong journal.',
    lower:'Ubos nga pagpahayag',higher:'Taas nga pagpahayag',mid:'Tunga / sinagol',
    observeTitle:'Sugdi sa pag-obserbar',observeBody:'Sulod sa usa ka semana, hunong kadiyot kausa kada adlaw ug pangutan-a: “Unsang pattern sa akong kaugalingon ang naghulma niini nga desisyon, ug unsang tubag ang matinud-anon ug maalamon?”',
    historySpiritual:'Pagpamalandong sa pagtuo ug pagbuhat',historyPersonality:'Pagpamalandong sa personalidad',historyBias:'Review sa paagi sa panghunahuna',historyReflection:'Pribadong pagpamalandong'
  })
});

const SPIRITUAL=Object.freeze({
  tl:Object.freeze({
    word:['Kasulatan','Regular akong nagbabasa ng Kasulatan nang sapat na maingat upang maunawaan ang konteksto, hindi lamang hiwa-hiwalay na talata.','Magbasa araw-araw ng isang buong talata o kabanata at sumulat ng isang pangungusap tungkol sa konteksto bago ito isabuhay.'],
    prayer:['Panalangin','Tunay na bahagi ng paraan ko ng pagpapasya, pag-amin, pasasalamat, at paghanap sa Diyos ang panalangin.','Gumamit ng simpleng ayos: pagpupuri, pag-amin, pasasalamat, mga kahilingan, at isang minutong tahimik na pakikinig.'],
    obedience:['Pagsunod','Kapag malinaw na hinaharap ng Kasulatan ang aking kilos, gumagawa ako ng konkretong pagbabago sa halip na sumang-ayon lamang.','Pumili ng isang malinaw na tagubilin mula sa binasa ngayon at gawing aksyon na matatapos sa loob ng 24 oras.'],
    love:['Pag-ibig','Nakikita ng mga taong malapit sa akin ang pagtitiis, kabaitan, pagpapatawad, at praktikal na pag-aalaga sa aking kilos.','Pumili ng isang taong nangangailangan ng pagtitiis, tulong, pagpapatawad, o pansin at gumawa ng isang konkretong hakbang.'],
    service:['Paglilingkod','Ginagamit ko ang oras, kakayahan, o yaman upang maglingkod sa iba nang hindi naghahanap ng pagkilala.','Gumawa ngayong linggo ng isang kapaki-pakinabang na bagay para sa iba na hindi madaling masuklian.'],
    community:['Komunidad','May makabuluhan akong ugnayan sa ibang mananampalataya na makapagpapalakas at makapagtutuwid sa akin.','Makipag-usap ngayong linggo sa isang may-gulang na mananampalataya tungkol sa isang tunay na hamon o pasya.'],
    integrity:['Integridad','Ang mga pribado kong pagpili ay karaniwang tugma sa pananampalatayang ipinapakita ko sa publiko.','Tukuyin ang isang pribadong gawi na salungat sa iyong paninindigan at maglagay ng isang praktikal na hangganan.'],
    witness:['Pagpapatotoo','Natural akong nakapagsasalita tungkol kay Cristo at sa ebanghelyo kapag may angkop na pagkakataon.','Maghanda ng dalawang minutong paliwanag tungkol sa paniniwala mo kay Jesus at kung bakit ito mahalaga sa iyo.'],
    wisdom:['Karunungan','Sapat akong humihinto upang hanapin ang karunungang biblikal bago tumugon sa mahirap na sitwasyon.','Bago ang isang mahirap na pasya, isulat ang mga katotohanan, kaugnay na prinsipyong biblikal, posibleng bunga, at payong dapat hingin.'],
    stewardship:['Pamamahala','Itinuturing kong ipinagkatiwala ng Diyos sa akin ang pera, trabaho, katawan, oras, at mga responsibilidad.','Suriin ang isang bahagi—pera, oras, kalusugan, trabaho, pamilya—at pumili ng isang masusukat na pagbuti ngayong linggo.'],
    repentance:['Pagsisisi','Kaya kong aminin ang mali nang hindi ipinagtatanggol ang pride, at pagkatapos ay humingi ng tawad at pagtutuwid.','Kapag nakita mong mali ka, pangalanan ito nang malinaw, humingi ng tawad nang walang dahilan, at ayusin ang kayang ayusin.'],
    perseverance:['Pagtitiyaga','Kapag mahirap o may kapalit ang pananampalataya, nagpapatuloy ako sa halip na umatras.','Pumili ng isang maliit ngunit tapat na gawain na ipagpapatuloy mo sa loob ng pitong araw kahit mababa ang motibasyon.']
  }),
  ceb:Object.freeze({
    word:['Kasulatan','Kanunay akong mobasa sa Kasulatan nga maampingon aron masabtan ang konteksto, dili lang ang bulag nga mga bersikulo.','Basaha adlaw-adlaw ang usa ka tibuok parapo o kapitulo ug isulat ang usa ka hugpong sa pulong bahin sa konteksto sa dili pa ipadapat.'],
    prayer:['Pag-ampo','Tinuod nga bahin sa akong pagdesisyon, pagkumpisal, pagpasalamat, ug pagpangita sa Dios ang pag-ampo.','Gamita ang yano nga pamaagi: pagdayeg, pagkumpisal, pagpasalamat, mga hangyo, ug usa ka minuto nga hilom nga pagpaminaw.'],
    obedience:['Pagtuman','Kung klarong atubangon sa Kasulatan ang akong batasan, mohimo ko og konkretong kausaban imbes mouyon lamang.','Pilia ang usa ka klarong sugo gikan sa teksto karon ug himoa kini nga aksyon nga mahuman sulod sa 24 oras.'],
    love:['Gugma','Makita sa mga tawo nga duol kanako ang pailub, kaayo, pagpasaylo, ug praktikal nga pag-atiman sa akong batasan.','Pilia ang usa ka tawo nga nanginahanglan og pailub, tabang, pagpasaylo, o pagtagad ug buhata ang usa ka konkretong lakang.'],
    service:['Pag-alagad','Gigamit nako ang oras, abilidad, o kahinguhaan sa pag-alagad sa uban nga dili mangita og pag-ila.','Buhata karong semanaha ang usa ka mapuslanong butang alang sa uban nga dili dali mabayran.'],
    community:['Komunidad','Aduna koy makahuluganon nga koneksyon sa ubang magtutuo nga makadasig ug makatul-id kanako.','Pakigsulti karong semanaha sa usa ka hamtong nga magtutuo bahin sa tinuod nga kalisdanan o desisyon.'],
    integrity:['Integridad','Ang akong pribadong mga pagpili kasagarang nahiuyon sa pagtuo nga akong gipakita sa publiko.','Ngalani ang usa ka pribadong batasan nga supak sa imong kombiksyon ug pagbutang og usa ka praktikal nga utlanan.'],
    witness:['Pagpamatuod','Natural akong makasulti bahin kang Cristo ug sa maayong balita kung adunay angay nga higayon.','Pag-andam og duha ka minutong pagpasabot sa imong pagtuo kang Jesus ug nganong importante kini kanimo.'],
    wisdom:['Kaalam','Mohunong ko og igo aron mangita og biblikal nga kaalam sa dili pa motubag sa lisod nga sitwasyon.','Sa dili pa ang lisod nga desisyon, isulat ang mga kamatuoran, may kalabotang biblikal nga prinsipyo, posible nga resulta, ug tambag nga angay pangitaon.'],
    stewardship:['Pagdumala','Gitan-aw nako ang kwarta, trabaho, lawas, oras, ug mga responsibilidad isip mga butang nga gitugyan sa Dios kanako.','Repasuha ang usa ka bahin—kwarta, oras, panglawas, trabaho, pamilya—ug pilia ang usa ka masukod nga pag-uswag karong semanaha.'],
    repentance:['Paghinulsol','Makaangkon ko sa sayop nga dili panalipdan ang garbo, dayon mangayo og pasaylo ug pagtul-id.','Kung mailhan nimo ang sayop, isulti kini klaro, pangayo og pasaylo nga walay pasangil, ug ayuha ang mahimong ayuhon.'],
    perseverance:['Paglahutay','Kung mahimong lisod o mahal ang pagtuo, mopadayon ko imbes moundang.','Pilia ang usa ka gamay apan matinud-anong praktis nga ipadayon sulod sa pito ka adlaw bisan ubos ang motibasyon.']
  })
});

const FACTORS=Object.freeze({
  tl:Object.freeze({E:'Ekstrobersyon',A:'Pakikisama',C:'Pagiging organisado',S:'Katatagan ng damdamin',O:'Pagiging bukas / pag-iisip'}),
  ceb:Object.freeze({E:'Ekstrobersyon',A:'Pagkamahigalaon',C:'Pagkaorganisado',S:'Kalinaw sa emosyon',O:'Pagkabukas / panghunahuna'})
});

const PERSONALITY_ITEMS=Object.freeze({
  tl:Object.freeze({
    E1:'Ako ang nagbibigay-buhay sa isang salu-salo.',A1:'Nakikiramay ako sa damdamin ng ibang tao.',C1:'Lagi akong handa.',S1:'Karaniwan akong relaks.',O1:'Malikhain ang aking imahinasyon.',
    E2:'Hindi ako gaanong nagsasalita.',A2:'Minsan ay nakapagsasalita ako nang nakasasakit sa iba.',C2:'Madalas kong iwan kung saan-saan ang aking mga gamit.',S2:'Madali akong ma-stress.',O2:'Nahihirapan akong umunawa ng mga abstraktong ideya.',
    E3:'Komportable ako kapag kasama ang ibang tao.',A3:'Madali akong maantig sa pangangailangan ng iba.',C3:'Binibigyang-pansin ko ang mga detalye.',S3:'Bihira akong malungkot nang matagal.',O3:'Madalas akong magkaroon ng mahuhusay na ideya.',
    E4:'Mas gusto kong manatili sa likuran.',A4:'Minsan ay kaunti ang pag-aalala ko para sa iba.',C4:'Minsan ay nagiging magulo ang mga bagay dahil sa akin.',S4:'Madalas akong mag-alala.',O4:'Hindi ako gaanong interesado sa mga abstraktong ideya.'
  }),
  ceb:Object.freeze({
    E1:'Kasagaran ako ang makapabuhi sa usa ka panagtigom.',A1:'Maluoy ug makasabut ko sa gibati sa ubang tawo.',C1:'Kanunay akong andam.',S1:'Kasagaran relaks ko.',O1:'Mabungahon ang akong imahinasyon.',
    E2:'Dili kaayo ko daghang mosulti.',A2:'Usahay makasulti ko og makasakit sa uban.',C2:'Usahay biyaan nako ang akong mga butang bisan asa.',S2:'Dali ko ma-stress.',O2:'Lisod para kanako ang pagsabot sa abstract nga mga ideya.',
    E3:'Komportable ko uban sa mga tawo.',A3:'Malumo ang akong kasingkasing sa panginahanglan sa uban.',C3:'Nagtagad ko sa mga detalye.',S3:'Panagsa ra ko magpabiling masulob-on.',O3:'Kanunay ko adunay maayong mga ideya.',
    E4:'Mas gusto nako nga dili pirming naa sa atubangan.',A4:'Usahay gamay ra akong kabalaka sa uban.',C4:'Usahay mahimong gubot ang mga butang tungod kanako.',S4:'Kanunay ko mabalaka.',O4:'Dili kaayo ko interesado sa abstract nga mga ideya.'
  })
});

const FACTOR_PRACTICE=Object.freeze({
  tl:Object.freeze({
    E:{low:'Pumili ng isang sadyang pag-uusap sa halip na hintayin ang perpektong pagkakataon.',high:'Makinig nang sapat upang maunawaan bago manguna.'},
    A:{low:'Magtanong muna nang may pag-uusisa bago ipahayag ang hindi pagsang-ayon.',high:'Pagsamahin ang kabaitan at malinaw na hangganan kapag may kailangang harapin.'},
    C:{low:'Tukuyin ang isang maliit na susunod na hakbang at oras kung kailan ito gagawin.',high:'Mag-iwan ng puwang para sa biyaya, mga tao, at pagbabago sa halip na sobrang kontrolin ang plano.'},
    S:{low:'Pangalanan ang emosyon, huminto, manalangin, at saka magpasya matapos humupa ang unang bugso.',high:'Pansinin kung kailan kailangan ng iba ng katiyakan kahit kaya mong manatiling kalmado.'},
    O:{low:'Suriin ang isang di-pamilyar na pananaw o konteksto ng talata bago magpasya.',high:'Gawing isang konkretong pagsunod ang isang ideya sa halip na mag-ipon pa ng ideya.'},
    mid:'Pansinin ang isang sitwasyong nakatutulong ang hilig na ito at isa kung saan mas makabubuti ang ibang tugon.'
  }),
  ceb:Object.freeze({
    E:{low:'Pilia ang usa ka tinuyo nga panag-istorya imbes hulaton ang perpektong higayon.',high:'Paminaw og igo aron makasabot sa dili pa manguna.'},
    A:{low:'Pangutana una nga adunay pagkamausisaon sa dili pa mosulti sa imong dili pag-uyon.',high:'Ipares ang kaayo sa klarong utlanan kung adunay kinahanglan atubangon.'},
    C:{low:'Tinoa ang usa ka gamay nga sunod nga buhat ug oras sa pagbuhat niini.',high:'Hatagi og luna ang grasya, mga tawo, ug nag-usab nga kahimtang imbes kontrolon pag-ayo ang plano.'},
    S:{low:'Ngalani ang emosyon, hunong, pag-ampo, dayon pagdesisyon human mohupay ang unang balod.',high:'Matikdi kung ang uban nanginahanglan og kasiguruhan bisan manageable para kanimo ang sitwasyon.'},
    O:{low:'Susiha ang usa ka dili pamilyar nga panan-aw o konteksto sa teksto sa dili pa magdesisyon.',high:'Himoa ang usa ka ideya nga konkretong buhat sa pagtuman imbes magtigom pa og ideya.'},
    mid:'Matikdi ang usa ka kahimtang diin makatabang kini nga hilig ug usa diin mas makaalagad ang laing tubag.'
  })
});

const BIAS=Object.freeze({
  tl:Object.freeze({
    sunk:{title:'Nakaraang gastos kumpara sa halaga sa hinaharap',scenario:'Nagbayad ka para sa kursong malinaw nang hindi kapaki-pakinabang. Ang pagtapos nito ay kukuha ng oras para sa mahalagang responsibilidad. Ano ang dapat higit na mahalaga ngayon?',options:['Tapusin lalo na dahil nabayaran na ang pera.','Ihambing ang gastos at pakinabang mula ngayon pasulong.','Magpatuloy lalo na dahil nakakahiya ang tumigil.'],signal:'Pagkapit sa nakaraang gastos',practice:'Kapag hindi na mababawi ang nakaraang gastos, itanong: “Kung hindi pa ako nagbayad o namuhunan, ano ang pipiliin ko ngayon?”'},
    base:{title:'Gamitin ang base rate',scenario:'Ang isang bihirang depekto ay nasa humigit-kumulang 1 sa 100 device. Nakakahuli ang scanner ng karamihan sa depekto ngunit may maling alarma rin. Na-flag ang device mo. Ano ang pinakamainam na unang tugon?',options:['Ipalagay na halos tiyak na may depekto dahil sa scanner.','Pagsamahin ang resulta ng scanner at kung gaano kabihira ang depekto bago magpasya.','Huwag pansinin ang scanner dahil may maling alarma.'],signal:'Pagpapabaya sa base rate',practice:'Bago tumugon sa dramatikong signal, itanong kung gaano kadalas ang pangyayari bago lumitaw ang bagong ebidensya.'},
    confirm:{title:'Hamunin ang sarili mong paniniwala',scenario:'Naniniwala ang grupo mo na nagpapabuti ng retention ang bagong Bible-study format. Aling pagsusuri ang pinakamakinabang?',options:['Tanungin ang mga taong gusto na ito para sa positibong testimonial.','Ihambing ang pag-alala kalaunan at sadyang hanapin ang mga kasong hindi nakatulong ang format.','Mangolekta pa ng positibong komento kung gaano ito ka-engaging.'],signal:'Confirmation bias',practice:'Isulat muna ang isang ebidensyang makapagpapabago ng isip mo bago maghanap ng dagdag na suporta.'},
    outcome:{title:'Proseso kumpara sa kinalabasan',scenario:'Dalawang lider ang gumamit ng parehong maingat na proseso. Ang isa ay minamalas at masama ang resulta; ang isa ay sinuwerte at maganda ang resulta. Paano dapat husgahan ang kalidad ng pasya?',options:['Pangunahin ayon sa huling kinalabasan.','Pangunahin ayon sa proseso at impormasyong mayroon noon.','Ang lider na may magandang resulta ay tiyak na gumawa ng mas mabuting pasya.'],signal:'Outcome bias',practice:'Suriin muna kung maayos ang proseso bago gawing patunay ang kinalabasan na tama o mali ang pasya.'},
    frame:{title:'I-frame muli ang pagpili',scenario:'Kaakit-akit ang isang pagpili kapag sinabing “90% tagumpay.” Ano ang pinakamakinabang na pagsusuri?',options:['Tanggapin ang positibong framing dahil malakas pakinggan ang 90%.','Sabihin din itong “10% kabiguan” at tingnan kung nagbabago ang iyong pasya.','Huwag pansinin ang porsiyento at sundin ang kutob.'],signal:'Framing effect',practice:'Ilarawan ang mahahalagang pagpili sa parehong pakinabang at pagkawala bago magpasya.'}
  }),
  ceb:Object.freeze({
    sunk:{title:'Nangaging gasto kumpara sa umaabot nga bili',scenario:'Nibayad ka sa kurso nga klarong dili mapuslanon. Ang paghuman niini mokaon sa oras para sa importanteng responsibilidad. Unsay angay labing timbangon karon?',options:['Humanon tungod kay nabayran na ang kwarta.','Itandi ang umaabot nga gasto ug benepisyo gikan karon padayon.','Padayon tungod kay makauulaw ang paghunong.'],signal:'Pagkapilit sa nangaging gasto',practice:'Kung dili na mabawi ang nangaging gasto, pangutan-a: “Kung wala pa ko nagbayad o namuhunan, unsay akong pilion karon?”'},
    base:{title:'Gamita ang base rate',scenario:'Ang talagsaong depekto makaapekto og mga 1 sa 100 ka device. Makakita ang scanner sa kadaghanan sa depekto apan adunay false alarms. Na-flag ang imong device. Unsay labing maayong unang tubag?',options:['Hunahunaa nga halos sigurado nga depektibo tungod sa scanner.','Ihiusa ang resulta sa scanner ug kung unsa ka talagsaon ang depekto sa dili pa mohukom.','Pasagdi ang scanner tungod kay adunay false alarms.'],signal:'Pagpasagad sa base rate',practice:'Sa dili pa motubag sa kusog nga signal, pangutan-a kung unsa ka komon ang hitabo sa wala pa ang bag-ong ebidensya.'},
    confirm:{title:'Hagita ang imong kaugalingong pagtuo',scenario:'Nagtuo ang imong grupo nga makapaayo sa retention ang bag-ong Bible-study format. Unsang pagsusi ang labing mapuslanon?',options:['Pangutan-a ang mga ganahan na niini para sa positibong testimonial.','Itandi ang ulahi nga paghinumdom ug tinuyo pangitaa ang mga kaso diin wala makatabang ang format.','Tigoma pa ang positibong komento kung unsa kini ka-engaging.'],signal:'Confirmation bias',practice:'Isulat una ang usa ka ebidensya nga makapausab sa imong hunahuna sa dili pa mangita og dugang suporta.'},
    outcome:{title:'Proseso kumpara sa resulta',scenario:'Duha ka lider ang migamit sa parehas nga maampingong proseso. Ang usa malas ug daotan ang resulta; ang usa swerte ug maayo ang resulta. Giunsa paghusay ang kalidad sa desisyon?',options:['Kasagaran base sa katapusang resulta.','Kasagaran base sa proseso ug impormasyon nga anaa niadtong higayona.','Ang lider nga adunay maayong resulta siguradong adunay mas maayong desisyon.'],signal:'Outcome bias',practice:'Repasuha kung lig-on ba ang proseso sa dili pa gamiton ang katapusang resulta isip pamatuod nga maalamon o sayop ang desisyon.'},
    frame:{title:'I-frame pag-usab ang pagpili',scenario:'Makadani ang usa ka pagpili kung ihulagway nga “90% success.” Unsay labing mapuslanong pagsusi?',options:['Dawata ang positibong framing kay lig-on paminawon ang 90%.','Isulti usab nga “10% failure” ug tan-awa kung mausab ang imong paghukom.','Pasagdi ang porsiyento ug sundi ang intuition.'],signal:'Framing effect',practice:'Ihulagway ang importanteng mga pagpili sa pinulongan sa gain ug loss sa dili pa magdesisyon.'}
  })
});

const interpolate=(value,values={})=>String(value??'').replace(/\{([a-z0-9_.-]+)\}/gi,(m,k)=>Object.prototype.hasOwnProperty.call(values,k)?String(values[k]):m);
const normalized=locale=>['tl','ceb'].includes(locale)?locale:'en';

export function createTransformLocalizer(locale){
  const lang=normalized(locale);
  const text=(key,values)=>interpolate(UI[lang]?.[key]??UI.en[key]??key,values);
  const spiritual=item=>{
    const row=SPIRITUAL[lang]?.[item?.id];
    return row?{...item,dimension:row[0],text:row[1],guide:row[2]}:{...item,guide:''};
  };
  const spiritualResult=row=>{
    const sourceId=row?.id;
    if(sourceId&&SPIRITUAL[lang]?.[sourceId]){const tr=SPIRITUAL[lang][sourceId];return {...row,dimension:tr[0],guide:tr[2]};}
    const match=Object.entries({word:'Scripture',prayer:'Prayer',obedience:'Obedience',love:'Love',service:'Service',community:'Community',integrity:'Integrity',witness:'Witness',wisdom:'Wisdom',stewardship:'Stewardship',repentance:'Repentance',perseverance:'Perseverance'}).find(([,dimension])=>dimension===row?.dimension);
    if(match&&SPIRITUAL[lang]?.[match[0]]){const tr=SPIRITUAL[lang][match[0]];return {...row,dimension:tr[0],guide:tr[2]};}
    return row;
  };
  const factorName=(factor,fallback='')=>FACTORS[lang]?.[factor]||fallback||factor;
  const personalityText=item=>PERSONALITY_ITEMS[lang]?.[item?.id]||item?.text||'';
  const band=value=>value==='Lower expression'?text('lower'):value==='Higher expression'?text('higher'):value==='Midrange / mixed'?text('mid'):value;
  const bias=task=>BIAS[lang]?.[task?.id]||{title:task?.title,scenario:task?.scenario,options:task?.options||[],signal:task?.signal,practice:task?.practice};
  const biasSignal=row=>{const tr=BIAS[lang]?.[row?.id];return tr?{...row,title:tr.signal,practice:tr.practice}:row};
  const recommendation=row=>{
    if(!row)return row;
    if(row.title==='Start with observation')return{title:text('observeTitle'),body:text('observeBody')};
    for(const factor of ['E','A','C','S','O']){
      const english={E:'Extraversion',A:'Agreeableness',C:'Conscientiousness',S:'Emotional Stability',O:'Openness / Intellect'}[factor];
      if(String(row.title||'').startsWith(english+':')){
        const rawBand=String(row.title).slice(english.length+1).trim();
        const practices=FACTOR_PRACTICE[lang]?.[factor];
        const body=rawBand==='Higher expression'?practices?.high:rawBand==='Lower expression'?practices?.low:FACTOR_PRACTICE[lang]?.mid;
        return{title:`${factorName(factor,english)}: ${band(rawBand)}`,body:body||row.body};
      }
    }
    for(const id of ['sunk','base','confirm','outcome','frame']){
      const source={sunk:'Sunk-cost thinking',base:'Base-rate neglect',confirm:'Confirmation bias',outcome:'Outcome bias',frame:'Framing effect'}[id];
      if(row.title===source&&BIAS[lang]?.[id])return{title:BIAS[lang][id].signal,body:BIAS[lang][id].practice};
    }
    return row;
  };
  const historyType=type=>text({spiritual:'historySpiritual',personality:'historyPersonality',bias:'historyBias',reflection:'historyReflection'}[type]||type);
  return Object.freeze({lang,text,spiritual,spiritualResult,factorName,personalityText,band,bias,biasSignal,recommendation,historyType});
}
