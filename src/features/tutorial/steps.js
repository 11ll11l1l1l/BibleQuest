// The first-run guided tour, kept short enough that people actually finish
// it (9 screens, per the Phase 5 requirement of "around 8-10"). Anything
// more detailed than "what this does, what to tap, what happens next"
// belongs in the always-available Help & Tutorial Center instead, not here.
export const STEPS = Object.freeze([
  Object.freeze({
    eyebrow: 'WELCOME TO BIBLEQUEST',
    title: 'A short guide to the app',
    body: 'BibleQuest has many tools, but you do not need to learn them all at once. This guide shows the main path. You can reopen it anytime from Home, and a full Help Center is always available if you need more detail later.',
    action: Object.freeze({ route: 'home', label: 'Show Home' })
  }),
  Object.freeze({
    eyebrow: 'WHERE TO START EVERY DAY',
    title: 'Home',
    body: 'Home is where you start each day. It shows your next Bible activity, a quick-access row for your most-used tools, your progress, and - if your congregation is active - any assignments waiting for you.',
    action: Object.freeze({ route: 'home', label: 'Go to Home' })
  }),
  Object.freeze({
    eyebrow: 'HOW TO OPEN THE BIBLE',
    title: 'Read',
    body: 'Tap Reader to open the Bible itself: choose a translation, search, and read at your own pace. This is the simplest way to just read Scripture without any activity or scoring attached.',
    action: Object.freeze({ route: 'reader', label: 'Open Reader' })
  }),
  Object.freeze({
    eyebrow: 'A SIMPLE GUIDED DAILY ACTIVITY',
    title: 'Daily Journey',
    body: 'The Daily Journey is the simplest everyday path: retrieve, understand context, learn, apply, and reflect. One meaningful Bible activity can protect your streak; completing the full journey gives stronger progress evidence.',
    action: Object.freeze({ route: 'mission', label: 'Open Daily Journey' })
  }),
  Object.freeze({
    eyebrow: 'IF YOUR CHURCH SENDS YOU A TASK',
    title: 'Assignments',
    body: 'A leader may assign your congregation a task or question to answer. Your submitted answer is private: other ordinary members cannot see your answer or whether you have responded. Authorized ministry leaders may see responses only when they need to review the assignment.',
    action: Object.freeze({ route: 'assignments', label: 'Open Assignments' })
  }),
  Object.freeze({
    eyebrow: 'BIBLE LEARNING GAMES',
    title: 'Play',
    body: 'Play has quiz-style games, matching games, and other ways to practice Scripture that feel more like a game than a study session. Great for a quick break that still counts toward your progress.',
    action: Object.freeze({ route: 'play', label: 'Open Play' })
  }),
  Object.freeze({
    eyebrow: 'YOUR PROGRESS',
    title: 'Grow',
    body: 'Grow holds your progress, streak, badges, and reflection tools like Transformation and your Avatar Vault. Scores describe your app activity; they are not a measure of faith.',
    action: Object.freeze({ route: 'grow', label: 'Open Grow' })
  }),
  Object.freeze({
    eyebrow: 'CONGREGATION, GROUPS AND SHARED TOOLS',
    title: 'Community',
    body: 'Use More to reach your congregation, Journey Groups, couples and family tools, notifications, calendar, and other shared tools not on the main navigation bar.',
    action: Object.freeze({ route: 'more', label: 'Open More' })
  }),
  Object.freeze({
    eyebrow: 'INSTALLING AND GETTING HELP',
    title: 'You are ready',
    body: 'BibleQuest can be installed like an app on your phone and can keep some information on your device so you can keep reading even without internet. If you ever forget how something works, open the Help Center from Home or More at any time.',
    action: Object.freeze({ route: 'help', label: 'Open Help Center' })
  })
]);
