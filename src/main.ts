import { mount } from 'svelte';
import App from './App.svelte';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Target root element not found');
}

const app = mount(App, { target: rootElement });

export default app;
