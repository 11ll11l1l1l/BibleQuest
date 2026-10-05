const en = {
  title:'ONE 2 ONE relationship', intro:'Both participants must accept before lessons can begin.',
  invite:'Invite a member', member:'Congregation member', choose:'Choose a member', role:'Your role', mentor:'Mentor', mentee:'Mentee',
  send:'Create invitation', empty:'No eligible members are available.', reload:'Reload', back:'Back to ONE 2 ONE',
  account:'Account', congregation:'Choose congregation', loading:'Loading relationship…', saving:'Saving…',
  error:'This action could not complete. Check your account and congregation, then reload.',
  changed:'Account or congregation changed. Reload this relationship.', accept:'Accept invitation', decline:'Decline invitation',
  waiting:'You accepted. Waiting for the other participant.', end:'End relationship', confirm:'I understand that ending this relationship removes ongoing access.',
  lessons:'Open assigned lessons', invited:'Invitation pending', active:'Active', declined:'Declined', suspended:'Suspended', ended:'Ended',
};
const tl = {
  title:'Ugnayang ONE 2 ONE', intro:'Kailangang tanggapin ng parehong kalahok bago magsimula ang mga aralin.',
  invite:'Mag-imbita ng miyembro', member:'Miyembro ng kongregasyon', choose:'Pumili ng miyembro', role:'Iyong papel', mentor:'Mentor', mentee:'Inaalalayan',
  send:'Gumawa ng imbitasyon', empty:'Walang maaaring imbitahang miyembro.', reload:'I-load muli', back:'Bumalik sa ONE 2 ONE',
  account:'Account', congregation:'Pumili ng kongregasyon', loading:'Nilo-load ang ugnayan…', saving:'Sine-save…',
  error:'Hindi natapos ang aksyon. Suriin ang account at kongregasyon, saka i-load muli.',
  changed:'Nagbago ang account o kongregasyon. I-load muli ang ugnayang ito.', accept:'Tanggapin ang imbitasyon', decline:'Tanggihan ang imbitasyon',
  waiting:'Tinanggap mo na. Hinihintay ang isa pang kalahok.', end:'Tapusin ang ugnayan', confirm:'Nauunawaan kong mawawala ang patuloy na access kapag tinapos ang ugnayan.',
  lessons:'Buksan ang mga nakatalagang aralin', invited:'Naghihintay ang imbitasyon', active:'Aktibo', declined:'Tinanggihan', suspended:'Nakasuspinde', ended:'Natapos',
};
const ceb = {
  title:'Relasyon sa ONE 2 ONE', intro:'Kinahanglang modawat ang duha ka partisipante sa dili pa magsugod ang mga leksyon.',
  invite:'Pagdapit og miyembro', member:'Miyembro sa kongregasyon', choose:'Pagpili og miyembro', role:'Imong papel', mentor:'Mentor', mentee:'Gialalayan',
  send:'Paghimo og imbitasyon', empty:'Walay angay dapiton nga miyembro.', reload:'I-load pag-usab', back:'Balik sa ONE 2 ONE',
  account:'Account', congregation:'Pagpili og kongregasyon', loading:'Gi-load ang relasyon…', saving:'Gitipigan…',
  error:'Wala mahuman ang aksyon. Susiha ang account ug kongregasyon, unya i-load pag-usab.',
  changed:'Nausab ang account o kongregasyon. I-load pag-usab kini nga relasyon.', accept:'Dawata ang imbitasyon', decline:'Balibari ang imbitasyon',
  waiting:'Nidawat ka na. Naghulat sa laing partisipante.', end:'Taposa ang relasyon', confirm:'Nasabtan nako nga mawala ang padayong access kon taposon ang relasyon.',
  lessons:'Ablihi ang gitudlo nga mga leksyon', invited:'Naghulat ang imbitasyon', active:'Aktibo', declined:'Gibalibaran', suspended:'Gisuspinde', ended:'Natapos',
};
const prefix = dictionary => Object.freeze(Object.fromEntries(Object.entries(dictionary).map(([key,value]) => [`v7.pairing.${key}`,value])));
export const v7PairingLocales = Object.freeze({ en: prefix(en), tl: prefix(tl), ceb: prefix(ceb) });
export const V7_PAIRING_KEY_INVENTORY = Object.freeze(Object.keys(v7PairingLocales.en).sort());
