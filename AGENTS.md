# Portfolio repository instructions

- Use the `autosave` branch for requested source or content changes. Never push an in-progress patch directly to `main`.
- Treat one fully implemented and verified user-requested change set as one patch and one saved version.
- After the patch is complete and checks pass, run the command below from the repository root. Replace the message with a concise patch summary.

  ```powershell
  powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File ".\tools\SavePortfolioVersion.ps1" -Message "concise patch summary"
  ```

- Run the version-saving command only after a patch is complete, not after every file save or intermediate edit.
- Do not create a commit for read-only inspection, diagnosis, or explanation.
- If the current branch is not `autosave`, or if a commit or push fails, report it instead of silently switching branches or pushing `main`.
