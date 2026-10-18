import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

// Local, single-process credential store. Never put this directory under dist/.
// Sessions and replay protection deliberately expire when the process restarts.
export class CredentialStore {
  constructor(filename) {
    this.filename = filename;
    mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
    this.data = existsSync(filename)
      ? JSON.parse(readFileSync(filename, 'utf8'))
      : { version: 1, users: {} };
    if (this.data.version !== 1 || !this.data.users) throw new Error('Invalid credential store.');
  }

  get(address) { return this.data.users[address]; }

  commit(data) {
    const temporary = `${this.filename}.${randomUUID()}.tmp`;
    try {
      writeFileSync(temporary, JSON.stringify(data), { mode: 0o600, flag: 'wx' });
      renameSync(temporary, this.filename);
      this.data = data;
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
    }
  }

  create(address, passwordHash) {
    if (this.get(address)) return false;
    this.commit({ ...this.data, users: { ...this.data.users, [address]: { passwordHash, history: [] } } });
    return true;
  }

  record(address, success, time) {
    const user = this.get(address);
    if (!user) return;
    const history = [...user.history, { success, timestamp: time }].slice(-100);
    this.commit({ ...this.data, users: { ...this.data.users, [address]: { ...user, history } } });
  }
}
