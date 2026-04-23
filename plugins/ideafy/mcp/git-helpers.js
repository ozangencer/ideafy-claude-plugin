import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
// Minimal git helpers used by the ensure_branch tool. Kept separate from
// lib/git.ts because the mcp-server is a standalone package (its own
// rootDir and tsconfig) and cannot import from the Next app tree.
const execFileAsync = promisify(execFile);
export async function git(cwd, ...args) {
    return execFileAsync("git", args, { cwd });
}
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 50);
}
export function generateBranchName(idPrefix, taskNumber, title) {
    return `kanban/${idPrefix}-${taskNumber}-${slugify(title)}`;
}
export async function isGitRepo(cwd) {
    try {
        await git(cwd, "rev-parse", "--git-dir");
        return true;
    }
    catch {
        return false;
    }
}
export async function getCurrentBranch(cwd) {
    try {
        const { stdout } = await git(cwd, "branch", "--show-current");
        return stdout.trim();
    }
    catch {
        return "";
    }
}
export async function branchExists(cwd, branchName) {
    try {
        await git(cwd, "show-ref", "--verify", "--quiet", `refs/heads/${branchName}`);
        return true;
    }
    catch {
        return false;
    }
}
export async function getDefaultBranch(cwd) {
    try {
        const { stdout } = await git(cwd, "symbolic-ref", "refs/remotes/origin/HEAD");
        return stdout.trim().replace("refs/remotes/origin/", "").replace("refs/heads/", "");
    }
    catch {
        try {
            await git(cwd, "show-ref", "--verify", "--quiet", "refs/heads/main");
            return "main";
        }
        catch {
            return "master";
        }
    }
}
export function getWorktreeBaseDir(projectPath) {
    return join(projectPath, ".worktrees", "kanban");
}
export function getWorktreePath(projectPath, branchName) {
    const branchPart = branchName.startsWith("kanban/")
        ? branchName.slice(7)
        : branchName;
    return join(getWorktreeBaseDir(projectPath), branchPart);
}
export async function worktreeExists(projectPath, worktreePath) {
    try {
        if (!existsSync(worktreePath))
            return false;
        const { stdout } = await git(projectPath, "worktree", "list", "--porcelain");
        return stdout.includes(`worktree ${worktreePath}`);
    }
    catch {
        return false;
    }
}
export async function createWorktree(projectPath, branchName) {
    const worktreePath = getWorktreePath(projectPath, branchName);
    const baseDir = getWorktreeBaseDir(projectPath);
    try {
        if (!existsSync(baseDir)) {
            mkdirSync(baseDir, { recursive: true });
        }
        if (await worktreeExists(projectPath, worktreePath)) {
            return { success: true, worktreePath };
        }
        if (await branchExists(projectPath, branchName)) {
            await git(projectPath, "worktree", "add", worktreePath, branchName);
        }
        else {
            const defaultBranch = await getDefaultBranch(projectPath);
            await git(projectPath, "worktree", "add", "-b", branchName, worktreePath, defaultBranch);
        }
        return { success: true, worktreePath };
    }
    catch (error) {
        return {
            success: false,
            worktreePath,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
// Non-worktree mode: create the branch or check it out in the existing cwd.
// Stashes/restores uncommitted changes so a wrong-branch edit doesn't get
// marooned.
export async function ensureBranchInPlace(cwd, branchName) {
    let didStash = false;
    try {
        const { stdout: statusOutput } = await git(cwd, "status", "--porcelain");
        const hasChanges = statusOutput.trim() !== "";
        if (hasChanges) {
            await git(cwd, "stash", "push", "-m", "ideafy-ensure-branch-stash");
            didStash = true;
        }
        if (await branchExists(cwd, branchName)) {
            await git(cwd, "checkout", branchName);
        }
        else {
            const defaultBranch = await getDefaultBranch(cwd);
            await git(cwd, "checkout", defaultBranch);
            await git(cwd, "checkout", "-b", branchName);
        }
        if (didStash) {
            try {
                await git(cwd, "stash", "pop");
            }
            catch {
                return {
                    success: true,
                    error: "Branch ready but stash could not be applied. Run 'git stash pop' manually.",
                };
            }
        }
        return { success: true };
    }
    catch (error) {
        if (didStash) {
            try {
                await git(cwd, "stash", "pop");
            }
            catch {
                // stash remains; surface the original error below
            }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
