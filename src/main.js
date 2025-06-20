import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia); // Use Pinia before router or accessing store

app.use(router); // Use router after Pinia setup and initial auth check

app.mount("#app");
