# FRMS Brand Guide

Last updated 2026-11-10. The working copy lives in the [FRMS Brand Guide doc](https://claude.ai/artifact/3pjXhWeF99L8iir5Vf2WbW); this file is a snapshot of it.

## Logo

The FRMS mark is a circular seal: the letters F, R, M and S in a heavy serif, set in four quadrants divided by a thin cross, with white mycelium threads branching through a black field, ringed by a double circle. Representing letters of mycelium growing on an agar plate.

| File | Format | Where it's used |
| --- | --- | --- |
| `images/logo.png` | PNG, 1024 × 1024, black and light gray | Site nav (40 px, cropped to a circle), footer, welcome email |
| `favicon.ico` | ICO, 16 × 16 | Browser tab |
| `images/nexstrata-icon.svg` | SVG | Nexstrata map partner badge only, not an FRMS mark |

**Usage on the site today**

- Shown small and round (`rounded-full`) in the dark green nav bar, with no wordmark next to it.
- The full name "Front Range Mycological Society" is set as text beside or below the mark, never baked into the image.
- Abbreviation is "FRMS".

**Open questions**

- There is no vector (SVG) master, no transparent-background version, and no reversed (white on dark) version in the repo. A vector trace would help for print, merch and stickers.
- Minimum size and clear space are not defined yet. A starting rule: keep clear space equal to the width of the outer ring, and don't use it smaller than 32 px on screen or 0.5 in in print.
- Don't stretch, or crop the ring off the seal.

## Links

These are the official links

| Channel | Link | Use it for |
| --- | --- | --- |
| Website | [frontrangemycosociety.org](https://frontrangemycosociety.org) | Home base for every post and print piece |
| Instagram | [@frontrange\_mycologicalsociety](https://www.instagram.com/frontrange_mycologicalsociety) | Finds, event photos, announcements |
| Discord | [discord.gg/mKSuJ6w9zr](https://discord.gg/mKSuJ6w9zr) | Community chat, ID help, foray planning |
| Eventbrite | [FRMS organizer page](https://www.eventbrite.com/o/front-range-mycological-society-120736224622) | Forays and event tickets |
| iNaturalist | [FRMS project](https://www.inaturalist.org/projects/front-range-mycological-society) | Members' observations and finds |
| Nexstrata map | [nexstrata.frontrangemycosociety.org/map](https://nexstrata.frontrangemycosociety.org/map) | Regional fungal distribution map |
| Newsletter | [Sign up](http://eepurl.com/eDKZxBt3bX) (Mailchimp) | Event announcements and mushroom news |
| Donate | [frontrangemycosociety.org/donate.html](https://frontrangemycosociety.org/donate.html) (PayPal) | Donation asks |
| Email | frontrangemycologicalsociety@gmail.com | General contact |

**Contact email:** use frontrangemycologicalsociety@gmail.com for now. Email on frontrangemycosociety.org is still being set up; once it's live, switch the public contact to a domain address and update this guide and the site.

## Color and Brand

The brand is forest green and amber on a warm cream ground, with the black-and-white seal as the mark. The site builds every color from Tailwind's default palette, so the hex values below are Tailwind v3's.

| Role | Name (Tailwind) | Hex | Where it shows up |
| --- | --- | --- | --- |
| Primary dark | Forest green (`green-800`) | #166534 | Nav bar, headings, section titles |
| Primary deep | Deep forest (`green-900`) | #14532D | Footer background |
| Primary mid | Moss (`green-700`) | #15803D | Mobile menu, secondary buttons, borders |
| Primary light | Mint wash (`green-100`) | #DCFCE7 | Light text on green, soft panels |
| Accent | Amber (`amber-500`) | #F59E0B | Main call-to-action buttons (Donate, Explore the Map) |
| Accent hover | Dark amber (`amber-600`) | #D97706 | Button hover |
| Highlight | Gold (`amber-300`) | #FCD34D | Active nav item, link hover, icons on dark green |
| Background | Cream (`amber-50`) | #FFFBEB | Page background |
| Background alt | Parchment (`amber-100`) | #FEF3C7 | Alternating sections, cards |
| Hover pop | Lime (`lime-500`) | #84CC16 | Desktop nav link hover |
| Body text | Slate (`gray-700`) | #374151 | Paragraph text |
| Logo | Black / light gray | #000000 / #D9D9D9 (approx.) | The seal only |

**Typography**

- The site uses no custom font. All text is Tailwind's default sans-serif system stack (system-ui, Segoe UI, Roboto, Helvetica, Arial).
- Headings are bold: 4xl–6xl (36–60 px) for page heroes, 3xl (30 px) for section titles, xl (20 px) for card titles.
- Body copy is 16–20 px, regular weight, gray-700.
- Buttons are bold, white text on amber, fully rounded pills (`rounded-full`). Cards use `rounded-lg` corners and lift with a soft shadow on hover.

**Open questions**

- Choose a brand typeface. The logo letters are a heavy serif, so a serif display face for headings (for example Roboto Slab or Merriweather) with the current sans for body would tie the site to the mark.
- Decide whether lime stays in the palette; it is used in one place and sits apart from the green-and-amber scheme.

## Themes and Visual Language

FRMS looks and sounds like a field trip with friends who happen to know a lot: close-up photos of real Front Range fungi, earthy colors, and plain, welcoming words backed by science.

**Recurring themes**

- **Mycelium and networks.** The logo's branching threads, the "hidden networks of the forest floor," and data that connects finds into a bigger picture.
- **Education, conservation, citizen science.** The three pillars named on the About page; every find logged on iNaturalist "contributes to the science."
- **Community for all levels.** Beginners are always explicitly welcome.
- **Place.** Colorado's Front Range, the High Rockies, Ward, elevation zones, mountain forests.
- **Safety and ethics.** Ethical foraging, and never eating a mushroom on an app ID alone.

**Imagery**

- Real macro photos of local fungi taken on forays: oysters, chanterelles, porcini, morels, amanitas, earthstars, russulas, slime molds, lichens and moss. About 30 live in `images/`.
- Group photos from forays and meetups (`foray-foraging.jpg`, `foray-meetup.jpg`, `community-event.jpg`).
- Hero banners put a photo under a 50% black overlay with large white bold type (the home hero uses `mushroom-oyster-orange.jpg`).
- Board headshots are round crops.
- Prefer our own field photos over stock. Credit the photographer when it isn't a board member.

**Layout patterns**

- Dark green nav and footer bracket cream pages; sections alternate cream and parchment.
- White rounded cards that lift on hover, with outline icons from Feather Icons.
- Amber pill buttons for the one main action on each screen.
- Content fades up gently as you scroll (AOS).

**Tone of voice**

- Warm, curious and inviting: "fascinating," "passionate," "welcoming space."
- Inclusive by default: "all levels of experience," "people of all backgrounds."
- Careful about safety: when in doubt, defer to an experienced mycologist.
- Use "FRMS" after the first full mention of Front Range Mycological Society. Members are "fungi enthusiasts" or "mycophiles".

## Blurbs

Ready-to-paste copy, taken from the site and lightly trimmed. Pick the length that fits the space.

**Mission statement (draft)**

The Front Range Mycological Society connects people with the fungi of Colorado's Front Range through education, conservation, and citizen science, building a welcoming community for every level of experience.

**Mission (current site wording, home page)**

The Front Range Mycological Society is dedicated to the study and appreciation of mushrooms and other fungi through educational programs, forays, and community events. We believe in fostering a deeper connection between people and the natural world through the fascinating lens of mycology.

**Tagline**

Exploring the fungal kingdom through education, research, and community.

**Alternate tagline (home hero)**

Exploring the fascinating world of fungi through education, forays, and community building.

**One sentence (bios, event listings)**

The Front Range Mycological Society is a nonprofit dedicated to mycological education, conservation, and citizen science on Colorado's Front Range.

**Short (about 50 words: social bios, partner pages)**

Founded in September 2025, the Front Range Mycological Society (FRMS) brings together fungi lovers across Colorado's Front Range. We offer forays, workshops, and talks for every level of experience, and log our finds on iNaturalist to build a lasting citizen-science record of the region's fungi.

**Long (about 100 words: grants, press, sponsors)**

The Front Range Mycological Society is dedicated to the study and appreciation of mushrooms and other fungi through educational programs, forays, and community events. Founded in September 2025 by a group of passionate mycologists and nature enthusiasts, FRMS has quickly grown from a small gathering into an active community and a welcoming space for all levels of experience. We share knowledge through lectures, workshops, and hands-on field days; promote sustainable foraging and the protection of fungal habitats; and turn members' observations into data that maps fungal biodiversity across Colorado. FRMS is a nonprofit based in Colorado.

**Mission pillars**

- **Education:** We share knowledge about fungi through lectures, workshops, and hands-on experiences to foster appreciation and understanding.
- **Conservation:** We promote sustainable practices and advocate for the protection of fungal habitats and biodiversity in our local ecosystems.
- **Community:** We build connections among people who share a passion for mycology, creating a welcoming space for all levels of interest and expertise.

**Calls to action**

- Join: Become part of our growing community and connect with fellow fungi enthusiasts.
- Newsletter: Subscribe for event announcements, mushroom news, and community updates.
- Donate: Your donation helps us continue our work in mycology education, research, and conservation.

**Safety disclaimer**

No app can reliably identify mushrooms to a safe-to-eat certainty. Never eat a foraged mushroom based on an app ID alone. When in doubt, defer to an experienced mycologist.

**Nonprofit line (footers, receipts)**

Front Range Mycological Society is a nonprofit organization based in Ward, Colorado. EIN 39-4447386. Please consult your tax advisor regarding the deductibility of your contribution.
