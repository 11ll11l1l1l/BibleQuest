let readerAudioProvider = null;

export function disposeReaderAudioProvider() {
  readerAudioProvider?.dispose();
  readerAudioProvider = null;
}

export async function loadReaderPage(args) {
  const loadPage = args.loadPage;
  if (typeof loadPage !== 'function') throw new Error('Missing lazy Reader feature module.');
  const [pageModule, packageModule, audioModule, speechModule, audioStorageModule, audioPackageModule, catalogModule] = await Promise.all([
    loadPage(),
    import('../v6/reader/browser-packages.ts'),
    import('../v6/reader/audio-provider.ts'),
    import('../v6/reader/speech-synthesis.ts'),
    import('../v6/reader/audio-package-storage.ts'),
    import('../v6/reader/audio-packages.ts'),
    import('../v6/reader/openbible-hays-catalog.ts'),
  ]);
  const scriptureContentVersion = await catalogModule.loadCurrentBsbScriptureContentVersion();
  const haysAlignment = scriptureContentVersion
    ? await catalogModule.loadOpenBibleHaysAlignmentBundle(scriptureContentVersion, args.books)
    : null;
  const haysStreamManifest = scriptureContentVersion
    ? catalogModule.createOpenBibleNarratorStreamingManifest('hays', scriptureContentVersion, args.books, haysAlignment?.alignmentSource)
    : null;
  const haysManifest = haysAlignment && haysStreamManifest
    ? catalogModule.bindOpenBibleHaysAlignmentIdentity(haysStreamManifest, haysAlignment)
    : haysStreamManifest;
  const souerManifest = scriptureContentVersion
    ? catalogModule.createOpenBibleNarratorStreamingManifest('souer', scriptureContentVersion, args.books)
    : null;
  if (typeof pageModule?.readerPage !== 'function' || typeof packageModule.createBrowserScripturePackageController !== 'function'
    || typeof audioModule.createReaderAudioProvider !== 'function' || typeof audioModule.createReaderAudioSourceRouter !== 'function'
    || typeof speechModule.createReaderSpeechSynthesis !== 'function'
    || typeof audioStorageModule.createBrowserScriptureAudioPackageRepository !== 'function'
    || typeof audioPackageModule.ScriptureAudioPackageManager !== 'function' || typeof audioStorageModule.createFetchScriptureAudioPackageTransport !== 'function') {
    throw new Error('Bible Reader offline/audio services are unavailable.');
  }
  const SpeechUtterance = globalThis.SpeechSynthesisUtterance;
  const speech = speechModule.createReaderSpeechSynthesis({
    synthesis: globalThis.speechSynthesis || null,
    createUtterance: typeof SpeechUtterance === 'function' ? text => new SpeechUtterance(text) : undefined,
  });
  if (!readerAudioProvider) {
    const audioRepository = audioStorageModule.createBrowserScriptureAudioPackageRepository();
    const createNarratorProvider = (manifest, alignments = []) => audioModule.createReaderAudioProvider({
      manifest,
      alignments,
      scriptureContentVersion,
      store: args.audioStore,
      createAudio: () => new Audio(),
      mediaSession: globalThis.navigator?.mediaSession || null,
      offlinePackages: audioRepository,
      packageManager: new audioPackageModule.ScriptureAudioPackageManager({
        repository: audioRepository,
        transport: audioStorageModule.createFetchScriptureAudioPackageTransport(),
      }),
      isOffline: () => globalThis.navigator?.onLine === false,
    });
    readerAudioProvider = audioModule.createReaderAudioSourceRouter({
      sources: [
        { id: 'hays', label: 'Barry Hays', provider: createNarratorProvider(haysManifest, haysAlignment?.chapters || []) },
        { id: 'souer', label: 'Bob Souer', provider: createNarratorProvider(souerManifest) },
      ],
      store: args.audioStore,
      defaultSourceId: 'hays',
    });
  }
  return pageModule.readerPage({
    ...args,
    offlinePackages: packageModule.createBrowserScripturePackageController({ books: args.books }),
    audio: readerAudioProvider,
    speech,
  });
}
