import type { RouteRecordRaw } from "vue-router";
import HomePage from "./pages/HomePage.vue";
import EventPage from "./pages/EventPage.vue";
import TicketsPage from "./pages/TicketsPage.vue";
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
    path: "/tickets",
    name: "tickets",
    component: TicketsPage,
  },
  {
    path: "/watchlist",
    name: "watchlist",
    component: WatchlistPage,
  },
];
