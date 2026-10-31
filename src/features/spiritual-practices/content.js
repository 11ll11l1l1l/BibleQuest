// Original short guides adapted from the owner's Spiritual Disciplines and Silencio PDFs.
const stage = (title, seconds, guide) => Object.freeze({ title, seconds, guide });
const template = (id, title, stages, adapted = true) => Object.freeze({ id, title, version: 1, adapted, stages: Object.freeze(stages) });
export const PRACTICES = Object.freeze([
  template('silencio-120', 'Silencio · 120 minutes', [
    stage('Entering silence', 600, 'Find a quiet place. Set aside distractions and become attentive to God.'),
    stage('Silent sitting', 1200, 'Be still. When distracted, gently return your attention to God.'),
    stage('Listening', 1200, 'Notice your thoughts and concerns. Consider them in light of Scripture; impressions are not verified divine speech.'),
    stage('Scripture and silence', 1200, 'Recall a short passage you have read. Let its meaning settle without rushing.'),
    stage('Heart examination', 1200, 'Notice fear, anger, desire or resistance honestly before God.'),
    stage('Gratitude', 900, 'Remember specific gifts and offer thanks.'),
    stage('Surrender', 600, 'Entrust a concern or expectation to God.'),
    stage('Reflection', 300, 'Choose one loving response to carry into your day.'),
  ], false),
  template('silencio-10', 'Silencio · 10 minutes', [
    stage('Prepare', 60, 'Set aside distractions. Become present to God.'),
    stage('Stillness', 120, 'Sit quietly. Gently return when your attention wanders.'),
    stage('Scripture meditation', 180, 'Recall a short passage. Consider what it reveals about God and your response.'),
    stage('Gratitude and surrender', 120, 'Give thanks and entrust one concern to God.'),
    stage('Reflection', 120, 'Choose one faithful, loving response.'),
  ]),
  template('morning-10', 'Morning surrender · 10 minutes', [
    stage('Silence', 120, 'Begin quietly in God’s presence.'),
    stage('Gratitude', 60, 'Give thanks for this day.'),
    stage('Scripture', 180, 'Recall a short passage read in the Bible Reader.'),
    stage('Formation', 120, 'What Christlike quality do you need to practice today?'),
    stage('Surrender', 120, 'Entrust your schedule to God and choose one response.'),
  ]),
  template('meditation-10', 'Scripture meditation · 10 minutes', [
    stage('Read slowly', 120, 'Read the selected verse in its chapter context. Notice what it says about God.'),
    stage('Dwell', 180, 'Stay with a word or phrase. Consider its meaning in context without rushing.'),
    stage('Respond in prayer', 120, 'Speak honestly to God about what you have read.'),
    stage('Rest in silence', 120, 'Rest attentively before God. Gently return to the passage when distracted.'),
    stage('Live it', 60, 'Choose one concrete, loving response to this Scripture.'),
  ]),
  template('presence-30', 'Daytime pause · 30 seconds', [stage('Remember', 30, 'Pause. Acknowledge Jesus’ presence and ask for help to love faithfully in this moment.')]),
  template('evening-5', 'Evening reflection · 5 minutes', [
    stage('Notice', 60, 'Where did I see God today?'),
    stage('Resistance', 60, 'Where did I resist God?'),
    stage('Gratitude', 60, 'What am I thankful for?'),
    stage('Confession', 60, 'What do I need to confess?'),
    stage('Learning and prayer', 60, 'What is God teaching me? Close in prayer.'),
  ]),
]);
export const getPractice = id => PRACTICES.find(item => item.id === id);
