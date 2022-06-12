// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  CloseAction,
  ErrorAction,
  LanguageClientOptions,
  PublishDiagnosticsNotification,
  RevealOutputChannelOn,
} from "vscode-languageclient";
import {
  ServerOptions,
  LanguageClient,
  TransportKind,
  Executable,
} from "vscode-languageclient/node";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const lspOutputChannel = vscode.window.createOutputChannel(
    "Juan Carlos LSP Logs"
  );

  const run: Executable = {
    command: "../lsp/target/debug/lsp",
    options: {
      env: {
        ...process.env,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        RUST_LOG: "debug",
      },
    },
  };
  const serverOptions: ServerOptions = {
    run,
    debug: run,
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    markdown: {
      isTrusted: true,
    },
    documentSelector: [
      { scheme: "file", language: "html" },
      { scheme: "file", language: "css" },
    ],

    outputChannel: lspOutputChannel,

    // Since we use stderr for debug logs, the "Something went wrong" popup
    // in VSCode shows up a lot. This tells vscode not to show it in any case.
    revealOutputChannelOn: RevealOutputChannelOn.Never,

    errorHandler: {
      // This happens when the LSP server stops running.
      // e.g. Could not find relay config.
      // e.g. watchman was not installed.
      //
      // TODO: Figure out the best way to handle this `closed` event
      //
      // Some of these messages are worth surfacing and others are not
      // e.g. "Watchman is not installed" is important to surface to the user
      // but "No relay config found" is not relevant since the user is likely
      // just in a workspace where they don't have a relay config.
      //
      // We already bail early if there is no relay binary found.
      // So maybe we should just show all of these messages since it would
      // be weird if you had a relay binary in your node modules but no relay
      // config could be found. 🤷 for now.
      closed() {
        vscode.window
          .showWarningMessage(
            "Relay LSP client connection got closed unexpectedly.",
            "Go to output",
            "Ignore"
          )
          .then((selected) => {
            if (selected === "Go to output") {
              lspOutputChannel.show();
            }
          });

        return CloseAction.DoNotRestart;
      },
      // This `error` callback should probably never happen. 🙏
      error() {
        vscode.window
          .showWarningMessage(
            "An error occurred while writing/reading to/from the relay lsp connection",
            "Go to output",
            "Ignore"
          )
          .then((selected) => {
            if (selected === "Go to output") {
              lspOutputChannel.show();
            }
          });

        return ErrorAction.Continue;
      },
    },

    initializationFailedHandler: (error) => {
      lspOutputChannel.appendLine(`initializationFailedHandler ${error}`);

      return true;
    },
  };

  // Create the language client and start the client.
  const client = new LanguageClient(
    "juancarloslsp",
    "Juan Carlos",
    serverOptions,
    clientOptions
  );

  lspOutputChannel.appendLine(
    `Starting the Relay Langauge Server with these options: ${JSON.stringify(
      serverOptions
    )}`
  );

  // Start the client. This will also launch the server
  client.start();

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "helloworld-sample" is now active!'
  );
}
