import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import HomePage from "../src/pages/HomePage.vue";
import EventPage from "../src/pages/EventPage.vue";
import ObfuscatedEmail from "../src/components/ObfuscatedEmail.vue";
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

  it("derives next dates from historical cadence when next edition dates are missing", () => {
    const summaries = getEventSummaries(loadEventsData());
    const eurixSpring = summaries.find((summary) => summary.event.slug === "eurix-spring-edition");
    const ropeLinkedWinter = summaries.find((summary) => summary.event.slug === "ropelinked-winter-edition");

    expect(eurixSpring).toBeDefined();
    expect(ropeLinkedWinter).toBeDefined();
    expect(eurixSpring?.nextDate.value).not.toBeNull();
    expect(ropeLinkedWinter?.nextDate.value).not.toBeNull();
    expect(eurixSpring?.nextDate.isEstimated).toBe(true);
    expect(ropeLinkedWinter?.nextDate.isEstimated).toBe(true);
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

    expect(wrapper.text()).toContain("Upcoming Events");
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

    router.push("/events/eurix-autumn-edition");
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

  it("shows button before reveal then plain text email link after click", async () => {
    const wrapper = mount(ObfuscatedEmail, {
      props: {
        email: "contact@example.com",
        revealLabel: "Reveal email",
        requireReveal: true,
        className: "rounded-xl border px-3 py-1",
      },
    });

    const revealButton = wrapper.find("button");
    expect(revealButton.exists()).toBe(true);
    expect(revealButton.text()).toBe("Reveal email");
    expect(revealButton.classes()).toContain("rounded-xl");

    await revealButton.trigger("click");

    const revealedLink = wrapper.find('a[href="mailto:contact@example.com"]');
    expect(revealedLink.exists()).toBe(true);
    expect(revealedLink.classes()).toContain("underline");
    expect(revealedLink.classes()).not.toContain("rounded-xl");
    expect(revealedLink.text()).toBe("moc.elpmaxe@tcatnoc");
  });
});
