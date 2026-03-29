import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import HomePage from "../src/pages/HomePage.vue";
import EventPage from "../src/pages/EventPage.vue";
import { routes } from "../src/router";
import { loadEventsData, sortEventSummaries, getEventSummaries } from "../src/lib/events";

describe("buyer guide website", () => {
  it("sorts by event date with confirmed before estimated", () => {
    const summaries = getEventSummaries(loadEventsData());
    const sorted = sortEventSummaries(summaries, "eventDate");

    expect(sorted.length).toBeGreaterThan(0);
    const firstEstimatedIndex = sorted.findIndex((summary) => summary.nextDate.isEstimated);
    if (firstEstimatedIndex > 0) {
      const allConfirmedBeforeEstimated = sorted
        .slice(0, firstEstimatedIndex)
        .every((summary) => !summary.nextDate.isEstimated);
      expect(allConfirmedBeforeEstimated).toBe(true);
    }
  });

  it("renders home cards with sort control", () => {
    const wrapper = mount(HomePage, {
      global: {
        stubs: {
          RouterLink: {
            template: "<a><slot /></a>",
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Event Buyer Guide");
    expect(wrapper.find("select").exists()).toBe(true);
    expect(wrapper.text()).toContain("Sort by");
    expect(wrapper.text()).toContain("Missing an event?");
    expect(wrapper.text()).toContain("Open a pull request on GitHub");
    expect(
      wrapper
        .find('a[href="https://github.com/RopeLabsOrg/international-shibari-events"]')
        .exists(),
    ).toBe(true);
  });

  it("renders event detail with status, provenance, history, and links", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    router.push("/events/eurix");
    await router.isReady();

    const wrapper = mount(EventPage, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain("Prediction provenance");
    expect(wrapper.text()).toContain("Historical editions");
    expect(wrapper.text()).toContain("Official links");
    expect(wrapper.text()).toContain("Temporal state");
    expect(wrapper.text()).toContain("Reveal contact email");
  });
});
