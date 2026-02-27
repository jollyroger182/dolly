import { sql } from 'bun'

export interface PollWithChoices extends DB.Poll {
  choices: DB.PollChoice[]
}

interface CreatePoll {
  user: string
  question: string
  choices: string[]
}

const Polls = {
  async create({ user, question, choices }: CreatePoll) {
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
}

export default Polls
