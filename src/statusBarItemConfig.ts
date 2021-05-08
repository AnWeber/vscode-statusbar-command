import { AccessibilityInformation } from 'vscode';

export interface StatusBarItemConfig {

/**
* The alignment of this item.
*/
alignment?: 'left' | 'right';

/**
 * The priority of this item. Higher value means the item should
 * be shown more to the left.
 */
priority?: number;

/**
 * The text to show for the entry. You can embed icons in the text by leveraging the syntax:
 *
 * `My text $(icon-name) contains icons like $(icon-name) this one.`
 *
 * Where the icon-name is taken from the [codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html) icon set, e.g.
 * `light-bulb`, `thumbsup`, `zap` etc.
 */
text: string;

/**
 * The tooltip text when you hover over this entry.
 */
tooltip: string | undefined;

/**
 * The foreground color for this entry.
 */
color: string | undefined;

/**
 * the background color for this entry
 */
backgroundColor: string | undefined;

/**
 * identifier of a command to run on click.
 *
 * The command must be [known](#commands.getCommands).
 *
 * Note that if this is a [`Command`](#Command) object, only the [`command`](#Command.command) and [`arguments`](#Command.arguments)
 * are used by VS Code.
 */
command: string;


/**
 * Arguments that the command handler should be invoked with.
 */
arguments: Array<unknown>;

/**
 * Accessibility information used when screen reader interacts with this StatusBar item
 */
accessibilityInformation?: AccessibilityInformation;

/**
 * if RegEx is valid, then the StatusbarItem is shown
 */
include?: string;

/**
 * if RegEx is valid, then the StatusbarItem is hidden
 */
exclude?: string;

/**
 * if regex match languageid
 */
filterLanguageId?: string;

/**
 * if regex match filename
 */
filterFileName?: string;

/**
 * if regex match filepath
 */
filterFilepath?: string;

/**
 * if regex match text
 */
filterText?: string;
}
