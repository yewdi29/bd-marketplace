# Black Diamond Marketplace — Bugs & Changes



## Bugs
Bugs that need to be fixed.

### B008 — Listing card in dashboard does not navigate to product page
- **Page:** /dashboard
- **What happened:** Clicking a listing card does nothing — does not 
  navigate to the listing detail page
- **What should happen:** Clicking on the card (anywhere other than the manage button) should navigate to /listings/[slug] in a new tab.
- **Priority:** High
- **Status:** Resolved

### B009 — Published listing with no price displays $0 on card
- **Page:** /dashboard and /listings
- **What happened:** Listing was published without a price entered. 
  The listing card displays $0 instead of hiding the price
- **What should happen:** If price is 0, null, or empty, hide the 
  price entirely on the listing card and listing detail page. 
  Display 'Contact for price' instead.
- **Priority:** High
- **Status:** Resolved

### B010 — Manage modal appears as full screen overlay instead of on-card
- **Page:** /dashboard
- **What happened:** Clicking 'Manage' on a listing card opens a 
  full screen blurred modal overlay
- **What should happen:** Action buttons (Edit Listing, Unpublish, 
  Mark as Sold) should appear centered directly on the card itself, 
  with only that card having a dark overlay and blur. The rest of 
  the dashboard remains normal and unaffected.
- **Priority:** High
- **Status:** Resolved

### B011 — Edit Listing button does nothing
- **Page:** /dashboard
- **What happened:** Clicking 'Edit Listing' in the manage actions 
  does not open anything
- **What should happen:** Opens an edit modal similar to the new 
  listing window with the same multi-step flow. Seller can edit 
  photos, specs, price, and description. Has a Cancel button and 
  a Save Changes button that PATCHes the listing via 
  /api/listings/[id] and refreshes the dashboard card.
- **Priority:** High
- **Status:** Resolved

### B012 — Drafts and Unpublished should be combined into one filter
- **Page:** /dashboard
- **What happened:** Filter bar has separate 'Drafts' and 
  'Unpublished' toggles
- **What should happen:** Combine into a single 'Drafts' filter 
  that shows both draft and unpublished listings. Remove the 
  separate Unpublished filter button entirely.
- **Priority:** High
- **Status:** Resolved

### B013 — Listing slug generated from empty draft title instead of final title
- **Page:** /api/listings/[id]/publish
- **What happened:** Slug is generated when draft is first created, 
  before AI fills in the title. Results in slug 'untitled-draft-[id]'
- **What should happen:** Slug should be regenerated from the final 
  listing title at the moment of publishing, not at draft creation
- **Priority:** High
- **Status:** Resolved

### B014 — Product page gallery stretches full browser width
- **Page:** /listings/[slug]
- **What happened:** The hero image and thumbnail strip span the full browser
  window width with no max-width constraint
- **What should happen:** Hero image and thumbnail strip should be 
  contained within the same max-width as the page content (1200px), 
  centered, with the same horizontal padding (32px). Also, the hero image 
  height should be determined by the natural aspect ratio of the 
  photo rather than a fixed height.
- **Priority:** High
- **Status:** Resolved

### B015 — Title and price layout change
- **Page:** /listings/[slug]
- **What happened:** Title and price are stacked vertically
- **What should happen:** Title left aligned, price right aligned 
  on the same row. Price/Contact for Price in orange #FF6B35. Should not overlap 
  on smaller screens — title should truncate or wrap before 
  pushing into the price.
- **Priority:** High
- **Status:** Resolved

### B017 — No 'Save as Draft' button available after Step 1 in new listing flow
- **Page:** /dashboard — new listing modal
- **What happened:** After generating the listing in Step 1 and 
  moving to Step 2, there is no way to save progress as a draft 
  and exit the modal
- **What should happen:** A 'Save as Draft' button should be 
  persistently available from Step 2 onwards alongside the Back 
  and Next buttons. Clicking it saves all current field values 
  via PATCH /api/listings/[id] with status 'draft' and closes 
  the modal, refreshing the dashboard grid.
- **Priority:** High
- **Status:** Resolved

### B018 — Sold listing pill indicator is blue instead of red
- **Page:** /dashboard
- **What happened:** Listing cards marked as sold show a blue 
  status pill
- **What should happen:** Sold status pill should be red — 
  background #FFF0F0, text #CC0000, border #FFCCCC
- **Priority:** Medium

--------


## Design Changes
Make it look goood.

### D001 — [Short description]
- **Page:** Whole System
- **Change:** Change to light mode.
- **Priority:** Resolved


## Design Vision and Inspo Notes

A scratchpad for look, feel, and direction before formal design changes are logged.

### Overall Vibe
- Light mode — white/off-white base
- Clean, professional, approachable
- Built for experienced industry people, not tech-savvy millennials
- Think: serious business tool meets premium marketplace
- References: IronPlanet, MachineryTrader, but elevated and modern.

### Typography
- Sans Serif font headers and body text for easy reading.
- Monospace font for equipment specs.

### Color Palette
- Light mode for a very welcoming feel. Charcoal colors on certain sections to ease distinguishability.
- Orange accents for easy to spot clickables.

### Inspiration & References
- I really love the dashboard style of linear, I want to adopt this style to the command center.
- I love the flowness of mobbin.
- I love the industrialness and uniqueness of https://www.shepherdinsurance.com/
- I love the cleaness of https://handhold.io/
- I love the glass effect/frosty designs of modern app UI, I would like to apply it minimaly to a certain component of the site like nav/ai dedicated prompt field.
- I love the colors of https://gradient-labs.ai/

### Component Notes
- Navbar:
- Listing Cards:
- Homepage Hero:
- Buttons & Forms:

### Questions to Decide
- 

--------


## Future Features Additions
Things not yet built that you want added.

### F001 — Mobile App
- **Description:** This app would extend the marketplace by making it easy to take photos from a mobile device and upload them directly to a listing. It would also let users save listing drafts and generate descriptions using AI or voice dictation.
- **Priority:** Low

### F002 — Language Toggle
- **Description:** Have a language change feature where it can detect what country you're browsing from and suggest to change the language OR have a flag button on the top/bottom right of the screen giving the user the option to change the langauge manually.
- **Priority:** Low

### F003 — AI-powered listing submission
- **Description:** Replace traditional listing form with a natural language
  prompt field. Seller describes equipment conversationally. Claude API 
  extracts structured fields, generates SEO meta description, optimizes 
  title and tags. Seller reviews auto-populated fields before submitting.
  This AI-powered submission interface will pop-up as an internal window with an
  AI prompt field.
- **API:** POST to /api/listings/generate — calls Claude API, returns 
  structured listing JSON
- **Priority:** Low

### F004 — Listing lifecycle management
- **Description:** Sellers can save drafts, unpublish active listings, 
  archive, and mark as sold. Sold listings display on public seller 
  profile page for reputation building and SEO value.
- **New page:** /sellers/[id] — public seller profile with active 
  and sold listings
- **Status flow:** draft → pending_review → active → sold/unpublished/archived
- **Priority:** Low


--------

## Project To-Do's
[ ] Figure out best listing pricing structure for memberships. (Free=3, Pro=15, Max=30) + perks.
    - Basic ($2000) 
    - Pro ($7500)
    - Premium ($12,000)
    - Global reach unlocked with premium, lower tiers limited to local country. Track reach based on IP location.
[ ] 