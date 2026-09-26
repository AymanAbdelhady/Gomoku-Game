import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { StoreProvider } from './state/StoreContext';
import { createStore } from './state/store/createStore';

const root = createRoot(document.getElementById('root')!);

createStore().then((store) => {
  root.render(
    <StrictMode>
      <StoreProvider store={store}>
        <App />
      </StoreProvider>
    </StrictMode>,
  );
});
