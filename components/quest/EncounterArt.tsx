import type { Category } from './model';

/** Original vector characters, drawn locally; no external assets or franchise marks. */
export function EncounterArt({ category }: { category: Category }) {
  const hero = category === 'Heroes';
  const scout = category === 'Side quests';
  const accent = hero ? '#a9d9c0' : scout ? '#e7be74' : '#ec9c87';
  return <svg viewBox="0 0 600 390" role="img" aria-label={hero ? 'Cloud warden with a lantern staff and a billowing cloud cloak' : scout ? 'Compass scout charting a route with a brass astrolabe' : 'Armored orbital sentinel guarding a luminous planetary core'}>
    <rect width="600" height="390" fill="#172c31" />
    <g fill="none" stroke={accent} opacity=".24">
      <circle cx="337" cy="180" r="144" /><circle cx="337" cy="180" r="119" />
      <path d="M0 288 600 112M0 110 600 300M337 0V390M0 342H600M0 52H600" />
      <ellipse cx="337" cy="180" rx="216" ry="68" transform="rotate(-25 337 180)" />
    </g>
    <g fill={accent} opacity=".75">
      {[[45,88],[112,184],[535,70],[501,286],[74,317],[446,39],[238,38],[559,204]].map(([x,y], i) => <path key={i} d={`M${x-4} ${y}h8M${x} ${y-4}v8`} stroke={accent} />)}
      <circle cx="178" cy="76" r="2" /><circle cx="474" cy="132" r="3" /><circle cx="53" cy="229" r="2" />
    </g>
    <path d="M0 366 125 320 218 348 417 308 600 344V390H0Z" fill="#102125" />
    {hero ? <g stroke="#132e30" strokeWidth="3" strokeLinejoin="round">
      <path d="M215 178Q128 204 159 262Q95 257 81 306Q80 350 157 347L410 351Q463 311 408 285Q431 236 372 228Z" fill="#bad8c4" />
      <path d="M198 240Q160 264 183 284M130 304Q185 287 204 322M345 281Q394 265 399 306" fill="none" stroke="#7fae9d" />
      <path d="M263 192 229 322 283 344 307 260 334 345 376 330 341 190Z" fill="#285658" />
      <path d="m262 190-49 44 20 45 41-33M337 188l45 42 49-29 12 23-59 50-59-28" fill="#77b7a6" />
      <path d="M257 168 281 139 324 140 348 177 324 249 269 239Z" fill="#8fc5af" />
      <path d="m289 200 16-18 17 18-17 22Z" fill="#e9d9ad" />
      <path d="M281 125v34q23 23 45-1v-35" fill="#debfa0" />
      <path d="M264 121Q263 73 306 73Q351 74 344 120l-18 8-5-25-41 27Z" fill="#e4e4c9" />
      <path d="m283 128 15 3m16-4 10-3" stroke="#132e30" />
      <path d="M269 94Q287 56 312 68L342 90l-32 5Z" fill="#72a38f" />
      <path d="M432 105v234" stroke="#dec58f" strokeWidth="7" />
      <path d="m433 56 25 37-25 42-25-42Z" fill="#bde6cd" /><path d="m433 75 9 18-9 21-9-21Z" fill="#fff1c9" stroke="none" />
      <path d="M241 319 229 342l52 4 6-15M333 331l2 17 49-3-13-18" fill="#132e30" />
      <path d="M176 211q-15-29-35-8-30-10-32 14h71" fill="#e3e7cd" stroke="none" />
    </g> : scout ? <g stroke="#243437" strokeWidth="3" strokeLinejoin="round">
      <path d="M248 150Q203 171 186 239l41 89 101-32 69 38 30-38-53-140Z" fill="#b18145" />
      <path d="m248 205-51 68-41-17-11 21 62 26 71-59M342 205l56 34 31-22 14 17-39 40-64-29" fill="#d6b273" />
      <path d="m266 243-27 96 36 10 37-73 25 61 38-10-30-98" fill="#274a4b" />
      <path d="m238 333-12 18 49 6 5-18m56-7 1 17 54 1-18-22" fill="#142a2d" />
      <path d="m252 159 56-24 46 34-13 78-77 9-29-40Z" fill="#789c8a" />
      <path d="m254 170 79 56" stroke="#ddc18a" strokeWidth="12" />
      <path d="m294 114-3 39 32 10 14-43" fill="#d9b996" />
      <path d="M268 120q-8-60 44-59l47 60-36-10-22 26Z" fill="#dcc591" />
      <path d="m297 91 14 8-9 15m-9 4 9 3" fill="none" />
      <path d="m253 81 57-48-2 44" fill="#75998a" />
      <circle cx="158" cy="243" r="42" fill="#e2bc78" /><circle cx="158" cy="243" r="31" fill="#203e41" />
      <path d="m158 216 11 27-11 27-11-27Z" fill="#e9d6ac" /><path d="m158 216v27h11" fill="#bd784a" />
      <path d="M413 187 477 171l9 46-53 9Z" fill="#eee0bb" /><path d="m425 201 16-8 10 12 17-17" fill="none" stroke="#9a7947" />
    </g> : <g stroke="#182b33" strokeWidth="3" strokeLinejoin="round">
      <ellipse cx="320" cy="162" rx="161" ry="67" transform="rotate(-32 320 162)" fill="none" stroke="#d1917e" strokeWidth="9" />
      <path d="m247 160-60 29-19 83 62 24 25-54m97-82 69 28 29 80-60 29-34-56" fill="#b87365" />
      <path d="m248 165 48-26 58 16 25 92-37 43-84-11-32-43Z" fill="#e0ad92" />
      <path d="m269 258-33 76 37 14 41-59 31 61 43-17-30-76" fill="#7e6260" />
      <path d="m232 333-15 23 59 6 4-20m64 1 2 20 62-7-22-25" fill="#c9967c" />
      <path d="m267 97 36-30 40 25 3 54-44 19-34-24Z" fill="#c4907a" />
      <path d="m260 85-22-29 43 14m57 8 36-25-22 49" fill="#b87365" />
      <path d="m278 110 51-3-11 18-30 2Z" fill="#17383e" /><path d="m287 115 31-2" stroke="#f3e7ba" />
      <circle cx="306" cy="216" r="33" fill="#233f44" /><circle cx="306" cy="216" r="22" fill="#f1c09c" />
      <ellipse cx="306" cy="216" rx="37" ry="10" transform="rotate(-25 306 216)" fill="none" stroke="#faf0cf" strokeWidth="3" />
      <path d="m181 261-14 47 54 14 13-41m165-1 7 43 56-12-15-48" fill="#d19b83" />
      <path d="m254 180-34-30-38 38 55 29m110-35 36-34 39 33-54 35" fill="#e5b49a" />
    </g>}
    <g fill="none" stroke={accent} opacity=".7"><path d="M20 40V20h40M540 20h40v40M20 330v40h40M540 370h40v-40" /><path d="M30 32h32M30 37h20" /></g>
    <text x="32" y="354" fill={accent} fontFamily="monospace" fontSize="11" letterSpacing="3">{hero ? 'THE CLOUD WARDEN' : scout ? 'THE WAYFINDER' : 'ORBITAL SENTINEL'}</text>
  </svg>;
}
