import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { tampermonkeyLog } from './base';

// HackerRank's new UI puts data in <script type="application/json" id="initialData">...</script>
// but this HTML element will be automatically deleted shortly when the page is loaded.
// To read the data, we set up a MutationObserver as soon as possible and wait for the element
// to be deleted.
function whenReady(proc: (initialData: HTMLElement) => void) {
  const observer = new MutationObserver((mutations) => {
    for (const { removedNodes } of mutations) {
      for (const removedNode of removedNodes) {
        if (removedNode instanceof HTMLElement && removedNode.matches("#initialData")) {
          observer.disconnect();
          tampermonkeyLog("found initialData through MutationObserver");
          proc(removedNode);
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

tampermonkeyLog("start");
whenReady((initialData: HTMLElement) => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(initialData.textContent);
  } catch (e) {
    tampermonkeyLog(`failed to decode URI, found:\n\n${initialData.textContent}`);
    throw new Error("bad");
  }
  let parsed: object;
  try {
    parsed = JSON.parse(decoded);
  } catch (e) {
    tampermonkeyLog(`failed to parse JSON, found\n\n${decoded}`);
    throw new Error("bad");
  }
  tampermonkeyLog("load initialData successfully");

  ReactDOM.createRoot(
    (() => {
      const app = document.createElement('div');
      document.body.prepend(app);
      return app;
    })(),
  ).render(
    <React.StrictMode>
      <App input={parsed} />
    </React.StrictMode>,
  );
});