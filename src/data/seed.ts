import type { Attachment, Conversation, Message, User } from '../types'

export const STORAGE_VERSION = 2

export const USERS: User[] = [
  { id: 'u_maya', name: 'Maya Chen', handle: 'maya', initials: 'MC', hue: 168 },
  { id: 'u_jordan', name: 'Jordan Hale', handle: 'jordan', initials: 'JH', hue: 262 },
  { id: 'u_sam', name: 'Sam Okonkwo', handle: 'sam', initials: 'SO', hue: 28 },
]

export const CURRENT_USER_ID = 'u_maya'

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c_design',
    name: 'Design Squad',
    participantIds: ['u_maya', 'u_jordan', 'u_sam'],
    isGroup: true,
    hue: 168,
  },
  {
    id: 'c_weekend',
    name: 'Weekend hike',
    participantIds: ['u_maya', 'u_jordan'],
    isGroup: true,
    hue: 142,
  },
  {
    id: 'c_jordan',
    name: 'Jordan Hale',
    participantIds: ['u_maya', 'u_jordan'],
    isGroup: false,
    hue: 262,
  },
  {
    id: 'c_sam',
    name: 'Sam Okonkwo',
    participantIds: ['u_maya', 'u_sam'],
    isGroup: false,
    hue: 28,
  },
]

function minutesAgo(mins: number, now: number): number {
  return now - mins * 60_000
}

function seedShot(id: string): Attachment {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
  <rect width="320" height="200" rx="16" fill="#111b21"/>
  <rect x="16" y="16" width="288" height="40" rx="8" fill="#202c33"/>
  <circle cx="36" cy="36" r="8" fill="#00a884"/>
  <rect x="52" y="30" width="120" height="12" rx="4" fill="#8696a0"/>
  <rect x="40" y="72" width="160" height="72" rx="10" fill="#005c4b"/>
  <text x="52" y="104" fill="#e9edef" font-family="Segoe UI,sans-serif" font-size="13">Unread badge wrap</text>
  <text x="52" y="124" fill="#d1d7db" font-family="Segoe UI,sans-serif" font-size="11">375 × 812 · Safari</text>
  <rect x="216" y="72" width="88" height="28" rx="14" fill="#00a884"/>
  <text x="232" y="91" fill="#111b21" font-family="Segoe UI,sans-serif" font-size="12" font-weight="700">99+</text>
</svg>`
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return {
    id,
    name: 'composer-375.svg',
    mimeType: 'image/svg+xml',
    size: svg.length,
    kind: 'image',
    dataUrl,
  }
}

function seedChecklist(): Attachment {
  const csv = [
    'device,width,badge,notes',
    'iPhone SE,375,wraps,two pills stacked',
    'iPhone 14,390,ok,after min-width bump',
    'Pixel 7,412,ok,',
    'iPad mini,768,ok,desktop layout',
  ].join('\n')
  const dataUrl = `data:text/csv;base64,${btoa(csv)}`
  return {
    id: 'att_qa_matrix',
    name: 'qa-device-matrix.csv',
    mimeType: 'text/csv',
    size: csv.length,
    kind: 'file',
    dataUrl,
  }
}

export function buildSeedMessages(now = Date.now()): Message[] {
  const m = (
    id: string,
    conversationId: string,
    authorId: string,
    parentId: string | null,
    body: string,
    mins: number,
    attachments: Attachment[] = [],
  ): Message => ({
    id,
    conversationId,
    authorId,
    parentId,
    body,
    createdAt: minutesAgo(mins, now),
    attachments,
  })

  return [
    // Design Squad — rich nested thread under launch recap
    m(
      'm_launch',
      'c_design',
      'u_maya',
      null,
      'Quick recap from standup — launch is Thursday. Dropping a thread for remaining blockers 👇 Please keep replies nested so we can actually find them later.',
      186,
    ),
    m(
      'm_launch_tokens',
      'c_design',
      'u_jordan',
      'm_launch',
      'Blocker: dark-mode tokens still mismatch on the composer. Own bubbles look mint in light and muddy in dark.',
      180,
    ),
    m(
      'm_launch_tokens_where',
      'c_design',
      'u_maya',
      'm_launch_tokens',
      'Is that only on iOS, or desktop too?',
      178,
    ),
    m(
      'm_launch_tokens_desktop',
      'c_design',
      'u_jordan',
      'm_launch_tokens_where',
      'Desktop for sure. iOS looked fine after yesterday’s patch — at least on my 15.',
      176,
    ),
    m(
      'm_launch_tokens_safari',
      'c_design',
      'u_sam',
      'm_launch_tokens_desktop',
      'Catching it on iOS Safari 17.4 too. Capture from the 375px frame — attaching it here.',
      172,
      [seedShot('att_composer_thread')],
    ),
    m(
      'm_launch_tokens_p0',
      'c_design',
      'u_maya',
      'm_launch_tokens_safari',
      'Okay that’s P0. I’ll pair with Jordan after lunch and land a token pass before freeze.',
      168,
    ),
    m(
      'm_launch_tokens_time',
      'c_design',
      'u_jordan',
      'm_launch_tokens_p0',
      'Free at 1:30. I’ll pull a before/after on the composer + thread panel.',
      165,
    ),
    m(
      'm_launch_badge',
      'c_design',
      'u_sam',
      'm_launch_tokens',
      'Also the unread badge wraps on 375px. Looks like two pills stacked.',
      170,
    ),
    m(
      'm_launch_badge_fix',
      'c_design',
      'u_maya',
      'm_launch_badge',
      'I’ll bump min-width and cap it at 99+. Can you QA at 375 and 390?',
      164,
    ),
    m(
      'm_launch_badge_ok',
      'c_design',
      'u_sam',
      'm_launch_badge_fix',
      'Yep — matrix is attached. Adding it to the device list now.',
      160,
      [seedChecklist()],
    ),
    m(
      'm_launch_legal',
      'c_design',
      'u_maya',
      'm_launch',
      'Legal still needs the privacy blurb in the empty-state of new threads.',
      158,
    ),
    m(
      'm_launch_legal_draft',
      'c_design',
      'u_jordan',
      'm_launch_legal',
      'Draft is in Notion. Want me to paste it here so we can line-edit in-thread?',
      154,
    ),
    m(
      'm_launch_legal_yes',
      'c_design',
      'u_maya',
      'm_launch_legal_draft',
      'Please — then we never have to leave chat.',
      152,
    ),
    m(
      'm_launch_legal_copy',
      'c_design',
      'u_jordan',
      'm_launch_legal_yes',
      '“Messages in a thread stay on this device unless you export a chat. We don’t sell conversation data. Cookies are strictly necessary for keeping you signed in.”',
      149,
    ),
    m(
      'm_launch_legal_edit',
      'c_design',
      'u_maya',
      'm_launch_legal_copy',
      'Looks good except the cookie sentence. Drop “strictly necessary” — policy page doesn’t use that.',
      146,
    ),
    m(
      'm_launch_legal_plus1',
      'c_design',
      'u_sam',
      'm_launch_legal_edit',
      '+1, matches the policy page. I’ll swap the string after the token pass.',
      140,
    ),
    m(
      'm_changelog',
      'c_design',
      'u_jordan',
      null,
      'I can own changelog copy if someone else grabs screenshots.',
      92,
    ),
    m(
      'm_shots',
      'c_design',
      'u_sam',
      null,
      'Screenshots are in Figma — dropping the 375 capture here so we don’t hunt for it.',
      8,
      [seedShot('att_composer_chat')],
    ),
    m(
      'm_freeze',
      'c_design',
      'u_maya',
      null,
      'Code freeze is 6pm tomorrow. Anything not in the thread above is out of scope 💚',
      18,
    ),

    // Weekend hike
    m(
      'm_hike1',
      'c_weekend',
      'u_jordan',
      null,
      'Weather looks clear Saturday. Still on for Raven’s Ridge?',
      2400,
    ),
    m(
      'm_hike2',
      'c_weekend',
      'u_maya',
      null,
      'Yes! Leaving at 7 so we beat the lot. I’ll bring the thermos.',
      2320,
    ),
    m(
      'm_hike3',
      'c_weekend',
      'u_jordan',
      null,
      'Perfect. Pack extra layers — summit’s windy even in September.',
      40,
    ),
    m(
      'm_hike3_a',
      'c_weekend',
      'u_maya',
      'm_hike3',
      'Windbreaker + fleece. Do you still have the paper map or are we all-in on AllTrails?',
      36,
    ),
    m(
      'm_hike3_b',
      'c_weekend',
      'u_jordan',
      'm_hike3_a',
      'Both. Service dies after the second switchback.',
      32,
    ),

    // DM Jordan
    m(
      'm_j1',
      'c_jordan',
      'u_jordan',
      null,
      'Did you see Sam’s Safari note? I thought we closed that.',
      210,
    ),
    m(
      'm_j2',
      'c_jordan',
      'u_maya',
      null,
      'We closed the WebKit input zoom. Tokens are a different bug. Pairing at 1:30?',
      200,
    ),
    m(
      'm_j3',
      'c_jordan',
      'u_jordan',
      null,
      'Booked. I’ll grab us the small huddle room.',
      55,
    ),
    m(
      'm_j3_r',
      'c_jordan',
      'u_maya',
      'm_j3',
      'If it’s taken, my desk is fine. Headphones recommended 😄',
      50,
    ),

    // DM Sam
    m(
      'm_s1',
      'c_sam',
      'u_sam',
      null,
      'Exported a 375px capture of the badge wrap. Want it in the squad chat or just Figma?',
      400,
    ),
    m(
      'm_s2',
      'c_sam',
      'u_maya',
      null,
      'Figma is enough — I already called it out in the launch thread.',
      388,
    ),
    m(
      'm_s3',
      'c_sam',
      'u_sam',
      null,
      'Cool. I’ll QA the token pass as soon as it lands.',
      12,
    ),
  ]
}

export function initialLastReadAt(now: number) {
  return {
    u_maya: {
      c_design: now,
      c_weekend: minutesAgo(2000, now),
      c_jordan: now,
      c_sam: minutesAgo(20, now),
    },
    u_jordan: {
      c_design: minutesAgo(100, now),
      c_weekend: now,
      c_jordan: now,
      c_sam: 0,
    },
    u_sam: {
      c_design: minutesAgo(90, now),
      c_weekend: 0,
      c_jordan: 0,
      c_sam: now,
    },
  }
}
