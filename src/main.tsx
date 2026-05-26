import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- ハートビート送信機能（ブラウザ連動自動終了） ---
// ブラウザが開いている間、5秒ごとにサーバーへ「生存信号」を送信する。
// ブラウザタブを閉じると信号が止まり、12秒後にサーバーが自動終了する。
const startHeartbeat = () => {
  const sendPing = () => {
    fetch('http://localhost:3001/api/heartbeat', {
      method: 'POST',
    }).catch(() => {
      // サーバー終了後のエラーは無視（正常な動作）
    });
  };

  // 起動時に即座に送信
  sendPing();

  // 5秒ごとに送信
  setInterval(sendPing, 5000);
};

startHeartbeat();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
