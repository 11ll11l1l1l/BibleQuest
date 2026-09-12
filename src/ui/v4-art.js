const ROOT='assets/v4';
const asset=(folder,name)=>`${ROOT}/${folder}/${name}.png`;

export const V4_ART=Object.freeze({
  core:Object.freeze({
    brandMark:asset('core','brand-mark'),
    brandMini:asset('core','brand-mark-mini'),
    appIcon:asset('core','app-icon'),
    home:asset('core','nav-home'),
    learn:asset('core','nav-learn'),
    play:asset('core','nav-play'),
    grow:asset('core','nav-grow'),
    more:asset('core','nav-more'),
    account:asset('core','account'),
    notifications:asset('core','notifications'),
    streak:asset('core','streak-flame'),
    xp:asset('core','xp'),
    coin:asset('core','coin'),
    privacy:asset('core','privacy-shield'),
    cloudSync:asset('core','cloud-sync'),
    deviceLocal:asset('core','device-local')
  }),
  homeLearn:Object.freeze({
    dailyJourney:asset('home-learn','daily-journey'),
    continueReading:asset('home-learn','continue-reading'),
    tutorial:asset('home-learn','tutorial'),
    recordings:asset('home-learn','recordings'),
    mediaLibrary:asset('home-learn','media-library'),
    progress:asset('home-learn','progress'),
    dailyVerse:asset('home-learn','daily-verse'),
    calendar:asset('home-learn','calendar'),
    reader:asset('home-learn','reader'),
    guidedStudy:asset('home-learn','guided-study'),
    deepQuestions:asset('home-learn','deep-questions'),
    storyJourney:asset('home-learn','story-journey'),
    wisdomSituations:asset('home-learn','wisdom-situations'),
    adaptiveLearning:asset('home-learn','adaptive-learning'),
    openReview:asset('home-learn','open-review'),
    notes:asset('home-learn','notes')
  }),
  bibleWorld:Object.freeze({
    creation:asset('bible-world','world-creation'),
    patriarchs:asset('bible-world','world-patriarchs'),
    exodus:asset('bible-world','world-exodus'),
    kingdom:asset('bible-world','world-kingdom'),
    wisdom:asset('bible-world','world-wisdom'),
    prophets:asset('bible-world','world-prophets'),
    jesus:asset('bible-world','world-gospels'),
    church:asset('bible-world','world-early-church'),
    letters:asset('bible-world','world-letters'),
    next:asset('bible-world','world-next-marker'),
    explored:asset('bible-world','world-explored'),
    unexplored:asset('bible-world','world-unexplored'),
    map:asset('bible-world','world-map'),
    compass:asset('bible-world','world-compass'),
    badge:asset('bible-world','world-badge')
  })
});

const AVATAR_IDS=new Set(['starter','sakura','lantern','flame','crown','scholar','scroll','shepherd','couple','community','world','kitsune','moon','fuji','tea','lock']);
export const avatarArtPath=id=>asset('avatar-vault',AVATAR_IDS.has(id)?id:'starter');

export function decorativeImg(src,className='',alt=''){
  const safeClass=String(className||'').replace(/[^a-zA-Z0-9 _-]/g,'').trim();
  const safeAlt=String(alt||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  return `<img src="${src}" class="${safeClass}" alt="${safeAlt}" ${safeAlt?'':'aria-hidden="true"'} loading="lazy" decoding="async">`;
}
