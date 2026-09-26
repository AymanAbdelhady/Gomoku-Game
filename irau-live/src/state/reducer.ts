import type { AppState, Donation, FundraisingEvent, Overlay } from '../types/index.ts';
import type { Action } from './actions.ts';
import { enabledMilestones, getTotals } from './selectors.ts';
import { demoHistory, demoTick } from './demo.ts';
import { publicDonorName } from '../utils/content.ts';
import { money } from '../utils/format.ts';

const MAX_OVERLAYS = 8;

/**
 * The single source of truth for how event data changes.
 * Pure: no Date.now(), no randomness, no I/O. Returns the same object when
 * an action is rejected so callers can cheaply detect no-ops.
 */
export function reducer(state: AppState, action: Action): AppState {
  const next = apply(state, action);
  return next === state ? state : { ...next, rev: state.rev + 1 };
}

function apply(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'state/replace':
      return action.state;

    case 'event/create':
      return {
        ...state,
        events: { ...state.events, [action.event.id]: action.event },
        activeEventId: action.activate ? action.event.id : state.activeEventId,
      };

    case 'event/delete': {
      if (Object.keys(state.events).length <= 1 || !state.events[action.eventId]) return state;
      const events = { ...state.events };
      delete events[action.eventId];
      const activeEventId = state.activeEventId === action.eventId ? Object.keys(events)[0] : state.activeEventId;
      return { ...state, events, activeEventId };
    }

    case 'event/activate':
      return state.events[action.eventId] ? { ...state, activeEventId: action.eventId } : state;

    case 'donation/add':
      return withEvent(state, action.donation.eventId, (event) => addDonations(event, [action.donation], !!action.recognise, action.donation.timestamp));

    default:
      return withEvent(state, action.eventId, (event) => applyToEvent(event, action));
  }
}

function withEvent(state: AppState, eventId: string, fn: (e: FundraisingEvent) => FundraisingEvent): AppState {
  const event = state.events[eventId];
  if (!event) return state;
  const updated = fn(event);
  if (updated === event) return state;
  return { ...state, events: { ...state.events, [eventId]: updated } };
}

function applyToEvent(event: FundraisingEvent, action: Exclude<Action, { type: 'state/replace' | 'event/create' | 'event/activate' | 'donation/add' }>): FundraisingEvent {
  const touch = (e: FundraisingEvent, at?: number): FundraisingEvent => ({ ...e, updatedAt: at ?? e.updatedAt + 1 });

  switch (action.type) {
    case 'event/delete':
      return event;

    case 'donation/update':
      return touch({
        ...event,
        donations: event.donations.map((d) => {
          if (d.id !== action.id) return d;
          const merged = { ...d, ...action.patch };
          if (action.patch.donor) merged.anonymous = action.patch.donor.recognition === 'anonymous';
          return merged;
        }),
      });

    case 'donation/remove':
      return touch({ ...event, donations: event.donations.filter((d) => d.id !== action.id) });

    case 'donation/recognise': {
      const d = event.donations.find((x) => x.id === action.id);
      if (!d) return event;
      return touch(pushOverlays(event, [thankYouOverlay(event, d, action.at, `ov_ty_${d.id}_${action.at}`)]));
    }

    case 'live/slide':
      return touch({ ...event, live: { ...event.live, slide: action.slide, activeLevelId: action.slide === 'appeal' ? event.live.activeLevelId : null } });

    case 'live/level':
      if (action.levelId && !event.givingLevels.some((l) => l.id === action.levelId)) return event;
      return touch({
        ...event,
        live: {
          ...event.live,
          activeLevelId: action.levelId,
          slide: action.levelId ? 'appeal' : event.live.slide === 'appeal' ? 'main' : event.live.slide,
        },
      });

    case 'live/milestone': {
      const m = event.milestones.find((x) => x.id === action.milestoneId);
      if (!m) return event;
      return touch(pushOverlays(event, [milestoneOverlay(m.amount, m.headline, m.message, action.at, `ov_ms_${m.id}_${action.at}`)]));
    }

    case 'live/clearOverlays':
      return touch({ ...event, live: { ...event.live, overlays: [] } });

    case 'event/status':
      return touch({ ...event, status: action.status });

    case 'event/update':
      return touch({ ...event, ...action.patch });

    case 'event/setRaised': {
      const donated = event.donations.reduce((s, d) => s + d.amount, 0);
      const updated = { ...event, openingBalance: Math.max(0, action.raised - donated) };
      // A manual correction should never trigger celebrations; mark passed milestones as done.
      return touch(markMilestones(updated, 0, false).event);
    }

    case 'event/resetData':
      return touch({
        ...event,
        donations: [],
        openingBalance: 0,
        openingDonorCount: 0,
        live: { slide: 'main', activeLevelId: null, celebratedMilestoneIds: [], overlays: [] },
        demo: { ...event.demo, running: false, tick: 0 },
      });

    case 'demo/start': {
      let e: FundraisingEvent = {
        ...event,
        status: 'live',
        demo: { running: true, autoStage: action.autoStage, intervalMs: action.intervalMs, tick: 0 },
      };
      if (e.donations.length === 0) {
        const history = demoHistory(e, action.at, action.seed, getTotals(e).raised);
        e = markMilestones({ ...e, donations: history }, action.at, false).event;
      }
      return touch({ ...e, live: { ...e.live, slide: 'main', activeLevelId: null } }, action.at);
    }

    case 'demo/stop':
      return touch({ ...event, demo: { ...event.demo, running: false } });

    case 'demo/configure':
      return touch({
        ...event,
        demo: {
          ...event.demo,
          ...(action.autoStage !== undefined ? { autoStage: action.autoStage } : {}),
          ...(action.intervalMs ? { intervalMs: Math.min(15_000, Math.max(800, action.intervalMs)) } : {}),
        },
      });

    case 'demo/clear': {
      const donations = event.donations.filter((d) => d.source !== 'demo');
      const e = { ...event, donations, demo: { ...event.demo, running: false, tick: 0 }, live: { ...event.live, overlays: [], activeLevelId: null, slide: 'main' as const } };
      const raised = getTotals(e).raised;
      const celebrated = e.live.celebratedMilestoneIds.filter((id) => (e.milestones.find((m) => m.id === id)?.amount ?? Infinity) <= raised);
      return touch({ ...e, live: { ...e.live, celebratedMilestoneIds: celebrated } });
    }

    case 'demo/tick': {
      if (!event.demo.running || event.status !== 'live') return event;
      const outcome = demoTick(event, action.at, action.seed, getTotals(event).raised);
      let e: FundraisingEvent = { ...event, demo: { ...event.demo, tick: event.demo.tick + 1, running: !outcome.stop } };
      if (outcome.levelId !== undefined || outcome.slide) {
        e = {
          ...e,
          live: {
            ...e.live,
            activeLevelId: outcome.levelId !== undefined ? outcome.levelId : e.live.activeLevelId,
            slide: outcome.slide ?? e.live.slide,
          },
        };
      }
      for (const { donation, recognise } of outcome.donations) {
        e = addDonations(e, [donation], recognise, action.at);
      }
      return touch(e, action.at);
    }
  }
}

function addDonations(event: FundraisingEvent, donations: Donation[], recognise: boolean, at: number): FundraisingEvent {
  if (event.status !== 'live') return event;
  const fresh = donations.filter((d) => d.amount > 0 && !event.donations.some((x) => x.id === d.id));
  if (fresh.length === 0) return event;
  let e: FundraisingEvent = { ...event, donations: [...event.donations, ...fresh], updatedAt: at };
  if (recognise) e = pushOverlays(e, fresh.map((d) => thankYouOverlay(e, d, at, `ov_ty_${d.id}`)));
  return markMilestones(e, at, true).event;
}

/** Marks newly-passed milestones as celebrated and (optionally) queues their overlay. */
function markMilestones(event: FundraisingEvent, at: number, announce: boolean): { event: FundraisingEvent } {
  const { raised } = getTotals(event);
  const crossed = enabledMilestones(event).filter((m) => m.amount <= raised && !event.live.celebratedMilestoneIds.includes(m.id));
  if (crossed.length === 0) return { event };
  let e: FundraisingEvent = {
    ...event,
    live: { ...event.live, celebratedMilestoneIds: [...event.live.celebratedMilestoneIds, ...crossed.map((m) => m.id)] },
  };
  if (announce) {
    // If a single gift crosses several milestones, celebrate the highest only.
    const top = crossed[crossed.length - 1];
    e = pushOverlays(e, [milestoneOverlay(top.amount, top.headline, top.message, at, `ov_ms_${top.id}_${at}`)]);
  }
  return { event: e };
}

function pushOverlays(event: FundraisingEvent, overlays: Overlay[]): FundraisingEvent {
  return { ...event, live: { ...event.live, overlays: [...event.live.overlays, ...overlays].slice(-MAX_OVERLAYS) } };
}

function thankYouOverlay(event: FundraisingEvent, d: Donation, at: number, id: string): Overlay {
  const slide = event.slides.find((s) => s.id === 'thankyou');
  return {
    id,
    kind: 'thankyou',
    createdAt: at,
    amount: d.amount,
    headline: slide?.title || 'Jazakum Allahu Khairan',
    message: slide?.subtitle || 'Thank you for helping provide lifesaving medical support.',
    name: publicDonorName(d),
  };
}

function milestoneOverlay(amount: number, headline: string, message: string, at: number, id: string): Overlay {
  return { id, kind: 'milestone', createdAt: at, amount, headline: headline || 'Alhamdulillah', message: message || `${money(amount)} raised` };
}
