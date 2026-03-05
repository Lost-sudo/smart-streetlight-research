# Git Issue Documentation: Frontend Folder Tracking

## Description of the Error

The `client` (frontend) directory was not properly tracked by the main Git repository. Instead of containing files, it appeared as a **gitlink** (mode `160000` or a "submodule pointer").

In the Git repository index, the folder was logged as a single commit hash rather than a directory of files:

```bash
160000 commit <commit_hash> client
```

### Why It Happened

This usually occurs if:

1.  **Nested Repository**: A `.git` folder was present inside the `client/` directory when it was first added.
2.  **Accidental Initialization**: `git init` was run inside the `client/` folder before adding it to the project root.
3.  **Cached Reference**: The main repository cached the `client` folder as a submodule reference rather than a standard directory.

---

## The Solution

To fix the tracking and include the actual frontend source files, the following steps were taken from the project root:

### 1. Remove the Cached Reference

First, the "gitlink" reference was removed from the Git index without deleting the actual physical files:

```bash
git rm --cached client
```

### 2. Verify No Nested `.git` Folder

Before re-adding, it's critical to ensure there is no hidden `.git` folder inside the `client` directory (as this would cause Git to treat it as a submodule again):

```powershell
# On Windows PowerShell
Remove-Item -Path client\.git -Recurse -Force
```

### 3. Re-add and Commit

After clearing the cache and removing the nested repository metadata, the folder was added as a standard directory:

```bash
git add client
git commit -m "Correctly add frontend files"
```

### 4. Push to Remote

Finally, the changes were pushed to the `master` branch:

```bash
git push -u origin master
```

---

## Outcome

The `client` directory is now correctly tracked in the global repository, and all frontend source code is visible and version-controlled.
