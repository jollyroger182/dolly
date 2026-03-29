export const CALLBACK_ID = {
  // defined in slack portal, need to match manifest
  createPoll: 'create_poll',

  // defined purely in code
  createPollModal: 'create_poll_modal',
  editPollModal: 'edit_poll_modal',
  addOptionModal: 'add_option_modal',
} as const

export const BLOCK_ID = {
  question: 'question',
  channel: 'channel',
  options: 'options',
  settings: 'settings',
  addChoiceSettings: 'add_choice_settings',
  pollTitle: 'poll_title',
  option: 'option',
} as const

export const ACTION_ID = {
  value: 'value',
  pollChoiceButton: 'poll_choice_button',
  pollChoiceMenu: 'poll_choice_menu',
  pollOverflowMenu: 'poll_overflow_menu',
} as const

export const VALUE = {
  anonymous: 'anonymous',
  multiSelect: 'multi_select',

  noOne: 'no_one',
  creator: 'creator',
  anyone: 'anyone',

  edit: 'edit',
  delete: 'delete',
  addOption: 'add_option',
} as const
