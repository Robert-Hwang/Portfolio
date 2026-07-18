[CmdletBinding()]
param(
  [string]$Message = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryPath = Split-Path -Parent $PSScriptRoot
$branchName = "autosave"
$env:GIT_TERMINAL_PROMPT = "0"

function Find-GitExecutable {
  $gitCommand = Get-Command git.exe -ErrorAction SilentlyContinue
  if ($gitCommand) {
    return $gitCommand.Source
  }

  $desktopPattern = Join-Path $env:LOCALAPPDATA "GitHubDesktop\app-*\resources\app\git\cmd\git.exe"
  $desktopGit = Get-ChildItem -Path $desktopPattern -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($desktopGit) {
    return $desktopGit.FullName
  }

  throw "Git executable was not found. Install Git or GitHub Desktop."
}

$gitExe = Find-GitExecutable
$gitBaseArguments = @("-c", "safe.directory=$repositoryPath", "-C", $repositoryPath)

function Invoke-RepositoryGit {
  param([string[]]$Arguments)

  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    $output = & $gitExe @gitBaseArguments @Arguments 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($exitCode -ne 0) {
    $details = ($output | ForEach-Object { $_.ToString() }) -join " | "
    throw "git $($Arguments -join ' ') failed ($exitCode): $details"
  }

  return $output
}

$currentBranch = ((Invoke-RepositoryGit -Arguments @("branch", "--show-current")) -join "").Trim()
if ($currentBranch -ne $branchName) {
  throw "Version saving is allowed only on the '$branchName' branch. Current branch: '$currentBranch'."
}

$status = (Invoke-RepositoryGit -Arguments @("status", "--porcelain")) -join "`n"
if (-not [string]::IsNullOrWhiteSpace($status)) {
  Invoke-RepositoryGit -Arguments @("add", "-A") | Out-Null

  & $gitExe @gitBaseArguments "diff" "--cached" "--quiet"
  $diffExitCode = $LASTEXITCODE

  if ($diffExitCode -eq 1) {
    if ([string]::IsNullOrWhiteSpace($Message)) {
      $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
      $commitMessage = "autosave: $timestamp KST"
    } else {
      $commitMessage = "autosave: $($Message.Trim())"
    }

    Invoke-RepositoryGit -Arguments @("commit", "-m", $commitMessage) | Out-Null
    Write-Host "Created version: $commitMessage"
  } elseif ($diffExitCode -ne 0) {
    throw "git diff --cached --quiet failed ($diffExitCode)"
  }
}

$upstreamOutput = & $gitExe @gitBaseArguments "rev-parse" "--abbrev-ref" "--symbolic-full-name" "@{u}" 2>$null
$upstreamExitCode = $LASTEXITCODE

if ($upstreamExitCode -ne 0) {
  Invoke-RepositoryGit -Arguments @("push", "--set-upstream", "origin", $branchName) | Out-Null
  Write-Host "Pushed '$branchName' to GitHub."
} else {
  $aheadCount = ((Invoke-RepositoryGit -Arguments @("rev-list", "--count", "@{u}..HEAD")) -join "").Trim()
  if ([int]$aheadCount -gt 0) {
    Invoke-RepositoryGit -Arguments @("push", "origin", $branchName) | Out-Null
    Write-Host "Pushed '$branchName' to GitHub."
  } else {
    Write-Host "No unpushed version remains."
  }
}
