import { sql } from 'bun'

interface ToggleResponse {
  poll: number
  user: string
  choice: number
  single: boolean
}

interface DeleteByUser {
  poll: number
  user: string
}

const Responses = {
  async toggle({
    poll,
    user,
    choice,
    single,
  }: ToggleResponse): Promise<DB.PollResponse | undefined> {
    return await sql.begin(async (sql) => {
      const [existing] = await sql<
        DB.PollResponse[]
      >`SELECT * FROM poll_responses WHERE user_id = ${user} AND choice_id = ${choice}`

      if (existing) {
        await sql`DELETE FROM poll_responses WHERE id = ${existing.id}`
        return
      } else {
        const payload = { poll_id: poll, choice_id: choice, user_id: user }
        if (single) {
          await sql`DELETE FROM poll_responses WHERE user_id = ${user} AND poll_id = ${poll}`
        }
        const [response] = await sql<
          [DB.PollResponse]
        >`INSERT INTO poll_responses ${sql(payload)} RETURNING *`
        return response
      }
    })
  },
  async deleteByUser({ poll, user }: DeleteByUser) {
    await sql`DELETE FROM poll_responses WHERE poll_id = ${poll} AND user_id = ${user}`
  },
  async fetchByPoll(poll: number): Promise<DB.PollResponse[]> {
    return await sql<
      DB.PollResponse[]
    >`SELECT * FROM poll_responses WHERE poll_id = ${poll}`
  },
}

export default Responses
