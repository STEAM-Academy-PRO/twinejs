import {EditorConfiguration} from 'codemirror';
import {PrefsState} from '../store/prefs';
import CodeMirror from 'codemirror';

// Define a custom mode for highlighting @-prefixed words
CodeMirror.defineMode('atword-highlight', function() {
  return {
    startState: function() {
      return {};
    },
    token: function(stream, state) {
      if (stream.match(/^@[\w\d_]+/)) {
        return 'atword';
      }
      stream.next();
      return null;
    }
  };
});

/**
 * Returns baseline CodeMirror options based on user preferences.
 */
export function codeMirrorOptionsFromPrefs(
  prefs: PrefsState
): EditorConfiguration {
  // Disable overstrike mode.
  const result: EditorConfiguration = {
    extraKeys: {
      Insert() {}
    },
    mode: 'atword-highlight',
    theme: 'default',
    styleActiveLine: true
  };

  if (!prefs.editorCursorBlinks) {
    result.cursorBlinkRate = 0;
  }

  return result;
}

// Add CSS for the highlight style
CodeMirror.defineMIME('text/atword', 'atword-highlight');

// Add CSS class for yellow highlighting
CodeMirror.defineOption('theme', 'default', (cm: any, value: string) => {
  if (value === 'default') {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .cm-atword {
        background-color: yellow;
        color: black;
      }
    `;
    document.head.appendChild(styleElement);
  }
});
