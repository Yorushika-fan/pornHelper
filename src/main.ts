import { createApp } from 'vue';
import './tailwind.css';
import 'element-plus/dist/index.css';
import App from './App.vue';


createApp(App).mount(
  (() => {
    const app = document.createElement('div');
    document.body.append(app);
    return app;
  })(),
);


