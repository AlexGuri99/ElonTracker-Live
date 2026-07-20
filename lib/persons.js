const persons = [
  {
    id: "elon",
    name: "Elon Musk",
    username: "elonmusk",
    icon: "/elon_icon.png",
    // No events config — uses existing SpaceX / Tesla / Starlink logic from Space Devs API
  },
  {
    id: "trump",
    name: "Donald Trump",
    username: "realDonaldTrump",
    icon: "/trump_icon.png",
    events: {
      newsQuery: '"Donald Trump" AND (rally OR speech OR court OR debate OR verdict OR campaign OR endorsement OR announcement)',
      classifiers: [
        { pattern: /rally|town hall|campaign/i, type: "rally", multiplier: 1.5, label: "Rally / Campaign", windowHours: 6 },
        { pattern: /court|indict|verdict|trial|arraign|hearing|lawsuit|convict/i, type: "legal", multiplier: 2.0, label: "Legal", windowHours: 8 },
        { pattern: /debate/i, type: "debate", multiplier: 1.8, label: "Debate", windowHours: 4 },
        { pattern: /endorse|announce|policy|executive order|statement|press conference/i, type: "announcement", multiplier: 1.3, label: "Announcement", windowHours: 4 },
      ],
    },
  },
  {
    id: "cz",
    name: "Changpeng Zhao",
    username: "cz_binance",
    icon: "/cz_icon.png",
    events: {
      newsQuery: '"Changpeng Zhao" OR "CZ Binance" AND (regulatory OR listing OR launch OR settlement OR SEC OR crypto OR Binance)',
      classifiers: [
        { pattern: /regulat|SEC|CFTC|fine|settlement|prosecut|investigat/i, type: "regulatory", multiplier: 2.0, label: "Regulatory", windowHours: 8 },
        { pattern: /listing|launch|token|BNB|chain/i, type: "launch", multiplier: 1.5, label: "Launch / Listing", windowHours: 4 },
        { pattern: /hack|breach|security|exploit|theft/i, type: "security", multiplier: 1.8, label: "Security Incident", windowHours: 6 },
        { pattern: /interview|speech|conference|statement/i, type: "public", multiplier: 1.3, label: "Public Appearance", windowHours: 4 },
      ],
    },
  },
  {
    id: "cruz",
    name: "Ted Cruz",
    username: "tedcruz",
    icon: "/cruz_icon.png",
    events: {
      newsQuery: '"Ted Cruz" AND (Senate OR hearing OR speech OR bill OR vote OR committee OR interview)',
      classifiers: [
        { pattern: /hearing|testimony|committee/i, type: "hearing", multiplier: 1.5, label: "Hearing", windowHours: 6 },
        { pattern: /vote|bill|legislation|resolution/i, type: "vote", multiplier: 1.2, label: "Vote / Bill", windowHours: 4 },
        { pattern: /speech|floor|address|remarks/i, type: "speech", multiplier: 1.4, label: "Speech", windowHours: 4 },
        { pattern: /interview|appearance|town hall/i, type: "media", multiplier: 1.3, label: "Media Appearance", windowHours: 4 },
      ],
    },
  },
  {
    id: "khamenei",
    name: "Ali Khamenei",
    username: "khamenei_ir",
    icon: "/khamenei_icon.png",
    events: {
      newsQuery: '"Ali Khamenei" OR "Khamenei" AND (speech OR address OR announcement OR diplomatic OR Iran OR nuclear)',
      classifiers: [
        { pattern: /speech|address|remarks|ayatollah/i, type: "speech", multiplier: 1.5, label: "Speech", windowHours: 6 },
        { pattern: /diplomatic|negotiation|deal|talks|visit/i, type: "diplomatic", multiplier: 1.4, label: "Diplomatic", windowHours: 8 },
        { pattern: /nuclear|sanction|military|defense|missile/i, type: "geopolitical", multiplier: 1.6, label: "Geopolitical", windowHours: 8 },
        { pattern: /announce|decree|statement|declaration/i, type: "announcement", multiplier: 1.3, label: "Announcement", windowHours: 4 },
      ],
    },
  },
  {
    id: "zelenskyy",
    name: "Volodymyr Zelenskyy",
    username: "ZelenskyyUa",
    icon: "/zelenskyy_icon.png",
    events: {
      newsQuery: '"Volodymyr Zelenskyy" OR "Zelenskyy" AND (speech OR aid OR meeting OR address OR diplomatic OR Ukraine OR defense)',
      classifiers: [
        { pattern: /aid|package|assistance|support|grant/i, type: "aid", multiplier: 1.5, label: "Aid Package", windowHours: 6 },
        { pattern: /diplomatic|visit|meeting|summit|talks|ambassador/i, type: "diplomatic", multiplier: 1.4, label: "Diplomatic", windowHours: 6 },
        { pattern: /speech|address|remarks|parliament|UN|assembly/i, type: "speech", multiplier: 1.6, label: "Speech", windowHours: 4 },
        { pattern: /defense|military|weapon|offensive|counter/i, type: "military", multiplier: 1.3, label: "Military", windowHours: 8 },
      ],
    },
  },
  {
    id: "mamdani",
    name: "Mayor Zohran Mamdani",
    username: "NYCMayor",
    icon: "/mamdani_icon.png",
    events: {
      newsQuery: '"NYC Mayor" OR "Mayor Mamdani" OR "Zohran Mamdani" AND (policy OR speech OR announcement OR budget OR legislation OR press)',
      classifiers: [
        { pattern: /speech|address|remarks|press conference|town hall/i, type: "speech", multiplier: 1.5, label: "Speech", windowHours: 6 },
        { pattern: /budget|policy|initiative|plan|proposal|executive order/i, type: "policy", multiplier: 1.4, label: "Policy", windowHours: 6 },
        { pattern: /press conference|statement|announce|press release/i, type: "announcement", multiplier: 1.3, label: "Announcement", windowHours: 4 },
        { pattern: /interview|appearance|media/i, type: "media", multiplier: 1.2, label: "Media", windowHours: 4 },
        { pattern: /crisis|emergency|storm|disaster|outage|protest/i, type: "crisis", multiplier: 1.6, label: "Crisis Response", windowHours: 8 },
      ],
    },
  },
];

export default persons;