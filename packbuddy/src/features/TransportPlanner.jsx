/* =============================================================
   PackBuddy – Airport transport planner for international students
   React component.  Use it with:   import Planner from "./Planner";
                                    <Planner />
   Styles are in Planner.css (imported below).
   ============================================================= */

import { useState, useEffect, useMemo, useRef } from "react";
import "./TransportPlanner.css";


/* =============================================================
   1. DATA – edit these numbers to update the website
   ============================================================= */

/* -------------------------------------------------------------
   Typical size of each bag, in litres
   ------------------------------------------------------------- */
const BAG_LITRES = { large: 100, medium: 65, cabin: 40, backpack: 25 };


/* -------------------------------------------------------------
   UK airports. "tube": true = the Tube / Elizabeth line / DLR reaches it
   ------------------------------------------------------------- */
const AIRPORTS = [
  { code: "LHR", name: "London Heathrow",   lat: 51.4700, lng: -0.4543, tube: true },
  { code: "LGW", name: "London Gatwick",    lat: 51.1537, lng: -0.1821, tube: false },
  { code: "STN", name: "London Stansted",   lat: 51.8860, lng:  0.2389, tube: false },
  { code: "LTN", name: "London Luton",      lat: 51.8747, lng: -0.3683, tube: false },
  { code: "LCY", name: "London City",       lat: 51.5053, lng:  0.0553, tube: true },
  { code: "MAN", name: "Manchester",        lat: 53.3588, lng: -2.2727, tube: false },
  { code: "BHX", name: "Birmingham",        lat: 52.4539, lng: -1.7480, tube: false },
  { code: "EDI", name: "Edinburgh",         lat: 55.9508, lng: -3.3615, tube: false },
  { code: "GLA", name: "Glasgow",           lat: 55.8719, lng: -4.4331, tube: false },
  { code: "BRS", name: "Bristol",           lat: 51.3827, lng: -2.7191, tube: false }
];


/* -------------------------------------------------------------
   Popular student destinations – found instantly as you type.
   Add your own: { name, area, type: "uni" | "station", lat, lng, alias }
   ------------------------------------------------------------- */
const STUDENT_PLACES = [
  // ---- London universities ----
  { name: "UCL (University College London)",   area: "Bloomsbury, London",       type: "uni", lat: 51.5246, lng: -0.1340, alias: "ucl" },
  { name: "Imperial College London",            area: "South Kensington, London", type: "uni", lat: 51.4988, lng: -0.1749, alias: "icl imperial" },
  { name: "King's College London (Strand)",     area: "Strand, London",           type: "uni", lat: 51.5115, lng: -0.1160, alias: "kcl kings" },
  { name: "LSE (London School of Economics)",   area: "Holborn, London",          type: "uni", lat: 51.5144, lng: -0.1165, alias: "lse" },
  { name: "Queen Mary University of London",    area: "Mile End, London",         type: "uni", lat: 51.5241, lng: -0.0404, alias: "qmul queen mary" },
  { name: "University of the Arts London (Central Saint Martins)", area: "King's Cross, London", type: "uni", lat: 51.5354, lng: -0.1253, alias: "ual csm" },
  { name: "City St George's, University of London", area: "Clerkenwell, London",  type: "uni", lat: 51.5279, lng: -0.1025, alias: "city university" },
  { name: "SOAS University of London",          area: "Bloomsbury, London",       type: "uni", lat: 51.5222, lng: -0.1290, alias: "soas" },
  { name: "University of Westminster",          area: "Regent Street, London",    type: "uni", lat: 51.5170, lng: -0.1426, alias: "westminster" },
  { name: "Goldsmiths, University of London",   area: "New Cross, London",        type: "uni", lat: 51.4743, lng: -0.0354, alias: "goldsmiths" },
  { name: "University of Greenwich",            area: "Greenwich, London",        type: "uni", lat: 51.4829, lng: -0.0059, alias: "greenwich" },
  { name: "Royal Holloway, University of London", area: "Egham, Surrey",          type: "uni", lat: 51.4256, lng: -0.5631, alias: "rhul royal holloway" },
  { name: "Brunel University London",           area: "Uxbridge, London",         type: "uni", lat: 51.5326, lng: -0.4730, alias: "brunel" },
  // ---- Universities around the UK ----
  { name: "University of Oxford",               area: "Oxford",                   type: "uni", lat: 51.7548, lng: -1.2544, alias: "oxford" },
  { name: "University of Cambridge",            area: "Cambridge",                type: "uni", lat: 52.2043, lng:  0.1149, alias: "cambridge" },
  { name: "University of Manchester",           area: "Manchester",               type: "uni", lat: 53.4668, lng: -2.2339, alias: "manchester uom" },
  { name: "University of Birmingham",           area: "Edgbaston, Birmingham",    type: "uni", lat: 52.4508, lng: -1.9305, alias: "birmingham uob" },
  { name: "University of Edinburgh",            area: "Edinburgh",                type: "uni", lat: 55.9445, lng: -3.1892, alias: "edinburgh" },
  { name: "University of Glasgow",              area: "Glasgow",                  type: "uni", lat: 55.8721, lng: -4.2882, alias: "glasgow" },
  { name: "University of Leeds",                area: "Leeds",                    type: "uni", lat: 53.8067, lng: -1.5550, alias: "leeds" },
  { name: "University of Sheffield",            area: "Sheffield",                type: "uni", lat: 53.3811, lng: -1.4882, alias: "sheffield" },
  { name: "University of Bristol",              area: "Bristol",                  type: "uni", lat: 51.4584, lng: -2.6030, alias: "bristol" },
  { name: "University of Nottingham",           area: "Nottingham",               type: "uni", lat: 52.9381, lng: -1.1960, alias: "nottingham" },
  { name: "University of Warwick",              area: "Coventry",                 type: "uni", lat: 52.3793, lng: -1.5615, alias: "warwick" },
  { name: "University of Southampton",          area: "Southampton",              type: "uni", lat: 50.9346, lng: -1.3960, alias: "southampton soton" },
  { name: "Newcastle University",               area: "Newcastle upon Tyne",      type: "uni", lat: 54.9792, lng: -1.6147, alias: "newcastle" },
  { name: "University of Liverpool",            area: "Liverpool",                type: "uni", lat: 53.4060, lng: -2.9660, alias: "liverpool" },
  { name: "Cardiff University",                 area: "Cardiff",                  type: "uni", lat: 51.4866, lng: -3.1789, alias: "cardiff" },
  { name: "University of Bath",                 area: "Bath",                     type: "uni", lat: 51.3782, lng: -2.3264, alias: "bath" },
  { name: "Durham University",                  area: "Durham",                   type: "uni", lat: 54.7650, lng: -1.5782, alias: "durham" },
  { name: "University of York",                 area: "York",                     type: "uni", lat: 53.9461, lng: -1.0518, alias: "york" },
  { name: "Lancaster University",               area: "Lancaster",                type: "uni", lat: 54.0104, lng: -2.7877, alias: "lancaster" },
  { name: "University of St Andrews",           area: "St Andrews",               type: "uni", lat: 56.3417, lng: -2.7943, alias: "st andrews" },
  // ---- Major stations ----
  { name: "King's Cross Station",               area: "London",                   type: "station", lat: 51.5308, lng: -0.1238, alias: "kings cross" },
  { name: "St Pancras International",           area: "London",                   type: "station", lat: 51.5320, lng: -0.1270, alias: "st pancras" },
  { name: "Euston Station",                     area: "London",                   type: "station", lat: 51.5282, lng: -0.1337, alias: "euston" },
  { name: "Paddington Station",                 area: "London",                   type: "station", lat: 51.5154, lng: -0.1755, alias: "paddington" },
  { name: "Victoria Station",                   area: "London",                   type: "station", lat: 51.4952, lng: -0.1441, alias: "victoria" },
  { name: "Waterloo Station",                   area: "London",                   type: "station", lat: 51.5031, lng: -0.1132, alias: "waterloo" },
  { name: "Liverpool Street Station",           area: "London",                   type: "station", lat: 51.5178, lng: -0.0823, alias: "liverpool street" },
  { name: "Stratford Station",                  area: "London",                   type: "station", lat: 51.5416, lng: -0.0033, alias: "stratford" },
  { name: "Manchester Piccadilly",              area: "Manchester",               type: "station", lat: 53.4774, lng: -2.2309, alias: "piccadilly" },
  { name: "Birmingham New Street",              area: "Birmingham",               type: "station", lat: 52.4778, lng: -1.8990, alias: "new street" },
  { name: "Edinburgh Waverley",                 area: "Edinburgh",                type: "station", lat: 55.9520, lng: -3.1890, alias: "waverley" }
];


/* -------------------------------------------------------------
   Every London Underground station, plus Elizabeth line and DLR stations.
   Format: [name, latitude, longitude, lines, fare zone]
   Source: TfL station data (via oobrien/vis on GitHub).
   Stations on a zone boundary (e.g. 2/3) use the lower zone.
   ------------------------------------------------------------- */
const TUBE_STATIONS = [
  ["Abbey Road", 51.53239, 0.00353, "DLR", 2],
  ["Abbey Wood", 51.49109, 0.12041, "Elizabeth", 4],
  ["Acton Main Line", 51.51711, -0.26716, "Elizabeth", 3],
  ["Acton Town", 51.50264, -0.27992, "District, Piccadilly", 3],
  ["Aldgate", 51.51410, -0.07572, "Circle, Metropolitan", 1],
  ["Aldgate East", 51.51515, -0.07188, "District, Hammersmith & City", 1],
  ["All Saints", 51.51072, -0.01307, "DLR", 2],
  ["Alperton", 51.54055, -0.29945, "Piccadilly", 4],
  ["Amersham", 51.67421, -0.60847, "Metropolitan", 9],
  ["Angel", 51.53182, -0.10613, "Northern", 1],
  ["Archway", 51.56537, -0.13475, "Northern", 2],
  ["Arnos Grove", 51.61648, -0.13327, "Piccadilly", 4],
  ["Arsenal", 51.55782, -0.10810, "Piccadilly", 2],
  ["Baker Street", 51.52250, -0.15551, "Bakerloo, Circle, Hammersmith & City, Jubilee, Metropolitan", 1],
  ["Balham", 51.44316, -0.15299, "Northern", 3],
  ["Bank", 51.51345, -0.08899, "Central, Northern, Waterloo & City", 1],
  ["Bank (DLR)", 51.51230, -0.08700, "DLR", 1],
  ["Barbican", 51.52021, -0.09779, "Circle, Hammersmith & City, Metropolitan", 1],
  ["Barking", 51.53950, 0.08120, "District, Hammersmith & City", 4],
  ["Barkingside", 51.58565, 0.08858, "Central", 4],
  ["Barons Court", 51.49026, -0.21375, "District, Piccadilly", 2],
  ["Battersea Power Station", 51.47943, -0.14299, "Northern", 2],
  ["Bayswater", 51.51233, -0.18784, "Circle, District", 1],
  ["Beckton", 51.51428, 0.06105, "DLR", 3],
  ["Beckton Park", 51.50873, 0.05498, "DLR", 3],
  ["Becontree", 51.54032, 0.12727, "District", 5],
  ["Belsize Park", 51.55028, -0.16470, "Northern", 2],
  ["Bermondsey", 51.49773, -0.06374, "Jubilee", 2],
  ["Bethnal Green", 51.52747, -0.05549, "Central", 2],
  ["Blackfriars", 51.51177, -0.10314, "Circle, District", 1],
  ["Blackhorse Road", 51.58700, -0.04070, "Victoria", 3],
  ["Blackwall", 51.50794, -0.00723, "DLR", 2],
  ["Bond Street", 51.51433, -0.14899, "Central, Elizabeth, Jubilee", 1],
  ["Borough", 51.50109, -0.09341, "Northern", 1],
  ["Boston Manor", 51.49575, -0.32473, "Piccadilly", 4],
  ["Bounds Green", 51.60707, -0.12413, "Piccadilly", 3],
  ["Bow Church", 51.52773, -0.02091, "DLR", 2],
  ["Bow Road", 51.52687, -0.02484, "District, Hammersmith & City", 2],
  ["Brent Cross", 51.57670, -0.21355, "Northern", 3],
  ["Brentwood", 51.61354, 0.29983, "Elizabeth", 9],
  ["Brixton", 51.46261, -0.11487, "Victoria", 2],
  ["Bromley-by-Bow", 51.52474, -0.01159, "District, Hammersmith & City", 2],
  ["Buckhurst Hill", 51.62595, 0.04680, "Central", 5],
  ["Burnham", 51.52340, -0.64635, "Elizabeth", null],
  ["Burnt Oak", 51.60284, -0.26395, "Northern", 4],
  ["Caledonian Road", 51.54837, -0.11837, "Piccadilly", 2],
  ["Camden Town", 51.53894, -0.14256, "Northern", 2],
  ["Canada Water", 51.49800, -0.04930, "Jubilee", 2],
  ["Canary Wharf", 51.50354, -0.01861, "DLR, Elizabeth, Jubilee", 2],
  ["Canning Town", 51.51404, 0.00817, "Jubilee", 2],
  ["Canning Town (DLR)", 51.51350, 0.00800, "DLR", 2],
  ["Cannon Street", 51.51139, -0.09032, "Circle, District", 1],
  ["Canons Park", 51.60776, -0.29474, "Jubilee", 5],
  ["Chadwell Heath", 51.56794, 0.12906, "Elizabeth", 5],
  ["Chalfont & Latimer", 51.66804, -0.56082, "Metropolitan", 8],
  ["Chalk Farm", 51.54420, -0.15347, "Northern", 2],
  ["Chancery Lane", 51.51811, -0.11212, "Central", 1],
  ["Charing Cross", 51.50734, -0.12736, "Bakerloo, Northern", 1],
  ["Chesham", 51.70539, -0.61093, "Metropolitan", 9],
  ["Chigwell", 51.61783, 0.07475, "Central", 4],
  ["Chiswick Park", 51.49458, -0.26812, "District", 3],
  ["Chorleywood", 51.65418, -0.51836, "Metropolitan", 7],
  ["Clapham Common", 51.46199, -0.13759, "Northern", 2],
  ["Clapham North", 51.46512, -0.12990, "Northern", 2],
  ["Clapham South", 51.45276, -0.14758, "Northern", 2],
  ["Cockfosters", 51.65161, -0.14935, "Piccadilly", 5],
  ["Colindale", 51.59535, -0.24978, "Northern", 4],
  ["Colliers Wood", 51.41812, -0.17809, "Northern", 3],
  ["Covent Garden", 51.51306, -0.12420, "Piccadilly", 1],
  ["Crossharbour", 51.49584, -0.01447, "DLR", 2],
  ["Croxley", 51.64715, -0.44167, "Metropolitan", 7],
  ["Custom House", 51.50970, 0.02637, "DLR, Elizabeth", 3],
  ["Cutty Sark", 51.48174, -0.01072, "DLR", 2],
  ["Cyprus", 51.50843, 0.06397, "DLR", 3],
  ["Dagenham East", 51.54416, 0.16564, "District", 5],
  ["Dagenham Heathway", 51.54167, 0.14770, "District", 5],
  ["Debden", 51.64529, 0.08357, "Central", 6],
  ["Deptford Bridge", 51.47411, -0.02239, "DLR", 2],
  ["Devons Road", 51.52247, -0.01750, "DLR", 2],
  ["Dollis Hill", 51.55208, -0.23923, "Jubilee", 3],
  ["Ealing Broadway", 51.51520, -0.30154, "Central, District", 3],
  ["Ealing Broadway (Rail)", 51.51478, -0.30154, "Elizabeth", 3],
  ["Ealing Common", 51.50991, -0.28818, "District, Piccadilly", 3],
  ["Earl's Court", 51.49148, -0.19417, "District, Piccadilly", 1],
  ["East Acton", 51.51687, -0.24757, "Central", 2],
  ["East Finchley", 51.58757, -0.16522, "Northern", 3],
  ["East Ham", 51.53924, 0.05201, "District, Hammersmith & City", 3],
  ["East India", 51.50939, -0.00226, "DLR", 2],
  ["East Putney", 51.45907, -0.21106, "District", 2],
  ["Eastcote", 51.57661, -0.39707, "Metropolitan, Piccadilly", 5],
  ["Edgware", 51.61399, -0.27550, "Northern", 5],
  ["Edgware Road", 51.52048, -0.17034, "Bakerloo, Circle, District, Hammersmith & City", 1],
  ["Elephant & Castle", 51.49538, -0.10054, "Bakerloo, Northern", 1],
  ["Elm Park", 51.54964, 0.19746, "District", 6],
  ["Elverson Road", 51.46910, -0.01679, "DLR", 2],
  ["Embankment", 51.50701, -0.12258, "Bakerloo, Circle, District, Northern", 1],
  ["Epping", 51.69418, 0.11453, "Central", 6],
  ["Euston", 51.52843, -0.13429, "Northern, Victoria", 1],
  ["Euston Square", 51.52568, -0.13553, "Circle, Hammersmith & City, Metropolitan", 1],
  ["Fairlop", 51.59595, 0.09111, "Central", 4],
  ["Farringdon", 51.52021, -0.10467, "Circle, Hammersmith & City, Metropolitan", 1],
  ["Farringdon (Rail)", 51.51920, -0.10330, "Elizabeth", 1],
  ["Finchley Central", 51.60068, -0.19194, "Northern", 4],
  ["Finchley Road", 51.54738, -0.18088, "Jubilee, Metropolitan", 2],
  ["Finsbury Park", 51.56464, -0.10634, "Piccadilly, Victoria", 2],
  ["Forest Gate", 51.54955, 0.02412, "Elizabeth", 3],
  ["Fulham Broadway", 51.48018, -0.19528, "District", 2],
  ["Gallions Reach", 51.50896, 0.07177, "DLR", 3],
  ["Gants Hill", 51.57661, 0.06635, "Central", 4],
  ["Gidea Park", 51.58162, 0.20529, "Elizabeth", 6],
  ["Gloucester Road", 51.49444, -0.18347, "Circle, District, Piccadilly", 1],
  ["Golders Green", 51.57240, -0.19409, "Northern", 3],
  ["Goldhawk Road", 51.50195, -0.22667, "Circle, Hammersmith & City", 2],
  ["Goodge Street", 51.52051, -0.13436, "Northern", 1],
  ["Goodmayes", 51.56550, 0.11100, "Elizabeth", 4],
  ["Grange Hill", 51.61312, 0.09252, "Central", 4],
  ["Great Portland Street", 51.52384, -0.14392, "Circle, Hammersmith & City, Metropolitan", 1],
  ["Green Park", 51.50656, -0.14312, "Jubilee, Piccadilly, Victoria", 1],
  ["Greenford", 51.54219, -0.34482, "Central", 4],
  ["Greenwich", 51.47804, -0.01549, "DLR", 2],
  ["Gunnersbury", 51.49161, -0.27538, "District", 3],
  ["Hainault", 51.60371, 0.09347, "Central", 4],
  ["Hammersmith", 51.49410, -0.22508, "Circle, District, Hammersmith & City, Piccadilly", 2],
  ["Hampstead", 51.55639, -0.17820, "Northern", 2],
  ["Hanger Lane", 51.53030, -0.29329, "Central", 3],
  ["Hanwell", 51.51181, -0.33860, "Elizabeth", 4],
  ["Harlesden", 51.53637, -0.25795, "Bakerloo", 3],
  ["Harold Wood", 51.59268, 0.23301, "Elizabeth", 6],
  ["Harrow & Wealdstone", 51.59232, -0.33540, "Bakerloo", 5],
  ["Harrow-on-the-Hill", 51.57924, -0.33630, "Metropolitan", 5],
  ["Hatton Cross", 51.46672, -0.42312, "Piccadilly", 5],
  ["Hayes & Harlington", 51.50297, -0.41962, "Elizabeth", 5],
  ["Heathrow Terminal 4", 51.45866, -0.44543, "Elizabeth, Piccadilly", 6],
  ["Heathrow Terminal 5", 51.47255, -0.49010, "Elizabeth, Piccadilly", 6],
  ["Heathrow Terminals 2 & 3", 51.47250, -0.45500, "Elizabeth, Piccadilly", 6],
  ["Hendon Central", 51.58313, -0.22610, "Northern", 3],
  ["Heron Quays", 51.50326, -0.02144, "DLR", 2],
  ["High Barnet", 51.65093, -0.19482, "Northern", 5],
  ["High Street Kensington", 51.50094, -0.19266, "Circle, District", 1],
  ["Highbury & Islington", 51.54700, -0.10375, "Victoria", 2],
  ["Highgate", 51.57764, -0.14578, "Northern", 3],
  ["Hillingdon", 51.55373, -0.45020, "Metropolitan, Piccadilly", 6],
  ["Holborn", 51.51762, -0.12018, "Central, Piccadilly", 1],
  ["Holland Park", 51.50728, -0.20564, "Central", 2],
  ["Holloway Road", 51.55273, -0.11301, "Piccadilly", 2],
  ["Hornchurch", 51.55401, 0.21854, "District", 6],
  ["Hounslow Central", 51.47131, -0.36641, "Piccadilly", 4],
  ["Hounslow East", 51.47323, -0.35631, "Piccadilly", 4],
  ["Hounslow West", 51.47353, -0.38645, "Piccadilly", 5],
  ["Hyde Park Corner", 51.50296, -0.15256, "Piccadilly", 1],
  ["Ickenham", 51.56197, -0.44206, "Metropolitan, Piccadilly", 6],
  ["Ilford", 51.55905, 0.06992, "Elizabeth", 4],
  ["Island Gardens", 51.48792, -0.01029, "DLR", 2],
  ["Iver", 51.50864, -0.50654, "Elizabeth", null],
  ["Kennington", 51.48882, -0.10555, "Northern", 2],
  ["Kensal Green", 51.53057, -0.22460, "Bakerloo", 2],
  ["Kensington (Olympia)", 51.49753, -0.20959, "District", 2],
  ["Kentish Town", 51.55031, -0.14074, "Northern", 2],
  ["Kenton", 51.58153, -0.31662, "Bakerloo", 4],
  ["Kew Gardens", 51.47708, -0.28501, "District", 3],
  ["Kilburn", 51.54702, -0.20529, "Jubilee", 2],
  ["Kilburn Park", 51.53515, -0.19413, "Bakerloo", 2],
  ["King George V", 51.50195, 0.06216, "DLR", 3],
  ["King's Cross St. Pancras", 51.53060, -0.12294, "Circle, Hammersmith & City, Metropolitan, Northern, Piccadilly, Victoria", 1],
  ["Kingsbury", 51.58472, -0.27862, "Jubilee", 4],
  ["Knightsbridge", 51.50161, -0.16059, "Piccadilly", 1],
  ["Ladbroke Grove", 51.51727, -0.21094, "Circle, Hammersmith & City", 2],
  ["Lambeth North", 51.49889, -0.11229, "Bakerloo", 1],
  ["Lancaster Gate", 51.51187, -0.17514, "Central", 1],
  ["Langdon Park", 51.51514, -0.01411, "DLR", 2],
  ["Langley", 51.50795, -0.54121, "Elizabeth", null],
  ["Latimer Road", 51.51340, -0.21791, "Circle, Hammersmith & City", 2],
  ["Leicester Square", 51.51122, -0.12849, "Northern, Piccadilly", 1],
  ["Lewisham", 51.46471, -0.01291, "DLR", 2],
  ["Leyton", 51.55663, -0.00541, "Central", 3],
  ["Leytonstone", 51.56858, 0.00840, "Central", 3],
  ["Limehouse", 51.51237, -0.03969, "DLR", 2],
  ["Liverpool Street", 51.51730, -0.08321, "Central, Circle, Elizabeth, Hammersmith & City, Metropolitan", 1],
  ["London Bridge", 51.50502, -0.08963, "Jubilee, Northern", 1],
  ["London City Airport", 51.50368, 0.04801, "DLR", 3],
  ["Loughton", 51.64136, 0.05525, "Central", 6],
  ["Maida Vale", 51.52980, -0.18577, "Bakerloo", 2],
  ["Maidenhead", 51.51832, -0.72276, "Elizabeth", null],
  ["Manor House", 51.57049, -0.09619, "Piccadilly", 2],
  ["Manor Park", 51.55245, 0.04578, "Elizabeth", 3],
  ["Mansion House", 51.51191, -0.09375, "Circle, District", 1],
  ["Marble Arch", 51.51354, -0.15784, "Central", 1],
  ["Maryland", 51.54620, 0.00623, "Elizabeth", 3],
  ["Marylebone", 51.52228, -0.16322, "Bakerloo", 1],
  ["Mile End", 51.52536, -0.03344, "Central, District, Hammersmith & City", 2],
  ["Mill Hill East", 51.60825, -0.21015, "Northern", 4],
  ["Monument", 51.51065, -0.08610, "Circle, District", 1],
  ["Moor Park", 51.62977, -0.43223, "Metropolitan", 6],
  ["Moorgate", 51.51812, -0.08829, "Circle, Hammersmith & City, Metropolitan, Northern", 1],
  ["Morden", 51.40235, -0.19473, "Northern", 4],
  ["Mornington Crescent", 51.53436, -0.13854, "Northern", 2],
  ["Mudchute", 51.49170, -0.01495, "DLR", 2],
  ["Neasden", 51.55417, -0.24996, "Jubilee", 3],
  ["Newbury Park", 51.57560, 0.08995, "Central", 4],
  ["Nine Elms", 51.48015, -0.12862, "Northern", 2],
  ["North Acton", 51.52360, -0.25971, "Central", 2],
  ["North Ealing", 51.51769, -0.28854, "Piccadilly", 3],
  ["North Greenwich", 51.50009, 0.00388, "Jubilee", 2],
  ["North Harrow", 51.58500, -0.36280, "Metropolitan", 5],
  ["North Wembley", 51.56241, -0.30387, "Bakerloo", 4],
  ["Northfields", 51.49960, -0.31316, "Piccadilly", 3],
  ["Northolt", 51.54839, -0.36907, "Central", 5],
  ["Northwick Park", 51.57849, -0.31778, "Metropolitan", 4],
  ["Northwood", 51.61079, -0.42373, "Metropolitan", 6],
  ["Northwood Hills", 51.60036, -0.40896, "Metropolitan", 6],
  ["Notting Hill Gate", 51.50920, -0.19609, "Central, Circle, District", 1],
  ["Oakwood", 51.64738, -0.13149, "Piccadilly", 5],
  ["Old Street", 51.52563, -0.08754, "Northern", 1],
  ["Osterley", 51.48112, -0.35230, "Piccadilly", 4],
  ["Oval", 51.48183, -0.11237, "Northern", 2],
  ["Oxford Circus", 51.51531, -0.14208, "Bakerloo, Central, Victoria", 1],
  ["Paddington", 51.51595, -0.17449, "Bakerloo, Circle, District, Elizabeth, Hammersmith & City", 1],
  ["Park Royal", 51.52652, -0.28396, "Piccadilly", 3],
  ["Parsons Green", 51.47530, -0.20109, "District", 2],
  ["Perivale", 51.53674, -0.32358, "Central", 4],
  ["Piccadilly Circus", 51.50996, -0.13344, "Bakerloo, Piccadilly", 1],
  ["Pimlico", 51.48889, -0.13295, "Victoria", 1],
  ["Pinner", 51.59271, -0.38081, "Metropolitan", 5],
  ["Plaistow", 51.53116, 0.01657, "District, Hammersmith & City", 3],
  ["Pontoon Dock", 51.50221, 0.03270, "DLR", 3],
  ["Poplar", 51.50784, -0.01748, "DLR", 2],
  ["Preston Road", 51.57207, -0.29514, "Metropolitan", 4],
  ["Prince Regent", 51.50949, 0.03362, "DLR", 3],
  ["Pudding Mill Lane", 51.53384, -0.01352, "DLR", 2],
  ["Putney Bridge", 51.46834, -0.20882, "District", 2],
  ["Queen's Park", 51.53399, -0.20551, "Bakerloo", 2],
  ["Queensbury", 51.59417, -0.28619, "Jubilee", 4],
  ["Queensway", 51.51050, -0.18723, "Central", 1],
  ["Ravenscourt Park", 51.49412, -0.23580, "District", 2],
  ["Rayners Lane", 51.57519, -0.37128, "Metropolitan, Piccadilly", 5],
  ["Reading", 51.45924, -0.97291, "Elizabeth", null],
  ["Redbridge", 51.57636, 0.04541, "Central", 4],
  ["Regent's Park", 51.52345, -0.14650, "Bakerloo", 1],
  ["Richmond", 51.46333, -0.30118, "District", 4],
  ["Rickmansworth", 51.64018, -0.47358, "Metropolitan", 7],
  ["Roding Valley", 51.61711, 0.04388, "Central", 4],
  ["Romford", 51.57491, 0.18342, "Elizabeth", 6],
  ["Royal Albert", 51.50834, 0.04566, "DLR", 3],
  ["Royal Oak", 51.51906, -0.18799, "Circle, Hammersmith & City", 2],
  ["Royal Victoria", 51.50917, 0.01793, "DLR", 3],
  ["Ruislip", 51.57137, -0.42163, "Metropolitan, Piccadilly", 6],
  ["Ruislip Gardens", 51.56074, -0.41059, "Central", 5],
  ["Ruislip Manor", 51.57331, -0.41239, "Metropolitan, Piccadilly", 6],
  ["Russell Square", 51.52315, -0.12420, "Piccadilly", 1],
  ["Seven Kings", 51.56386, 0.09710, "Elizabeth", 4],
  ["Seven Sisters", 51.58360, -0.07248, "Victoria", 3],
  ["Shadwell", 51.51175, -0.05620, "DLR", 2],
  ["Shenfield", 51.63114, 0.33061, "Elizabeth", 12],
  ["Shepherd's Bush", 51.50445, -0.21800, "Central", 2],
  ["Shepherd's Bush Market", 51.50580, -0.22638, "Circle, Hammersmith & City", 2],
  ["Sloane Square", 51.49235, -0.15653, "Circle, District", 1],
  ["Slough", 51.51237, -0.59239, "Elizabeth", null],
  ["Snaresbrook", 51.58073, 0.02151, "Central", 4],
  ["South Ealing", 51.50103, -0.30710, "Piccadilly", 3],
  ["South Harrow", 51.56466, -0.35221, "Piccadilly", 5],
  ["South Kensington", 51.49404, -0.17290, "Circle, District, Piccadilly", 1],
  ["South Kenton", 51.57025, -0.30840, "Bakerloo", 4],
  ["South Quay", 51.50001, -0.01619, "DLR", 2],
  ["South Ruislip", 51.55703, -0.39929, "Central", 5],
  ["South Wimbledon", 51.41533, -0.19214, "Northern", 3],
  ["South Woodford", 51.59193, 0.02739, "Central", 4],
  ["Southall", 51.50619, -0.37743, "Elizabeth", 4],
  ["Southfields", 51.44553, -0.20671, "District", 3],
  ["Southgate", 51.63233, -0.12781, "Piccadilly", 4],
  ["Southwark", 51.50408, -0.10515, "Jubilee", 1],
  ["St. James's Park", 51.49961, -0.13354, "Circle, District", 1],
  ["St. John's Wood", 51.53483, -0.17405, "Jubilee", 2],
  ["St. Paul's", 51.51492, -0.09748, "Central", 1],
  ["Stamford Brook", 51.49494, -0.24583, "District", 2],
  ["Stanmore", 51.61939, -0.30302, "Jubilee", 5],
  ["Star Lane", 51.52056, 0.00417, "DLR", 2],
  ["Stepney Green", 51.52171, -0.04673, "District, Hammersmith & City", 2],
  ["Stockwell", 51.47218, -0.12250, "Northern, Victoria", 2],
  ["Stonebridge Park", 51.54388, -0.27570, "Bakerloo", 3],
  ["Stratford", 51.54149, -0.00388, "Central, DLR, Elizabeth, Jubilee", 2],
  ["Stratford (DLR 1)", 51.54033, -0.00486, "DLR", 2],
  ["Stratford High Street", 51.53770, -0.00034, "DLR", 2],
  ["Stratford International", 51.54576, -0.00886, "DLR", 2],
  ["Sudbury Hill", 51.55699, -0.33668, "Piccadilly", 4],
  ["Sudbury Town", 51.55085, -0.31580, "Piccadilly", 4],
  ["Swiss Cottage", 51.54334, -0.17466, "Jubilee", 2],
  ["Taplow", 51.52346, -0.68168, "Elizabeth", null],
  ["Temple", 51.51106, -0.11375, "Circle, District", 1],
  ["Theydon Bois", 51.67174, 0.10321, "Central", 6],
  ["Tooting Bec", 51.43560, -0.15965, "Northern", 3],
  ["Tooting Broadway", 51.42775, -0.16819, "Northern", 3],
  ["Tottenham Court Road", 51.51647, -0.13052, "Central, Elizabeth, Northern", 1],
  ["Tottenham Hale", 51.58843, -0.05987, "Victoria", 3],
  ["Totteridge & Whetstone", 51.63037, -0.17915, "Northern", 4],
  ["Tower Gateway", 51.51062, -0.07441, "DLR", 1],
  ["Tower Hill", 51.50981, -0.07775, "Circle, District", 1],
  ["Tufnell Park", 51.55681, -0.13843, "Northern", 2],
  ["Turnham Green", 51.49514, -0.25453, "District, Piccadilly", 2],
  ["Turnpike Lane", 51.59035, -0.10285, "Piccadilly", 3],
  ["Twyford", 51.47512, -0.86374, "Elizabeth", null],
  ["Upminster", 51.55901, 0.25302, "District", 6],
  ["Upminster Bridge", 51.55833, 0.23469, "District", 6],
  ["Upney", 51.53827, 0.09973, "District", 4],
  ["Upton Park", 51.53522, 0.03441, "District, Hammersmith & City", 3],
  ["Uxbridge", 51.54643, -0.47841, "Metropolitan, Piccadilly", 6],
  ["Vauxhall", 51.48497, -0.12308, "Victoria", 1],
  ["Victoria", 51.49636, -0.14323, "Circle, District, Victoria", 1],
  ["Walthamstow Central", 51.58390, -0.02010, "Victoria", 3],
  ["Wanstead", 51.57567, 0.02862, "Central", 4],
  ["Warren Street", 51.52465, -0.13810, "Northern, Victoria", 1],
  ["Warwick Avenue", 51.52330, -0.18401, "Bakerloo", 2],
  ["Waterloo", 51.50306, -0.11436, "Bakerloo, Jubilee, Northern, Waterloo & City", 1],
  ["Watford", 51.65737, -0.41737, "Metropolitan", 7],
  ["Wembley Central", 51.55140, -0.29588, "Bakerloo", 4],
  ["Wembley Park", 51.56377, -0.28004, "Jubilee, Metropolitan", 4],
  ["West Acton", 51.51820, -0.28061, "Central", 3],
  ["West Brompton", 51.48703, -0.19549, "District", 2],
  ["West Drayton", 51.50981, -0.47190, "Elizabeth", 6],
  ["West Ealing", 51.51351, -0.32047, "Elizabeth", 3],
  ["West Finchley", 51.60949, -0.18830, "Northern", 4],
  ["West Ham", 51.52834, 0.00440, "District, Hammersmith & City, Jubilee", 2],
  ["West Ham (DLR)", 51.52800, 0.00500, "DLR", 2],
  ["West Hampstead", 51.54686, -0.19080, "Jubilee", 2],
  ["West Harrow", 51.57939, -0.35377, "Metropolitan", 5],
  ["West India Quay", 51.50690, -0.02040, "DLR", 2],
  ["West Kensington", 51.49070, -0.20598, "District", 2],
  ["West Ruislip", 51.56963, -0.43766, "Central", 6],
  ["West Silvertown", 51.50293, 0.02213, "DLR", 3],
  ["Westbourne Park", 51.52095, -0.20151, "Circle, Hammersmith & City", 2],
  ["Westferry", 51.50945, -0.02674, "DLR", 2],
  ["Westminster", 51.50088, -0.12596, "Circle, District, Jubilee", 1],
  ["White City", 51.51207, -0.22439, "Central", 2],
  ["Whitechapel", 51.51960, -0.06100, "District, Elizabeth, Hammersmith & City", 2],
  ["Willesden Green", 51.54933, -0.22185, "Jubilee", 2],
  ["Willesden Junction", 51.53225, -0.24318, "Bakerloo", 2],
  ["Wimbledon", 51.42164, -0.20616, "District", 3],
  ["Wimbledon Park", 51.43446, -0.19963, "District", 3],
  ["Wood Green", 51.59742, -0.10976, "Piccadilly", 3],
  ["Wood Lane", 51.51007, -0.22371, "Circle, Hammersmith & City", 2],
  ["Woodford", 51.60665, 0.03386, "Central", 4],
  ["Woodside Park", 51.61779, -0.18562, "Northern", 4],
  ["Woolwich", 51.49179, 0.07081, "Elizabeth", 4],
  ["Woolwich Arsenal", 51.49030, 0.06938, "DLR", 4]
];


/* -------------------------------------------------------------
   Official line colours, for the coloured dots in the search list
   ------------------------------------------------------------- */
const LINE_COLOURS = {
  "Bakerloo": "#B36305", "Central": "#E32017", "Circle": "#FFD300", "District": "#00782A",
  "Hammersmith & City": "#F3A9BB", "Jubilee": "#A0A5A9", "Metropolitan": "#9B0056", "Northern": "#000000",
  "Piccadilly": "#003688", "Victoria": "#0098D4", "Waterloo & City": "#95CDBA",
  "Elizabeth": "#6950A1", "DLR": "#00A4A7"
};


/* -------------------------------------------------------------
   Cars used by Uber, Bolt and local taxis.
   PRICE = base + perMile × miles + perMin × minutes + airportFee
   range = how much higher the real price can be (surge, traffic)
   All prices are rough estimates for planning only.
   ------------------------------------------------------------- */
const CARS = [
  { id: "uberx",   name: "Uber (UberX)",           icon: "🚗", example: "Hybrid saloon, e.g. Toyota Prius",  seats: 4, boot: 410,
    base: 2.5, perMile: 1.45, perMin: 0.28, airportFee: 5, range: 0.3, wait: 8,
    note: "Book in the Uber app. Choose UberXL if you have lots of bags." },
  { id: "uberxl",  name: "Uber (UberXL)",          icon: "🚙", example: "People carrier / MPV",              seats: 6, boot: 850,
    base: 3.5, perMile: 2.10, perMin: 0.40, airportFee: 5, range: 0.3, wait: 12,
    note: "Bigger car for groups or lots of luggage." },
  { id: "bolt",    name: "Bolt",                   icon: "🚗", example: "Hybrid saloon or hatchback",        seats: 4, boot: 400,
    base: 2.5, perMile: 1.30, perMin: 0.25, airportFee: 5, range: 0.35, wait: 8,
    note: "Book in the Bolt app. Often slightly cheaper than Uber." },
  { id: "boltxl",  name: "Bolt XL",                icon: "🚙", example: "People carrier / MPV",              seats: 6, boot: 850,
    base: 3.5, perMile: 1.90, perMin: 0.36, airportFee: 5, range: 0.35, wait: 12,
    note: "Larger Bolt car for groups and luggage." },
  { id: "cab",     name: "Black cab (local taxi)", icon: "🚕", example: "London-style taxi, bags go inside", seats: 5, boot: 600,
    base: 3.8, perMile: 3.20, perMin: 0.55, airportFee: 0, range: 0.15, wait: 5,
    note: "Find at the official taxi rank. Metered fare, usually the most expensive." },
  { id: "minicab", name: "Local minicab",          icon: "🚘", example: "Saloon or estate car",              seats: 4, boot: 500,
    base: 5.0, perMile: 2.30, perMin: 0,    airportFee: 0, range: 0.1, wait: 0,
    note: "Pre-book with a licensed local firm for a fixed price. Ask for an estate car for big cases." }
];


/* -------------------------------------------------------------
   Public transport. Prices are PER PERSON.
   Options with "tfl" use the real TfL fare tables below.
   ------------------------------------------------------------- */
const PUBLIC = [
  { id: "bus",   name: "Bus / coach",                 icon: "🚌", base: 4, perMile: 0.12, speed: 22, wait: 20, walk: 15,
    note: "Cheapest. Coaches have a luggage hold, local buses don't.", nightOk: true },
  { id: "tube",  name: "Tube (Piccadilly line) / DLR", icon: "🚇", tfl: "tube", speed: 18, wait: 6, walk: 12,
    note: "Pay with contactless or Oyster. Some stations have lots of stairs, so check step-free access.", needsTube: true, nightOk: false },
  { id: "elizabeth", name: "Elizabeth line", icon: "🟣", tfl: "elizabeth", speed: 30, wait: 6, walk: 12,
    note: "Faster than the tube, with step-free stations and room for luggage. Pay with contactless or Oyster.", needsTube: true, onlyFrom: "LHR", nightOk: false },
  { id: "train", name: "Train",                       icon: "🚆", base: 6, perMile: 0.40, speed: 38, wait: 15, walk: 15,
    note: "Fast and has luggage racks. Book ahead for cheaper tickets; Railcards save money.", nightOk: false }
];


/* -------------------------------------------------------------
   TfL fares – adult pay-as-you-go (contactless / Oyster), from 1 March 2026.
   Source: Mayor of London decision MD3464 and TfL.
   Update these when fares change (usually every March).
   ------------------------------------------------------------- */
const TFL = {
  // Journeys that include Zone 1:  "1-6" means Zone 1 to Zone 6
  withZone1: {
    1: { peak: 3.10, off: 3.00 },
    2: { peak: 3.60, off: 3.10 },
    3: { peak: 3.90, off: 3.30 },
    4: { peak: 4.80, off: 3.60 },
    5: { peak: 5.30, off: 3.80 },
    6: { peak: 5.90, off: 4.00 }
  },
  // Journeys that avoid Zone 1, by how many zones you travel through
  withoutZone1: {
    1: { peak: 2.30, off: 2.20 },
    2: { peak: 2.50, off: 2.30 },
    3: { peak: 3.20, off: 2.40 },
    4: { peak: 3.40, off: 2.50 },
    5: { peak: 3.80, off: 2.60 }
  },
  // Elizabeth line from Heathrow to Zone 1 – same price all day since March 2026
  elizabethHeathrow: 15.50
};


/* -------------------------------------------------------------
   Which TfL fare zone each airport is in
   ------------------------------------------------------------- */
const AIRPORT_ZONE = { LHR: 6, LCY: 3 };


/* -------------------------------------------------------------
   Each person can comfortably wheel about 2 suitcases on public transport
   ------------------------------------------------------------- */
const CASES_PER_PERSON = 2;


// Add every tube / Elizabeth line / DLR station to the searchable list of places
TUBE_STATIONS.forEach(([name, lat, lng, lines, zone]) => {
  const label = / Station$/.test(name) ? name : name + " Station";   // avoid "Power Station Station"
  STUDENT_PLACES.push({ name: label, area: lines, type: "tube", lat, lng, zone, alias: name + " underground tube" });
});


/* =============================================================
   2. HELPER FUNCTIONS (plain JavaScript, no React)
   ============================================================= */

// £5.90 stays "£5.90"; bigger or whole amounts are rounded, e.g. "£46"
const rawMoney = n => (n < 20 && Math.abs(n - Math.round(n)) > 0.004) ? "£" + n.toFixed(2) : "£" + Math.round(n);
// Every price starts with "~" to show it's approximate, e.g. "~£46"
const money = n => "~" + rawMoney(n);

const toNum = v => Math.max(0, Number(v) || 0);

// Straight-line distance between two GPS points, in miles
function milesBetween(lat1, lng1, lat2, lng2) {
  const R = 3958.8, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function getLuggage(bags) {
  const counts = { large: toNum(bags.large), medium: toNum(bags.medium), cabin: toNum(bags.cabin), backpack: toNum(bags.backpack) };
  let litres = toNum(bags.extra);
  let items = toNum(bags.extra) > 0 ? 1 : 0;
  for (const type in counts) {
    litres += counts[type] * BAG_LITRES[type];
    items += counts[type];
  }
  return { counts, litres, items, wheeled: counts.large + counts.medium };
}

// How well does the luggage fit in one car?
function carFit(car, litres, passengers) {
  const spareSeats = Math.max(0, car.seats - passengers);
  const usable = car.boot * 0.75 + spareSeats * 50;  // empty seats hold ~50 L of soft bags
  const carsBySeats = Math.ceil(passengers / car.seats);
  const carsByBags = Math.max(1, Math.ceil(litres / (car.boot * 0.75)));
  const carsNeeded = usable >= litres && passengers <= car.seats ? 1 : Math.max(carsBySeats, carsByBags);
  return { usable, fill: litres / usable, carsNeeded };
}

function formatTime(mins) {
  mins = Math.max(5, Math.round(mins / 5) * 5);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Add minutes to a "HH:MM" time and return the new "HH:MM"
function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + Math.round(mins)) % (24 * 60);
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}

// Rush hour makes cars slower
function trafficInfo(hhmm, day) {
  const hour = Number(hhmm.split(":")[0]);
  if (hour >= 23 || hour < 5) return { factor: 1.0, label: "Night time – quiet roads", night: true };
  if (day === "weekday" && ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 19)))
    return { factor: 1.5, label: "Rush hour – expect heavy traffic", night: false };
  if (day === "weekend") return { factor: 1.15, label: "Weekend – light to normal traffic", night: false };
  return { factor: 1.25, label: "Normal daytime traffic", night: false };
}

/* ---------- TfL fares ---------- */

// Rough fare zone of a place, from its distance to central London (Charing Cross)
function guessZone(lat, lng) {
  const d = milesBetween(lat, lng, 51.5073, -0.1276);
  if (d < 2)    return 1;
  if (d < 4.8)  return 2;
  if (d < 7.5)  return 3;
  if (d < 9.5)  return 4;
  if (d < 12)   return 5;
  return 6;
}

// Peak = Monday–Friday 06:30–09:30 and 16:00–19:00.
// TfL charges journeys INTO Zone 1 in the evening peak at the off-peak price.
function isPeak(hhmm, day, intoZone1) {
  if (day !== "weekday") return false;
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m;
  if (t >= 390 && t < 570) return true;          // 06:30–09:30
  if (t >= 960 && t < 1140) return !intoZone1;   // 16:00–19:00
  return false;
}

// Price of ONE adult single on the Tube / DLR / Elizabeth line
function tflFare(option, airport, dest, hhmm, day) {
  const from = AIRPORT_ZONE[airport.code];
  if (!from) return null;   // this airport isn't on the Tube / Elizabeth line
  // Tube stations know their real zone; other addresses are estimated from distance
  const to = dest ? Math.min(6, dest.zone || guessZone(dest.lat, dest.lng)) : 1;

  if (option.tfl === "elizabeth") {
    return { fare: TFL.elizabethHeathrow, zones: `Heathrow → Zone ${to}`, peak: false };
  }

  // Does the journey go through Zone 1?
  const viaZone1 = to === 1 || (airport.code === "LHR" && dest && dest.lng > -0.10)
                            || (airport.code === "LCY" && dest && dest.lng < -0.02);
  const peak = isPeak(hhmm, day, to === 1);
  if (viaZone1) {
    const furthest = Math.max(from, to);
    return { fare: TFL.withZone1[furthest][peak ? "peak" : "off"], zones: `Zones 1–${furthest}`, peak };
  }
  const count = Math.min(5, Math.abs(from - to) + 1);
  return {
    fare: TFL.withoutZone1[count][peak ? "peak" : "off"],
    zones: from === to ? `Zone ${from}` : `Zones ${Math.min(from, to)}–${Math.max(from, to)}`,
    peak
  };
}

/* ---------- Searching for places ---------- */

// Make text easy to compare: "King's Cross St. Pancras" → "kings cross st pancras"
function simplify(text) {
  return text.toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ").trim();
}

// Search the built-in database (universities, stations, every tube station)
function searchLocal(text) {
  const SHORT = { rd: "road", sq: "square", ave: "avenue", pk: "park", grn: "green", xing: "cross", univ: "university", uni: "university" };
  const words = simplify(text).split(" ")
    .map(w => SHORT[w] || w)
    .filter(w => w && !["station", "tube", "underground", "stn", "the"].includes(w));
  if (!words.length || words.join("").length < 2) return [];
  const query = words.join(" ");

  const matches = [];
  STUDENT_PLACES.forEach(p => {
    const name = simplify(p.name.replace(/ Station$/, ""));
    const haystack = simplify(p.name + " " + p.area + " " + (p.alias || ""));
    if (!words.every(w => haystack.includes(w))) return;
    let score = 3;                                   // exact > starts with > word starts with > anywhere
    if (name === query) score = 0;
    else if (name.startsWith(query)) score = 1;
    else if ((" " + name).includes(" " + words[0])) score = 2;
    matches.push({ p, score });
  });
  matches.sort((a, b) => a.score - b.score || a.p.name.length - b.p.name.length);

  return matches.slice(0, 6).map(({ p }) => ({
    lat: p.lat, lng: p.lng, label: p.name, zone: p.zone || null,
    lines: p.type === "tube" ? p.area : null,
    sub: p.type === "tube" ? null : p.area,
    icon: p.type === "uni" ? "🎓" : p.type === "tube" ? "🚇" : "🚉",
    group: "Stations & universities"
  }));
}

// UK postcodes, e.g. "WC1E 6BT" or just "SW7"
const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;
const OUTCODE = /^\s*([A-Z]{1,2}\d[A-Z\d]?)\s*$/i;

async function searchPostcode(text) {
  let m = text.match(POSTCODE);
  if (m) {
    const res = await fetch("https://api.postcodes.io/postcodes/" + (m[1] + m[2]).toUpperCase());
    const data = await res.json();
    if (data.status === 200) {
      const r = data.result;
      return { lat: r.latitude, lng: r.longitude, label: `${r.postcode}, ${r.admin_district}` };
    }
  }
  m = text.match(OUTCODE);
  if (m) {
    const res = await fetch("https://api.postcodes.io/outcodes/" + m[1].toUpperCase());
    const data = await res.json();
    if (data.status === 200) {
      const r = data.result;
      return { lat: r.latitude, lng: r.longitude, label: `${r.outcode}, ${(r.admin_district || [])[0] || "UK"}` };
    }
  }
  return null;
}

// Place names and addresses in the UK (Photon, free OpenStreetMap search)
async function searchPhoton(text, limit = 6) {
  const url = `https://photon.komoot.io/api/?limit=${limit}&lang=en&bbox=-8.7,49.8,1.9,60.9&q=` + encodeURIComponent(text);
  const res = await fetch(url);
  const data = await res.json();
  return (data.features || [])
    .filter(f => !f.properties.countrycode || f.properties.countrycode === "GB")
    .map(f => {
      const p = f.properties;
      const street = p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street;
      const main = p.name || street || p.city;
      const city = (p.city || p.county || "").trim();
      const sub = [p.name ? street : null, p.postcode, city].filter(Boolean).join(", ");
      return main ? {
        lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0],
        label: city && city !== main ? `${main}, ${city}` : main,
        sub: sub || "United Kingdom", icon: "📍", group: "Places in the UK"
      } : null;
    })
    .filter(Boolean);
}

// OpenStreetMap's own search – used as a backup
async function searchNominatim(text) {
  const res = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gb&q=" + encodeURIComponent(text));
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.length) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon), label: data[0].display_name.split(",").slice(0, 2).join(",") };
}

// Find one place from typed text. Returns a place, or { error: "..." }
async function findPlace(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const local = searchLocal(clean)[0];
  if (local) return local;

  let failures = 0;
  const tries = [
    () => searchPostcode(clean),
    async () => (await searchPhoton(clean, 1))[0] || null,
    () => searchNominatim(clean),
    async () => (await searchPhoton(clean + ", UK", 1))[0] || null
  ];
  for (const attempt of tries) {
    try { const place = await attempt(); if (place) return place; }
    catch (err) { failures++; }
  }
  if (failures >= 3) {
    return { error: window.location.protocol === "file:"
      ? "The map search is blocked because the page was opened as a file. Run your React app with npm run dev / npm start instead."
      : "We couldn't reach the map search. Check your internet connection, or type the distance in miles." };
  }
  return { error: "We couldn't find that place. Try the postcode (e.g. WC1E 6BT), or add the city (e.g. \"Imperial College, London\")." };
}

// Real road distance and driving time (OSRM, free routing service)
async function getRoadRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes.length) return null;
  return { miles: data.routes[0].distance / 1609.34, mins: data.routes[0].duration / 60 };
}

/* ---------- Work out every transport option for a route ---------- */
function calculateTrip(route, { airport, luggage, passengers, budget, leaveTime, leaveDay }) {
  const traffic = trafficInfo(leaveTime, leaveDay);
  const driveMins = route.freeFlowMins * traffic.factor;
  const lug = getLuggage(luggage);
  const miles = route.miles;
  const inLondon = route.dest ? milesBetween(route.dest.lat, route.dest.lng, 51.5074, -0.1278) < 20 : airport.tube;
  const results = [];

  // Public transport
  PUBLIC.forEach(p => {
    let available = (!p.needsTube || (airport.tube && inLondon)) && (!p.onlyFrom || p.onlyFrom === airport.code);
    const warning = available && traffic.night && !p.nightOk ? "May not run at this time of night." : "";

    let pricePP, fareInfo = null;
    if (p.tfl) {
      fareInfo = available ? tflFare(p, airport, route.dest, leaveTime, leaveDay) : null;
      if (!fareInfo) available = false;
      pricePP = fareInfo ? fareInfo.fare : 0;
    } else {
      pricePP = p.base + p.perMile * miles;
    }
    const price = pricePP * passengers;

    const casesEach = lug.wheeled / passengers;
    let ease, easeClass, fill;
    if (casesEach <= 1) { ease = "Easy with your bags"; easeClass = "good"; fill = 0.3; }
    else if (casesEach <= CASES_PER_PERSON) { ease = "Manageable"; easeClass = "warn"; fill = 0.7; }
    else { ease = "Hard with this many bags"; easeClass = "bad"; fill = 1.5; }

    results.push({
      kind: "public", ...p, available, warning, price, fareInfo,
      priceLow: price, priceHigh: fareInfo ? price : price * 1.15,
      mins: p.wait + (miles / p.speed) * 60 + p.walk,
      ease, easeClass, fill
    });
  });

  // Cars: Uber, Bolt, taxis
  CARS.forEach(c => {
    const fit = carFit(c, lug.litres, passengers);
    let oneCar = c.base + c.perMile * miles + c.perMin * driveMins + c.airportFee;
    if (c.id === "cab" && traffic.night) oneCar *= 1.2;   // night tariff
    const price = oneCar * fit.carsNeeded;
    let ease, easeClass;
    if (fit.carsNeeded > 1) { ease = `Needs ${fit.carsNeeded} cars`; easeClass = "bad"; }
    else if (fit.fill > 0.85) { ease = "Tight fit"; easeClass = "warn"; }
    else { ease = "Fits comfortably"; easeClass = "good"; }

    results.push({
      kind: "car", ...c, available: true, warning: "", price,
      priceLow: price, priceHigh: price * (1 + c.range),
      mins: c.wait + driveMins, ease, easeClass,
      fill: fit.carsNeeded > 1 ? 1.5 : fit.fill, carsNeeded: fit.carsNeeded
    });
  });

  const ok = results.filter(r => r.available);
  const byPrice = [...ok].sort((a, b) => a.price - b.price);
  return {
    airport, route, traffic, driveMins, lug, passengers, budget, miles, leaveTime, results,
    cheapest: byPrice[0],
    fastest: [...ok].sort((a, b) => a.mins - b.mins)[0],
    // Best for luggage: cheapest option where the bags fit comfortably / are easy to carry
    bestForBags: byPrice.find(r => r.easeClass === "good") || [...ok].sort((a, b) => a.fill - b.fill)[0]
  };
}

function currentTime() {
  const now = new Date();
  return {
    time: String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"),
    day: now.getDay() === 0 || now.getDay() === 6 ? "weekend" : "weekday"
  };
}


/* =============================================================
   3. SMALL DISPLAY PIECES
   ============================================================= */

// Coloured dots for each line, e.g. ● Piccadilly ● District
function LineDots({ lines }) {
  return lines.split(", ").map(l => (
    <span key={l} className="pb-line">
      <span className="pb-line-dot" style={{ background: LINE_COLOURS[l] || "#999" }} />{l}
    </span>
  ));
}

// e.g. "Zones 1–6 · off-peak · ~£4.00 each" under a tube price
function FareNote({ r }) {
  if (!r.fareInfo) return null;
  const when = r.tfl === "elizabeth" ? "same price all day" : r.fareInfo.peak ? "peak" : "off-peak";
  return <span className="pb-fare-note">{r.fareInfo.zones} · {when} · ~£{r.fareInfo.fare.toFixed(2)} each</span>;
}

function NumberField({ id, label, value, onChange, min = 0, max }) {
  return (
    <div className="pb-field">
      <label htmlFor={id}>{label}</label>
      <input type="number" id={id} min={min} max={max} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}


/* =============================================================
   4. THE PAGE
   ============================================================= */
export default function TransportPlanner() {
  const start = useMemo(currentTime, []);
  const defaultDest = useMemo(() => searchLocal("King's Cross Station")[0], []);

  // ---- Form values ----
  const [luggage, setLuggage] = useState({ large: 2, medium: 1, cabin: 1, backpack: 1, extra: 0 });
  const [passengers, setPassengers] = useState(1);
  const [budget, setBudget] = useState(60);
  const [airportCode, setAirportCode] = useState("LHR");
  const [destText, setDestText] = useState(defaultDest.label);
  const [selectedDest, setSelectedDest] = useState(defaultDest);
  const [manualMiles, setManualMiles] = useState("");
  const [leaveTime, setLeaveTime] = useState(start.time);
  const [leaveDay, setLeaveDay] = useState(start.day);

  // ---- Search suggestions ----
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // ---- Status messages + results ----
  const [gpsStatus, setGpsStatus] = useState({ text: "", type: "" });
  const [formStatus, setFormStatus] = useState("");
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const routeCache = useRef({});        // remembers routes already looked up
  const estimateRef = useRef(null);

  const airport = AIRPORTS.find(a => a.code === airportCode);
  const lug = getLuggage(luggage);
  const people = Math.max(1, toNum(passengers));
  const miles = toNum(manualMiles);
  const destChosen = selectedDest && selectedDest.label === destText;

  const setBag = type => value => setLuggage(prev => ({ ...prev, [type]: value }));

  /* ---- Look up the road route whenever the airport or destination changes ---- */
  useEffect(() => {
    if (miles > 0) {
      setRouteLoading(false);
      setRoute({ miles, freeFlowMins: miles / 30 * 60, dest: destChosen ? selectedDest : null,
                 destLabel: destText || "your destination", source: "manual" });
      return;
    }
    if (!destChosen) { setRouteLoading(false); return; }

    const key = `${airport.code}|${selectedDest.lat.toFixed(5)},${selectedDest.lng.toFixed(5)}`;
    if (routeCache.current[key]) {
      setRouteLoading(false);
      setRoute({ ...routeCache.current[key], destLabel: selectedDest.label });
      return;
    }

    let cancelled = false;
    setRouteLoading(true);
    const timer = setTimeout(async () => {
      let road = null;
      try { road = await getRoadRoute(airport, selectedDest); } catch (err) { road = null; }
      if (cancelled) return;
      const result = road
        ? { miles: road.miles, freeFlowMins: road.mins, dest: selectedDest, destLabel: selectedDest.label, source: "road" }
        : (() => {   // routing failed – estimate from straight-line distance (roads ≈ 30% longer)
            const m = Math.max(1, milesBetween(airport.lat, airport.lng, selectedDest.lat, selectedDest.lng) * 1.3);
            return { miles: m, freeFlowMins: m / 30 * 60, dest: selectedDest, destLabel: selectedDest.label, source: "estimate" };
          })();
      routeCache.current[key] = result;
      setRoute(result);
      setRouteLoading(false);
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [airport, selectedDest, destChosen, destText, miles]);

  /* ---- Prices and times update instantly when anything changes ---- */
  const trip = useMemo(() => {
    if (!route) return null;
    if (!(miles > 0) && !destChosen) return null;
    return calculateTrip(route, { airport, luggage, passengers: people, budget: toNum(budget), leaveTime: leaveTime || "12:00", leaveDay });
  }, [route, airport, luggage, people, budget, leaveTime, leaveDay, miles, destChosen]);

  /* ---- Search suggestions as the student types ---- */
  useEffect(() => {
    if (destChosen) return;   // a place is already chosen
    const text = destText.trim();
    const local = searchLocal(text);
    setSuggestions(local);
    setActiveIndex(-1);
    if (text.length < 3) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const online = [];
      try {
        if (POSTCODE.test(text) || OUTCODE.test(text)) {
          const pc = await searchPostcode(text);
          if (pc) online.push({ ...pc, sub: "Postcode", icon: "📮", group: "Places in the UK" });
        }
      } catch (err) { /* ignore */ }
      try { online.push(...await searchPhoton(text)); } catch (err) { /* ignore */ }
      if (cancelled) return;
      // Avoid showing the same place twice
      const extra = online.filter(o => !local.some(l => milesBetween(l.lat, l.lng, o.lat, o.lng) < 0.2));
      setSuggestions([...local, ...extra].slice(0, 9));
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [destText, destChosen]);

  function chooseDestination(place) {
    setSelectedDest(place);
    setDestText(place.label);
    setManualMiles("");
    setShowSuggestions(false);
    setFormStatus(`✓ Destination set: ${place.label}`);
  }

  function onDestKeyDown(e) {
    if (!showSuggestions || !suggestions.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = suggestions.length;
      setActiveIndex(i => (i + (e.key === "ArrowDown" ? 1 : -1) + n) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      chooseDestination(suggestions[activeIndex >= 0 ? activeIndex : 0]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  /* ---- GPS: find the nearest airport ---- */
  function findNearestAirport() {
    if (!navigator.geolocation) { setGpsStatus({ text: "Your browser doesn't support GPS.", type: "err" }); return; }
    setGpsStatus({ text: "Finding your location…", type: "" });
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      let nearest = AIRPORTS[0], best = Infinity;
      AIRPORTS.forEach(a => {
        const d = milesBetween(latitude, longitude, a.lat, a.lng);
        if (d < best) { best = d; nearest = a; }
      });
      setAirportCode(nearest.code);
      setGpsStatus({ text: `✓ Nearest airport: ${nearest.name} (${best.toFixed(0)} miles away)`, type: "ok" });
    }, () => {
      setGpsStatus({ text: "Couldn't get your location. Please allow location access, or pick the airport yourself.", type: "err" });
    }, { timeout: 10000 });
  }

  /* ---- "Calculate" button (and pressing Enter in the form) ---- */
  async function calculate(e) {
    if (e) e.preventDefault();
    if (!(miles > 0) && !destChosen) {
      if (!destText.trim()) { setFormStatus("Please enter where you're going, or type the distance."); return; }
      setFormStatus("Finding your destination on the map…");
      let place;
      try { place = await findPlace(destText); }
      catch (err) { place = { error: "Something went wrong with the map search. Try again, or type the distance in miles." }; }
      if (!place || place.error) { setFormStatus(place ? place.error : "We couldn't find that place."); return; }
      chooseDestination(place);
    }
    setTimeout(() => estimateRef.current && estimateRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }), 400);
  }

  /* ---- Things worked out for the display ---- */
  const sortedByPrice = trip ? [...trip.results].sort((a, b) => (b.available - a.available) || (a.price - b.price)) : [];
  const sortedByTime = trip ? [...trip.results].sort((a, b) => (b.available - a.available) || (a.mins - b.mins)) : [];
  const perPerson = r => people > 1 ? money(r.price / people) : "–";
  const priceRange = r => Math.round(r.priceHigh) > Math.round(r.priceLow) + 1 ? `~${rawMoney(r.priceLow)}–${rawMoney(r.priceHigh)}` : money(r.price);
  const sourceNote = trip && {
    road: "Driving distance and time come from real road routing (OpenStreetMap).",
    estimate: "We couldn't reach the routing service, so distance is estimated from a straight line.",
    manual: "Using the distance you typed in."
  }[trip.route.source];

  return (
    <div className="packbuddy">

      {/* ================= HERO ================= */}
      <section className="pb-hero" id="home">
        <div className="pb-container">
          <h1>Just landed with all your suitcases? Let's get you home.</h1>
          <p>PackBuddy helps international students choose the best way from the airport, based on how much luggage you have, who's travelling with you and your budget.</p>
          <a href="#plan" className="pb-btn pb-btn-light">Start planning</a>
          <div className="pb-steps-preview">
            <div>🧳 1. Tell us your luggage &amp; trip, and see the route, time &amp; price</div>
            <div>🚗 2. See what fits in each car boot</div>
          </div>
        </div>
      </section>

      {/* ================= STEP 1 ================= */}
      <section id="plan" className="pb-section">
        <div className="pb-container">
          <span className="pb-step-label">STEP 1</span>
          <h2 className="pb-section-title">Tell us about your trip</h2>
          <p className="pb-section-intro">Fill in your luggage, your group and where you're going. You can use your phone's GPS to find your nearest airport automatically.</p>

          <form className="pb-panel" onSubmit={calculate}>
            <div className="pb-form-grid">

              {/* Luggage */}
              <fieldset>
                <legend>🧳 Your luggage</legend>
                <div className="pb-row">
                  <NumberField id="pb-large" label="Large suitcases" value={luggage.large} onChange={setBag("large")} />
                  <NumberField id="pb-medium" label="Medium suitcases" value={luggage.medium} onChange={setBag("medium")} />
                </div>
                <div className="pb-row">
                  <NumberField id="pb-cabin" label="Cabin bags" value={luggage.cabin} onChange={setBag("cabin")} />
                  <NumberField id="pb-backpack" label="Backpacks" value={luggage.backpack} onChange={setBag("backpack")} />
                </div>
                <div className="pb-field">
                  <label htmlFor="pb-extra">Other bags / boxes (litres)</label>
                  <input type="number" id="pb-extra" min="0" value={luggage.extra} onChange={e => setBag("extra")(e.target.value)} />
                  <span className="pb-hint">Not sure? A shoebox is about 10 L, a moving box about 55 L.</span>
                </div>
                <div className="pb-volume-box">Total: <strong>{lug.litres} L</strong> · {lug.items} item{lug.items === 1 ? "" : "s"}</div>
              </fieldset>

              {/* Group & budget */}
              <fieldset>
                <legend>👥 Group &amp; budget</legend>
                <NumberField id="pb-passengers" label="Number of passengers" value={passengers} onChange={setPassengers} min={1} max={12} />
                <div className="pb-field">
                  <label htmlFor="pb-budget">Total budget (£)</label>
                  <input type="number" id="pb-budget" min="0" value={budget} onChange={e => setBudget(e.target.value)} />
                  <span className="pb-hint">For the whole group, not per person.</span>
                </div>
              </fieldset>

              {/* Route */}
              <fieldset>
                <legend>📍 Your route</legend>
                <div className="pb-field">
                  <label htmlFor="pb-airport">From airport</label>
                  <select id="pb-airport" value={airportCode} onChange={e => setAirportCode(e.target.value)}>
                    {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.name} ({a.code})</option>)}
                  </select>
                  <button type="button" className="pb-btn pb-btn-small pb-btn-outline" onClick={findNearestAirport} style={{ marginTop: 8 }}>📡 Use my GPS location</button>
                  <div className={`pb-gps-status ${gpsStatus.type}`}>{gpsStatus.text}</div>
                </div>

                <div className="pb-field">
                  <label htmlFor="pb-destination">Going to</label>
                  <div className="pb-autocomplete">
                    <input
                      type="text" id="pb-destination" autoComplete="off"
                      placeholder="Start typing: a university, station, street or postcode"
                      value={destText}
                      onChange={e => { setDestText(e.target.value); setShowSuggestions(true); setFormStatus(""); }}
                      onFocus={() => !destChosen && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      onKeyDown={onDestKeyDown}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="pb-suggestions">
                        {suggestions.map((s, i) => (
                          <React.Fragment key={`${s.label}-${i}`}>
                            {(i === 0 || suggestions[i - 1].group !== s.group) && <li className="pb-s-group">{s.group}</li>}
                            <li
                              className={i === activeIndex ? "active" : ""}
                              onMouseDown={e => { e.preventDefault(); chooseDestination(s); }}
                            >
                              <span className="pb-s-icon">{s.icon}</span>
                              <span>
                                <span className="pb-s-main">{s.label}</span>
                                <span className="pb-s-sub">
                                  {s.lines ? <><LineDots lines={s.lines} />{s.zone ? ` · Zone ${s.zone}` : ""}</> : s.sub}
                                </span>
                              </span>
                            </li>
                          </React.Fragment>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span className="pb-hint">Pick a station, university or address from the list as you type.</span>
                </div>

                <div className="pb-row">
                  <div className="pb-field">
                    <label htmlFor="pb-time">Leaving at</label>
                    <input type="time" id="pb-time" value={leaveTime} onChange={e => setLeaveTime(e.target.value)} />
                  </div>
                  <div className="pb-field">
                    <label htmlFor="pb-day">Day</label>
                    <select id="pb-day" value={leaveDay} onChange={e => setLeaveDay(e.target.value)}>
                      <option value="weekday">Weekday</option>
                      <option value="weekend">Weekend</option>
                    </select>
                  </div>
                </div>
                <div className="pb-field">
                  <label htmlFor="pb-miles">Distance in miles (optional)</label>
                  <input type="number" id="pb-miles" min="1" placeholder="We'll work it out for you" value={manualMiles} onChange={e => setManualMiles(e.target.value)} />
                </div>
              </fieldset>
            </div>

            <div className="pb-form-actions">
              <button type="submit" className="pb-btn pb-btn-red">⏱️ Calculate time &amp; price</button>
              <span className="pb-hint">{formStatus}</span>
            </div>

            {/* ---- Automatic route summary ---- */}
            {(trip || routeLoading) && (
              <div className="pb-route-summary" aria-live="polite">
                {!trip ? <p className="pb-rs-loading">⏳ Working out your route, journey time and prices…</p> : (
                  <>
                    <div className="pb-rs-head">
                      <div className="pb-rs-title">✈️ {trip.airport.name} → 📍 {trip.route.destLabel}</div>
                      <div className="pb-rs-meta">{trip.miles.toFixed(1)} miles · {formatTime(trip.driveMins)} by car · 🚦 {trip.traffic.label}</div>
                    </div>
                    <div className="pb-rs-highlights">
                      {[["cheap", "💷 Cheapest", trip.cheapest], ["fast", "⚡ Fastest", trip.fastest], ["bags", "🧳 Best for your luggage", trip.bestForBags]].map(([cls, label, r]) => (
                        <div key={cls} className={`pb-rs-pick ${cls}`}>
                          <div className="pb-rs-label">{label}</div>
                          <div className="pb-rs-name">{r.icon} {r.name}</div>
                          <div className="pb-rs-nums">{money(r.price)} · {formatTime(r.mins)}{people > 1 && <span>{money(r.price / people)} each</span>}</div>
                        </div>
                      ))}
                    </div>
                    <ul className="pb-rs-list">
                      {sortedByPrice.map(r => r.available ? (
                        <li key={r.id}>
                          <span>
                            {r.icon} {r.name}
                            {r.easeClass !== "good" && <> <span className={`pb-tag ${r.easeClass}`}>{r.ease}</span></>}
                            {r.price > trip.budget && <> <span className="pb-tag bad">Over budget</span></>}
                            <FareNote r={r} />
                          </span>
                          <span className="pb-rs-time">⏱️ {formatTime(r.mins)} · arrive {addMinutes(trip.leaveTime, r.mins)}</span>
                          <span className="pb-rs-price">{money(r.price)}</span>
                        </li>
                      ) : (
                        <li key={r.id} className="pb-rs-off">
                          <span>{r.icon} {r.name}</span><span className="pb-rs-time">–</span><span className="pb-rs-price pb-rs-off">Not on this route</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pb-rs-foot">
                      <span className="pb-hint">Leaving {trip.leaveTime} · {people} passenger{people === 1 ? "" : "s"} · prices are estimates for the whole group</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </form>

          {/* ---- Detailed journey table ---- */}
          {trip && (
            <div className="pb-panel pb-estimate-panel" ref={estimateRef}>
              <div className="pb-estimate-head">
                <div>
                  <h3>⏱️ Your journey estimate</h3>
                  <p className="pb-hint">{trip.airport.name} → {trip.route.destLabel}</p>
                </div>
                <div className="pb-estimate-stats">
                  <div className="pb-stat"><strong>{trip.miles.toFixed(1)} mi</strong><span>by road</span></div>
                  <div className="pb-stat"><strong>{formatTime(trip.driveMins)}</strong><span>driving time</span></div>
                  <div className="pb-stat"><strong>{money(trip.cheapest.price)}</strong><span>cheapest option</span></div>
                </div>
              </div>
              <div className="pb-table-wrap">
                <table className="pb-estimate-table">
                  <thead>
                    <tr><th>Transport</th><th>Travel time</th><th>Arrive around</th><th>Total price</th><th>Per person</th><th>Your luggage</th></tr>
                  </thead>
                  <tbody>
                    {sortedByTime.map(r => r.available ? (
                      <tr key={r.id} className={r === trip.fastest ? "fastest" : r === trip.cheapest ? "cheapest" : ""}>
                        <td>
                          <strong>{r.icon} {r.name}</strong>
                          {r.warning && <><br /><span className="pb-hint">⚠️ {r.warning}</span></>}
                          <FareNote r={r} />
                        </td>
                        <td>{formatTime(r.mins)}</td>
                        <td>{addMinutes(trip.leaveTime, r.mins)}</td>
                        <td><strong>{priceRange(r)}</strong>{r.kind === "car" && r.carsNeeded > 1 && <span className="pb-hint"> ({r.carsNeeded} cars)</span>}</td>
                        <td>{perPerson(r)}</td>
                        <td><span className={`pb-tag ${r.easeClass}`}>{r.ease}</span></td>
                      </tr>
                    ) : (
                      <tr key={r.id} className="unavailable"><td>{r.icon} {r.name}</td><td colSpan={5}>Doesn't serve this route</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="pb-hint" style={{ marginTop: 12 }}>
                🚦 <strong>{trip.traffic.label}</strong> (car times × {trip.traffic.factor}). {sourceNote} Times include waiting for the car or train.
                Prices are rough estimates; check the app or operator before you travel.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= STEP 2: CAR BOOTS ================= */}
      <section id="boots" className="pb-section">
        <div className="pb-container">
          <span className="pb-step-label">STEP 2</span>
          <h2 className="pb-section-title">Will your suitcases fit in the boot?</h2>
          <p className="pb-section-intro">If you're taking Uber, Bolt or a local taxi, here's roughly how many suitcases fit in each type of car, and whether <strong>your</strong> luggage fits.</p>
          <div className="pb-table-wrap">
            <table className="pb-boot-table">
              <thead>
                <tr><th>Ride type</th><th>Typical car</th><th>Seats</th><th>Boot space</th><th>Large cases</th><th>Medium cases</th><th>Cabin bags</th><th>Your luggage</th></tr>
              </thead>
              <tbody>
                {CARS.map(c => {
                  const usableBoot = c.boot * 0.75;
                  const fit = carFit(c, lug.litres, people);
                  const large = Math.floor(usableBoot / BAG_LITRES.large);
                  return (
                    <tr key={c.id}>
                      <td><strong>{c.icon} {c.name}</strong></td>
                      <td>{c.example}</td>
                      <td>{c.seats}</td>
                      <td>≈ {c.boot} L</td>
                      <td><span className="pb-num">{large}</span> <span className="pb-suitcases">{"🧳".repeat(Math.min(large, 8))}</span></td>
                      <td><span className="pb-num">{Math.floor(usableBoot / BAG_LITRES.medium)}</span></td>
                      <td><span className="pb-num">{Math.floor(usableBoot / BAG_LITRES.cabin)}</span></td>
                      <td>
                        {fit.carsNeeded > 1 ? <span className="pb-tag bad">Needs {fit.carsNeeded} cars</span>
                          : fit.fill > 0.85 ? <span className="pb-tag warn">Tight ({Math.round(fit.fill * 100)}%)</span>
                          : <span className="pb-tag good">Fits ({Math.round(fit.fill * 100)}%)</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="pb-hint" style={{ marginTop: 12 }}>Boot sizes are approximate and vary by car model. Suitcases are rigid, so we assume about 75% of the boot can be used. Empty seats can hold a backpack or soft bag.</p>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how" className="pb-section pb-section-alt">
        <div className="pb-container">
          <h2 className="pb-section-title">How PackBuddy works it out</h2>
          <p className="pb-section-intro">No magic, just sensible numbers you can check.</p>
          <div className="pb-how-grid">
            <div className="pb-how-card"><div>🧳</div><h3>Luggage volume</h3><p>Each bag has a typical size: large case ≈ 100 L, medium ≈ 65 L, cabin ≈ 40 L, backpack ≈ 25 L.</p></div>
            <div className="pb-how-card"><div>🚗</div><h3>Car fit</h3><p>We compare your total with each car's usable boot space plus empty seats. If it doesn't fit, we tell you how many cars you'd need.</p></div>
            <div className="pb-how-card"><div>🚇</div><h3>Public transport</h3><p>Each person can comfortably wheel about two suitcases. Tube and Elizabeth line prices use the real TfL fares.</p></div>
            <div className="pb-how-card"><div>💷</div><h3>Your budget</h3><p>We flag anything over your budget, and show the cheapest, fastest and best option for your luggage.</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}

