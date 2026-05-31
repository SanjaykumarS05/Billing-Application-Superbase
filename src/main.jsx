import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { billingApi } from './services/billingApi.js';
import '../styles.css';

window.billingApi = billingApi;

createRoot(document.getElementById('root')).render(<App />);
