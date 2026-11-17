/* Seasonal checklists for Smokies cabin hosts.
   Shared by checklists.html and the printable PDF. Edit here once; both update. */
window.CHECKLISTS = (function () {
  const SRC = {
    rc: ['American Red Cross, Preventing & Thawing Frozen Pipes', 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/winter-storm/frozen-pipes.html'],
    csia: ['Chimney Safety Institute of America, Homeowner Resources (NFPA 211)', 'https://www.csia.org/homeowner-resources'],
    nfpa: ['NFPA, Smoke Alarm Information', 'https://www.nfpa.org/education-and-research/home-fire-safety/smoke-alarms'],
    cpscAlarm: ['CPSC, Change Smoke and CO Alarm Batteries', 'https://www.cpsc.gov/Newsroom/News-Releases/2023/Its-Time-to-Change-Smoke-and-Carbon-Monoxide-Alarm-Batteries-as-Daylight-Saving-Time-Ends'],
    sces: ['Sevier County Electric System, Contact', 'https://sces.net/contact/'],
    cdc: ['CDC, Home Pool and Hot Tub Water Treatment and Testing', 'https://www.cdc.gov/healthy-swimming/about/home-pool-and-hot-tub-water-treatment-and-testing.html'],
    cdcTub: ['CDC, What You Can Do to Stay Healthy in Hot Tubs', 'https://www.cdc.gov/healthy-swimming/safety/what-you-can-do-to-stay-healthy-in-hot-tubs.html'],
    cpscTemp: ['CPSC, CPSC Warns of Hot Tub Temperatures', 'https://www.cpsc.gov/Newsroom/News-Releases/1980/CPSC-Warns-Of-Hot-Tub-Temperatures'],
    cpscSpa: ['CPSC, Warning for Pools, Spas, and Hot Tubs', 'https://www.cpsc.gov/Newsroom/News-Releases/1996/CPSC-Issues-Warning-for-Pools-Spas-and-Hot-Tubs'],
    esfi: ['Electrical Safety Foundation International, How to Use GFCIs', 'https://www.esfi.org/how-to-use-gfcis'],
    sfGutter: ['State Farm, How to Clean Gutters and Downspouts Safely', 'https://www.statefarm.com/simple-insights/residence/stepbystep-guide-to-gutter-cleaning'],
    hiGutter: ['HousingInfo, How to Keep Your Gutters Clean and Working Properly', 'https://housinginfo.org/home-maintenance-repairs/how-to-keep-your-gutters-clean-and-functioning'],
    hiExt: ['HousingInfo, Keeping Your Home\u2019s Exterior in Good Condition', 'https://housinginfo.org/home-maintenance-repairs/how-to-maintain-your-homes-exterior'],
    irc: ['RestoreAdvisor, Gutter & Downspout Overflow (IRC R801.3)', 'https://www.restoreadvisor.com/water-damage-restoration/gutter-overflow'],
    puro: ['PuroClean, 6 Steps to Clean Gutters Safely', 'https://www.puroclean.com/bloomington-il-puroclean-bloomington/blog/6-steps-to-clean-gutters-safely-before-winter-arrives/'],
    bwSpring: ['BearWise, Be BearWise at Home: Seven Tips for a BearWise Spring', 'https://bearwise.org/article-bank/articles-be-bearwise-at-home/'],
    bwApril: ['BearWise, What Bears Do in April', 'https://bearwise.org/what-bears-do-in-april/'],
    gat: ['City of Gatlinburg, Black Bear Management Program', 'https://www.gatlinburgtn.gov/page/black-bear-management-program'],
    nadra: ['NADRA, Check Your Deck Consumer Checklist', 'https://www.nadra.org/blog/tips-for-a-beautiful-and-safe-deck']
  };

  const LISTS = [
    {
      id: 'winterizing', name: 'Winterizing', short: 'Winter',
      when: 'October to November, before the first hard freeze',
      months: [10, 11, 12, 1, 2],
      intro: 'Most winter damage at a rental cabin starts with frozen pipes, a cold empty cabin, or a fireplace nobody checked. Do this once in the fall, then keep the cold-night items in place all winter.',
      img: 'img/winter.webp',
      groups: [
        { h: 'Water and pipes', items: [
          { k: 'w1', t: 'Disconnect, drain and store garden hoses.', n: 'Close the inside valve to each outdoor faucet, then open the outdoor faucet so leftover water can drain.', s: ['rc'] },
          { k: 'w2', t: 'Drain sprinkler and irrigation lines.', n: 'Follow the installer\u2019s directions. Don\u2019t add antifreeze unless they tell you to.', s: ['rc'] },
          { k: 'w3', t: 'Insulate exposed pipes in the crawl space, garage and along outside walls.', n: 'These are the pipes most likely to freeze.', s: ['rc'] },
          { k: 'w4', t: 'Set the empty-cabin thermostat to 55\u00b0F or higher.', n: 'Tell your cleaners not to turn it lower between guests.', s: ['rc'] },
          { k: 'w5', t: 'Label the main water shutoff and show your cleaner and handyman where it is.', n: 'If a pipe bursts, shutting off the water fast is what limits the damage.' },
          { k: 'w6', t: 'Add a cold-night note to your house manual.', n: 'Keep the heat steady day and night, open sink cabinets, and let a faucet on exposed pipes drip.', s: ['rc'] }
        ]},
        { h: 'Heat and safety', items: [
          { k: 'w7', t: 'Have the chimney and wood-burning fireplace inspected.', n: 'The national fire standard, NFPA 211, calls for an inspection at least once a year.', s: ['csia'] },
          { k: 'w8', t: 'Test every smoke and carbon monoxide alarm.', n: 'Replace batteries at least once a year unless the alarm has a sealed 10-year battery. Replace smoke alarms older than 10 years.', s: ['nfpa', 'cpscAlarm'] },
          { k: 'w9', t: 'Leave flashlights and spare batteries where guests can find them.', n: 'Post the Sevier County Electric outage line: 865-774-6300.', s: ['sces'] },
          { k: 'w10', t: 'Consider a smart thermostat or low-temperature alarm.', n: 'It texts you if the cabin gets cold while it\u2019s empty.' }
        ]},
        { h: 'Driveway and guests', items: [
          { k: 'w11', t: 'Line up someone to clear snow and ice, and keep a shovel and ice melt by the door.', n: 'Steep cabin driveways are often the hardest part of a winter stay.' },
          { k: 'w12', t: 'Send guests the winter guide before arrival.', n: 'It covers road closures, driving on snow, frozen pipes and outages.', link: ['Winter-ready guest guide', 'downloads/smokies-winter-guest-guide.pdf'] }
        ]}
      ]
    },
    {
      id: 'hot-tub', name: 'Hot tub', short: 'Hot tub',
      when: 'Every turnover, plus monthly and every few months',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      intro: 'Guests notice a cloudy or lukewarm hot tub fast, and it\u2019s also a real safety item. Give this list to whoever handles turnovers.',
      img: 'img/hottub.webp',
      groups: [
        { h: 'Every turnover', items: [
          { k: 'h1', t: 'Test the water before each check-in.', n: 'Free chlorine at least 3 ppm (up to 10), or bromine 4\u20138 ppm. Keep pH between 7.0 and 7.8.', s: ['cdc', 'cdcTub'] },
          { k: 'h2', t: 'Check the temperature: 104\u00b0F or lower.', n: 'Never set it above 104\u00b0F.', s: ['cpscTemp'] },
          { k: 'h3', t: 'Look at the drain covers.', n: 'They should be in place and not cracked or missing. If one is broken, shut the tub down until it\u2019s replaced.', s: ['cpscSpa'] },
          { k: 'h4', t: 'Skim the water, wipe the waterline and rinse the filter if it looks dirty.' },
          { k: 'h5', t: 'Close and lock the safety cover.', n: 'Check that the straps and clips still latch.', s: ['cpscSpa'] }
        ]},
        { h: 'Monthly', items: [
          { k: 'h6', t: 'Test the GFCI that protects the hot tub.', n: 'Press TEST and the power should cut off. Press RESET and it should come back. If it doesn\u2019t, have it replaced.', s: ['esfi'] },
          { k: 'h7', t: 'Deep-clean or swap the filter as your owner\u2019s manual says.' },
          { k: 'h8', t: 'Check the cover for tears, sagging or water weight.', n: 'A waterlogged cover won\u2019t hold heat or lock well.' },
          { k: 'h9', t: 'Don\u2019t use stabilized chlorine (dichlor or trichlor) in the hot tub.', n: 'The CDC recommends against cyanuric acid in hot tubs.', s: ['cdc'] }
        ]},
        { h: 'Every few months', items: [
          { k: 'h10', t: 'Drain, clean the shell and refill.', n: 'Follow the schedule in your owner\u2019s manual. Heavy rental use usually means more often.' },
          { k: 'h11', t: 'Have a professional check the pump, heater and drain covers.', n: 'Make sure you know where the pump\u2019s shutoff switch is.', s: ['cpscSpa'] },
          { k: 'h12', t: 'Post or refresh the hot tub rules for guests.', n: 'No glass, kids supervised, and the 104\u00b0F limit.', s: ['cpscTemp'] }
        ]}
      ]
    },
    {
      id: 'gutters', name: 'Gutters', short: 'Gutters',
      when: 'Late fall after the leaves drop, and again in late spring',
      months: [11, 12, 5],
      intro: 'Cabins under hardwoods fill gutters fast. Overflow ends up at the foundation, behind the fascia or in the crawl space.',
      img: 'img/cabin.webp',
      groups: [
        { h: 'Clean', items: [
          { k: 'g1', t: 'Clean the gutters at least twice a year.', n: 'Late fall after the leaves drop and late spring after trees shed. Cabins with trees overhead may need it more often.', s: ['sfGutter', 'hiGutter'] },
          { k: 'g2', t: 'Flush each gutter with a hose and make sure every downspout runs freely.', n: 'If water backs up, the downspout is clogged.', s: ['hiGutter'] },
          { k: 'g3', t: 'Clear them before winter so ice dams don\u2019t form.', s: ['hiExt'] }
        ]},
        { h: 'Check', items: [
          { k: 'g4', t: 'Make sure downspouts empty at least 5 feet from the foundation.', n: 'Water should land on ground that slopes away from the cabin. Add an extension or splash block if it doesn\u2019t.', s: ['irc'] },
          { k: 'g5', t: 'Look for sagging sections, loose hangers, leaking seams and rust.', s: ['puro'] },
          { k: 'g6', t: 'Check the gutter guards too.', n: 'They cut down on clogs but don\u2019t stop all of them.', s: ['puro'] },
          { k: 'g7', t: 'Trim branches hanging over the roof.' }
        ]},
        { h: 'Safety', items: [
          { k: 'g8', t: 'Use a ladder that reaches 3 feet above the gutter, or hire it out.', n: 'On steep mountain lots, hiring it out is often the safer call.', s: ['sfGutter'] },
          { k: 'g9', t: 'Do a quick walk-around after big storms.' }
        ]}
      ]
    },
    {
      id: 'spring-opening', name: 'Spring opening', short: 'Spring',
      when: 'March to April, before spring break and summer bookings',
      months: [3, 4],
      intro: 'Bears wake up hungry, decks come out of a wet winter, and summer guests are close. A spring walk-through catches problems before your busy season.',
      img: 'img/spring.webp',
      groups: [
        { h: 'Bears are back', items: [
          { k: 's1', t: 'Lock down trash before bears come out of their dens.', n: 'Some bears leave their dens in March, and by the end of April most are out looking for food.', s: ['bwSpring', 'bwApril'] },
          { k: 's2', t: 'Check that bear-resistant cans latch, and remind guests to latch them every time.', n: 'Gatlinburg requires animal-resistant containers in many areas, and feeding bears is illegal there.', s: ['gat'] },
          { k: 's3', t: 'Take down bird feeders and clean the grill.', n: 'Bears remember easy food from last year.', s: ['bwSpring', 'bwApril'] }
        ]},
        { h: 'Outside', items: [
          { k: 's4', t: 'Walk the deck and stairs.', n: 'Probe for soft or spongy wood, check that railings don\u2019t give, and look for rusted or loose fasteners at the ledger board.', s: ['nadra'] },
          { k: 's5', t: 'Re-seal the deck if the coating has worn away.', s: ['nadra'] },
          { k: 's6', t: 'Do the spring gutter cleaning.', link: ['Gutters checklist', '#gutters'] },
          { k: 's7', t: 'Turn outdoor faucets back on and watch for leaks.', n: 'A pipe that froze over the winter often shows up now.' },
          { k: 's8', t: 'Look for wasp nests under eaves, decks and railings.' }
        ]},
        { h: 'Inside', items: [
          { k: 's9', t: 'Replace HVAC filters and have the air conditioning serviced before summer.' },
          { k: 's10', t: 'Check the crawl space for standing water, pests and torn vapor barrier.' },
          { k: 's11', t: 'Test smoke and CO alarms and every GFCI outlet.', n: 'Both should be tested monthly.', s: ['nfpa', 'esfi'] },
          { k: 's12', t: 'Drain and refill the hot tub after winter, and replace a worn filter.', link: ['Hot tub checklist', '#hot-tub'] },
          { k: 's13', t: 'Update your house manual with spring events and park road openings.', link: ['Smokies events', 'index.html#events'] }
        ]}
      ]
    }
  ];

  // Yearly reminders for the calendar file (month, day, title, list id)
  const REMIND = [
    { m: 10, d: 15, t: 'Winterize the cabin', id: 'winterizing' },
    { m: 11, d: 20, t: 'Fall gutter cleaning', id: 'gutters' },
    { m: 3, d: 10, t: 'Spring opening walk-through', id: 'spring-opening' },
    { m: 5, d: 15, t: 'Spring gutter cleaning', id: 'gutters' }
  ];

  return { SRC, LISTS, REMIND };
})();
