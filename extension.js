const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Soup = imports.gi.Soup;

const Gio = imports.gi.Gio;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Lang = imports.lang;

const KEY_RETURN = 65293;
const KEY_ENTER = 65421;

let boxLayout, translateEntry, translateButton, button, isOpen;

function _hideTranslate() {
    Main.uiGroup.remove_actor(boxLayout);
    boxLayout = null;
    translateEntry = null;
    translateButton = null;
    isOpen = false;
}

function _showTranslate() {
    if (isOpen === false) {
        isOpen = true;

        boxLayout = new St.BoxLayout({
            style_class: 'boxLayout',
            can_focus: true
        });
        boxLayout.set_width(400);

        translateEntry = new St.Entry({
            style_class: 'translateEntry',
            hint_text: _("Type..."),
            track_hover: true,
            can_focus: true
        });

        let translateEntryText = translateEntry.clutter_text;

        translateEntryText.connect('key-press-event', Lang.bind(this, function (o, e) {
            let symbol = e.get_key_symbol();
            if (symbol == KEY_RETURN || symbol == KEY_ENTER) {
                _translate();
            }
        }));

        translateButton = new St.Button({style_class: 'translateButton', label: 'Translate'});
        translateButton.connect('clicked', _translate);

        boxLayout.add_actor(translateEntry);
        boxLayout.add_actor(translateButton);

        let monitor = Main.layoutManager.primaryMonitor;

        boxLayout.set_position(Math.floor(monitor.width / 2 - boxLayout.width / 2),
            Math.floor(monitor.height / 2 - boxLayout.height / 2));

        //translateEntry.grab_key_focus();
        //translateEntry.navigate_focus(boxLayout, 2, false);
        //global.focus_manager.add_group (translateEntry);

        Main.uiGroup.add_actor(boxLayout);
        translateEntry.grab_key_focus();
    } else {
        _hideTranslate();
    }
}

function _translate() {

    let jsonDetectCall = 'https://translate.yandex.net/api/v1.5/tr.json/detect?' +
        'key=trnsl.1.1.20150425T214814Z.23757beb84a5e3ad.491b23fde139220149918ab252de6da8929ca42e&' +
        'text=' + translateEntry.get_text();

    //Always output to english, except when input is english, then output to german
    let inputLanguage = _getJSONCallResult(jsonDetectCall)['lang'];
    let outputLanguage = 'en';

    if (inputLanguage === 'en') {
        outputLanguage = 'de';
    }

    let jsonTranslateCall = 'https://translate.yandex.net/api/v1.5/tr.json/translate?' +
        'key=trnsl.1.1.20150425T214814Z.23757beb84a5e3ad.491b23fde139220149918ab252de6da8929ca42e&' +
        'lang=' + inputLanguage + '-' + outputLanguage + '&text=' + translateEntry.get_text();

    let translateCallResult = _getJSONCallResult(jsonTranslateCall)['text'];
    translateEntry.set_text(translateCallResult[0]);
}

function _getJSONCallResult(jsonCall) {
    let response;

    let soupSyncSession = new Soup.SessionSync();
    let message = Soup.Message.new('GET', jsonCall);
    let responseCode = soupSyncSession.send_message(message);
    if (responseCode == 200) {
        let responseBody = message['response-body'];
        response = JSON.parse(responseBody.data);
    }

    return response;
}

function _getSettings() {
    let dir = Extension.dir.get_child('schemas').get_path();
    let source = Gio.SettingsSchemaSource.new_from_directory(dir,
        Gio.SettingsSchemaSource.get_default(),
        false);

    if (!source)
        throw new Error('Error Initializing.');

    let schema = source.lookup('org.gnome.shell.extensions.translate', false);

    if (!schema)
        throw new Error('Schema missing.');

    return new Gio.Settings({
        settings_schema: schema
    });
}

function init() {
    isOpen = false;
}


function enable() {
    Main.wm.addKeybinding('open-translate',
        _getSettings(),
        Meta.KeyBindingFlags.NONE,
        Shell.KeyBindingMode.ALL,
        Lang.bind(this, _showTranslate));
}

function disable() {
    Main.wm.removeKeybinding('open-translate');
}
