namespace DB {
  interface Poll {
    id: number
    creator_user_id: string
    question: string
    created_at: Date
    updated_at: Date
  }

  interface PollChoice {
    id: number
    poll_id: number
    text: string
    position: number
  }

  interface PollResponse {
    id: number
    poll_id: number
    user_id: string
    created_at: Date
    updated_at: Date
  }

  interface PollResponseAnswer {
    id: number
    poll_id: number
    response_id: number
    choice_id: number
  }
}

interface PollWithChoices extends DB.Poll {
  choices: DB.PollChoice[]
}

interface PollWithResponses extends PollWithChoices {
  responses: PollResponseWithAnswers[]
}

interface PollResponseWithAnswers extends DB.PollResponse {
  answers: DB.PollResponseAnswer[]
}
