import { sql } from 'bun'
import Responses from './responses'

interface CreatePoll {
  user: string
  question: string
  choices: string[]
  anonymous: boolean
  multi_select: boolean
  add_choice_setting: 'no_one' | 'creator' | 'anyone'
}

const Polls = {
  async create({
    user,
    question,
    choices,
    anonymous,
    multi_select,
    add_choice_setting,
  }: CreatePoll): Promise<PollWithChoices> {
    return {
      ...(await sql.begin(async (sql) => {
        const newPoll: Partial<DB.Poll> = {
          creator_user_id: user,
          question,
          anonymous,
          multi_select,
          add_choice_setting,
        }
        const [poll] = await sql<
          [DB.Poll]
        >`INSERT INTO polls ${sql(newPoll)} RETURNING *`

        const newPollChoices: Partial<DB.PollChoice>[] = choices.map(
          (text, index) => ({
            poll_id: poll.id,
            creator_user_id: user,
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
    >`SELECT * FROM poll_choices WHERE poll_id = ${id} ORDER BY position ASC`
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
  async addChoice(
    id: number,
    { text, creator_user_id }: Pick<DB.PollChoice, 'text' | 'creator_user_id'>,
  ) {
    try {
      const [newChoice] = await sql<
        [DB.PollChoice]
      >`INSERT INTO poll_choices(poll_id, creator_user_id, text, position) SELECT ${id}, ${creator_user_id}, ${text}, COALESCE(MAX(position), 0) + 1 FROM poll_choices WHERE poll_id = ${id} RETURNING *`
      return newChoice
    } catch (e) {
      console.error(e)
      throw e
    }
  },
}

export default Polls
