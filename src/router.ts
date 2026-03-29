import type { RouteRecordRaw } from "vue-router";
import HomePage from "./pages/HomePage.vue";
import EventPage from "./pages/EventPage.vue";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/events/:slug",
    name: "event",
    component: EventPage,
    props: true,
  },
];
