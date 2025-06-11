import { version1_1 } from './1.1'

export const changelogData = [
  version1_1
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 