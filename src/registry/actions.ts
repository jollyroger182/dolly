import { Cache } from '../cache'
import { ACTION_ID, BLOCK_ID, CALLBACK_ID, VALUE } from '../consts'
import {
  handleClearResponses,
  handleTogglePollAnswer,
} from '../handlers/answer'
import { handleConfirmCreatePoll, handleCreatePoll } from '../handlers/create'
import Polls from '../services/polls'
import app from '../slack'
import {
  handleConfirmEditChoices,
  handleConfirmEditPoll,
  handleEditPoll,
} from '../handlers/edit'
import { showErrorModal, unique } from '../utils'

const responseUrlCache = new Cache<string, string>()

app.view(
  CALLBACK_ID.createPollModal,
  async ({ ack, respond, payload, body }) => {
    if (body.type !== 'view_submission') return

    await ack()

    const conversation =
      payload.state.values[BLOCK_ID.channel]![ACTION_ID.value]!
        .selected_conversation!
    const question =
      payload.state.values[BLOCK_ID.question]![ACTION_ID.value]!.value!
    const choices = unique(
      payload.state.values[BLOCK_ID.options]![ACTION_ID.value]!.value!.trim()
        .split('\n')
        .filter((c) => c),
    )
    const settings = payload.state.values[BLOCK_ID.settings]![
      ACTION_ID.value
    ]!.selected_options!.map((o) => o.value)

    const anonymous = settings.includes(VALUE.anonymous)

    if (choices.length < 2) {
      await handleCreatePoll({
        trigger_id: body.trigger_id,
        initial_conversation: conversation,
        text: question,
        options: choices.join('\n'),
        error: "What's a poll without two or more choices?",
      })
      return
    }

    await handleConfirmCreatePoll({
      respond,
      user: body.user.id,
      question,
      choices,
      anonymous,
    })
  },
)

app.action(
  ACTION_ID.pollChoiceMenu,
  async ({ ack, respond, payload, body }) => {
    if (body.type !== 'block_actions') return
    if (payload.type !== 'static_select') return

    await ack()

    const answerValue = payload.selected_option.value
    const { poll: pollId, choice: choiceId } = JSON.parse(answerValue) as {
      poll: number
      choice: number
    }

    if (choiceId >= 0) {
      await handleTogglePollAnswer({
        respond,
        poll: pollId,
        user: body.user.id,
        choice: choiceId,
      })
    } else {
      await handleClearResponses({
        respond,
        poll: pollId,
        user: body.user.id,
      })
    }
  },
)

app.action(
  { type: 'block_actions', block_id: BLOCK_ID.pollTitle },
  async ({ ack, respond, payload, body }) => {
    if (payload.type !== 'overflow') return

    await ack()

    const { poll: pollId } = JSON.parse(payload.action_id) as { poll: number }

    const poll = await Polls.fetchWithChoices(pollId)
    if (!poll) return

    if (poll.creator_user_id !== body.user.id) {
      // for some reason this doesn't work smh
      // await respond({
      //   text: "You cannot edit another user's poll.",
      //   replace_original: false,
      //   response_type: 'ephemeral',
      // })
      await showErrorModal({
        trigger_id: body.trigger_id,
        error: "You cannot edit another user's poll.",
      })
      return
    }

    await handleEditPoll({
      trigger_id: body.trigger_id,
      poll,
      response_url: body.response_url,
    })
  },
)

app.view(
  { type: 'view_submission', callback_id: CALLBACK_ID.editPollModal },
  async ({ ack, payload, body }) => {
    if (body.type !== 'view_submission') return

    await ack()

    const question =
      payload.state.values[BLOCK_ID.question]![ACTION_ID.value]!.value!
    const choices = unique(
      payload.state.values[BLOCK_ID.options]![ACTION_ID.value]!.value!.trim()
        .split('\n')
        .filter((c) => c),
    )

    await handleConfirmEditPoll({
      private_metadata: payload.private_metadata,
      trigger_id: body.trigger_id,
      question,
      choices,
    })
  },
)

app.view(
  { type: 'view_submission', callback_id: CALLBACK_ID.confirmEditChoices },
  async ({ ack, payload, body }) => {
    if (body.type !== 'view_submission') return

    await ack()

    await handleConfirmEditChoices({
      private_metadata: payload.private_metadata,
    })
  },
)
