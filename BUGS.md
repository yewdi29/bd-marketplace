# Black Diamond Marketplace — Bugs & Changes



## Bugs
Bugs that need to be fixed.

### B005 — Make all signup fields required
- **Page:** Sign up page
- **What happened:** User can continue creating an account without requiring company name.
- **What should happen:** Company name must be required. All field names should have a red asterisks.
- **Priority:** High

--------


## Design Changes
Make it look goood.

### D001 — [Short description]
- **Page:** Whole System
- **Change:** Change to light mode.
- **Priority:** Low


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