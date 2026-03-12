import { sql } from 'bun'
import Responses from './responses'

interface CreatePoll {
  user: string
  question: string
  choices: string[]
  anonymous: boolean
}

const Polls = {
  async create({
    user,
    question,
    choices,
    anonymous,
  }: CreatePoll): Promise<PollWithChoices> {
    return {
      ...(await sql.begin(async (sql) => {
        const newPoll: Partial<DB.Poll> = {
          creator_user_id: user,
          question,
          anonymous,
        }
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
  async fetchChoices(id: number): Promise<DB.PollChoice[]> {
    return await sql<
      DB.PollChoice[]
    >`SELECT * FROM poll_choices WHERE poll_id = ${id}`
  },
  async fetchWithChoices(id: number): Promise<PollWithChoices | undefined> {
    const poll = await Polls.fetch(id)
    if (!poll) return
    const choices = await Polls.fetchChoices(id)
    return { ...poll, choices }
  },
  async fetchWithResponses(id: number): Promise<PollWithResponses | undefined> {
    const poll = await Polls.fetchWithChoices(id)
    if (!poll) return
    const responses = await Responses.fetchByPoll(id)
    return { ...poll, responses }
  },
  async update(poll: Partial<Pick<DB.Poll, 'id' | 'question'>>) {
    const payload = { ...poll, updated_at: new Date(), id: undefined }
    const [updated] = await sql<
      DB.Poll[]
    >`UPDATE polls SET ${sql(payload)} WHERE id = ${poll.id} RETURNING *`
    return updated
  },
  async changeChoices(
    id: number,
    add: string[],
    remove: number[],
  ): Promise<DB.PollChoice[]> {
    return await sql.begin(async (sql) => {
      await sql`DELETE FROM poll_choices WHERE id IN ${sql(remove)}`

      const existing = await sql<
        DB.PollChoice[]
      >`SELECT * FROM poll_choices WHERE poll_id = ${id}`
      const maxPosition = Math.max(...existing.map((c) => c.position))

      const newChoices = add.map((c, i) => ({
        poll_id: id,
        text: c,
        position: maxPosition + i + 1,
      }))
      const choices = await sql<
        DB.PollChoice[]
      >`INSERT INTO poll_choices ${sql(newChoices)} RETURNING *`

      return choices
    })
  },
}

export default Polls
