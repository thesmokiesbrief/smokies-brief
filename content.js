// In production this file is rebuilt every morning by the scheduled job.
window.CONTENT = {
  updated: "Tue, Nov 17, 6:04 a.m.",
  today: "2026-11-17",
  // today's snapshot used by the check-in builder, guest sheet and share cards (rebuilt by the morning job)
  now: {
    weather: [["Today",63,"Sunny"],["Tonight",39,"Mostly clear"],["Wednesday",66,"Sunny"],["Wednesday night",42,"Mostly clear"],["Thursday",67,"Mostly sunny"]],
    roads: [
      "Kuwohi Road is closed for snow and ice.",
      "Heintooga Ridge, Parson Branch and Rich Mountain roads are closed for the season.",
      "Park Headquarters Road is closed for water and wastewater work near Sugarlands.",
      "Straight Fork and the one-way section of Balsam Mountain Road are closed."
    ],
    roadsSoon: "Kuwohi Road, Roaring Fork Motor Nature Trail and Little Greenbrier Road close for the season on Nov 29.",
    busyDays: "Nov 22, 25, 27–28, Dec 1–2 and Dec 26",
    week: [["68%","Gatlinburg rental occupancy in October"],["25/100","Market gauge: a buyer's market"],["Nov 21","Free Winterfest kickoff at The Island"],["Nov 20","Ober Mountain plans to open skiing and tubing"]]
  },
  rates: {
    period: "Oct 2025 – Sep 2026",
    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    adr: [548,516,577,542,545,703,672,520,480,602,601,699],
    occ: [27.0,29.4,47.0,43.1,46.8,57.9,56.1,45.8,43.4,50.9,45.6,50.0],
    season: ["Low","Low","Shoulder","Low","Low","High","High","Shoulder","Low","Shoulder","Low","High"],
    current: 10
  },
  // long-running events drawn as bars on the 6-month strip
  spans: [
    {t:"Gatlinburg & Sevierville Winterfest lights", sh:"Gatlinburg & Sevierville Winterfest", s:"2026-11-05", e:"2027-02-15", c:"fest", u:"https://visitsevierville.com/winterfest.aspx"},
    {t:"Pigeon Forge Winterfest lights", sh:"Pigeon Forge Winterfest", s:"2026-11-06", e:"2027-01-31", c:"fest", u:"https://www.mypigeonforge.com/event/winterfest/"},
    {t:"Dollywood's Smoky Mountain Christmas", sh:"Dollywood Christmas", s:"2026-11-06", e:"2027-01-03", c:"big", u:"https://www.mypigeonforge.com/events/dollywood/"},
    {t:"Dollywood's I Will Always Love You Festival", sh:"I Will Always Love You Festival", s:"2027-03-11", e:"2027-04-11", c:"big", u:"https://www.mypigeonforge.com/events/dollywood/"},
    {t:"Dollywood's Flower & Food Festival", sh:"Flower & Food Festival", s:"2027-05-07", e:"2027-06-20", c:"big", u:"https://www.mypigeonforge.com/events/dollywood/"}
  ],
  events: [
    {d:"2026-11-20", t:"Ober Mountain opens skiing, snowboarding and tubing (weather permitting)", p:"Gatlinburg", c:"big", u:"https://www.obergatlinburg.com/blog/get-ready-for-winter-2026-27-at-ober-gatlinburg"},
    {d:"2026-11-21", t:"The Island Winterfest kickoff: free concert and tree lighting", p:"Pigeon Forge", c:"fest", u:"https://deeparrival.com/news/the-island-pigeon-forge-winterfest-kickoff-november-21-2026/"},
    {d:"2026-11-24", e:"2026-11-29", t:"Gatlinburg Festival of Trees", p:"Gatlinburg", c:"fest", u:"https://www.pigeonforge.com/fun/winterfest/"},
    {d:"2026-11-26", t:"Thanksgiving Day", p:"Everywhere", c:"big", u:"https://www.rgj.com/story/entertainment/smoky-mountains/2026/11/13/great-smoky-mountains-national-park-busy-days-visitors-november-december-fall-winter/92722959007/"},
    {d:"2026-11-27", e:"2026-12-27", t:"Mountain Mile Christmas Market (Fridays and Saturdays)", wd:[5,6], p:"Pigeon Forge", c:"fest", u:"https://www.knoxnews.com/story/entertainment/2026/11/06/christmas-markets-in-knoxville-gatlinburg-pigeon-forge-2026/92561135007/"},
    {d:"2026-11-28", t:"Chimney Tops 2 Wildfires 10-year gathering of remembrance", p:"Sevier County", c:"civic", u:"https://www.seviercountytn.gov/"},
    {d:"2026-11-29", t:"Kuwohi Road and Roaring Fork Motor Nature Trail close for the season", p:"National park", c:"park", u:"https://www.wate.com/news/smoky-mountains/when-does-kuwohi-road-close-smokies-seasonal-road-closures/"},
    {d:"2026-12-03", t:"Planning Commission, 5 p.m.", p:"Sevierville", c:"meet", u:"https://www.seviervilletn.org/calendar.aspx?view=list&CID=14"},
    {d:"2026-12-04", e:"2026-12-06", t:"Yama-Con anime and gaming convention", p:"LeConte Center", c:"conv", u:"https://www.pigeonforge.com/area/leconte-center/events/"},
    {d:"2026-12-07", t:"Board of Mayor and Aldermen, 6 p.m.", p:"Sevierville", c:"meet", u:"https://www.seviervilletn.org/calendar.aspx?view=list&CID=14"},
    {d:"2026-12-21", t:"Board of Mayor and Aldermen, 6 p.m.", p:"Sevierville", c:"meet", u:"https://www.seviervilletn.org/calendar.aspx?view=list&CID=14"},
    {d:"2026-12-28", e:"2026-12-30", t:"Strength to Stand December Conference", p:"Pigeon Forge", c:"conv", u:"https://www.mypigeonforge.com/calendar/list/page/7/?tribe-bar-date=2026-06-20"},
    {d:"2026-12-31", t:"New Year's Eve celebration and fireworks at The Island", p:"Pigeon Forge", c:"big", u:"https://www.mypigeonforge.com/calendar/list/page/7/?tribe-bar-date=2026-06-20"},
    {d:"2027-01-04", e:"2027-01-07", t:"Wilderness Wildlife Week", p:"LeConte Center", c:"conv", u:"https://www.pigeonforge.com/area/leconte-center/events/"},
    {d:"2027-01-16", e:"2027-01-18", t:"Strength to Stand January Conference", p:"Pigeon Forge", c:"conv", u:"https://www.mypigeonforge.com/calendar/list/page/7/?tribe-bar-date=2026-06-20"},
    {d:"2027-01-16", e:"2027-01-18", t:"Martin Luther King Jr. Day weekend", p:"Holiday weekend", c:"big", u:"https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/"},
    {d:"2027-01-22", e:"2027-01-24", t:"Resurrection Youth Conference", p:"Pigeon Forge", c:"conv", u:"https://www.mypigeonforge.com/calendar/list/page/7/?tribe-bar-date=2026-06-20"},
    {d:"2027-02-04", e:"2027-02-05", t:"Smoky Mountain Jubilee", p:"Pigeon Forge", c:"conv", u:"https://www.mypigeonforge.com/calendar/list/page/7/?tribe-bar-date=2026-06-20"},
    {d:"2027-02-06", t:"February Freeze 5K on the Riverwalk", p:"Pigeon Forge", c:"fest", u:"https://www.mypigeonforge.com/calendar/list/page/7/?tribe-bar-date=2026-06-20"},
    {d:"2027-02-11", e:"2027-02-15", t:"Make It Count Spectacular gymnastics meet", p:"Pigeon Forge", c:"conv", u:"https://www.mypigeonforge.com/calendar/list/page/7/?tribe-bar-date=2026-06-20"},
    {d:"2027-02-13", e:"2027-02-15", t:"Presidents' Day weekend", p:"Holiday weekend", c:"big", u:"https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/"},
    {d:"2027-03-11", t:"Dollywood opens its I Will Always Love You Festival", p:"Dollywood", c:"big", u:"https://www.mypigeonforge.com/events/dollywood/"},
    {d:"2027-03-26", e:"2027-03-28", t:"Easter weekend", p:"Holiday weekend", c:"big"},
    {d:"2027-04-08", e:"2027-04-10", t:"Corvette Expo", p:"LeConte Center", c:"conv", u:"https://www.pigeonforge.com/area/leconte-center/events/"},
    {d:"2027-05-07", t:"Dollywood's Flower & Food Festival opens", p:"Dollywood", c:"big", u:"https://www.mypigeonforge.com/events/dollywood/"},
    {d:"2027-05-20", e:"2027-05-22", t:"Spring Rod Run (new May dates for 2027)", p:"LeConte Center", c:"big", u:"https://www.pigeonforge.com/area/leconte-center/events/"},
    {d:"2027-05-29", e:"2027-05-31", t:"Memorial Day weekend", p:"Holiday weekend", c:"big", u:"https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/"}
  ],
  // Guest-facing attractions feed (data/attractions.json). Written for guests, not owners:
  // no local-only deals, no live ride waits. Items hide automatically outside from/until.
  attractions: {
    dollywood: {
      url: "https://www.dollywood.com/",
      seasons: [
        {from:"2026-11-06", until:"2027-01-03", name:"Smoky Mountain Christmas", url:"https://www.mypigeonforge.com/events/dollywood/"},
        {from:"2027-03-11", until:"2027-04-11", name:"I Will Always Love You Festival", url:"https://www.mypigeonforge.com/events/dollywood/"},
        {from:"2027-05-07", until:"2027-06-20", name:"Flower & Food Festival", url:"https://www.mypigeonforge.com/events/dollywood/"}
      ],
      deals: [
        {title:"$45 Christmas friend ticket", text:"Buy any 2027 season pass by Dec 13 and bring a friend for $45.", until:"2026-12-13", url:"https://www.dollywood.com/Deals/Special-Offers"},
        {title:"$59 tickets for public employees", text:"Military, first responders, school, government and medical workers, verified by ID.me.", until:"2026-11-23", url:"https://www.dollywood.com/press/dollywood-christmas-shopping/"},
        {title:"$10 off adult day tickets", text:"Limited-time online offer.", until:"2026-11-23", url:"https://www.dollywood.com/press/dollywood-christmas-shopping/"},
        {title:"Military discount", text:"Year-round savings on tickets and passes, verified by ID.me.", url:"https://www.dollywood.com/deals/special-offers/military-discount/"}
      ],
      tips: [
        {text:"Go on a weekday if you can. Saturdays are much busier.", url:"https://queue-times.com/en-US/parks/55/stats/2024"},
        {text:"Have a Silver pass? It isn't valid Dec 14 through Jan 3. You'll need a Gold pass or a day ticket on those dates.", from:"2026-11-06", until:"2027-01-03", url:"https://www.dollywood.com/tickets/season-passes/current-passholders/renewals/"},
        {text:"Dollywood doesn't offer AAA discounts, but some AAA offices sell tickets.", url:"https://www.dollywood.com/themepark/Guest-Services/FAQs"}
      ]
    },
    cards: [
      {name:"Ober Mountain", town:"Gatlinburg", title:"Skiing and tubing open Friday, Nov 20", text:"Weather permitting. The summit already has its first natural snow of the season.", until:"2026-11-22", url:"https://www.obergatlinburg.com/blog/get-ready-for-winter-2026-27-at-ober-gatlinburg"},
      {name:"The Island", town:"Pigeon Forge", title:"Free Winterfest kickoff Saturday, Nov 21", text:"Concert at 6 p.m. and tree lighting at 8 p.m. Free admission and parking.", until:"2026-11-21", url:"https://deeparrival.com/news/the-island-pigeon-forge-winterfest-kickoff-november-21-2026/"},
      {name:"The Island", town:"Pigeon Forge", title:"Free nightly light shows", text:"Shows at 6, 7, 8 and 9 p.m. through Jan 31. Free admission and parking.", from:"2026-11-21", until:"2027-01-31", url:"https://deeparrival.com/news/the-island-pigeon-forge-winterfest-kickoff-november-21-2026/"}
    ]
  }
};
