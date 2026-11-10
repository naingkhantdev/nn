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
} as const
