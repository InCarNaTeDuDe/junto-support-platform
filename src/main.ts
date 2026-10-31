import { mount } from 'svelte';
import App from './App.svelte';
import './styles/global.css';

const target = document.getElementById('root');

if (!target) {
  throw new Error('Target root element not found');
}

const app = mount(App, { target });

export default app;
