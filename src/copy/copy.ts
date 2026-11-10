// ALL app text lives here, in English, in Mochi's soft voice.
// Never guilt, pressure, or reveal activity (see the mochi-style skill).
// Users may still type Burmese; the Noto Sans Myanmar font stays bundled for that.

export const copy = {
  appName: 'Mochi Island',
  loading: 'Mochi is waking up...',

  mochi: {
    label: {
      idle: 'Mochi',
      happy: 'Mochi is happy',
      sleepy: 'Mochi is sleepy',
      hungry: 'Mochi is hungry',
      tired: 'Mochi is tired',
      bored: 'Mochi is bored',
      homesick: 'Mochi is a little homesick',
      sulking: 'Mochi is sulking with its back turned',
      dancing: 'Mochi is dancing',
    },
  },

  // Login and choose-phrase. No sign-up anywhere.
  auth: {
    welcome: 'Welcome to Mochi Island',
    usernameLabel: 'Name',
    phraseLabel: 'Secret phrase',
    signIn: 'Come in',
    signingIn: 'Opening the gate...',
    wrongPhrase: "Mochi doesn't recognise that... could you check the name and phrase?",
    offline: "No internet just yet. Let's try again in a moment.",
    tooMany: "Let's take a little break and try again later.",
    unknown: 'Something went a bit wrong. Please try again.',
    needsReauth: 'To keep things safe, please sign out and back in once.',

    choosePhraseTitle: 'Choose your own secret phrase',
    choosePhraseIntro:
      "The phrase you choose here becomes yours alone. Nobody else will know it, not even Mochi.",
    newPhraseLabel: 'New secret phrase',
    repeatPhraseLabel: 'Type it once more',
    tooShort: 'It needs at least 6 characters.',
    mismatch: "The two don't match yet. Have another look?",
    save: 'Save',
    saving: 'Saving...',
    signOut: 'Sign out',
  },

  // Install guide: in-app browsers and iPhone Safari.
  install: {
    inAppTitle: 'Please open this in Safari',
    inAppBody: "Mochi Island can't settle in properly inside this app. Let's move it to Safari.",
    inAppStepMenu: 'Tap ••• and choose "Open in Safari" (or "Open in browser").',
    orCopy: 'Or copy the link and paste it into Safari.',
    linkLabel: 'Link',
    copyLink: 'Copy link',
    copied: 'Copied! Now paste it into Safari.',
    copyFailed: 'Press and hold the link above to copy it.',

    addTitle: 'Put Mochi on your Home Screen',
    addBody: 'Then Mochi opens like a little app of its own.',
    stepShare: "Tap the Share button (if you can't see it, it's inside •••).",
    stepAdd: 'Choose "Add to Home Screen".',
    stepOpen: 'Open Mochi from the new icon on your Home Screen.',
    oldIos:
      "This iPhone can't get notifications yet (they need iOS 16.4 or newer). Everything else works just fine.",
    continueHere: 'Carry on here for now',
  },

  // Island home.
  island: {
    settings: 'Settings',
    back: 'Back to the island',
    stillBuildingTitle: 'Still being built',
    stillBuildingBody: 'Mochi is still building this part of the island. Come and peek again another day!',
    stillBuildingOk: 'Okay!',
    roomComingSoon: 'Mochi is getting this place ready...',
  },

  // Mochi's house. Mochi's mood stays on this phone only.
  house: {
    pet: 'Pet Mochi',
    feed: 'Give a treat',
    saidHello: 'Mochi is happy you dropped by.',
    saidSleepy: "It's late... Mochi is getting sleepy.",
    saidAfterPet: 'Mochi wiggles happily!',
    saidAfterFeed: 'Mochi munches the treat. Yum!',
  },

  // Tappable places on the island (also their accessible labels).
  places: {
    mochiHouse: "Mochi's house",
    starJar: 'Star Jar',
    feelings: 'How I feel now',
    sulkCloud: 'Sulk cloud',
    snailPost: 'Snail Post',
    lantern: 'Lantern',
    garden: 'Garden',
    bottle: 'Message bottle',
  },

  // Star Jar: writing stars. The writer never sees whether a star was opened.
  stars: {
    writeStar: 'Write a star',
    writtenTitle: "Stars you've written",
    writtenEmpty: 'No stars yet. The first one can be something small and nice.',
    writtenNote: "Stars stay a surprise. You won't see when they're opened.",
    withPhoto: 'with a photo',
    justNow: 'just now',

    writeTitle: 'Write a star',
    writeHint: 'Something kind, a memory, a little joke... it will wait in the jar.',
    textLabel: 'Your star',
    addPhoto: 'Add a photo',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    photoAlt: 'The photo for your star',
    shrinkingPhoto: 'Making the photo smaller...',
    photoFailed: "Mochi couldn't open that photo. Try another one? Your words are still here.",
    empty: 'Write a few words or add a photo first.',
    tooLong: "That's a little long. A star can hold up to 1000 characters.",
    send: 'Fold and send',
    sending: 'Folding your star...',
    retry: 'Try again',
    sendFailed: "The star couldn't fly just now. Your words are safe here. Try again?",
    offline: "No internet right now. Your words are safe here, so try again once you're back online.",
    sentTitle: 'Your star is in the jar!',
    sentBody: "It'll be waiting there.",
    writeAnother: 'Write another',
    backToJar: 'Back to the Star Jar',

    // Opening stars (the recipient's own jar).
    jarLabel: 'Your star jar',
    jarReady: "Tap the jar to open today's star.",
    jarReadyShake: "Tap the jar, or give your phone a little shake, to open today's star.",
    jarEmpty: 'Your jar is resting for now. New stars will float in.',
    jarDoneToday: "You've opened today's star. Another one tomorrow!",
    comeBackTomorrow: "Today's star is already out. Come back tomorrow for the next one!",
    opening: 'A star is falling...',
    openFailed: "The jar is a bit stuck right now. Try again in a moment?",
    shakeMode: 'Turn on shake',
    shakeOn: 'Shake is on',
    shakeDenied: "Shake isn't allowed on this phone. Tapping works just the same.",
    keepIt: 'Keep it',
    photoLoading: 'Unfolding the photo...',
    photoMissing: "This star's photo couldn't be loaded.",
    keepsakes: 'Keepsakes',
    keepsakesTitle: 'Your keepsake stars',
    keepsakesEmpty: 'Stars you open will be kept here.',
    showPhoto: 'Show photo',
  },

  // How I feel now. No times are ever shown; feelings fade by themselves.
  feelings: {
    title: 'How I feel now',
    intro: 'Share how you feel, if you like. It fades away by itself after a while.',
    mineTitle: 'Me right now',
    nothing: 'Nothing right now',
    label: {
      sleepy: 'Sleepy',
      hungry: 'Hungry',
      happy: 'Happy',
      tired: 'Tired',
      bored: 'Bored',
      missingHome: 'Missing home',
    },
    otherTitle: 'Across the island',
    otherNone: 'Nothing shared right now.',
    bubblePrefix: 'Across the island, feeling',
    sendTreat: {
      snack: 'Send a snack 🍙',
      blanket: 'Send a blanket 🧣',
      hug: 'Send a hug 🤗',
      sweet: 'Send something sweet 🍬',
      sticker: 'Send a sticker ⭐',
    },
    treatSent: 'Sent! Mochi is carrying it over.',
    treatFailed: "Mochi couldn't carry it just now. Try again in a moment?",
  },

  // A treat arriving, shown once.
  treats: {
    arrivedTitle: 'A little treat arrived!',
    arrived: {
      snack: 'A warm snack, just for you 🍙',
      blanket: 'A cozy blanket to snuggle in 🧣',
      hug: 'A big soft hug 🤗',
      sweet: 'Something sweet for you 🍬',
      sticker: 'A shiny sticker ⭐',
    },
    thanks: 'Thank you!',
  },
} as const
