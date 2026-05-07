# Black Diamond Marketplace — Bugs & Changes



## Bugs
Bugs that need to be fixed.

### B001 — Sign In Dashboard Redirect
- **Page:** Sign Up/In Page
- **What happened:** When user signs up/in, it redirects them to home page
- **What should happen:** Should redirect to User Dashboard where they can create/manage listings, and manage membership.
- **Priority:** Medium

### B002 — Sign Up Promo Box
- **Page:** Sign Up Page
- **What happened:** Users who create an account aren't appearing on the newsletter_subscribers table.
- **What should happen:** Sign Up form should have a promo check box to add to newsletter database. This will add all users with accounts to our newsletter for promotional emials.
- **Priority:** High

### B003 — Company name not catching
- **Page:** Sign Up Page
- **What happened:** When users create a new account and fill in their company, supabase ins't populating the company field with their company name.
- **What should happen:** The company name they fill in when signing up should populate over to the company field in supabase database.
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