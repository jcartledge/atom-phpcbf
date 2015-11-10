'use babel';

import {CompositeDisposable} from 'atom';
import which from 'which';
import fs from 'fs';
import tempWrite from 'temp-write';
import childProcess from 'child_process';

/* global atom */
export default {

  config: {
    executablePath: {
      type: 'string',
      default: 'phpcbf',
      description: 'Path to the `phpcbf` executable.'
    },
    standard: {
      type: 'string',
      default: 'PSR2',
      description: 'The PHPCS coding standard to use.'
    }
  },

  activate () {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      atom.config.observe('phpcbf.executablePath', (e) => this.executablePath = e)
    );
    this.subscriptions.add(
      atom.config.observe('phpcbf.standard', (s) => this.standard = s)
    );
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {'phpcbf:reformat': () => this.reformat()})
    );
  },

  deactivate () {
    return this.subscriptions.dispose();
  },

  reformat () {
    let editor = atom.workspace.getActiveTextEditor();
    if (editor.getGrammar().name !== 'PHP') {
      return atom.notifications.addError(`Can't reformat ${editor.getGrammar().name} files.`);
    }

    which(this.executablePath, (err, phpcbf) => {
      if (err) {
        return atom.notifications.addError('Could not find phpcbf executable.', {detail: err.message});
      }

      let tempFile = tempWrite.sync(editor.getText());
      let args = ['--no-patch', `--standard=${this.standard}`, tempFile];
      childProcess.execFile(phpcbf, args, (err, stdOut, stdErr) => {
        // PHPCBF exits 1 for no apparent reason so we need to check stdErr is not empty.
        if (err && stdErr.length) {
          return atom.notifications.addError('Unexpected error.', {detail: stdErr});
        } else {
          editor.setText(fs.readFileSync(tempFile, 'utf8'));
          atom.notifications.addSuccess(`Reformatted to ${this.standard}.`, {detail: stdOut});
        }
      });
    });
  }
};
