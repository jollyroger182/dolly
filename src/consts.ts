export const CALLBACK_ID = {
  // defined in slack portal, need to match manifest
  createPoll: 'create_poll',

  // defined purely in code
  createPollModal: 'create_poll_modal',
  editPollModal: 'edit_poll_modal',
  confirmEditChoices: 'confirm_edit_choices',
}

export const BLOCK_ID = {
  question: 'question',
  channel: 'channel',
  options: 'options',
  settings: 'settings',
  pollTitle: 'poll_title',
}

export const ACTION_ID = {
  value: 'value',
  pollChoiceButton: 'poll_choice_button',
  pollChoiceMenu: 'poll_choice_menu',
  pollOverflowMenu: 'poll_overflow_menu',
}

export const VALUE = {
  anonymous: 'anonymous',
  edit: 'edit',
}
