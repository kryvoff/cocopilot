declare module '*.mp3' {
  const src: string
  export default src
}

declare module '*.jsonl?raw' {
  const content: string
  export default content
}
