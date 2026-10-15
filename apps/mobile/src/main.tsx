import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initUiInspector } from '@workshopsync/shared';

// 의뢰자 소통용 UI 일련번호 태깅 & Alt+I 인스펙션 뱃지 시스템 초기화
initUiInspector();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
