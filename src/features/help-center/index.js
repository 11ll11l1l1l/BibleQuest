// BibleQuest V4 Phase 5, Part B: the always-available Help & Tutorial Center.
// Pure content + presentation - no state beyond simple in-page navigation
// (native <details>/<summary>), matching the plan's requirement that this
// stay simple and nontechnical. Sole owner of this reference content; it
// does not read or write any other feature's state.
//
// Scope note (recorded honestly): Leader/Admin guide sections are included
// as general reference content, visible to everyone, rather than gated by
// a live role check. They describe how those tools work; they do not expose
// any private data or grant any actual access - the real access control for
// every feature they describe still lives entirely in that feature's own
// service/RLS layer, unaffected by this page. Role-based conditional
// rendering of this reference content is a reasonable follow-up, not a
// security requirement, since nothing sensitive is shown here either way.

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'getting-started', title: 'Getting Started',
    items: Object.freeze([
      ['Create or sign in to your account', 'Tap Account from More, then choose to sign in or create a new account with your email.'],
      ['Forgot your password?', 'Use "Forgot password" on the sign-in screen. You will get a link by email to choose a new one.'],
      ['Join a congregation', 'Ask your church leader for a join code, then enter it under Community &gt; Congregation.'],
      ['Main navigation', 'The bar at the bottom of the screen - Home, Learn, Play, Grow, More - is always available and gets you anywhere in three taps or fewer.']
    ])
  }),
  Object.freeze({
    id: 'home', title: 'Home',
    items: Object.freeze([
      ['Daily Journey', 'Your one recommended Bible activity for today. Tap it to start.'],
      ['Assignments', 'If your congregation sent you a task, it appears directly on Home - no need to search for it.'],
      ['Progress', 'Shows your XP, streak, and badges at a glance.'],
      ['Active-members indicator', 'Shows how many congregation members have used BibleQuest recently. It never shows who - just a number.'],
      ['Shortcuts row', 'A row of quick-access buttons you can scroll sideways to reach Daily Journey, Reader, Assignments, Calendar, and Progress fast.']
    ])
  }),
  Object.freeze({
    id: 'bible-learning', title: 'Bible &amp; Learning',
    items: Object.freeze([
      ['Reader', 'Read the Bible in your chosen translation. Search for a word or passage, or browse book by book.'],
      ['Translations', 'Switch translations from the Reader\u2019s own menu. Some translations open in a separate licensed reading view.'],
      ['Search and navigation', 'Type a reference (like "John 3:16") or a word to jump straight to it.'],
      ['Guided Study', 'A short, structured way to study one passage: context, observation, reflection, application.'],
      ['Smart Review', 'Answer questions from memory instead of multiple choice, then reveal the answer and mark it right or needs more review.'],
      ['Story Journey', 'Walk through a Bible story in a few short scenes with a Scripture checkpoint.'],
      ['Notes', 'Private Notes stay on this device only. Cloud Notes sync to your signed-in account across devices.']
    ])
  }),
  Object.freeze({
    id: 'assignments', title: 'Assignments',
    items: Object.freeze([
      ['What an assignment is', 'A task, question, or activity a leader sends to your congregation, a group, or you personally.'],
      ['How to start', 'Tap the assignment on Home or in Assignments, then tap Start task.'],
      ['How to submit', 'Write your response if one is required, then tap Mark complete.'],
      ['Written responses', 'Some assignments ask for a short written answer or reflection instead of just a checkbox.'],
      ['Leader feedback', 'A leader may leave you a short note after reviewing your response. You will see it on the assignment.'],
      ['Due dates', 'If an assignment has a due date, it is shown with the task. Completing it late still records your response.'],
      ['Privacy', 'Your submitted assignment answers are private. Other ordinary members cannot see your answer or whether you responded. Authorized ministry leaders may see responses when they need to review the assignment.']
    ])
  }),
  Object.freeze({
    id: 'games', title: 'Games',
    items: Object.freeze([
      ['Choosing a game', 'Open Play and pick any mode - each one practices Scripture a different way.'],
      ['Memory Meadow', 'A matching-card game: flip two cards to find a pair.'],
      ['Rewards', 'Finishing a game round can add XP and count toward your streak, same as any other activity.'],
      ['Game progress', 'Your best scores and completion counts are tracked automatically - nothing to set up.']
    ])
  }),
  Object.freeze({
    id: 'grow-progress', title: 'Grow &amp; Progress',
    items: Object.freeze([
      ['XP', 'Points earned from completing activities. Higher-effort activities usually earn more.'],
      ['Streak', 'The number of days in a row you have completed at least one meaningful activity.'],
      ['Badges', 'Small achievements unlocked by reaching certain milestones.'],
      ['Progress', 'A running total of your activity, viewable anytime from Grow.'],
      ['Transformation', 'A personal reflection tool - not a test, and not scored right or wrong.'],
      ['Personality Profile &amp; Psychometrics', 'Self-reflection tools to help you understand yourself better. These are not spiritual grades and not a medical or psychological diagnosis.']
    ])
  }),
  Object.freeze({
    id: 'calendar', title: 'Calendar',
    items: Object.freeze([
      ['Personal events', 'Add your own reminders - only you can see them.'],
      ['Assignment deadlines', 'Assignment due dates appear on your calendar automatically.'],
      ['Congregation items', 'Leaders can share congregation-wide events, like a service or meeting, that appear on every member\u2019s calendar.']
    ])
  }),
  Object.freeze({
    id: 'community', title: 'Community',
    items: Object.freeze([
      ['Congregation', 'View your congregation, your role, and how many members have been active recently.'],
      ['Journey Groups', 'Smaller groups within your congregation for shared study or accountability.'],
      ['Teams', 'Groups organized around a specific ministry task or role.'],
      ['Encouragements', 'Send a short, preset encouragement to your Journey Group with one tap.'],
      ['Recognition', 'See badges and awards your congregation has given to members.'],
      ['Live Rooms', 'Join a live shared session if your congregation is running one.']
    ])
  }),
  Object.freeze({
    id: 'couples-family', title: 'Couples &amp; Family',
    items: Object.freeze([
      ['What is private', 'Your individual reflections in Couples tools stay private to you unless you choose to share them.'],
      ['Shared Couple Journey', 'A guided communication self-assessment you and your spouse can each take, building a shared communication-level history over time.'],
      ['Communication tools', 'Structured prompts for conversation, listening, and working through disagreement together.']
    ])
  }),
  Object.freeze({
    id: 'notifications', title: 'Notifications',
    items: Object.freeze([
      ['What they mean', 'Notifications tell you about new assignments, encouragements, announcements, and similar updates.'],
      ['Opening destinations', 'Tap a notification to go straight to what it is about.'],
      ['Read/unread', 'Unread notifications are marked so you can find what is new at a glance.']
    ])
  }),
  Object.freeze({
    id: 'install', title: 'Install BibleQuest',
    items: Object.freeze([
      ['Android Chrome installation', 'Open the browser menu and choose "Add to Home screen" or "Install app" to add BibleQuest like a regular app.'],
      ['Standalone app', 'Once installed, BibleQuest opens in its own window without browser address bars.'],
      ['Offline usage', 'BibleQuest can keep some information on this device so you can keep reading even when the internet is unavailable.'],
      ['Reconnecting', 'When your connection returns, BibleQuest syncs any changes automatically - no action needed from you.']
    ])
  }),
  Object.freeze({
    id: 'backup-reset', title: 'Backup &amp; Reset',
    items: Object.freeze([
      ['Export', 'Save a copy of your device-only data (like Private Notes) before switching devices.'],
      ['Restore', 'Bring exported data back onto a device.'],
      ['What reset does and does not delete', 'Resetting clears local device data only. It does not delete your account or anything already saved to your signed-in account in the cloud.']
    ])
  }),
  Object.freeze({
    id: 'accessibility', title: 'Accessibility',
    items: Object.freeze([
      ['Text size', 'Increase reading text size from Accessibility settings.'],
      ['Reduced motion', 'Turn off animations and transitions if they bother you.'],
      ['Contrast', 'Switch to a higher-contrast color mode for easier reading.'],
      ['Keyboard support', 'Every button and link in BibleQuest can be reached and activated using only a keyboard.']
    ])
  }),
  Object.freeze({
    id: 'troubleshooting', title: 'Troubleshooting',
    items: Object.freeze([
      ['Blank page', 'Reload the page. If it keeps happening, try closing and reopening the app.'],
      ['Offline', 'Some features need internet the first time you open them. Previously-opened content may still work offline.'],
      ['Failed login', 'Double check your email and password, or use "Forgot password" to reset it.'],
      ['Assignment missing', 'Make sure you are viewing the right congregation if you belong to more than one.'],
      ['Congregation missing', 'Ask your leader for a current join code if you have not joined yet.'],
      ['Stale data', 'Pull down to refresh, or use any visible Refresh/Retry button.'],
      ['When to contact your administrator', 'If you are locked out or believe your account needs attention, ask your congregation leader or BibleQuest administrator for help.']
    ])
  })
]);

const LEADER_GUIDE = Object.freeze({
  id: 'leader-guide', title: 'Leader Guide',
  items: Object.freeze([
    ['Publishing assignments', 'From Assignments, ministry roles see a "Publish assignment" form to send a task to members, a team, or a group.'],
    ['Reviewing responses', '"Member Responses" on an assignment (visible only to ministry roles) shows who has completed it and their submitted answers.'],
    ['Groups and teams', 'Journey Groups and Team Center let you organize members into smaller units.'],
    ['Member activity', 'The active-members indicator and congregation summaries give you a privacy-safe view of engagement.'],
    ['Privacy responsibilities', 'Member answers are only visible to you because your role requires it for review - treat that information as confidential.']
  ])
});

const ADMIN_GUIDE = Object.freeze({
  id: 'admin-guide', title: 'Admin Guide',
  items: Object.freeze([
    ['User management', 'The Admin Console lets an Owner/Admin search users and adjust platform or congregation roles.'],
    ['Reset access', 'Send a password-reset link to a user who is locked out.'],
    ['Temporary passwords', 'Owner-only emergency tool: sets a temporary password and revokes existing sessions. Use only when a reset link is not possible.'],
    ['Suspending accounts', 'Suspending immediately blocks access and signs the account out everywhere, without deleting their data.'],
    ['Deletion', 'Account deletion is permanent, Owner-only, and requires transferring away any congregation/group ownership first.'],
    ['Emergency procedures', 'Every emergency action is logged with who did it, when, and to which account - review the audit log after any emergency action.']
  ])
});

function categoryHtml(category) {
  return `<details class="bq-help-category" data-help-category="${esc(category.id)}"><summary>${category.title}</summary><dl>${category.items.map(([term, body]) => `<dt>${esc(term)}</dt><dd>${body.includes('&')?body:esc(body)}</dd>`).join('')}</dl></details>`;
}

export function helpCenterPage({ onBack, onTutorial } = {}) {
  return {
    title: 'Help &amp; Tutorial Center',
    html: `<section class="bq-panel bq-help-center" data-help-center>
      <div class="bq-team-center-head"><div><p class="bq-eyebrow">HELP &amp; TUTORIAL CENTER</p><h1>How BibleQuest works</h1><p>Find a short, plain-language answer for any part of the app. If you would rather walk through the basics step by step, you can replay the guided tour anytime.</p></div><button type="button" class="bq-secondary-button" data-help-back>Back</button></div>
      <button type="button" class="bq-primary-button" data-help-replay-tutorial>Replay the guided tour</button>
      ${CATEGORIES.map(categoryHtml).join('')}
      ${categoryHtml(LEADER_GUIDE)}
      ${categoryHtml(ADMIN_GUIDE)}
    </section>`,
    mount(root) {
      const back = root.querySelector('[data-help-back]');
      const replay = root.querySelector('[data-help-replay-tutorial]');
      const onBackClick = () => onBack?.();
      const onReplayClick = () => onTutorial?.();
      back?.addEventListener('click', onBackClick);
      replay?.addEventListener('click', onReplayClick);
      return () => {
        back?.removeEventListener('click', onBackClick);
        replay?.removeEventListener('click', onReplayClick);
      };
    }
  };
}

export { CATEGORIES, LEADER_GUIDE, ADMIN_GUIDE };
