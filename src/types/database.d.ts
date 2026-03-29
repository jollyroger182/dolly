namespace DB {
  interface Poll {
    id: number
    creator_user_id: string
    question: string
    anonymous: boolean
    multi_select: boolean
    add_choice_setting: 'no_one' | 'creator' | 'anyone'
    created_at: Date
    updated_at: Date
  }

  interface PollChoice {
    id: number
    poll_id: number
    creator_user_id: string
    text: string
    position: number
    created_at: Date
  }

  interface PollResponse {
    id: number
    poll_id: number
    choice_id: number
    user_id: string
    created_at: Date
    updated_at: Date
  }
}

interface PollWithChoices extends DB.Poll {
  choices: DB.PollChoice[]
}

interface PollWithResponses extends PollWithChoices {
  responses: DB.PollResponse[]
}
