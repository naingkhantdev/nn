# Mochi Island: Design

Date: 2026-11-06
Status: Approved by the owner on 2026-11-06, with How I Feel Now added at approval. Stack changed on 2026-11-10 (see below).

## Stack change, 2026-11-10

**Owner's decision:** build Mochi Island as a React website, hosted free, in its own repository (`D:\mochi-island`), instead of Flutter. This replaces every Flutter, Dart, Java, and APK reference below. Everything else in this design stands.

- **Client:** Vite, React, and TypeScript, as an installable web app (PWA). Both people use the installed web app: the owner from Android Chrome, and she from iPhone Safari's Add to Home Screen. There is no APK.
- **Data, auth, push:** unchanged. Firebase Auth, Cloud Firestore, and FCM on the Spark plan, plus the free Cloudflare Worker for sending pushes.
- **Hosting:** Firebase Hosting on Spark, which is free with no card.
- **Art and motion:** SVG and CSS animation, kept light for iPhone Safari.
- **Testing:** Vitest and React Testing Library for app logic and screens, Vitest with the Firestore emulator for rules, and Playwright WebKit for a Safari-like smoke test.
- *(Builder's calls.)* Routing with React Router, server state from Firestore listeners in small hooks, no global state library, and `vite-plugin-pwa` for the manifest and service worker.

## မြန်မာလို အကျဉ်းချုပ်

Mochi Island က ခင်ဗျားနဲ့ သူမ နှစ်ယောက်တည်းသုံးမယ့် ကျွန်းငယ်လေးပုံစံ app ပါ။ ပထမအဆင့်မှာ လျှို့ဝှက်စကားလုံး login၊ ကျွန်းလေး၊ မိုချီအိမ်၊ စိတ်ကောက်တဲ့ feature၊ မိုးရွာတဲ့ ရာသီဥတု၊ ကြယ်ပုလင်းနဲ့ အခုဘယ်လိုခံစားနေလဲ (အိပ်ချင်တယ်၊ ဗိုက်ဆာတယ်) ပြတဲ့ feature တို့ ပါပါမယ်။ ခင်ဗျားအတွက် Android APK၊ သူမအတွက် iPhone Home Screen web app ထုတ်ပါမယ်။ Code တစ်ခုတည်းနဲ့ ရေးပြီး ငွေမကုန်အောင်၊ ကတ်မလိုအောင် လုပ်ပါမယ်။ App က အစပိုင်းမှာ ခင်မင်မှုအတွက် လက်ဆောင်လို ခံစားရစေပြီး ခံစားချက်ဖွင့်ပြောမယ့်အချိန်ကို ခင်ဗျားကိုယ်တိုင် ရွေးပါမယ်။

## Intent

The owner has a crush who does not yet know how the owner feels. She showed him a pink, passcode-protected website that a friend's boyfriend made ("For My Agnes"). What makes that site special is that it was made for one person. She also said she would like a sulking feature.

The owner wants something creative and cute: not one feature, but a small personal world that belongs to the two of them.

Success means she enjoys opening it, it gives them a playful everyday reason to talk, and it remains something good whatever happens between them.

The name is **Mochi Island** (owner's decision).

## Goals

- A private world used by exactly two people, the owner and her.
- Cute enough that she wants to show it to a friend. Motion and small reactions matter as much as features.
- A sulking feature that is fun and turns a small annoyance into a game.
- $0 running cost, with no payment card on any account.
- Runs on the owner's Android phone and her iPhone from one codebase.

## Non-goals

- Public release, app stores, sign-up, or any third user.
- A general chat app. They already have messaging apps.
- Paid services, TestFlight, or a native iOS build for now.

## Anti-goals

The app has failed, even if it works, if any of these are true:

- **It pressures her.** The first impression must not read as a couples app or a declaration of love. Nothing shows her that she "has not replied", and there are no guilt mechanics. Mochi never dies or gets sick from being ignored.
- **It watches her.** No location, no online or last-seen status, no read-tracking displayed to the owner, and no hidden analytics about her.
- **She has no way out.** She can leave at any time and can delete her data from inside the app.
- **It looks like someone else's product.** All art, names, and styling are original. No Barbie or other brand references, even though the site that inspired this used a "Barbie Edition" label.

## Constraints

- **Stack (owner's decision):** Flutter and Firebase. App code is Dart, because Flutter apps are written in Dart. Java is used only for Android build and setup needs.
- **Cost (owner's decision):** free for both people, using the Firebase Spark plan with no card.
- **Devices:** the owner uses Android, she uses iOS, and the development machine is Windows with no Mac.
- **Installed on this machine:** Flutter, Dart, Firebase CLI, Java 21 runtime. `adb` is not on PATH, so the Android SDK still has to be checked with `flutter doctor`.

### Verified platform limits (checked 2026-11-06)

| Topic | Fact | Consequence |
|---|---|---|
| Cloud Storage | Requires Blaze, including for default buckets | Do not use it. Store compressed media in Firestore. |
| Cloud Functions | Requires Blaze | Do not use it. Use a Cloudflare Worker. |
| Firestore | 1 MiB per document, 1 GiB stored, 50k reads and 20k writes per day on Spark | Keep media in its own documents, away from listeners. |
| Spark overage | Service stops until the period resets | Keep listeners narrow and media small. |
| FCM | No cost | Use for push notifications. |
| Cloudflare Workers Free | 100k requests per day, 10 ms CPU per request, 50 subrequests | Enough for volume. CPU limit needs testing because of token signing. |
| iOS web push | iOS 16.4+, HTTPS, manifest, installed to Home Screen, prompt only after a user gesture. If denied, she must remove and re-add the app. | Ask only after a friendly explanation. Her iOS version must be checked. |
| iOS motion | `DeviceMotionEvent.requestPermission()` needs HTTPS and a tap | Ask on a tap. Always offer tapping the jar as a fallback. |
| iOS microphone | MediaRecorder gives `audio/mp4` in Safari, but behaviour as an installed Home Screen app is unconfirmed | Voice is not guaranteed. See Phase 1 scope. |

## How she gets it

**Owner's decision:** Android APK for the owner, and a Home Screen web app for her, both from the same Flutter code and the same Firebase project.

1. The owner sends her a link hosted on Firebase Hosting.
2. In Safari, a cute illustrated guide shows the Add to Home Screen steps. It detects when the app is not yet installed.
3. She opens the installed icon and logs in with her username and a secret phrase based on a private joke between them.
4. Mochi greets her by name and offers notifications with a clear explanation.

## Phase 1 scope

**Owner approved this phase list in chat.**

### The island

The home screen is an illustrated island where each place is tappable. Phase 1 has two working places: Mochi's house and the Star Jar. Later places are shown as cute "still being built" spots, so the world feels like it is growing. It should look alive even when idle, with gentle movement like waves, clouds, and Mochi blinking.

### Secret login

Two accounts only, created manually by the owner. There is no sign-up screen. Firestore rules allow only those two user IDs. Each person enters a username and a secret phrase, and the phrase is the account password.

The private-joke phrase the owner gives her is temporary. On first login she is asked to choose her own phrase, which the owner does not know, so the owner cannot log in as her. Settings lets her change it again. If she forgets it, the owner resets it to a new temporary phrase through the Firebase console and she chooses again.

### Mochi's house

One shared Mochi pet that either person can pet or feed. Its reactions come from the viewer's own actions and the time of day, such as sleepy at night and happy when petted. Mochi's state must not reveal when or whether the other person has been in the app, and there is no "misses you" state.

### Sulking

- Either person can start a sulk (owner's decision).
- They pick a level: a little, a lot, or "don't talk to me". They can add a short reason.
- Mochi puffs its cheeks and turns its back. Rain clouds appear over the island on both phones. The heavier the sulk, the worse the weather.
- The other person gets a notification and can comfort them by sending a note or a virtual treat, and by playing a small game of popping raindrops and hugging Mochi. Each act makes the weather a little better.
- **Only the person sulking can forgive** by pressing Forgive. Then the sun returns with a rainbow and Mochi dances.
- **Every sulk fades after 24 hours** if nobody ends it. The clouds drift away with no blame and no message to either person, so nobody is left under rain for days. This is calculated from timestamps on the client and enforced in rules, because there are no Cloud Functions.
- Each person can have one active sulk, so both can sulk at once. The island shows the heavier weather.
- A sulk sends one notification when it starts and no reminders.
- A funny history shows numbers like "7 sulks this month, longest 2 hours". This is two-way and lighthearted, and it never ranks anyone as at fault.

### Star Jar

- A jar of folded paper stars. Each person writes stars for the other, holding text and optionally a photo.
- Once a day the recipient shakes the phone or taps the jar. A star falls and unfolds into its message, with a satisfying animation. A day resets at midnight Myanmar time.
- The jar can run empty, in which case it shows a cute empty state to the recipient. Nothing about this is shown to the writer.
- A writer can see the stars they wrote, but not whether or when any was opened, or how many remain. The opened state must live where the writer's rules cannot read it.
- Opened stars stay in the recipient's keepsake collection.
- **Voice stars are not in Phase 1,** because they cannot be tested without an iPhone. They can be tried later on her phone.

### How I Feel Now

**Owner requested this after approving the design.** Either person can choose how they feel right now from a set of cute options, such as sleepy, hungry, happy, tired, bored, or missing home.

- Each person's chosen feeling appears as a small Mochi bubble on the island for the other person to see. Their own Mochi expression changes to match on their own screen.
- The other person can answer with a small treat or a one-tap reaction: a snack for hungry, a blanket for sleepy.

*(Designer's calls.)* To respect the no-activity-signal rule:

- Sharing is always a deliberate choice, and "nothing right now" is an option.
- A feeling fades after 8 hours, and no time is shown, so an old feeling or an empty bubble says nothing about whether someone has been in the app.
- Setting a feeling sends no notification. A treat or reaction sends one short notification.
- Feelings are not kept as a history, and they do not count toward any statistics.

### Notifications

Sent for a new sulk, a comfort act, a forgiveness, and a new star. They are short and written as Mochi speaking.

If push fails or she declines it, the app must still work fully when opened.

### Her controls

Settings include turning notifications off and deleting her content and account.

**Deleting removes:** everything she wrote, including stars in the owner's keepsakes and her comfort notes; every star sent to her, opened or not; all sulk history for both people; her device token; and then her account. Her wish takes priority over the owner's keepsakes. The owner gets no notification.

The owner's app then shows a calm, quiet island with Mochi alone, with no message about what happened. She can return only if the owner creates a new account for her, and the island starts fresh.

The same delete option exists for the owner.

**Honest privacy note:** the owner is the Firebase project admin and can technically read stored data through the console. Encrypting this away is out of scope. An About page in the app says this in plain, friendly words, so she can decide what to write.

## Later phases (not Phase 1)

Added one at a time based on what she actually enjoys:

- Snail Post: letters carried slowly across a map by a snail
- Little Lantern: a "thinking of you" light, with fireflies when both light it on the same day
- Memory Garden: each shared memory grows a flower
- Message in a Bottle: letters that open on a set date, such as her birthday
- Question of the Day: answers revealed only when both have answered
- Sand Doodles: shared drawing that the tide washes away the next day
- Coupon Book: redeemable cards such as "one free boba"
- Festival Days: Thingyan water and Thadingyut lights on the island
- Island growth: new things appear as they use the app
- Secret Door: see below

### The Secret Door

*(Designer's call, the owner can veto.)* The app stays friendship-safe, and the confession is separate and optional. The door is added only when the owner chooses. It is the only place in the app for a confession, and she can answer freely. If the answer is no, the app works unchanged as a friendship app, and she can still delete it.

## Architecture

- **Client:** one Flutter app with Android and web targets. Platform-specific code stays behind small interfaces for shake, push, install detection, and audio. Web uses JS interop where needed.
- **Data:** Cloud Firestore. Every read and write is limited by security rules to the two allowed user IDs, and rules enforce the important behaviour, such as only the sulker can end a sulk and only the recipient can open a star.
- **Media:** photos are resized and compressed on the device to a target of about 300 KB, with a hard limit that keeps the document under 1 MiB after encoding, and stored in separate documents that load only when opened. Video is out of scope.
- **Push:** Firebase Cloud Messaging, sent by a small Cloudflare Worker on the free plan. The client calls the Worker with its Firebase ID token. The Worker verifies the token, checks the allowed user IDs, looks up only the other person's device token, and sends one of a fixed set of notification types. The FCM service account key lives only as a Worker secret. Cache the Google access token to stay within the CPU limit.
- **Hosting:** Firebase Hosting serves the web build, with a manifest and service worker.
- **Fonts:** bundle a Burmese Unicode font and a cute Latin font so Burmese renders correctly in Flutter web.
- **Loading:** a Mochi-waking-up screen shows immediately from plain HTML before Flutter loads, because the first web load can be slow.

## Risk checks to do first

**The owner has no iPhone to test on (owner's answer).** Windows cannot run the iOS simulator, so her phone will be the first real iPhone this runs on. Her first use is therefore also the first real test, and the plan must protect that moment.

Test these first, as far as possible without an iPhone:

1. **Worker signing inside 10 ms CPU.** If it cannot stay inside the free limit, return to the owner with options. In-app updates still work without push.
2. **Burmese text and the web build in a Safari-like browser.** Use WebKit through Playwright on Windows. It is only an approximation of an iPhone. A real-iPhone cloud trial is worth using only if one is available free and with no card.
3. **Installed web app on the owner's Android phone,** through Chrome, to check the install, push, and shake flows. iPhone behaviour can still differ.

Because the iPhone is untested, the first version she sees follows these rules:

- **Fallbacks are built before features need them.** Tap always works in place of shake. The app is fully usable without push.
- **Conservative animation.** Start with a light island, and add richer motion only once it runs well on her phone.
- **No voice stars in Phase 1.** Microphone behaviour is unconfirmed and cannot be tested beforehand.
- **Support check on the install page.** It detects the iOS version and whether the app is installed. Below iOS 16.4, it says kindly that notifications will not work there, and the app continues without them.
- **Mochi's Check-up.** A small screen in Settings shows whether notifications, motion, photos, and fonts work on this device. It stays on her device and is never sent to the owner. If something is wrong, she can choose to show or screenshot it.
- **A two-step handover.** She gets the island, login, Star Jar, and How I Feel Now first, framed as "Mochi's island is still being built". Sulking and other features follow once the basics work on her phone. Web updates reach her without reinstalling, so fixes can ship quickly.
- **Handover in person if possible,** so the owner can help with Add to Home Screen.

If Flutter animation is too slow on the iPhone, first simplify the island and animation while keeping Flutter and one codebase (designer's call). Dropping Flutter for her web app would come back to the owner as a new decision.

## Testing

- Security rule tests on the Firebase Emulator: a third user is refused everything, only the sulker can forgive, only the recipient opens a star, one star per day.
- Unit tests for state logic such as sulk states and the daily reset.
- Widget tests for key flows.
- Manual device test on the owner's Android phone, as both the APK and the installed web app, plus a Playwright WebKit smoke test of the web build, before handing it to her. Real-iPhone results come from her first use (see Risk checks).

## Agentic engineering setup

**Owner requested this.** Set up after this document is approved, before feature work.

- **Git:** local repository with a `.gitignore` covering secrets and build output. No remote or push unless the owner asks.
- **`CLAUDE.md`:** short and practical. Covers purpose, anti-goals, the stack and free-tier limits, commands, folder layout, and Firestore and privacy rules.
- **Hooks (`.claude/settings.json`), Windows compatible:**
  - After editing a `.dart` file: run `dart format` on it.
  - Before file writes and commits: block service account keys and other secrets.
  - Before finishing a turn with changed Dart code: run `flutter analyze` and report problems, with tests run when relevant.
  - After changing `firestore.rules`: run the rules tests.
- **Project skills (`.claude/skills/`):**
  - `add-island-place`: how to add a new place to the island consistently.
  - `mochi-style`: the visual and writing rules, colours, motion, Mochi's voice, and the anti-goals.
  - `deploy-mochi`: the checklist and commands for building the APK and deploying Hosting, rules, and the Worker.
  - `free-tier-check`: reviews a change against the Spark and Worker limits.
- **Wiring:** add the Dart and Firebase MCP servers if their current versions work on this machine, and a permissions allowlist for safe read-only commands. Deploys and anything sent to her always need the owner's confirmation.

## Designer's calls

Made by the designer, not yet agreed by the owner:

- The confession is a separate, later, optional Secret Door.
- Interface text is mainly Burmese, with Mochi's personality in the writing. All text lives in one easy-to-edit file, and the owner reviews the Burmese before she sees it, because AI-written Burmese can sound wrong.
- No activity signals between the two people (see Mochi's house and Star Jar).
- Sulks fade after 24 hours, and both people can sulk at the same time.
- Her own secret phrase, the deletion behaviour, and the privacy note on the About page.
- If the iPhone is slow, simplify before reconsidering Flutter.
- Day resets use Myanmar time.
- Security through a fixed two-user allowlist, with the secret phrase as the password.
- Phase 1 stars carry text and photos, with no voice.
- The no-iPhone rules: conservative animation, Mochi's Check-up, and the two-step handover.

## Left to the builder

- Package choices, state management, folder structure, and the exact Firestore data model.
- How art and animation are made, provided it is original, cute, performs well on the web, and needs no paid tool.
- Exact colours and characters within a soft, cute style. The inspiration is pink, but the app should have its own identity.
- Exact star-unfolding and raindrop-game mechanics.
