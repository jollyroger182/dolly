import { sql } from 'bun'
import Responses from './responses'

interface CreatePoll {
  user: string
  question: string
  choices: string[]
}

const Polls = {
  async create({
    user,
    question,
    choices,
  }: CreatePoll): Promise<PollWithChoices> {
    return {
      ...(await sql.begin(async (sql) => {
        const newPoll: Partial<DB.Poll> = { creator_user_id: user, question }
        const [poll] = await sql<
          [DB.Poll]
        >`INSERT INTO polls ${sql(newPoll)} RETURNING *`

        const newPollChoices: Partial<DB.PollChoice>[] = choices.map(
          (text, index) => ({
            poll_id: poll.id,
            text,
            position: index + 1,
          }),
        )
        const pollChoices = await sql<
          DB.PollChoice[]
        >`INSERT INTO poll_choices ${sql(newPollChoices)} RETURNING *`

        return { ...poll, choices: pollChoices }
      })),
    }
  },
  async fetch(id: number): Promise<DB.Poll | undefined> {
    return (await sql<DB.Poll[]>`SELECT * FROM polls WHERE id = ${id}`)[0]
  },
  async fetchWithChoices(id: number): Promise<PollWithChoices | undefined> {
    const poll = await Polls.fetch(id)
    if (!poll) return
    const choices = await sql<
      DB.PollChoice[]
    >`SELECT * FROM poll_choices WHERE poll_id = ${id}`
    return { ...poll, choices }
  },
  async fetchWithResponses(id: number): Promise<PollWithResponses | undefined> {
    const poll = await Polls.fetchWithChoices(id)
    if (!poll) return
    const responses = await Responses.fetchByPollWithAnswers(id)
    return { ...poll, responses }
  },
}

export default Polls
