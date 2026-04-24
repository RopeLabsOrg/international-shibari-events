import type { RouteRecordRaw } from "vue-router";
import HomePage from "./pages/HomePage.vue";
import EventPage from "./pages/EventPage.vue";
import WatchlistPage from "./pages/WatchlistPage.vue";

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
  {
    path: "/watchlist",
    name: "watchlist",
    component: WatchlistPage,
  },
];
