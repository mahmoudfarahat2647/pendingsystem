#!/usr/bin/env pwsh
# Renault System - Quick Commit Helper
# Usage: .\scripts\quick-commit.ps1 "your commit message"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

Write-Host "🚀 Quick Commit Helper" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Stage all changes
Write-Host "`n📦 Staging changes..." -ForegroundColor Yellow
git add .

# Commit (pre-commit hook will auto-format)
Write-Host "`n💾 Committing..." -ForegroundColor Yellow
git commit -m $Message

# Check if commit was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Commit successful!" -ForegroundColor Green
    
    # Ask if user wants to push
    $push = Read-Host "`nPush to remote? (y/n)"
    if ($push -eq "y" -or $push -eq "Y") {
        Write-Host "`n🚀 Pushing to remote..." -ForegroundColor Yellow
        git push
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Push successful!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Push failed!" -ForegroundColor Red
        }
    } else {
        Write-Host "`nℹ️  Skipped push. Run 'git push' manually when ready." -ForegroundColor Blue
    }
} else {
    Write-Host "`n❌ Commit failed! Check errors above." -ForegroundColor Red
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
