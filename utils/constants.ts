export const GEMINI_IN_PLUGIN = '--gein'
export const R_SCP_PARAM = '--r-csp';
export const IS_OPEN_IN_PLUGIN = '--opis';
export const IS_OPEN_IN_PLUGIN_SEARCH = '--opis_search';
export const IS_OPEN_IN_CHALLENGE_WINDOW = '--oppcw';
export const IS_OPEN_IN_CHAT_AUTH_WINDOW = '--opaw';
export const PERPLEXITY_SOCKET_PORT_NAME = 'PERPLEXITY_SOCKET_PORT_NAME';
export const IS_OPEN_IN_CHAT_CAPTCHA_WINDOW = '--oiccw';
export const WINDOW_FOR_REMOVE_STORAGE_KEY = '--o_wk';
export const MESSAGE_ACTION_SYNC_SEARCH_TEXT = 'sync_search_text';
export const DEVV_SEARCH_KEY = '--devvss';
export const MESSAGE_ACTION_SHOULD_RELOAD_PERPLEXITY_IN_PANEL = 'should_reload_perplexity_in_panel';
export const MESSAGE_ACTION_SHOULD_RELOAD_PHIND_IN_PANEL = 'should_reload_phind_in_panel';
export const MESSAGE_ACTION_CLOSE_WINDOW_WITH_ID = 'close_window_with_id';
export const MESSAGE_ACTION_RELOAD_SITE_FRAME = 'reload_site_frame';
export const MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS = 'auth_success';
export const MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS = 'captcha_success';
export const MESSAGE_ACTION_SET_PANEL_OPEN_OR_NOT = 'set_panel_open_or_not';
export const MESSAGE_ACTION_SET_QUOTING_SELECTION_TEXT = 'set_quoting_selection_text';
export const MESSAGE_ACTION_SEND_SUMMARY = 'send_summary_text_action';
export const MESSAGE_ACTION_SET_QUOTING_CANCEL = 'set_quoting_selection_text_cancel';
export const MESSAGE_ACTION_SET_QUOTING_SELECTION_CLEAR_CURSOR = 'set_quoting_selection_text_clear_cursor';
export const MESSAGE_CHECK_PANEL_IS_OPEN = 'message_check_panel_is_open';
export const STORAGE_WILL_REMOVED_WINDOW_KEY = 'will_removed_window_key';
export const STORAGE_OPEN_PANEL_INIT_DATA = 'open_panel_init_data';
export const STORAGE_OPEN_AI_DEVICE_ID = 'open_ai_device_id';
export const MESSAGE_ACTION_OPEN_PANEL = 'message_open_panel';
export const MESSAGE_PANEL_OPENED_PING_FROM_PANEL = 'MESSAGE_PANEL_OPENED_PING_FROM_PANEL';
export const MESSAGE_ACTION_OPEN_PANEL_WITH_SEARCH_TEXT = 'open_panel_with_search_text';
export const MESSAGE_ACTION_OPEN_PANEL_ASK_AI = 'open_panel_ask_ai_default';
export const MESSAGE_ACTION_GET_SESSION = 'get_session';
export const MESSAGE_ACTION_SEND_SESSION = 'send_session';
export const MESSAGE_UPDATE_PANEL_INIT_DATA = 'update_panel_init_data';
export const PORT_LISTEN_PANEL_CLOSED_KEY = 'listen_panel_closed_key';

export const STORAGE_PANEL_OPEN_DATA_KEY = 'panel_open_data_key';
export const PROMPT_PLACEHOLDER_TEXT = "${texts}";
export const PROMPT_PLACEHOLDER_LANG = "${lang}";
export const PROMPT_PLACEHOLDER_WEB_TEXT = "${web_content_text}";
export const EXECUTE_ACTION = "_execute_action";
export const EXECUTE_ACTION_SHORTCUT = "⌘I";
export const TOOLBAR_OPEN_SHORTCUT = "⌘J";

export const TOOLBAR_OPEN = 'toolbar_open';
export const SHORTCUTSTOOLBARTYPE = 'ShortcutsToolbarType';
export const SHOWSIDEBARICON = 'showSidebarIcon';

export enum ToolbarTypeEnum {
    SELECT_TEXT = 'SELECT_TEXT',
    SELECT_KEY = 'SELECT',
    SELECT_ALT = 'SELECT_ALT',
    SELECT_CTRL = 'SELECT_CTRL',
    SELECT_SHIFT = 'SELECT_SHIFT',
    CUS_KEY = 'CUS_KEY',
    DISABLE = 'DISABLE'
}

export const ENTERKEYCOMBINATION = 'EnterCombination';
export const ENTERKEY = 'Enter';

export const SHORTCUTSKEYURL = 'chrome://extensions/shortcuts';

export const APPEARANCEURL = 'chrome://settings/appearance';
export const PROMPT_PLACEHOLDER_TRANSLATE_LANG = "${trans_target_lang}";
