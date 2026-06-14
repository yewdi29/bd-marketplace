# Black Diamond Marketplace — Bugs & Changes



## Bugs
Bugs that need to be fixed.

### B019 — Require price
- **Page:** New Listing Process Step 2
- **What happened:** Listing can be published without needing price.
- **What should happen:** Listing must require a price. Also, diplay a
  small message in a convenient spot to let user know that price is needed
  for best browser findability results. If you don't want to display price,
  toggle price off.
- **Priority:** Resolved

### B020 — Price Display
- **Page:** Any page containing the listing card
- **What happened:** 
- **What should happen:** Listing must require a price. Also, diplay a
  small message in a convenient spot to let user know that price is needed
  for best browser findability results. If you don't want to display price,
  toggle price off.
- **Priority:** Resolved

### B021 — New listing modal exit
- **Page:** new listing modal window
- **What happened:** Even if the text field is blank, when trying to exit,
  it asks to keep editing or discard. 
- **What should happen:** If the text field is completely blank, the X or
  close button should close the window without requesting permission. It 
  Should only request permission if on step two. 
- **Priority:** Medium

### B022 — Add Save and Share button to listing page
- **Page:** Listing Page
- **What happened:** No save or share button
- **What should happen:** There should be a save heart button, as well as
  a share button that's incredibly easy to share via email, facebook, whatsapp
  and linkedIn. Learn new ways and techniques for optimized sharing visibility.
- **Priority:** Medium


--------


## Design Changes
Make it look deliciously goood.

### D003 — Browse by Category Section emojis
- **Page:** home page
- **Change:** Need custom icons instead of emojis 
- **Priority:** low

### D005 — Add a revolving globe animation
- **Page:** home page hero section
- **Change:** Create a revolving globe animation created with dots
    that slowly revolves, and has these curved lines stretching
    and connection from one side of the globe to the other, and
    at the end of these lines there are little bubbles containing
    the titles of listings (or tiny photos) and have it be a moving
    world that represents the modern and techy side of the website.
- **Priority:** low

### D006 — Redesign the marketplace filter/search ui (after transfering inventory from webflow)
- **Page:** search page
- **Change:** I like the simplicity of the page in terms of design,
    but I want to add more functionality to the search bar, and
    filtering system. I also want to make the search bar better looking,
    giving it a glass effect with smarter search ability being able
    to adjust the filtering system base on what the user searched.
- **Priority:** medium

### D008 — Redesign home page. 
- **Page:** home page
- **Change:**
  - Need to improve the layout of the hero section 
  - Remove the categories dropdown on the search bar.
  - Make the orange search button glassy orange/glass effect. 
  - Change the title and subtitle for a more general heavy equipment message.
  - Test globe positionings and design layout, perhaps on the right, or perhaps at the top or at the bottom.
  - Remove the data analytics for now.
  - Make the hero section background block glass effect for immersive animations from the globe.
  - Improve sections to include a "Browse Categories" and/or "Browse Equipment" button.
  - At a quick "How it works" section
  - 
- **Priority:** medium


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

### F004 — Listing lifecycle management
- **Description:** Sellers can save drafts, unpublish active listings, 
  archive, and mark as sold. Sold listings display on public seller 
  profile page for reputation building and SEO value.
- **New page:** /sellers/[id] — public seller profile with active 
  and sold listings
- **Status flow:** draft → pending_review → active → sold/unpublished/archived
- **Priority:** resolved


--------

## Project To-Do's
[done] Figure out best listing pricing structure for memberships. (Free=3, Pro=15, Max=30) + perks.
    - Pro ($2000/year) 10 listings, country only.
    - Premium ($7500/year) 30 listings, global reach, Directory page placement,- Enterprise ($12,000/year) 50 listings, global reach, 
    - Global reach unlocked with premium, lower tiers limited to local country. Track reach based on IP location.
[done] Need to figure out intelligence to detect editable values in the listing modal
    that are unique to the listing specs. The goal is for AI to identify the unique specs
    found in the initial prompt, then generate custom input fields. 
[done] Find solution to flexible pricing, such as: $19/ft, $500/pc,
[done] Redesign the product photo gallery. The gray side bars bother me.