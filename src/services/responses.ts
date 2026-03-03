import { sql } from 'bun'

interface CreateResponse {
  poll: number
  user: string
  choices: number[]
}

interface DeleteByUser {
  poll: number
  user: string
}

const Responses = {
  async createOrReplace({
    poll,
    user,
    choices,
  }: CreateResponse): Promise<PollResponseWithAnswers> {
    return {
      ...(await sql.begin(async (sql) => {
        await sql`DELETE FROM poll_responses WHERE poll_id = ${poll} AND user_id = ${user}`

        const payload = { poll_id: poll, user_id: user }
        const [response] = await sql<
          [DB.PollResponse]
        >`INSERT INTO poll_responses ${sql(payload)} RETURNING *`

        const newAnswers = choices.map((c) => ({
          poll_id: poll,
          response_id: response.id,
          choice_id: c,
        }))
        const answers = await sql<
          DB.PollResponseAnswer[]
        >`INSERT INTO poll_response_answers ${sql(newAnswers)} RETURNING *`

        return { ...response, answers }
      })),
    }
  },
  async deleteByUser({ poll, user }: DeleteByUser) {
    await sql`DELETE FROM poll_responses WHERE poll_id = ${poll} AND user_id = ${user}`
  },
  async fetchByPoll(poll: number): Promise<DB.PollResponse[]> {
    return await sql<
      DB.PollResponse[]
    >`SELECT * FROM poll_responses WHERE poll_id = ${poll}`
  },
  async fetchByPollWithAnswers(
    poll: number,
  ): Promise<PollResponseWithAnswers[]> {
    const responses = await Responses.fetchByPoll(poll)
    const answers = await sql<
      DB.PollResponseAnswer[]
    >`SELECT * FROM poll_response_answers WHERE poll_id = ${poll}`
    return responses.map((r) => ({
      ...r,
      answers: answers.filter((a) => a.response_id === r.id),
    }))
  },
}

export default Responses
