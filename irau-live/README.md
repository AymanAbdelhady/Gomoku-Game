# Gaza 3 Years On — Live Fundraising Platform

**Islamic Relief Australia** · live event display, operator dashboard and mobile donor page.

Built for the *Gaza 3 Years On* touring events (VIC · NSW · QLD · WA · SA · ACT). The audience watches giving happen live on the venue screen. The fundraising team enters pledges called from the stage, runs giving-level appeals and switches slides from a tablet or laptop backstage.

> **Prototype status.** A working product, but authentication is placeholder and there is no payment integration by design. See [What still needs a real backend](#7-what-still-needs-a-real-backendservice).

| Route | Who | What |
|---|---|---|
| `#/` | Event team | Launcher, with one-click **Start demo** |
| `#/live` | Audience | 16:9 stage display (press **F** for full screen) |
| `#/admin` | Operator | Command centre: quick add, appeals, slides, feed, demo |
| `#/admin/settings` | Operator | Every editable event setting |
| `#/give` | Donors (mobile) | Progress, giving options, **Donate now** → official site |

---

## Quick start

```bash
cd irau-live
npm install
npm run dev            # http://localhost:5173  (same-browser sync)
```

Operator passcode (prototype): **`gaza`**.

For **multiple devices** (a tablet backstage and a laptop on the projector), use the bundled sync server:

```bash
npm run start          # builds, then serves app + realtime API on http://<this-computer>:8787
SYNC_OPERATOR_KEY=choose-a-passcode PORT=8787 npm run serve   # after a build
```

Node ≥ 22.18 is required, because the server runs TypeScript natively.

---

## 1. Architecture

```
            ┌────────────── pure, shared ──────────────┐
            │ types/ · config/ · state/reducer.ts       │
            │ (every change is a serialisable Action)   │
            └──────────────────────────────────────────┘
                 ▲                              ▲
   ┌─────────────┴────────────┐   ┌─────────────┴──────────────┐
   │ LocalEventStore          │   │ ServerEventStore            │
   │ localStorage +           │   │ POST /api/actions (outbox)  │
   │ BroadcastChannel         │   │ SSE  /api/stream (snapshots)│
   │ (same browser, offline)  │   │ ↔ server/index.ts           │
   └─────────────┬────────────┘   └─────────────┬──────────────┘
                 └──────────── EventStore ───────┘
                                 ▲
          React: useAppState() / useDispatch() (useSyncExternalStore)
      pages/LiveDisplay · pages/Admin · pages/Settings · pages/Give
```

- **One pure reducer** (`src/state/reducer.ts`) owns every rule: totals, milestone detection, overlays, pausing and demo ticks. Actions carry their own ids, timestamps and random seeds, so the same action gives the same result in any tab, on the server, or in a future cloud function.
- **Swappable realtime layer.** `EventStore` (`src/state/store/types.ts`) is the only thing components depend on. `createStore()` picks the backend:
  - **Local mode.** Tabs and windows of one browser share state through `localStorage` and `BroadcastChannel`. A read-modify-write step stops a demo tab and an operator tab from overwriting each other. This mode works with no network at all.
  - **Server mode.** The server is detected automatically at `./api`. Operator actions apply immediately on screen, wait in a **persisted outbox**, and are replayed on reconnect; the server de-duplicates by action id. Displays keep the last confirmed state while offline.
- **To move to Supabase/Firebase/Ably**, implement `EventStore` the way `serverStore.ts` does: apply locally, queue in an outbox, and replace state from remote snapshots. Run `reducer()` in an Edge Function or keep it client-side with row-level security. No component changes.
- **Demo clock.** In local mode, a Web Lock makes sure only one open tab runs the demo. In server mode the server runs it, so extra devices never multiply the simulated gifts.
- **Stage rendering.** Every slide is composed on a fixed 1920×1080 canvas and scaled to fit (`ScaledStage`), so the design is identical on an LED wall, a letterboxed 4:3 projector, and the operator's live preview.

```
src/
  types/            domain model (Event, Donor, Donation, GivingLevel, Milestone, LiveSlide, ImpactMessage…)
  config/           campaign content, regions, defaults (the only place content lives)
  state/            actions, reducer, selectors, demo script, stores, React bindings
  utils/            formatting, amount parsing, privacy-safe names, QR, hooks, router
  components/
    stage/          live display: slides, progress track, feed, overlays, connection notice
    admin/          dashboard panels, settings fields, passcode gate
    ui/ brand/      primitives, icons, QR, wordmark, geometric pattern
  pages/            Home, LiveDisplay, Admin, Settings, Give
server/index.ts     zero-dependency sync server (static + SSE + actions + JSON persistence)
```

The data model lives in `src/types/index.ts`. A donation looks like this:

```ts
{ id, eventId, donor: { name, recognition: 'name' | 'family' | 'anonymous' },
  amount, anonymous, nameHidden, timestamp, source: 'stage' | 'online' | 'demo', levelId? }
```

`totalRaised` and `donorCount` are **computed**: `openingBalance` plus the donations, and `openingDonorCount` plus the number of gifts. They are never stored, so they can't drift.

---

## 2. Editable event settings

Everything is under **Settings** and applies to the live screen immediately. Each city is a separate event with its own copy of all of this.

- **Event details:** campaign name, organisation, state/territory, city, venue, date, supporting line, description, campaign statement, partner line
- **Cities & events:** add an event per state (copy the current settings or start from the campaign template), switch the active event, delete
- **Target & totals:** target, current total (correction; this never triggers celebrations), donors before tonight
- **Donation link & QR:** donation URL (supports `{amount}` / `{frequency}` tokens), optional separate QR URL, label under the QR, live QR preview and a test link
- **Giving levels:** amount, impact line, shown/hidden, add/remove. The first eight enabled levels become the quick-add buttons.
- **Milestones:** amount, headline (e.g. *Alhamdulillah*), message, on/off, add/remove, manual celebrate
- **Impact statements:** one-off or monthly, amount, text
- **Live slides:** show/hide each of the 7 slides, title and subtitle for each, the appeal prompt (`Who will help us reach {amount}?`), and an optional quotation or verse. That text is only ever entered by an administrator; the app never generates religious text.
- **Display options:** show amounts, impact line with new gifts, QR on the main screen, calm motion, auto thank-you threshold, gold threshold
- **Brand colours:** primary `#0778D4`, navy `#223A7B`, teal `#66B3BC`, gold (reserved for major gifts), with a reset
- **Donations & data:** moderated from the dashboard feed (hide name, Name / & Family / Anonymous, thank on screen, remove). You can also export gifts as CSV, export/import all settings as JSON, and reset tonight's donations.

**Content rule.** Only figures from Islamic Relief Australia's campaign material are included. Anything unconfirmed reads `[IMPACT STATEMENT TO BE CONFIRMED]`, is flagged amber in Settings, and **is never rendered on public screens**.

---

## 3. Running Demo Mode

1. Open the launcher (`#/`) and click **Start demo**. The live display opens with the demo running.
   Or, in the dashboard, use **Demo mode → Start demo** and **Stop demo**.
2. On an empty event, the demo seeds about 28% of the target as a believable earlier history. Then a simulated gift arrives every few seconds (Pace: Calm 5s · Standard 3.2s · Lively 1.6s).
3. With **Also run the stage** on, the demo also runs appeals ("Who will help us reach $5,000?" with pledges), the impact, QR and donor slides, thank-you moments for major gifts, and milestone celebrations.
4. Demo gifts are tagged **Demo** in the feed, and a *Demo mode · simulated gifts* badge shows on the big screen. **Clear demo gifts** removes them all. The demo stops by itself at 120% of target.

For a two-window demo on one laptop, open `#/live` on the projector (press F) and `#/admin` in another window of the **same browser**.

---

## 4. Connecting the real Islamic Relief Australia donation URL

1. **Settings → Donation link & QR → Donation URL.** Paste the campaign's official page, e.g. the Gaza appeal page on `islamicrelief.org.au`. It must start with `https://`.
2. If the donation platform accepts pre-filled amounts, add tokens, for example `https://…/donate?amount={amount}&type={frequency}`. The donor page fills them in from the donor's choice. Without tokens the URL is used as-is.
3. To track QR scans separately, set **QR code URL** (e.g. the same link with UTM parameters). To send scans to this app's own donor page instead, host the app publicly and use `https://your-host/#/give`.
4. Use **Test link** and scan the preview QR with a phone before doors open. Repeat for each city, or create the other cities with **Copy current settings**.

The app **never processes payments or collects card, email or phone details**. "Donate now" hands off to the official website.

---

## 5. Deploying

**Option A: static hosting (single-laptop events).** Run `npm run build` and upload `dist/` to Netlify, Vercel, Cloudflare Pages, S3, or any web server. Hash routing means no rewrite rules are needed, and `base: './'` means it also runs from a sub-folder or a local file share. Fonts are bundled, so nothing loads from third-party CDNs at the venue.

**Option B: venue sync server (tablet + projector + extra screens).**
```bash
npm ci && npm run build
SYNC_OPERATOR_KEY='a-strong-passcode' PORT=8787 npm run serve
```
Open `http://<laptop-ip>:8787/#/live` on the display machine and `…/#/admin` on the tablet. The server persists to `server/data/state.json`, so a restart keeps tonight's total. For anything reachable from the internet, put it behind HTTPS (e.g. Caddy or nginx) or use a managed backend (below).

**Environment variables** (see `.env.example`): `VITE_SYNC_MODE` (`auto` | `local` | `server`), `VITE_SYNC_URL`, `VITE_ADMIN_PASSCODE` (local-mode screen lock only, visible in the bundle), `SYNC_OPERATOR_KEY`, `PORT`.

### Offline behaviour (what is and isn't guaranteed)

- **Local mode.** The display and dashboard keep working with no internet. The QR and Donate links still need the phone's own connection.
- **Server mode.** If the venue Wi-Fi drops, the display keeps the last confirmed total and shows *"Reconnecting · showing last confirmed total"*, then *"Connection restored"* when it comes back. Gifts entered on the tablet while offline are queued on that device and synced on reconnect.
- **Not included.** There is no service worker yet, so a display that is *reloaded* while the server is unreachable shows its cached state, but a device that has never loaded the app needs the network once.

---

## 6. Accessibility & operator experience

- The live display uses large type (the total is 210px on a 1080p canvas), high contrast on deep navy, and the `prefers-reduced-motion` setting. The **Calm motion** option does the same for the venue screen.
- The dashboard has visible focus rings, labelled controls, ARIA live regions, native-`<dialog>` modals and a skip link.
- **Fast entry:** type `5000`, `5k` or `$5,000` and press **Enter**. During an appeal, an empty amount means the level amount, so each anonymous pledge is one keystroke. **Undo** is Ctrl/⌘ + Z.
- **Shortcuts** (press `?`): Alt+1…8 presets · Alt+A anonymous · Alt+Shift+1…7 slides · Alt+L end appeal · Alt+P pause.

---

## 7. What still needs a real backend/service

1. **Authentication.** Replace the passcode gate with organisational SSO (e.g. Entra ID / Google Workspace) and per-user audit logs. `VITE_ADMIN_PASSCODE` is not security.
2. **Hosted realtime database** (Supabase, Firebase, Ably…) to run across cities and networks with HTTPS, backups and history, by implementing `EventStore`.
3. **Payment platform integration.** Online gifts made through the QR code don't appear automatically. A webhook from the donation platform should post a `donation/add` action with `source: 'online'` (amount and consented display name only).
4. **CRM reconciliation.** Totals entered here are stage pledges, not settled payments. The payment platform/CRM stays the record of truth.
5. **Confirmed content.** Impact statements for $10,000, $5,000, $2,500, $50 and $25 are placeholders awaiting Islamic Relief Australia confirmation.
6. **Official logo artwork.** The header uses a typographic lockup and an original geometric emblem. Add the approved logo files if the brand team wishes.
7. **Offline-first reload** (service worker / PWA) if venues need a cold start without a network.
