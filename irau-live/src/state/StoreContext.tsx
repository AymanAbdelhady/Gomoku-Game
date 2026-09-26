import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { EventStore } from './store/types';
import type { AppState, FundraisingEvent } from '../types';
import { getActiveEvent } from './selectors';

const StoreContext = createContext<EventStore | null>(null);

export function StoreProvider({ store, children }: { store: EventStore; children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): EventStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}

export function useAppState(): AppState {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getState);
}

export function useActiveEvent(): FundraisingEvent {
  return getActiveEvent(useAppState());
}

export function useDispatch() {
  return useStore().dispatch;
}

export function useSyncStatus() {
  const store = useStore();
  return useSyncExternalStore(store.subscribeStatus, store.getStatus);
}
