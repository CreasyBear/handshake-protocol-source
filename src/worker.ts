import { createApp } from "./http/app";

const app = createApp();

export default {
  fetch: app.fetch,
};
