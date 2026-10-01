# =============================================================================
#  HANA-VI 빌드 — "HANA-VI 빌드.bat" 이 실행하는 스크립트
#
#  하는 일
#   1. .NET 10 SDK 가 있는지 확인하고, 없으면 설치를 도와준다 (winget)
#   2. SPT 설치 폴더를 확인한다 (기본 E:\SPT 4.1, 다르면 한 번만 물어보고 기억)
#   3. dotnet build → SPT_Runtime\user\mods 로 자동 복사 + 모드별 release\*.zip 생성
#
#  이 파일은 UTF-8(BOM) 으로 저장해야 한다. BOM 이 없으면 PowerShell 5.1 이 한글을 깨뜨린다.
# =============================================================================

param([switch]$NoPause)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$RepoRoot     = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$SettingsPath = Join-Path $RepoRoot '.editor-settings.json'   # 설정 편집기와 같은 파일을 쓴다
$Solution     = Join-Path $RepoRoot 'Project-HANA-VI-4.1.slnx'

function Say($text, $color = 'Gray') { Write-Host $text -ForegroundColor $color }
function Finish($code) {
    if (-not $NoPause) { Write-Host ''; Read-Host '엔터를 누르면 창이 닫힙니다' | Out-Null }
    exit $code
}

Say ''
Say '==============================================' Cyan
Say '  HANA-VI 4.1 빌드' Cyan
Say '==============================================' Cyan
Say ''

# ---------------------------------------------------------------------------
# 1. .NET 10 SDK
# ---------------------------------------------------------------------------
function Test-Sdk10 {
    $cmd = Get-Command dotnet -ErrorAction SilentlyContinue
    if (-not $cmd) { return $false }
    $sdks = & dotnet --list-sdks 2>$null
    return [bool]($sdks | Where-Object { $_ -match '^10\.' })
}

if (-not (Test-Sdk10)) {
    Say '[1/3] .NET 10 SDK 가 설치돼 있지 않습니다. (C# 코드를 DLL 로 만드는 도구, 한 번만 설치하면 됩니다)' Yellow
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        $ans = Read-Host '지금 자동으로 설치할까요? (Y = 설치 / 그 외 = 취소)'
        if ($ans -match '^[Yy]') {
            Say '설치 중입니다… 관리자 권한 확인 창이 뜨면 [예] 를 눌러 주세요.' Cyan
            & winget install --id Microsoft.DotNet.SDK.10 -e --accept-source-agreements --accept-package-agreements
            # 방금 설치한 dotnet 을 이 창에서도 바로 쓰도록 경로 추가
            $env:PATH = "$env:ProgramFiles\dotnet;$env:PATH"
        }
    } else {
        Say 'winget 이 없어 자동 설치를 할 수 없습니다. 다운로드 페이지를 엽니다.' Yellow
        Say '  → "SDK 10.0.x" 의 Windows x64 설치 파일을 받아 설치한 뒤, 이 파일을 다시 실행하세요.'
        Start-Process 'https://dotnet.microsoft.com/download/dotnet/10.0'
        Finish 1
    }
    if (-not (Test-Sdk10)) {
        Say '.NET 10 SDK 를 찾지 못했습니다. 설치가 끝났다면 이 창을 닫고 다시 실행해 보세요.' Red
        Finish 1
    }
}
Say ('[1/3] .NET SDK 확인 완료 (' + ((& dotnet --version) -join '') + ')') Green

# ---------------------------------------------------------------------------
# 2. SPT 설치 폴더
# ---------------------------------------------------------------------------
$settings = @{ sptRoot = 'E:\SPT 4.1'; applyOnSave = $true }
if (Test-Path $SettingsPath) {
    try {
        $j = [System.IO.File]::ReadAllText($SettingsPath, $Utf8NoBom) | ConvertFrom-Json
        if ($j.sptRoot) { $settings.sptRoot = [string]$j.sptRoot }
        if ($null -ne $j.applyOnSave) { $settings.applyOnSave = [bool]$j.applyOnSave }
    } catch { }
}

$deploy = $true
# Join-Path 는 없는 드라이브(예: E: 가 없는 PC)에서 오류를 내므로 [IO.Path]::Combine 을 쓴다.
while (-not (Test-Path -LiteralPath ([System.IO.Path]::Combine($settings.sptRoot, 'SPT_Runtime', 'user', 'mods')))) {
    Say ("[2/3] '{0}' 에서 SPT 를 찾지 못했습니다 (SPT_Runtime\user\mods 폴더가 없음)." -f $settings.sptRoot) Yellow
    $in = Read-Host 'SPT 설치 폴더를 입력하세요 (예: D:\SPT 4.1 / 그냥 엔터 = 복사 없이 빌드만)'
    if (-not $in) { $deploy = $false; break }
    $settings.sptRoot = $in.Trim().Trim('"').TrimEnd('\')
}
if ($deploy) {
    [System.IO.File]::WriteAllText($SettingsPath, ((New-Object PSObject -Property $settings) | ConvertTo-Json), $Utf8NoBom)
    Say ("[2/3] SPT 폴더: {0}" -f $settings.sptRoot) Green

    # 서버가 켜져 있으면 DLL 을 덮어쓸 수 없다
    $running = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($settings.sptRoot, [StringComparison]::OrdinalIgnoreCase) }
    if ($running) {
        Say ('  ⚠ SPT 프로그램이 켜져 있습니다: ' + (($running | ForEach-Object { $_.ProcessName }) -join ', ')) Yellow
        Read-Host '  서버/런처를 끈 다음 엔터를 누르세요' | Out-Null
    }
} else {
    Say '[2/3] SPT 폴더 없이 빌드만 합니다 (각 모드 폴더의 release\ 에 zip 이 생깁니다).' Yellow
}

# ---------------------------------------------------------------------------
# 3. 빌드
# ---------------------------------------------------------------------------
Say '[3/3] 빌드 중입니다… (처음 한 번은 패키지를 내려받느라 1~3분 걸립니다)' Cyan
Say ''
$buildArgs = @('build', $Solution, '-c', 'Release', '-nologo', '-v:minimal')
if ($deploy) { $buildArgs += ('-p:SptRoot=' + $settings.sptRoot) } else { $buildArgs += '-p:SptRoot=__no_spt__' }
& dotnet @buildArgs 2>&1 | ForEach-Object { $_.ToString() } | Tee-Object -Variable lines
$code = $LASTEXITCODE

Say ''
if ($code -eq 0) {
    Say '==============================================' Green
    Say '  빌드 성공' Green
    Say '==============================================' Green
    if ($deploy) { Say ("  설치 위치: {0}\SPT_Runtime\user\mods\<모드이름>" -f $settings.sptRoot) }
    Say '  배포용 zip:'
    Get-ChildItem -Path (Join-Path $RepoRoot '4.1\*\release\*.zip') -ErrorAction SilentlyContinue |
        ForEach-Object { Say ('    ' + $_.FullName) }
    Say ''
    Say '  SPT 서버를 다시 켜면 적용됩니다.'
    Finish 0
} else {
    Say '==============================================' Red
    Say '  빌드 실패' Red
    Say '==============================================' Red
    $errs = $lines | Where-Object { $_ -match ' error ' } | Select-Object -Unique
    if ($errs) { Say '  오류 줄:' Red; $errs | Select-Object -First 15 | ForEach-Object { Say ('    ' + $_) Red } }
    if (($lines -join "`n") -match 'MSB3021|MSB3026|MSB3027|being used by another process|다른 프로세스') {
        Say '  → SPT 서버가 켜져 있어서 DLL 을 덮어쓰지 못했습니다. 서버를 끄고 다시 실행하세요.' Yellow
    }
    Say '  이 창 내용을 통째로 복사해서 R_F 에게 보내 주세요.'
    Finish 1
}
