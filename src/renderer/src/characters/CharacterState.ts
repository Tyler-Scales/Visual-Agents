export enum AgentState {
  IDLE = 'idle',
  WALKING = 'walking',
  TYPING = 'typing',
  READING = 'reading',
  THINKING = 'thinking',
  WAITING = 'waiting',
  CELEBRATING = 'celebrating'
}

/** Map tool names to the visual activity state */
export function toolToState(toolName: string): AgentState {
  switch (toolName) {
    case 'Edit':
    case 'Write':
    case 'NotebookEdit':
    case 'TodoWrite':
      return AgentState.TYPING

    case 'Read':
    case 'Grep':
    case 'Glob':
    case 'WebFetch':
    case 'WebSearch':
      return AgentState.READING

    case 'Bash':
    case 'Task':
      return AgentState.TYPING

    default:
      return AgentState.THINKING
  }
}
