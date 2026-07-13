import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import rootReducer from './reducer';

// Robust custom storage implementation that perfectly matches the redux-persist storage interface
// This bypasses any Vite/ESM import issues with redux-persist/lib/storage
const webStorage = {
  getItem(key) {
    try {
      return Promise.resolve(window.localStorage.getItem(key));
    } catch (e) {
      return Promise.resolve(null);
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return Promise.resolve(value);
    } catch (e) {
      return Promise.resolve();
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  },
};

const persistConfig = {
  key: 'root',
  storage: webStorage,
  whitelist: ['userInfo', 'langInfo'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
