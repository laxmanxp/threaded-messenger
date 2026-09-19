import { avatarStyle } from '../lib/format'

export function Avatar({
  initials,
  hue,
  size = 40,
  title,
}: {
  initials: string
  hue: number
  size?: number
  title?: string
}) {
  return (
    <div
      title={title}
      aria-hidden={!title}
      className="grid shrink-0 place-items-center rounded-full font-semibold tracking-wide select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        ...avatarStyle(hue),
      }}
    >
      {initials}
    </div>
  )
}
