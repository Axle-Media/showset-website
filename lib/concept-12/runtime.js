import { populateCategory, populateCaseStudy, selectCurrentView } from "./route-content";
// Original Concept 12 JavaScript, with lifecycle ownership and path-routing adapters.
// Generated from reference/CONCEPT_12_APPROVED.html; animation equations remain upstream.
export function mountConcept(host, options) {
  const cleanups=[],timeouts=new Set(),frames=new Set();
  const listen=(target,type,handler,settings)=>{target.addEventListener(type,handler,settings);cleanups.push(()=>target.removeEventListener(type,handler,settings));};
  const trackedTimeout=(callback,delay)=>{const id=setTimeout(()=>{timeouts.delete(id);callback();},delay);timeouts.add(id);return id;};
  const trackedFrame=(callback)=>{const id=requestAnimationFrame(time=>{frames.delete(id);callback(time);});frames.add(id);return id;};
  class TrackedObserver extends IntersectionObserver { constructor(...args){super(...args);cleanups.push(()=>this.disconnect());} }
  const paths={home:'/',events:'/events-experiences/',creative:'/creative-design/',digital:'/digital-marketing/',production:'/content-production/',studio:'/our-studio/',work:'/our-work/',contact:'/contact/','case-events':'/work/atmosphere-is-everything/','case-identity':'/work/made-to-be-remembered/','case-production':'/work/behind-every-moment/'};
  const keyForPath=(path)=>Object.keys(paths).find(key=>paths[key]===path);
  function rewriteLinks(){host.querySelectorAll('a[href^="#"]').forEach(a=>{const key=a.getAttribute('href').slice(1);if(paths[key]){a.dataset.routeKey=key;a.href=paths[key];}});}

  'use strict';
  const $ = (s, root = host) => root.querySelector(s);
  const $$ = (s, root = host) => [...root.querySelectorAll(s)];
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  let reduced = options.staticMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 800px)');
  const serviceKeys = ['events', 'creative', 'digital', 'production'];
  const routes = new Set(['home', 'events', 'creative', 'digital', 'production', 'studio', 'work', 'contact', 'case-events', 'case-identity', 'case-production']);
  const data = {
  "events": {
    "idx": "01",
    "image": "/concept-12/900abdb6d28df2c511ea.webp",
    "banner": "We plan for the practical. And leave room for the magic.",
    "title": [
      "We make the room",
      "feel something."
    ],
    "description": "The room. The crowd. The goosebumps. The perfectly timed reveal. We bring bold ideas and meticulous planning together to turn gatherings into experiences.",
    "button": "Plan something brilliant",
    "belief": "The guest list is only the beginning.",
    "beliefCopy": "A great event is not just a date with good lighting. It is a story people step into. The way they arrive. The way the space makes them feel. The moment everything goes quiet, then comes alive. We think about all of it because no single detail creates the atmosphere. Every detail plays its part. From a new concept and creative direction to venue sourcing, staging, guest journeys, technical production and the final run of show, we bring the moving parts into one connected plan. We know when to make a statement and when to let the moment speak for itself.",
    "clusters": [
      [
        "The big idea",
        "Event concepts, creative direction, brand worlds and the visual language that ties it together."
      ],
      [
        "The space",
        "Layouts, 3D renders, scenic builds, décor, florals, furniture and environmental design."
      ],
      [
        "The show",
        "Stage, sound, lighting, AV, entertainment, filming, photography and carefully timed moments."
      ],
      [
        "The invisible work",
        "Planning, suppliers, guest lists, hospitality, transport, logistics and all the things that should feel easy."
      ]
    ],
    "feature": [
      "What we make possible",
      "Conferences with character. Brand activations people actually want to engage with. Festivals that have a world of their own. Launches that get people talking. Celebrations with heart, polish and just enough mischief. Whatever the format, we start with the reason everyone is there and build outward."
    ],
    "process": [
      [
        "Imagine it.",
        "We find the point of the experience, then the creative idea that gives it a personality."
      ],
      [
        "Build it.",
        "We plan the guest journey, design the environment and coordinate the production that makes it possible."
      ],
      [
        "Run it.",
        "We keep the right eyes on the right details, so the audience gets the experience, not the logistics."
      ]
    ],
    "bannerButton": "Bring us your brief",
    "preview": "We make room for the unexpected, then plan every last detail around it.",
    "capabilities": [
      [
        "Event branding, layout & 3D renders",
        "We design the event as a world, not a collection of separate signs. From branded environments and floor plans to visual renders, we help people see the experience before it exists."
      ],
      [
        "Event concepts & creative direction",
        "We shape the central idea, guest experience and creative world that makes the event unmistakably itself. Everything else has something strong to build on."
      ],
      [
        "Graphic design & event branding",
        "Invitations, stage visuals, signage, credentials and everything in between. We make the whole event look and feel as though it belongs together."
      ],
      [
        "Event layout & 3D renders",
        "We help translate ambitious ideas into practical spaces, layouts and visual previews, so decisions can be made before the build begins."
      ],
      [
        "Event planning & management",
        "We give the experience a plan, a sequence and a clear line of responsibility, keeping the moving parts aligned from briefing to breakdown."
      ],
      [
        "Venue sourcing",
        "We help find the setting that suits the brief, the audience and the practical realities. The right room changes what is possible."
      ],
      [
        "Décor & styling",
        "We set the tone with material, colour, furniture, detail and atmosphere, creating a space that looks considered from every angle."
      ],
      [
        "Floral design",
        "Flowers and botanical elements can change the entire mood of a room. We shape a floral direction that works with the broader creative concept."
      ],
      [
        "Furniture & equipment hire",
        "We source and coordinate the pieces that make the space function and feel right, from seating and tables to the less glamorous essentials."
      ],
      [
        "Stage builds & custom installations",
        "Sometimes the idea needs its own structure. We plan and coordinate stages, scenic elements and custom features that give it physical presence."
      ],
      [
        "Branding, signage & printing",
        "From wayfinding and entry moments to step-and-repeat walls and printed details, we make sure the brand is present in the right ways."
      ],
      [
        "Catering & bar services",
        "Food and drinks are part of the guest experience. We coordinate options that fit the format, the atmosphere and the practical brief."
      ],
      [
        "Entertainment, DJs & MCs",
        "We help shape the energy of the room through the right performers, presenters and entertainment for the audience and occasion."
      ],
      [
        "Guest management & RSVP coordination",
        "From invitations and responses to arrival flow, we help make the guest journey feel personal, clear and well considered."
      ],
      [
        "Event staffing & hospitality",
        "The best welcome comes from people who know what they are doing. We plan staffing needs and hospitality touchpoints around the experience."
      ],
      [
        "Gifting & branded merchandise",
        "We create or coordinate thoughtful takeaways that people might actually want to keep. Useful, surprising and on brand."
      ],
      [
        "Transport & logistics",
        "We think through who and what needs to be where, when and how. Timing, access, movement and deliveries matter as much as the main event."
      ],
      [
        "Brand activations & interactive experiences",
        "We design reasons for people to participate, not just observe. A strong activation makes the brand part of a real interaction."
      ]
    ]
  },
  "creative": {
    "idx": "02",
    "image": "/concept-12/7f12ec7b20911ecee355.webp",
    "banner": "Good design gets noticed. Great design gets remembered.",
    "title": [
      "Make it look",
      "like nobody else."
    ],
    "description": "We build identities, ideas and design systems with a clear point of view. Not design for the sake of decoration. Design that gives people something to recognise, believe in and come back to.",
    "button": "Make something distinctive",
    "belief": "Pretty is easy. Personality takes thinking.",
    "beliefCopy": "A colour palette is not a personality. A logo is not the whole story. We start by understanding what you stand for, who you are speaking to and what people should feel when they meet your brand. Then we build a visual world that can hold its own anywhere. From strategy and identity to packaging, print, presentations, event branding, spatial design and campaign artwork, we make sure everything belongs to the same story. A billboard and a business card should feel like relatives, not strangers.",
    "clusters": [
      [
        "Find your point of view",
        "Brand thinking, positioning, naming support, identity and creative strategy."
      ],
      [
        "Build a visual world",
        "Art direction, identity systems, campaigns, visual assets and design guidelines."
      ],
      [
        "Make it physical",
        "Packaging, retail, print, signage, event environments and experiences you can walk into."
      ],
      [
        "Keep it consistent",
        "Everyday design, creative production and dependable support that protects the big idea."
      ]
    ],
    "feature": [
      "Every touchpoint is a chance to say something.",
      "The box someone opens. The slide that makes a complicated point instantly clear. The way a festival wristband, website and entrance sign look like they came from the same imagination. We care about the entire system, not just the hero graphic."
    ],
    "process": [
      [
        "Discover the character.",
        "We get to the truth beneath the brief."
      ],
      [
        "Draw the world.",
        "We explore the visual language, refine the right direction and build the system."
      ],
      [
        "Make it travel.",
        "We adapt the design across the places and formats it needs to live."
      ]
    ],
    "bannerButton": "Give the idea a look",
    "preview": "The kind of thinking that gives a brand a point of view, not just a pretty face.",
    "capabilities": [
      [
        "Brand strategy & identity",
        "We find the character behind the business and give it a clear voice, visual identity and rules worth following. The goal is not just recognition, but a brand that knows how to show up."
      ],
      [
        "Graphic design & creative production",
        "Campaign assets, presentations, layouts, illustrations and everyday creative with the same care as the big launch. The idea deserves to look good at every size."
      ],
      [
        "Packaging, print & retail design",
        "We give physical touchpoints their own personality, from packaging and print collateral to retail displays. Something people pick up can make as strong an impression as something they scroll past."
      ],
      [
        "Experiential & environmental design",
        "We think about how people move through, interact with and remember a space. Physical design becomes part of the story, rather than just somewhere to place the logo."
      ],
      [
        "Marketing strategy & creative consulting",
        "We challenge the brief, find the sharpest opportunity and put a direction behind the work. Good creative decisions are easier when the thinking is clear."
      ]
    ]
  },
  "digital": {
    "idx": "03",
    "image": "/concept-12/857bfe33201dcedbc6c9.webp",
    "banner": "Built for humans. Clever under the hood.",
    "title": [
      "Make the screen",
      "do more."
    ],
    "description": "We create websites, campaigns, platforms and content with a purpose beyond being online. Clearer experiences, smarter connections and useful reasons to come back.",
    "button": "Build what’s next",
    "belief": "Clicks are nice. Connection is better.",
    "beliefCopy": "The internet has enough noise. We are more interested in the things people choose to pay attention to. The website that makes sense. The campaign that knows what it wants to say. The content that sounds like a human. The technology that solves the problem instead of adding another one. We combine marketing thinking, design and technical problem-solving so digital work works in the real world. That could be a new website, a more joined-up social presence, a focused paid campaign, a useful software solution or creative support that keeps a business moving.",
    "clusters": [
      [
        "The foundation",
        "Website planning, UX, design, builds and digital brand experiences."
      ],
      [
        "The conversation",
        "Social media content, calendars, community-facing creative and everyday communication."
      ],
      [
        "The growth plan",
        "Marketing strategy, campaigns, digital advertising and thoughtful optimisation."
      ],
      [
        "The smarter way",
        "Software, automation, digital tools and custom solutions to practical business challenges."
      ]
    ],
    "feature": [
      "A launch is a moment. Momentum is a habit.",
      "We do not think a good marketing idea should disappear after launch day. We can stay involved with creative production, campaign planning, content management and ongoing marketing support, making the next move as considered as the first."
    ],
    "process": [
      [
        "Find the job.",
        "We define what people need to understand, do or experience."
      ],
      [
        "Make it useful.",
        "We design the message and the system around real behaviour, not digital buzzwords."
      ],
      [
        "Keep learning.",
        "We review the response and use what we learn to guide what comes next."
      ]
    ],
    "bannerButton": "Tell us what needs fixing",
    "preview": "Websites, campaigns and technology made for people, not just platforms.",
    "capabilities": [
      [
        "Websites & digital experiences",
        "We plan and design websites and digital journeys that people understand and enjoy using. Useful structure, clear content and good design should all pull in the same direction."
      ],
      [
        "Digital marketing & advertising",
        "We build campaigns around an idea, an audience and a clear objective. From creative to channel planning, every message should have a reason to exist."
      ],
      [
        "Social media & content management",
        "We plan the conversation, create the content and keep the rhythm consistent. A recognisable brand voice is built one considered post at a time."
      ],
      [
        "Software, technology & solutions",
        "We look for the useful technical answer, whether that means a digital tool, tailored software, an integration or a smarter workflow. The best technology makes the hard part feel simple."
      ],
      [
        "Ongoing creative & marketing partnerships",
        "We become the creative support that keeps things moving. From fresh campaigns to day-to-day design and marketing needs, we build consistency without losing curiosity."
      ]
    ]
  },
  "production": {
    "idx": "04",
    "image": "/concept-12/aa01c56d7f9e7726002f.webp",
    "banner": "Roll camera. Cue the lights. Make it count.",
    "title": [
      "Make people look.",
      "Then look again."
    ],
    "description": "Stories deserve more than a nice shot. We bring ideas to life through motion, video, photography, creative production and the technical details that make everything land.",
    "button": "Bring the story to life",
    "belief": "The magic has a call sheet.",
    "beliefCopy": "You see the final frame. We see the planning behind it. The storyboard, the light, the pace, the audio, the edit and the hundred decisions that make a piece feel like it was always meant to be that way. We work across digital content, branded video, motion design, multimedia and event production, connecting creative direction with what it takes to deliver. Some stories need to fill a screen. Others need to fill an entire room. Either way, we make sure the execution gives the idea its moment.",
    "clusters": [
      [
        "Plan the story",
        "Creative direction, concepts, scripts, storyboards and production thinking."
      ],
      [
        "Make the assets",
        "Photography, film, motion graphics, editing, animation and multimedia content."
      ],
      [
        "Take it live",
        "Stage visuals, on-screen content, technical event production, lighting, sound and AV coordination."
      ],
      [
        "Make it work everywhere",
        "Cutdowns, platform-ready versions, event recaps, campaign assets and content libraries."
      ]
    ],
    "feature": [
      "Good production knows when to disappear.",
      "The edit should feel natural. The sound should be right. The presentation should land without a hiccup. We spend time on the things nobody is supposed to notice, so everyone can pay attention to the story."
    ],
    "process": [
      [
        "Frame it.",
        "We decide what the audience needs to see, hear and feel."
      ],
      [
        "Produce it.",
        "We bring the creative and technical parts into one deliberate process."
      ],
      [
        "Finish it properly.",
        "We polish, adapt and prepare the final work for where it will be seen."
      ]
    ],
    "bannerButton": "Let’s get producing",
    "preview": "From the first storyboard to the final sound check, we bring the moving parts together.",
    "capabilities": [
      [
        "Motion graphics, video & multimedia",
        "We use movement, sound and storytelling to give ideas a different kind of energy, whether it is a product film, animation, presentation visual or content series."
      ],
      [
        "Photography & videography",
        "We plan how the event will be captured, from the headline moments to the small human details worth keeping and sharing."
      ],
      [
        "Lighting, sound & audiovisual production",
        "We bring technical requirements into the creative plan, coordinating sound, light, screens and AV so the experience feels as good as it looks."
      ]
    ]
  }
};
  const caseStudies = {
  "case-events": {
    "title": "Atmosphere is everything",
    "image": "/concept-12/900abdb6d28df2c511ea.webp",
    "detail": "/concept-12/f778ffc756368369e22f.webp",
    "intro": "A creative exploration of the way spaces make people feel before anyone says a word.",
    "belief": "Design for what people remember.",
    "description": "We think of atmosphere as a series of choices working together. Where the eye goes first. What people hear when they walk in. How they find their way. When the energy rises and when the room gets a moment to breathe. None of it happens by accident. This study explores how a cohesive creative concept might move through spatial layout, lighting, styling, staging and guest experience. It is a reminder that the strongest event design is not just about what a place looks like. It is about what happens to people while they are in it.",
    "quote": "Set the scene. Change the feeling."
  },
  "case-identity": {
    "title": "Made to be remembered",
    "image": "/concept-12/7f12ec7b20911ecee355.webp",
    "detail": "/concept-12/857bfe33201dcedbc6c9.webp",
    "intro": "A visual study of how identity becomes something people recognise without having to think twice.",
    "belief": "Consistency with a pulse.",
    "description": "An identity needs more than one beautiful logo. It needs a character strong enough to travel. Through type and colour, packaging and print, screens and spaces, big statements and tiny bits of useful information. This concept study looks at how a flexible visual system can bring every encounter back to the same idea while leaving space for expression. The goal is not for everything to look identical. It is for everything to feel unmistakably connected.",
    "quote": "Recognition lives in the details."
  },
  "case-production": {
    "title": "Behind every moment",
    "image": "/concept-12/aa01c56d7f9e7726002f.webp",
    "detail": "/concept-12/cacc0a760b075d1ccf18.webp",
    "intro": "A creative study celebrating the work that makes a live experience run like it was meant to.",
    "belief": "The invisible is important.",
    "description": "The audience comes for the experience. The cables, cue sheets, timing checks and technical conversations are not the headline. They are what allows the headline to happen. This study explores the relationship between creative vision and production craft. How lighting, sound, visuals, people and precision come together to create a moment that feels natural. Our favourite kind of technical excellence is the kind you do not have to think about while you are enjoying the show.",
    "quote": "Behind the scenes. Ahead of the moment."
  }
};
  function updateCaseStudy(key) { populateCaseStudy(host,key,caseStudies); }
  const seedData=structuredClone(data);
  options.configure?.(data,caseStudies);
  let current = 'home';
  let animatingRoute = false;
  let pendingRoute = null;
  let activeFilm = -1;
  let activeCase = 0;
  let activeService = -1;
  let serviceHover = null;
  let io;
  let rafPending = false;
  const header = $('#site-header');
  const curtain = $('#route-curtain');
  const dropdown = $('#nav-dropdown');
  const dropdownBtn = $('#services-button');
  const mobileToggle = $('#mobile-toggle');
  const mobilePanel = $('#mobile-panel');

  function closeMenus() {
    dropdown.classList.remove('is-open');
    dropdownBtn.setAttribute('aria-expanded', 'false');
    mobilePanel.classList.remove('open');
    mobilePanel.setAttribute('aria-hidden','true');
    mobilePanel.inert=true;
    mobileToggle.setAttribute('aria-expanded','false');
    mobileToggle.setAttribute('aria-label','Open menu');
    header.classList.remove('menu-is-open');
    document.body.classList.remove('menu-open');
  }
  listen(dropdownBtn,'click', () => {
    const open = !dropdown.classList.contains('is-open');
    dropdown.classList.toggle('is-open', open);
    dropdownBtn.setAttribute('aria-expanded', String(open));
  });
  listen(document,'pointerdown', ev => {
    if (!dropdown.contains(ev.target)) {
      dropdown.classList.remove('is-open');
      dropdownBtn.setAttribute('aria-expanded', 'false');
    }
  });
  listen(document,'keydown', ev => {
    if(ev.key==='Escape'){
      const mobileOpen=mobilePanel.classList.contains('open');
      const dropdownOpen=dropdown.classList.contains('is-open');
      closeMenus();
      if(mobileOpen){ev.preventDefault();mobileToggle.focus()}
      else if(dropdownOpen){ev.preventDefault();dropdownBtn.focus()}
    }
    if(ev.key==='Tab'&&mobilePanel.classList.contains('open')){
      const stops=[mobileToggle,...$$('a[href],button:not([disabled])',mobilePanel)];
      const index=stops.indexOf(document.activeElement);
      if(index<0||(ev.shiftKey&&index===0)||(!ev.shiftKey&&index===stops.length-1)){
        ev.preventDefault();void mobilePanel.offsetHeight;stops[ev.shiftKey?stops.length-1:0]?.focus();
      }
    }
  });
  listen(dropdownBtn,'keydown',ev=>{
    if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){
      ev.preventDefault();dropdown.classList.add('is-open');dropdownBtn.setAttribute('aria-expanded','true');
      const links=$$('#nav-panel a');void $('#nav-panel').offsetHeight;links[ev.key==='ArrowDown'?0:links.length-1]?.focus();
    }
  });
  listen(dropdown,'focusout',ev=>{
    if(!dropdown.contains(ev.relatedTarget)){dropdown.classList.remove('is-open');dropdownBtn.setAttribute('aria-expanded','false')}
  });
  mobilePanel.inert=!mobilePanel.classList.contains('open');
  listen(mobileToggle,'click', () => {
    projectClose();
    const open = mobileToggle.getAttribute('aria-expanded') !== 'true';
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobilePanel.classList.toggle('open',open);
    mobilePanel.setAttribute('aria-hidden',String(!open));
    mobilePanel.inert=!open;
    header.classList.toggle('menu-is-open',open);
    document.body.classList.toggle('menu-open',open);
  });

  // All popovers use the same open/close contract and support outside clicks,
  // Escape, pointer interactions and keyboard selection.
  const projectWrapper = $('#project-combobox');
  const projectTrigger = $('#project-trigger');
  const projectSelect = $('#project-type');
  let projectOptions = $$('.select-option',projectWrapper);
  function projectClose(restoreFocus=false){
    projectWrapper.classList.remove('is-open');
    projectTrigger.setAttribute('aria-expanded','false');
    if(restoreFocus)projectTrigger.focus();
  }
  function projectOpen(){
    closeMenus();
    projectWrapper.classList.add('is-open');
    projectTrigger.setAttribute('aria-expanded','true');
  }
  function chooseProject(option){
    projectSelect.value=option.dataset.value;
    $('.select-value',projectTrigger).textContent=option.textContent.trim();
    projectOptions.forEach(x=>x.setAttribute('aria-selected',String(x===option)));
    projectSelect.dispatchEvent(new Event('change',{bubbles:true}));
    projectClose(true);
  }
  if(projectWrapper && projectSelect){
    projectWrapper.classList.add('js-select-ready');projectSelect.setAttribute('aria-hidden','true');projectSelect.tabIndex=-1;
    listen(projectTrigger,'click',()=>projectWrapper.classList.contains('is-open')?projectClose():projectOpen());
    listen(projectWrapper,'click',ev=>{const option=ev.target.closest('.select-option');if(option&&projectWrapper.contains(option))chooseProject(option)});
    listen(projectTrigger,'keydown',ev=>{
      if(['ArrowDown','ArrowUp',' ','Enter'].includes(ev.key)){
        ev.preventDefault();ev.stopPropagation();projectOpen();
        // Focus after the newly visible panel has received a painted frame.
        // A single frame can still run before CSS visibility is committed.
        trackedFrame(()=>trackedFrame(()=>{
          if(projectWrapper.classList.contains('is-open'))
            (projectOptions.find(x=>x.dataset.value===projectSelect.value)||projectOptions[0])?.focus();
        }));
      }
    });
    listen(projectWrapper,'keydown',ev=>{
      const idx=projectOptions.indexOf(document.activeElement);
      if(ev.key==='Escape'){projectClose(true);ev.stopPropagation();return;}
      if(ev.key==='ArrowDown'||ev.key==='ArrowUp'||ev.key==='Home'||ev.key==='End'){
        ev.preventDefault();if(!projectWrapper.classList.contains('is-open'))projectOpen();
        const next=ev.key==='Home'?0:ev.key==='End'?projectOptions.length-1:((idx<0?0:idx)+(ev.key==='ArrowDown'?1:-1)+projectOptions.length)%projectOptions.length;
        trackedFrame(()=>projectOptions[next]?.focus());
      }
    });
    listen(document,'pointerdown',ev=>{if(!projectWrapper.contains(ev.target))projectClose()});
    listen(document,'focusin',ev=>{if(!projectWrapper.contains(ev.target))projectClose()});
  }
  listen(document,'pointerdown',ev=>{
    if(mobilePanel.classList.contains('open')&&!mobilePanel.contains(ev.target)&&!mobileToggle.contains(ev.target)&&!header.contains(ev.target))closeMenus();
  });
  // Opening navigation closes the form selection popover and vice versa.
  listen(dropdownBtn,'click',()=>projectWrapper&&projectClose());

  function revealText(head) {
    if (!head || head.classList.contains('is-revealed')) return;
    head.classList.add('is-revealed');
  }
  function restartWipe(head) {
    if (!head) return;
    head.classList.remove('is-revealed');
    // Restart the active reveal when a scroll chapter becomes active again.
    void head.offsetHeight;
    trackedFrame(() => revealText(head));
  }
  // The opening hero uses CSS animations directly rather than is-revealed.
  // Temporarily cancel those animations and force a style flush to replay them.
  function restartOpeningHero() {
    const head=$('.hero-title');
    if(!head) return;
    head.classList.add('is-rearming');
    void head.offsetHeight;
    head.classList.remove('is-rearming');
  }
  let openingHeroReplayArmed=false;
  cleanups.push(()=>io?.disconnect());
  // Case-study motion shares the homepage scroll engine and honours reduced motion.
  const caseObserver = new TrackedObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('case-is-inview');
        caseObserver.unobserve(entry.target);
      }
    });
  }, {threshold:.12,rootMargin:'0px 0px -6% 0px'});
  function setupCaseScenes(){
    caseObserver.disconnect();
    const active=current.startsWith('case-');
    const animated=active && !reduced && !options.editor;
    host.dataset.caseMotion=animated?'on':'off';
    if(!active)return;
    $('.view.is-current .case-detail-header,.view.is-current .case-detail-introduction,.view.is-current .case-quote,.view.is-current .case-detail-visual,.view.is-current .case-story-module,.view.is-current .case-detail-next,.view.is-current .case-next-project').forEach(el=>{
      el.classList.remove('case-is-inview');
      if(animated)caseObserver.observe(el);
      else el.classList.add('case-is-inview');
    });
  }
  listen(host,'input',ev=>{
    const slider=ev.target.closest?.('.case-compare-slider');
    if(slider && host.contains(slider))
      slider.closest('.case-story-compare')?.style.setProperty('--case-split',slider.value+'%');
  });
  function setupReveals() {
    io?.disconnect();
    setupCaseScenes();
    if (reduced) {
      $$('.view.is-current .block-heading,.view.is-current .wipe-heading').forEach(revealText);
      $$('.view.is-current .soft-rise').forEach(el=>el.classList.add('is-inview'));
      return;
    }
    io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if(entry.target.classList.contains('soft-rise')) entry.target.classList.add('is-inview');
          else revealText(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.13,rootMargin:'0px 0px -8% 0px'});
    $$('.view.is-current .block-heading:not(.is-revealed),.view.is-current .soft-rise:not(.is-inview)').forEach(h => io.observe(h));
    // The pinned film headlines are sequenced by the scroll engine.
  }

  function updateCategory(key) { populateCategory(host,key,data); }
  function setRoute(key, transition = true) {
    if (!routes.has(key)) key = 'home';
    if (animatingRoute) {pendingRoute=key;return;}
    if (key === current && $('.view.is-current')) {
      if (window.scrollY > 5) scrollTo({top:0,behavior:reduced?'instant':'smooth'});
      closeMenus(); return;
    }
    const apply = () => {
      current = key;
      const isService = serviceKeys.includes(key);
      if (isService) updateCategory(key);
      if (caseStudies[key]) updateCaseStudy(key);
      selectCurrentView(host,key);
      host.dataset.conceptRoute=key;
      window.scrollTo(0,0);
      closeMenus();
      $$('a.nav-text').forEach(a=>a.classList.toggle('active',a.dataset.routeKey===key));
      $('#route-announcement').textContent = key === 'home' ? 'SHOWSET homepage' : (isService ? data[key].title.join(' ') : caseStudies[key] ? caseStudies[key].title : key) + ' page';
      const descriptions={
        home:'Events, creative design, digital experiences and production in one connected agency. We think, design, plan and make ideas happen.',
        events:'From event concepts and branding to planning, stage production and guest experiences, we turn ambitious ideas into considered events.',
        creative:'Brand strategy, identity, graphic design, packaging, print and environmental creative. Distinctive ideas made to work across every touchpoint.',
        digital:'Websites, digital experiences, social media, campaigns and tailored technology. We connect smart thinking with useful digital execution.',
        production:'Creative content, video, motion graphics, multimedia and technical production. We put craft behind the moments that make people look twice.',
        studio:'Curious minds and capable hands. Meet our approach to events, creative thinking, technology and production, with the details considered from the start.',
        work:'Explore our creative thinking through stories about atmosphere, brand identity and the detail behind exceptional production.',
        contact:'An event, a brand, a campaign or a big idea still taking shape? Tell us what you have in mind and start the conversation.'
      };
      const authoredMetadata = options.getMetadata?.(key);
      document.querySelector('meta[name="description"]').setAttribute('content', authoredMetadata?.description || descriptions[key] || descriptions.work);
      document.title = authoredMetadata?.title || (key==='home' ? 'SHOWSET | Events & Creative Agency' : (isService ? ({events:'Events & Experiences',creative:'Creative & Design',digital:'Digital & Marketing',production:'Content & Production'})[key] : caseStudies[key] ? caseStudies[key].title : key==='studio' ? 'Our Studio' : key==='work' ? 'Creative Explorations & Work' : 'Contact Us')+' | SHOWSET');
      options.bind?.(host,key); rewriteLinks();
      if(transition&&!options.editor){const heading=$('.view.is-current h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}}
      setupReveals();
      if (key === 'home') activeFilm = -1;
      if (isService) trackedFrame(() => revealText($('#category-title')));
      frame();
    };
    if (!transition || reduced) {apply();return;}
    animatingRoute = true;
    curtain.classList.remove('leave','enter');
    void curtain.offsetHeight;
    curtain.classList.add('enter');
    trackedTimeout(() => {
      // Never leave the transition curtain covering the site when a route
      // binding or motion setup throws. Restore navigation and show the error.
      try {
        apply();
      } catch (error) {
        console.error('SHOWSET route transition failed', error);
        curtain.classList.remove('enter','leave');
        curtain.style.clipPath='inset(100% 0 0 0)';
        animatingRoute=false;
        pendingRoute=null;
        return;
      }
      curtain.classList.remove('enter');
      curtain.classList.add('leave');
      trackedTimeout(() => {
        curtain.classList.remove('leave');
        animatingRoute=false;
        if(pendingRoute){const next=pendingRoute;pendingRoute=null;setRoute(next)}
      },580);
    },530);
  }
  function routeFromHash(){const h = decodeURIComponent(location.hash.slice(1)).toLowerCase();if(routes.has(h)) return h;return null;}
  const sectionIds = new Set(['discover','services','portfolio-section','ending','hero-track','film-track']);
  listen(window,'hashchange', () => {
    const route=routeFromHash();
    if(route){setRoute(route);return;}
    const id=location.hash.slice(1);
    if(sectionIds.has(id)) {
      if(current !== 'home') {setRoute('home',false);trackedTimeout(()=>$('#'+id)?.scrollIntoView({behavior:reduced?'auto':'smooth'}),50)}
      else $('#'+id)?.scrollIntoView({behavior:reduced?'auto':'smooth'});
    }
  });
  // Same hash links should still work on repeated clicks.
  listen(document,'click', ev => {
    const link=ev.target.closest('a[href^="#"]'); if(!link)return;
    const id=link.getAttribute('href').slice(1);
    closeMenus();
    if(routes.has(id) && location.hash==='#'+id){ev.preventDefault();setRoute(id)}
    if(sectionIds.has(id) && location.hash==='#'+id){ev.preventDefault();$('#'+id)?.scrollIntoView({behavior:reduced?'auto':'smooth'})}
  });

  function setFilm(n) {
    if (n===activeFilm) return;
    activeFilm=n;
    $$('[data-film-image]').forEach((el,i)=>el.classList.toggle('is-on',i===n));
    $$('[data-film-step]').forEach((el,i)=>{
      el.classList.toggle('is-on',i===n);
      if(i===n) restartWipe($('.wipe-heading',el));
      else $('.wipe-heading',el)?.classList.remove('is-revealed');
    });
  }
  function setService(n) {
    if(n===activeService)return;
    activeService=n;
    $$('.discipline').forEach((el,i)=>el.classList.toggle('is-on',i===n));
    $$('[data-service-visual]').forEach((el,i)=>el.classList.toggle('is-on',i===n));
    const key=serviceKeys[n%4],d=data[key];
    $('#service-visual-copy').textContent=d.preview;
    $('#service-visual-link').href='#'+key;
    $('#service-visual-link').setAttribute('aria-label','Explore '+({events:'Events and experiences',creative:'Creative and design',digital:'Digital and marketing',production:'Content and production'})[key]);
    const override=options.serviceOverrides?.[n];if(override?.description!=null)$('#service-visual-copy').textContent=override.description;if(override?.href){$('#service-visual-link').href=override.href;$('#service-visual-link').setAttribute('aria-label','Explore '+override.title);}rewriteLinks();
  }
  // Hover reveals an example; click still navigates to the real category view.
  function serviceTarget(ev){const el=ev.target.closest?.('.discipline');return el&&host.contains(el)?el:null;}
  listen(host,'pointerover',ev=>{const el=serviceTarget(ev);if(el&&ev.pointerType==='mouse'&&!el.contains(ev.relatedTarget)){serviceHover=$$('.discipline').indexOf(el);setService(serviceHover)}});
  listen(host,'pointerout',ev=>{const el=serviceTarget(ev);if(el&&ev.pointerType==='mouse'&&!el.contains(ev.relatedTarget)){serviceHover=null;frame()}});
  listen(host,'focusin',ev=>{const el=serviceTarget(ev);if(el){serviceHover=$$('.discipline').indexOf(el);setService(serviceHover)}});
  listen(host,'focusout',ev=>{const el=serviceTarget(ev);if(el&&!el.contains(ev.relatedTarget)){serviceHover=null;frame()}});

  function setHeroAccess(firstActive,secondActive){
    for(const [id,active] of [['#hero-foreground',firstActive],['#hero-second',secondActive]]){
      const scene=$(id);scene.style.pointerEvents=active?'auto':'none';
      scene.toggleAttribute('inert',!active);scene.setAttribute('aria-hidden',String(!active));
    }
  }
  function frame() {
    rafPending=false;
    const y=window.scrollY, vh=window.innerHeight;
    header.classList.toggle('scrolled',y>28);
    const max=document.documentElement.scrollHeight-vh;
    $('#reading-progress').style.transform=`scaleX(${clamp(max>0?y/max:0)})`;
    // Secondary views inherit the homepage's restrained camera-like depth.
    // Keep one photographic plane, rather than adding floating elements.
    if(current!=='home'){
      if(!reduced){
        $$('.view.is-current .category-bg img[data-depth-image],.view.is-current .simple-bg img[data-depth-image],.view.is-current .case-detail-photo img[data-depth-image]').forEach(img=>{
          const r=img.parentElement.getBoundingClientRect();
          if(r.bottom<0||r.top>vh)return;
          const progress=clamp((vh-r.top)/(vh+r.height));
          img.style.transform=`translate3d(0,${((progress-.5)*-24).toFixed(2)}px,0) scale(1.065)`;
        });
      }
      // Reveal photographic chapters as the visitor scrolls, with gentle depth.
      if(current.startsWith('case-') && !reduced && !options.editor){
        $('.view.is-current .case-detail-visual,.view.is-current .case-story-image .case-story-figure,.view.is-current .case-story-video .case-story-figure,.view.is-current .case-story-comparison .case-story-figure').forEach(scene=>{
          const r=scene.getBoundingClientRect();
          if(r.bottom < -vh*.2 || r.top > vh*1.2)return;
          const progress=clamp((vh*.98-r.top)/(vh*.75));
          scene.style.setProperty('--case-mask','circle('+((progress*155).toFixed(2))+'% at 50% 50%)');
          const media=scene.querySelector('img');
          if(media && !scene.classList.contains('case-story-compare'))
            media.style.transform='translate3d(0,'+(((progress-.5)*-26).toFixed(2))+'px,0) scale(1.06)';
        });
      }
      return;
    }
    // CSS exposes both scenes in motion-off reading flow; accessibility must agree.
    if(reduced||options.stillScenes?.includes('hero'))setHeroAccess(true,true);
    if(reduced)return;
    if(!options.stillScenes?.includes('hero')){
    const hero=$('#hero-track'),heroRect=hero.getBoundingClientRect();
    const heroRange=hero.offsetHeight-vh;
    const p=clamp(-heroRect.top/Math.max(1,heroRange));
    // Separate thresholds provide hysteresis so direction changes do not
    // repeatedly reset a visible heading or flicker at the scene boundary.
    const heroVisible=heroRect.bottom>vh*.35 && heroRect.top<vh;
    if(p>=.52) openingHeroReplayArmed=true;
    if(openingHeroReplayArmed && p<=.32 && heroVisible){
      openingHeroReplayArmed=false;
      restartOpeningHero();
    }
    const photo=$('#hero-photo');
    // Single photograph smoothly becomes the entire viewport.
    const insetTop=15*(1-p),insetSide=7.6*(1-p),insetBottom=10*(1-p);
    photo.style.inset=`${insetTop.toFixed(3)}% ${insetSide.toFixed(3)}% ${insetBottom.toFixed(3)}%`;
    photo.style.borderRadius=`${((options.heroRadius??16)*(1-p)).toFixed(2)}px`;
    photo.style.boxShadow=`0 ${Math.round(42*(1-p))}px ${Math.round(110*(1-p))}px rgba(0,0,0,.25)`;
    photo.querySelector('img').style.transform=`translate3d(0,${(-2.4+p*4).toFixed(2)}%,0) scale(${((options.heroScale??1.13)-p*((options.heroScale??1.13)-1.02)).toFixed(4)})`;
    let introFade=1-clamp((p-.22)/.26);
    $('#hero-foreground').style.opacity=introFade;
    // The whole headline group no longer drifts while its block swipe runs.
    $('#hero-foreground').style.transform='none';
    const firstActive=introFade>=.2;
    let secondFade=clamp((p-.55)/.2);
    const second=$('#hero-second');
    second.style.opacity=secondFade;
    second.style.transform='none';
    const secondActive=secondFade>=.85;
    setHeroAccess(firstActive,secondActive);
    const secondHeading=$('.wipe-heading',second);
    // Once hidden above or below this photographic scene, reset its swipe.
    // A return scroll then produces the same block reveal as the first visit.
    if(p<=.5 || heroRect.bottom<=vh*.2)secondHeading?.classList.remove('is-revealed');
    else if(p>=.65 && heroVisible)revealText(secondHeading);
    }
    const film=$('#film-track'),filmRect=film.getBoundingClientRect();
    if(filmRect.top<vh && filmRect.bottom>0 && !options.stillScenes?.includes('story')){
      const fp=clamp(-filmRect.top/Math.max(1,film.offsetHeight-vh));
      const idx=Math.min((options.filmCount||3)-1,Math.floor(fp*(options.filmCount||3)));setFilm(idx);
      $('#film-progress-fill').style.transform=`scaleX(${fp.toFixed(4)})`;
      const activeImg=$(`[data-film-image="${idx}"] img`);
      if(activeImg){const local=fp*(options.filmCount||3)-idx;activeImg.style.transform=`translate3d(0,${((.5-local)*2*(options.storyParallax??1)).toFixed(2)}%,0) scale(${(1.025+local*.07).toFixed(4)})`}
    }
    const services=$('#services-track'),serviceRect=services.getBoundingClientRect();
    if(serviceRect.top<vh && serviceRect.bottom>0 && !small.matches && !options.stillScenes?.includes('services')){
      const sp=clamp(-serviceRect.top/Math.max(1,services.offsetHeight-vh));
      if(serviceHover===null)setService(Math.min(Math.max(1,options.serviceCount??4)-1,Math.floor(sp*Math.max(1,options.serviceCount??4))));
    }
    // Recreate Concept 02's circular dot growth. The circle is drawn as a
    // full-resolution clip-path rather than enlarging a 100px bitmap/layer,
    // so its edge stays perfectly sharp throughout the expansion.
    const dot=$('#dot-track'), dotRect=dot.getBoundingClientRect();
    if(dotRect.top < vh && dotRect.bottom > 0 && !options.stillScenes?.includes('dot')){
      const dp=clamp(-dotRect.top / Math.max(1,dot.offsetHeight-vh));
      const dw=dot.clientWidth, dh=$('.dot-stage').clientHeight;
      const x=.5*dw, y=.5*dh;
      const fullRadius=Math.max(
        Math.hypot(x,y),Math.hypot(dw-x,y),
        Math.hypot(x,dh-y),Math.hypot(dw-x,dh-y)
      )+4;
      // V2-style growth, now centred at 50%/50%, progressing at p^1.5.
      // Keep the dot fully clipped until scroll progress actually begins.
      // This also resets naturally when scrolling back above the scene.
      const radius=dp<=.006?0:10+Math.pow(dp,1.5)*(fullRadius-10);
      $('#dot-core').style.setProperty('--dot-radius',`${radius.toFixed(2)}px`);
      // V2 copy remains visible throughout the circle transition.
      $('.dot-words').style.transform=`translate3d(0,${(9-dp*18).toFixed(2)}px,0)`;
    } else if(dotRect.top>=vh) {
      $('#dot-core').style.setProperty('--dot-radius','0px');
    }
  }
  // Three-column horizontal case-study reel; clones preserve a seamless loop.
  // Autoplay pauses while hovered/focused and is disabled for reduced motion.
  const carousel=$('#case-carousel');
  const rail=$('#case-rail');
  let slides=$$('[data-case-slide]',carousel);
  let caseCount=slides.length;
  let carouselVisible=false, carouselPaused=false, carouselFocus=false;
  let casePosition=0;
  let caseAnimating=false;
  let caseEndTimer=null;
  slides.forEach(slide=>{
    slide.removeAttribute('aria-hidden');
    slide.tabIndex=0;
    const clone=slide.cloneNode(true);
    clone.classList.remove('is-active');
    clone.removeAttribute('data-case-slide');
    clone.setAttribute('aria-hidden','true');
    clone.setAttribute('tabindex','-1');
    clone.querySelectorAll('a,button,input').forEach(el=>el.tabIndex=-1);
    rail.append(clone);
  });
  function updateCaseAccess(){
    [...rail.children].forEach((card,i)=>{
      const visible=i>=casePosition && i<casePosition+Math.ceil(carousel.clientWidth/Math.max(1,caseStepWidth())) ;
      card.setAttribute('aria-hidden',String(!visible));
      card.tabIndex=visible?0:-1;
      card.querySelectorAll('a,button,input,select,textarea').forEach(el=>{el.tabIndex=visible?0:-1});
    });
  }
  function caseStepWidth(){
    const first=slides[0];
    if(!first)return 0;
    const gap=parseFloat(getComputedStyle(rail).columnGap)||0;
    return first.getBoundingClientRect().width+gap;
  }
  function setCasePosition(animate=true){
    rail.style.transition=animate&&!reduced?'transform .95s cubic-bezier(.76,0,.24,1)':'none';
    rail.style.transform=`translate3d(${-casePosition*caseStepWidth()}px,0,0)`;
    $('#case-progress-bar').style.transform=`translateX(${(casePosition % caseCount)*100}%)`;
    updateCaseAccess();
  }
  function advanceCase(delta=1){
    if(caseAnimating || !carouselVisible) return;
    caseAnimating=true;
    casePosition += delta;
    if(casePosition<0) casePosition=caseCount-1;
    setCasePosition(true);
    clearTimeout(caseEndTimer);
    caseEndTimer=trackedTimeout(()=>{
      if(casePosition>=caseCount){
        casePosition=0;
        setCasePosition(false);
        void rail.offsetHeight;
        rail.style.transition='';
      }
      caseAnimating=false;
    },1060);
  }
  listen(carousel,'pointerenter',()=>carouselPaused=true);
  listen(carousel,'pointerleave',()=>carouselPaused=false);
  listen(carousel,'focusin',()=>carouselFocus=true);
  listen(carousel,'focusout',ev=>{if(!carousel.contains(ev.relatedTarget))carouselFocus=false;});
  listen(carousel,'keydown',ev=>{
    if(ev.key==='ArrowRight'||ev.key==='ArrowLeft'){
      ev.preventDefault();advanceCase(ev.key==='ArrowRight'?1:-1);
    }
  });
  let touchStartX=null;
  listen(carousel,'touchstart',ev=>{touchStartX=ev.touches[0]?.clientX ?? null},{passive:true});
  listen(carousel,'touchend',ev=>{
    if(touchStartX===null)return;
    const dx=(ev.changedTouches[0]?.clientX??touchStartX)-touchStartX;
    if(Math.abs(dx)>42)advanceCase(dx<0?1:-1);
    touchStartX=null;
  },{passive:true});
  const carouselObserver=new TrackedObserver(entries=>{carouselVisible=entries[0]?.isIntersecting??false},{threshold:.22});
  carouselObserver.observe(carousel);
  listen(window,'resize',()=>setCasePosition(false),{passive:true});
  setCasePosition(false);
  let autoplayTimer;
  let autoplayDelay;
  function startAutoplay(){
    const delay=Math.max(1,options.carouselSeconds??4.7)*1000;
    if(delay===autoplayDelay)return;
    clearInterval(autoplayTimer);autoplayDelay=delay;
    autoplayTimer=setInterval(()=>{
    if(!reduced && current==='home' && carouselVisible && !carouselPaused && !carouselFocus && !document.hidden && !document.body.classList.contains('menu-open')) advanceCase();
    },delay);
  }
  startAutoplay();
  cleanups.push(()=>clearInterval(autoplayTimer));
  function scheduleFrame() {if(!rafPending){rafPending=true;trackedFrame(frame)}}
  listen(window,'scroll',scheduleFrame,{passive:true});
  listen(window,'resize',scheduleFrame,{passive:true});
  {
    // Tiny lighting response within the photo plane, never an added photo card.
    const heroStage=$('#hero-stage');
    listen(heroStage,'pointermove',ev=>{
      if(reduced||ev.pointerType!=='mouse')return;
      const r=heroStage.getBoundingClientRect();
      heroStage.style.setProperty('--light-x',`${((ev.clientX-r.left)/r.width*100).toFixed(2)}%`);
      heroStage.style.setProperty('--light-y',`${((ev.clientY-r.top)/r.height*100).toFixed(2)}%`);
    },{passive:true});
  }
  // Demo form does not claim to transmit or persist visitor information.
  listen($('#contact-form'),'submit',ev=>{
    ev.preventDefault();
    const form=ev.currentTarget;
    if(!form.reportValidity())return;
    $('#form-result').textContent='That did not go through. This is a design preview, so no message has been sent.';
  });
  $('#year').textContent=new Date().getFullYear();
  // Pages are not loaded from a server: the published site remains unaffected.
  const initial=options.route || routeFromHash() || 'home';
  // Initialise without triggering a curtain for a bookmarked page.
  if(initial==='home'){selectCurrentView(host,'home');host.dataset.conceptRoute='home';current='home';options.bind?.(host,'home');setupReveals();setService(0)}
  else{setRoute(initial,false);setService(0)}
  trackedFrame(frame);

  host.dataset.conceptReady='true';
  rewriteLinks();
  listen(document,'click',ev=>{
    if(ev.defaultPrevented || ev.button!==0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey)return;
    const a=ev.target.closest?.('a[href]');if(!a || !host.contains(a) || a.target==='_blank' || a.hasAttribute('download'))return;
    const url=new URL(a.href,location.href);if(url.origin!==location.origin || url.hash)return;
    const key=keyForPath(url.pathname);if(!key)return;
    ev.preventDefault();if(options.editor||animatingRoute)return;
    if(location.pathname!==url.pathname)history.pushState(null,'',url.pathname);
    setRoute(key);
  });
  listen(window,'popstate',()=>setRoute(keyForPath(location.pathname)||'home'));
  const dispose=()=>{cleanups.reverse().forEach(fn=>fn());timeouts.forEach(clearTimeout);frames.forEach(cancelAnimationFrame);document.body.classList.remove('menu-open');};
  dispose.refresh=nextOptions=>{
    Object.assign(options,nextOptions);
    reduced=options.staticMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
    Object.keys(data).forEach(key=>data[key]=structuredClone(seedData[key]));
    options.configure?.(data,caseStudies);
    projectOptions=$$('.select-option',projectWrapper);
    const selectedProject=projectOptions.find(option=>option.dataset.value===projectSelect.value);
    if(projectSelect.value&&selectedProject){
      $('.select-value',projectTrigger).textContent=selectedProject.textContent.trim();
      projectOptions.forEach(option=>option.setAttribute('aria-selected',String(option===selectedProject)));
    }
    const oldCount=caseCount;
    slides=$$('[data-case-slide]',carousel);caseCount=slides.length;
    if(oldCount!==caseCount){
      clearTimeout(caseEndTimer);caseAnimating=false;casePosition=caseCount?casePosition%caseCount:0;setCasePosition(false);
    } else updateCaseAccess();
    const service=Math.min(Math.max(0,activeService),(options.serviceCount??4)-1);
    activeService=-1;setService(service);
    startAutoplay();setupReveals();rewriteLinks();frame();
  };
  return dispose;
}


