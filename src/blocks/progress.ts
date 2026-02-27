const BLOCKS = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'] as const

export function generateProgressBar(percentage: number, size: number) {
  const blocks = percentage * size
  return (
    BLOCKS[8].repeat(Math.floor(blocks)) +
    (Math.floor(blocks) === blocks
      ? ''
      : BLOCKS[Math.round(blocks - Math.floor(blocks)) * 8]) +
    BLOCKS[0].repeat(size - Math.ceil(blocks))
  )
}
