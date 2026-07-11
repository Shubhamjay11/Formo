/**
 * WHITE-LABEL HEART.
 * Every brand-specific and business-config value lives here (plus the CSS
 * tokens in app/globals.css). Nothing brand-specific may appear anywhere else.
 * Launching a new product = edit this file + globals.css tokens + /public/brand.
 */

export const brand = {
  name: "Acme",
  tagline: "Ship faster with Acme",
  description: "Acme helps teams do X without Y.", // meta description
  domain: "acme.com",
  url: "https://acme.com",

  support: { email: "support@acme.com" },

  logo: {
    light: "/brand/logo-light.svg",
    dark: "/brand/logo-dark.svg",
    mark: "/brand/mark.svg", // square icon
  },

  social: {
    twitter: "https://x.com/acme",
    github: "",
    linkedin: "",
  },

  legal: {
    company: "Acme Inc.",
    address: "123 Example St, City, Country",
  },

  // Feature flags — toggle per product. Gate code with brand.features.x
  features: {
    teams: true,
    apiAccess: false,
    sso: false,
    blog: true,
  },

  // Plans — prices in integer cents. Stripe price ids come from env.
  plans: [
    {
      id: "free",
      name: "Free",
      priceMonthly: 0,
      stripePriceId: null,
      limits: { members: 1, projects: 1 },
      features: ["1 project", "1 member", "Community support"],
    },
    {
      id: "pro",
      name: "Pro",
      priceMonthly: 2900,
      stripePriceId: "env:STRIPE_PRICE_PRO",
      limits: { members: 10, projects: 20 },
      features: ["20 projects", "10 members", "Priority support"],
    },
  ],
} as const;

export type Brand = typeof brand;
export type PlanId = (typeof brand.plans)[number]["id"];
