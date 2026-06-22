import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

function whenBodyExists(callback: () => void) {
  if (document.body !== null) {
    console.log("[tampermonkey] found body right away");    
    callback();
    return;
  }

  console.log("[tampermonkey] wait for body through MutationObserver");
  const observer = new MutationObserver(() => {
    if (document.body !== null) {
      observer.disconnect();
      console.log("[tampermonkey] found body through MutationObserver");
      callback();
    }
  });

  observer.observe(document.documentElement, { childList: true });
}

console.log("[tampermonkey] start");
whenBodyExists(() => {
  console.log("[tampermonkey] rendering React");
  ReactDOM.createRoot(
    (() => {
      const app = document.createElement('div');
      document.body.prepend(app);
      return app;
    })(),
  ).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});