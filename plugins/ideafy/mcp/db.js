import { createRequire } from "node:module";
const MIN_NODE = [22, 5];
// Loaded lazily so an old Node reaches the version message below instead of
// failing at link time on an unknown builtin.
function loadSqlite() {
    const [major, minor] = process.versions.node.split(".").map(Number);
    if (major < MIN_NODE[0] || (major === MIN_NODE[0] && minor < MIN_NODE[1])) {
        throw new Error(`Ideafy MCP needs Node ${MIN_NODE.join(".")} or newer (found ${process.versions.node}).`);
    }
    try {
        return createRequire(import.meta.url)("node:sqlite");
    }
    catch {
        // Node 22.5–22.12 ships the module behind a flag.
        throw new Error(`node:sqlite is not available in Node ${process.versions.node}. Start the server with --experimental-sqlite or use Node 22.13+.`);
    }
}
// busy_timeout is not optional: better-sqlite3 waited 5s on a locked DB by
// default, node:sqlite waits 0, so a write landing while the app writes would
// fail straight away with SQLITE_BUSY.
export function openDatabase(path) {
    const { DatabaseSync } = loadSqlite();
    const db = new DatabaseSync(path);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec("PRAGMA busy_timeout = 5000");
    return db;
}
const depth = new WeakMap();
// Runs fn in a transaction and returns its result, rolling back on throw.
// Nested calls become savepoints, as better-sqlite3's db.transaction() did —
// moveCardInChain runs on its own and inside update_card's transaction.
export function transaction(db, fn) {
    const level = depth.get(db) ?? 0;
    const savepoint = `ideafy_tx_${level}`;
    db.exec(level === 0 ? "BEGIN IMMEDIATE" : `SAVEPOINT ${savepoint}`);
    depth.set(db, level + 1);
    try {
        const result = fn();
        db.exec(level === 0 ? "COMMIT" : `RELEASE ${savepoint}`);
        return result;
    }
    catch (error) {
        try {
            db.exec(level === 0 ? "ROLLBACK" : `ROLLBACK TO ${savepoint}; RELEASE ${savepoint}`);
        }
        catch {
            // SQLite may already have rolled back on its own; the original error matters.
        }
        throw error;
    }
    finally {
        depth.set(db, level);
    }
}
