/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");;

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommandsController = void 0;
const vscode_1 = __webpack_require__(1);
const statusBarCommand_1 = __webpack_require__(3);
/**
 * manage initialization of Commands
 */
class CommandsController {
    constructor() {
        this.commands = new Array();
        this.refresh();
    }
    /**
     * refresh config
     */
    refresh() {
        const config = vscode_1.workspace.getConfiguration('statusbar_command');
        this.disposeCommands();
        this.commands = new Array();
        const configCommands = config.get('commands');
        if (configCommands) {
            this.commands.push(...configCommands.map(configEntry => {
                const command = new statusBarCommand_1.StatusBarCommand(configEntry);
                command.refresh(vscode_1.window.activeTextEditor);
                return command;
            }));
        }
    }
    onChangeConfiguration() {
        this.refresh();
    }
    onChangeTextEditor(textEditor) {
        if (textEditor) {
            this.commands.forEach(command => command.refresh(textEditor));
        }
    }
    disposeCommands() {
        if (this.commands) {
            this.commands.forEach((command) => command.dispose());
            this.commands = new Array();
        }
    }
    dispose() {
        this.disposeCommands();
    }
}
exports.CommandsController = CommandsController;


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StatusBarCommand = void 0;
const vscode_1 = __webpack_require__(1);
class StatusBarCommand {
    constructor(config) {
        this.config = config;
        let alignment = vscode_1.StatusBarAlignment.Left;
        if (config.alignment === 'right') {
            alignment = vscode_1.StatusBarAlignment.Right;
        }
        this.statusBarItem = vscode_1.window.createStatusBarItem(alignment, config.priority);
        this.statusBarItem.color = config.color;
        this.statusBarItem.accessibilityInformation = config.accessibilityInformation;
        this.statusBarItem.text = config.text;
        this.statusBarItem.tooltip = config.tooltip;
        if (config.backgroundColor) {
            this.statusBarItem.backgroundColor = new vscode_1.ThemeColor(config.backgroundColor);
        }
        if (config.arguments) {
            this.statusBarItem.command = {
                title: config.text,
                command: config.command,
                arguments: config.arguments
            };
        }
        else {
            this.statusBarItem.command = config.command;
        }
    }
    refresh(textEditor) {
        var _a, _b;
        let visible = true;
        if (this.statusBarItem) {
            if (textEditor && textEditor.document) {
                if (!this.testRegex(this.config.filterLanguageId, textEditor.document.languageId)) {
                    visible = false;
                }
                if (!this.testRegex(this.config.filterFileName, textEditor.document.fileName)) {
                    visible = false;
                }
                if (!this.testRegex(this.config.filterText, textEditor.document.getText())) {
                    visible = false;
                }
                const documentUri = (_b = (_a = textEditor === null || textEditor === void 0 ? void 0 : textEditor.document) === null || _a === void 0 ? void 0 : _a.uri) === null || _b === void 0 ? void 0 : _b.toString();
                if (!this.testRegex(this.config.include, documentUri)) {
                    visible = false;
                }
                if (this.config.exclude && this.testRegex(this.config.exclude, documentUri)) {
                    visible = false;
                }
            }
            if (visible) {
                this.statusBarItem.show();
            }
            else {
                this.statusBarItem.hide();
            }
        }
    }
    testRegex(pattern, value) {
        return !pattern || value && RegExp(pattern).test(value);
    }
    dispose() {
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
            this.statusBarItem = undefined;
        }
    }
}
exports.StatusBarCommand = StatusBarCommand;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const vscode = __webpack_require__(1);
const commandsController_1 = __webpack_require__(2);
function activate(context) {
    const commandsController = new commandsController_1.CommandsController();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(commandsController.onChangeConfiguration, commandsController));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(commandsController.onChangeTextEditor, commandsController));
    context.subscriptions.push(commandsController);
}
exports.activate = activate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map