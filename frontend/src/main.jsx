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
              background: '#1a1b2c',
              color: '#bcbabb',
              border: '1px solid rgba(188,186,187,0.12)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: '"DM Sans", system-ui, sans-serif',
            },
            success: {
              iconTheme: { primary: '#256a69', secondary: '#020306' },
            },
            error: {
              iconTheme: { primary: '#904e55', secondary: '#020306' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
