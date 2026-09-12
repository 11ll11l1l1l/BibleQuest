const featureIcon = id => `
  <span class="bq-more-icon-wrap" aria-hidden="true">
    <svg class="bq-more-icon" viewBox="0 0 24 24" focusable="false">
      <use href="assets/more-feature-icons.svg#${id}"></use>
    </svg>
  </span>`;

const moreCard = ({ hook, action, icon, eyebrow, title, description, cta, tone = 'green', hidden = false }) => `
  <article class="bq-more-card" data-more-${hook} data-tone="${tone}"${hidden ? ' hidden' : ''}>
    <div class="bq-more-card-top">
      ${featureIcon(icon)}
      <span class="bq-more-arrow" aria-hidden="true">↗</span>
    </div>
    <div class="bq-more-card-copy">
      <p class="bq-eyebrow">${eyebrow}</p>
      <h3>${title}</h3>
      <p>${description}</p>
    </div>
    <button type="button" class="bq-more-card-action" ${action}>${cta}</button>
  </article>`;

const group = ({ eyebrow, title, description, cards }) => `
  <section class="bq-more-group">
    <header class="bq-more-group-head">
      <p class="bq-eyebrow">${eyebrow}</p>
      <h2>${title}</h2>
      <p>${description}</p>
    </header>
    <div class="bq-more-grid">${cards.join('')}</div>
  </section>`;

export function morePage({
  pwaInstall,
  onCommunity,
  onMinistryHub,
  onNotificationCenter,
  onWorkspace,
  onContentReview,
  onCouplesFamily,
  onCouplesCloud,
  onCongregation,
  onJourneyGroups,
  onTeamCenter,
  onBackup,
  onMission,
  onAccessibility,
  onCalendar
}) {
  const personal = [
    moreCard({
      hook: 'workspace',
      action: 'data-open-workspace',
      icon: 'workspace',
      eyebrow: 'PRIVATE STUDY',
      title: 'Bible Workspace',
      description: 'Return to your private study workspace using the existing Reader and Cloud Notes owners.',
      cta: 'Open workspace',
      tone: 'blue'
    }),
    moreCard({
      hook: 'notifications',
      action: 'data-open-notification-center',
      icon: 'notifications',
      eyebrow: 'INBOX',
      title: 'Notifications',
      description: 'Review private account notifications and open only verified BibleQuest destinations.',
      cta: 'Open notifications',
      tone: 'violet'
    }),
    moreCard({
      hook: 'mission',
      action: 'data-open-mission',
      icon: 'mission',
      eyebrow: 'PERSONAL',
      title: 'My Mission',
      description: 'Take the recommended next step when a review or focused reading is ready.',
      cta: 'Start mission',
      tone: 'gold'
    }),
    moreCard({
      hook: 'calendar',
      action: 'data-open-calendar',
      icon: 'calendar',
      eyebrow: 'PLANNING',
      title: 'Calendar',
      description: 'See personal reminders alongside assignment due dates in the existing calendar.',
      cta: 'Open calendar',
      tone: 'violet'
    })
  ];

  const relationships = [
    moreCard({
      hook: 'couples',
      action: 'data-open-couples-family',
      icon: 'couples',
      eyebrow: 'DEVICE',
      title: 'Grow Together',
      description: 'Use Christ-centered conversation cards, check-ins, repair conversations, and local practices.',
      cta: 'Open Grow Together',
      tone: 'rose'
    }),
    moreCard({
      hook: 'couples-cloud',
      action: 'data-open-couples-cloud',
      icon: 'couples-cloud',
      eyebrow: 'ACCOUNT',
      title: 'Couple Journey',
      description: 'Link two separate accounts and intentionally share only Couple Journey progress and commitments.',
      cta: 'Open Couple Journey',
      tone: 'rose'
    })
  ];

  const community = [
    moreCard({
      hook: 'community',
      action: 'data-open-community',
      icon: 'community',
      eyebrow: 'COMMUNITY',
      title: 'Community',
      description: 'Open congregation access, Journey Groups, and preset Encouragements through one bridge.',
      cta: 'Open community',
      tone: 'teal'
    }),
    moreCard({
      hook: 'journey-groups',
      action: 'data-open-journey-groups',
      icon: 'journey-groups',
      eyebrow: 'SMALL GROUP',
      title: 'Journey Groups',
      description: 'Create, join, or manage a 2–6 person group inside your congregation.',
      cta: 'Open Journey Groups',
      tone: 'cyan'
    }),
    moreCard({
      hook: 'team-center',
      action: 'data-open-team-center',
      icon: 'team',
      eyebrow: 'TEAMS',
      title: 'Team Center',
      description: 'View game-team rosters and use role-checked team controls when allowed.',
      cta: 'Open Team Center',
      tone: 'orange'
    }),
    moreCard({
      hook: 'congregation',
      action: 'data-open-congregation',
      icon: 'congregation',
      eyebrow: 'CONGREGATION',
      title: 'Membership & role',
      description: 'View your active congregation role or join using an existing invite code.',
      cta: 'Open congregation access',
      tone: 'green'
    })
  ];

  const ministry = [
    moreCard({
      hook: 'ministry-hub',
      action: 'data-open-ministry-hub',
      icon: 'ministry',
      eyebrow: 'ASSIGNMENTS & MINISTRY',
      title: 'Ministry Hub',
      description: 'Open verified congregation tools from the existing role-aware ministry portal.',
      cta: 'Open Ministry Hub',
      tone: 'indigo'
    }),
    moreCard({
      hook: 'content-review',
      action: 'data-open-content-review',
      icon: 'review',
      eyebrow: 'AUTHORIZED REVIEW',
      title: 'Content Review',
      description: 'Leaders, Pastors, and Admins can review quarantined Recall questions and member reports.',
      cta: 'Open Content Review',
      tone: 'amber'
    })
  ];

  const device = [
    moreCard({
      hook: 'accessibility',
      action: 'data-open-accessibility',
      icon: 'accessibility',
      eyebrow: 'ACCESSIBILITY',
      title: 'Readability & motion',
      description: 'Adjust text size, motion, contrast, keyboard focus, and modal focus support for this device.',
      cta: 'Open accessibility',
      tone: 'sky'
    }),
    moreCard({
      hook: 'install',
      action: 'data-install-app',
      icon: 'install',
      eyebrow: 'INSTALL',
      title: 'Install BibleQuest',
      description: 'Keep BibleQuest in a standalone app window when your browser supports installation.',
      cta: 'Install app',
      tone: 'green',
      hidden: true
    }),
    moreCard({
      hook: 'backup',
      action: 'data-open-backup',
      icon: 'backup',
      eyebrow: 'DEVICE DATA',
      title: 'Backup & reset',
      description: 'Export, restore, or reset portable local learning state without touching account or cloud data.',
      cta: 'Open backup controls',
      tone: 'slate'
    })
  ];

  return {
    title: 'More',
    html: `
      <div class="bq-more-page">
        <section class="bq-more-intro">
          <p class="bq-eyebrow">MORE</p>
          <h1>Everything else, organized by purpose.</h1>
          <p>Study, relationships, community, ministry, and device tools stay easy to find without competing with your main Bible journey.</p>
        </section>
        ${group({
          eyebrow: 'YOUR RHYTHM',
          title: 'Personal & planning',
          description: 'Private study, reminders, your next mission, and planning tools.',
          cards: personal
        })}
        ${group({
          eyebrow: 'TOGETHER',
          title: 'Relationships',
          description: 'Device-local and account-linked couple experiences remain clearly separate.',
          cards: relationships
        })}
        ${group({
          eyebrow: 'BELONG',
          title: 'Community',
          description: 'Connect with your congregation, small groups, and teams.',
          cards: community
        })}
        ${group({
          eyebrow: 'SERVE',
          title: 'Ministry & leadership',
          description: 'Role-aware tools remain protected by their existing service and database checks.',
          cards: ministry
        })}
        ${group({
          eyebrow: 'APP',
          title: 'App & device',
          description: 'Accessibility, installation, and local backup controls.',
          cards: device
        })}
        <section class="bq-more-footnote">
          <strong>Still rebuilding some advanced tools.</strong>
          <span>Only verified destinations are exposed here; unavailable workflows stay unavailable until their own milestones pass.</span>
        </section>
      </div>`,
    mount(root) {
      const communityButton = root.querySelector('[data-open-community]');
      const ministryHubButton = root.querySelector('[data-open-ministry-hub]');
      const notificationButton = root.querySelector('[data-open-notification-center]');
      const workspaceButton = root.querySelector('[data-open-workspace]');
      const contentReviewButton = root.querySelector('[data-open-content-review]');
      const couplesButton = root.querySelector('[data-open-couples-family]');
      const couplesCloudButton = root.querySelector('[data-open-couples-cloud]');
      const journeyGroupsButton = root.querySelector('[data-open-journey-groups]');
      const teamCenterButton = root.querySelector('[data-open-team-center]');
      const congregationButton = root.querySelector('[data-open-congregation]');
      const backupButton = root.querySelector('[data-open-backup]');
      const missionButton = root.querySelector('[data-open-mission]');
      const calendarButton = root.querySelector('[data-open-calendar]');
      const accessibilityButton = root.querySelector('[data-open-accessibility]');
      const installPanel = root.querySelector('[data-more-install]');
      const installButton = root.querySelector('[data-install-app]');

      const openCommunity = () => onCommunity?.();
      const openMinistryHub = () => onMinistryHub?.();
      const openNotifications = () => onNotificationCenter?.();
      const openWorkspace = () => onWorkspace?.();
      const openContentReview = () => onContentReview?.();
      const openCouples = () => onCouplesFamily?.();
      const openCouplesCloud = () => onCouplesCloud?.();
      const openJourneyGroups = () => onJourneyGroups?.();
      const openTeamCenter = () => onTeamCenter?.();
      const openCongregation = () => onCongregation?.();
      const openBackup = () => onBackup?.();
      const openMission = () => onMission?.();
      const openAccessibility = () => onAccessibility?.();
      const openCalendar = () => onCalendar?.();
      const install = () => { void pwaInstall?.prompt(); };

      const renderInstall = state => {
        const visible = state?.canPrompt || state?.status === 'prompting' || state?.status === 'dismissed';
        installPanel?.toggleAttribute('hidden', !visible);
        if (installButton) {
          installButton.disabled = state?.status === 'prompting';
          installButton.textContent = state?.status === 'prompting'
            ? 'Opening install prompt…'
            : state?.status === 'dismissed'
              ? 'Try install again'
              : 'Install app';
        }
      };

      communityButton?.addEventListener('click', openCommunity);
      ministryHubButton?.addEventListener('click', openMinistryHub);
      notificationButton?.addEventListener('click', openNotifications);
      workspaceButton?.addEventListener('click', openWorkspace);
      contentReviewButton?.addEventListener('click', openContentReview);
      couplesButton?.addEventListener('click', openCouples);
      couplesCloudButton?.addEventListener('click', openCouplesCloud);
      journeyGroupsButton?.addEventListener('click', openJourneyGroups);
      teamCenterButton?.addEventListener('click', openTeamCenter);
      congregationButton?.addEventListener('click', openCongregation);
      backupButton?.addEventListener('click', openBackup);
      missionButton?.addEventListener('click', openMission);
      accessibilityButton?.addEventListener('click', openAccessibility);
      calendarButton?.addEventListener('click', openCalendar);
      installButton?.addEventListener('click', install);

      const unsubscribe = pwaInstall?.subscribe?.(renderInstall) || (() => {});

      return () => {
        communityButton?.removeEventListener('click', openCommunity);
        ministryHubButton?.removeEventListener('click', openMinistryHub);
        notificationButton?.removeEventListener('click', openNotifications);
        workspaceButton?.removeEventListener('click', openWorkspace);
        contentReviewButton?.removeEventListener('click', openContentReview);
        couplesButton?.removeEventListener('click', openCouples);
        couplesCloudButton?.removeEventListener('click', openCouplesCloud);
        journeyGroupsButton?.removeEventListener('click', openJourneyGroups);
        teamCenterButton?.removeEventListener('click', openTeamCenter);
        congregationButton?.removeEventListener('click', openCongregation);
        backupButton?.removeEventListener('click', openBackup);
        missionButton?.removeEventListener('click', openMission);
        accessibilityButton?.removeEventListener('click', openAccessibility);
        calendarButton?.removeEventListener('click', openCalendar);
        installButton?.removeEventListener('click', install);
        unsubscribe();
      };
    }
  };
}
