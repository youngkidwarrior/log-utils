const vscode = require('vscode');

let supportedLanguages = {
  javascript: {
    logStatement: 'console.log',
    logRegex:
      /console.(log|debug|info|warn|error|assert|dir|dirxml|trace|group|groupEnd|time|timeEnd|profile|profileEnd|count)\((.*)\);?/g,
  },
  rescript: {
    logStatement: 'Js.log2',
    logRegex: /Js.log\((.*)\)/g,
  },
  go: {
    logStatement: 'log.Println',
    logRegex: /log.(Printf|Println|Print)((.*));?/g,
  },
  c: {
    logStatement: 'printf',
    logRegex: /printf\((.*)\);?/g,
  },
  cpp: {
    logStatement: 'printf',
    logRegex: /printf\((.*)\);?/g,
  },
  csharp: {
    logStatement: 'Console.WriteLine',
    logRegex: /Console.(WriteLine|Write)((.*));?/g,
  },
  python: {
    logStatement: 'print',
    logRegex: /print\((.*)\)/g,
  },
  ruby: {
    logStatement: 'puts',
    logRegex: /puts\((.*)\)/g,
  },
  fsharp: {
    logStatement: 'Print',
    logRegex: /Print\((.*)\)/g,
  },
  java: {
    logStatement: 'System.out.println',
    logRegex: /System.out.(println|print)((.*));?/g,
  },
  php: {
    logStatement: 'echo',
    logRegex: /echo\((.*)\)/g,
  },
  rust: {
    logStatement: 'println!',
    logRegex: /println!\((.*)\)/g,
  },
  swift: {
    logStatement: 'print',
    logRegex: /print\((.*)\)/g,
  },
};

module.exports = {
  activate,
  deactivate,
};

const getLanguageId = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return '';
  }
  const languageId = editor.document.languageId;
  return languageId;
};

const insertText = (val) => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage(
      "Can't insert log because no document is open"
    );
    return;
  }

  const selection = editor.selection;

  const range = new vscode.Range(selection.start, selection.end);

  editor.edit((editBuilder) => {
    editBuilder.replace(range, val);
  });
};

function getAllLogStatements(document, documentText, languageId) {
  let logStatements = [];

  if (!supportedLanguages[languageId])
    return vscode.window.showInformationMessage(
      `${languageId} is not supported`
    );

  const logRegex = supportedLanguages[languageId].logRegex;
  let match;
  while ((match = logRegex.exec(documentText))) {
    let matchRange = new vscode.Range(
      document.positionAt(match.index),
      document.positionAt(match.index + match[0].length)
    );
    if (!matchRange.isEmpty) logStatements.push(matchRange);
  }
  return logStatements;
}

function deleteFoundLogStatements(workspaceEdit, docUri, logs) {
  logs.forEach((log) => {
    workspaceEdit.delete(docUri, log);
  });

  vscode.workspace.applyEdit(workspaceEdit).then(() => {
    logs.length > 1
      ? vscode.window.showInformationMessage(`${logs.length} logs deleted`)
      : vscode.window.showInformationMessage(`${logs.length} logs deleted`);
  });
}

function activate(context) {
  console.log('rescript-log-utils is now active');

  const insertLogStatement = vscode.commands.registerCommand(
    'extension.insertLogStatement',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const languageId = getLanguageId();

      if (!supportedLanguages[languageId])
        return vscode.window.showInformationMessage(
          languageId !== 'plaintext'
            ? `${languageId} is not supported`
            : 'Choose a language for the file'
        );

      const log = supportedLanguages[languageId].logStatement;

      const selection = editor.selection;
      const text = editor.document.getText(selection);

      text
        ? vscode.commands
            .executeCommand('editor.action.insertLineAfter')
            .then(() => {
              const logToInsert = `${log}("${text}: ", ${text})`;
              insertText(logToInsert);
            })
        : insertText(`${log}()`);
    }
  );
  context.subscriptions.push(insertLogStatement);

  const deleteAllLogStatements = vscode.commands.registerCommand(
    'extension.deleteAllLogStatements',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const languageId = getLanguageId();

      const document = editor.document;
      const documentText = editor.document.getText();

      let workspaceEdit = new vscode.WorkspaceEdit();

      const logStatements = getAllLogStatements(
        document,
        documentText,
        languageId
      );

      deleteFoundLogStatements(workspaceEdit, document.uri, logStatements);
    }
  );
  context.subscriptions.push(deleteAllLogStatements);
}
exports.activate = activate;

function deactivate() {}

exports.deactivate = deactivate;
