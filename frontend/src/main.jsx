import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#25272e',
              color: '#d1d1d6',
              border: '1px solid oklch(32% 0.01 284)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: '"DM Sans", system-ui, sans-serif',
            },
            success: {
              iconTheme: { primary: '#368c8a', secondary: '#111218' },
            },
            error: {
              iconTheme: { primary: '#bf6d75', secondary: '#111218' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
