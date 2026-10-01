# =============================================================================
#  HANA-VI 설정 편집기 — 로컬 웹 서버
#
#  "HANA-VI 설정 편집기.bat" 이 이 파일을 실행한다. 직접 실행할 필요는 없다.
#
#  - 이 컴퓨터 안에서만 열리는 주소(http://127.0.0.1:포트)로 편집 화면을 띄운다.
#    127.0.0.1 은 "내 컴퓨터 자신"을 뜻하는 주소라서 다른 컴퓨터·인터넷에서는 접속할 수 없다.
#  - 편집 화면(index.html)이 JSON 을 읽고 고치며, 이 서버는 파일 읽기/쓰기/백업/빌드만 한다.
#  - Windows 기본 PowerShell 5.1 로 돌아가도록 썼다 (설치할 것 없음).
#  - 이 파일은 UTF-8(BOM) 으로 저장해야 한다. BOM 이 없으면 PowerShell 5.1 이 한글을 깨뜨린다.
# =============================================================================

param(
    [int]$Port = 8642,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$RepoRoot     = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$EditorDir    = $PSScriptRoot
$SettingsPath = Join-Path $RepoRoot '.editor-settings.json'
$BackupRoot   = Join-Path $RepoRoot '.editor-backup'
$Solution     = Join-Path $RepoRoot 'Project-HANA-VI-4.1.slnx'

# 편집해도 되는 파일만 허용한다 (그 밖의 경로는 읽기/쓰기 모두 거부).
# 로케일(아이템 이름표)은 패처에서 새 아이템 이름을 넣을 때 쓴다.
$WritablePattern = '^4\.1/[A-Za-z0-9_.\-]+/mod/(config\.json|db/(values|packs|ammo)\.json|db/patches/[A-Za-z0-9_.\-]+\.json|db/locales/global/[a-z\-]+\.json)$'
# 새로 만들기 / 삭제는 패치 파일과 로케일만
$CreatablePattern = '^4\.1/[A-Za-z0-9_.\-]+/mod/db/(patches/[A-Za-z0-9_.\-]+|locales/global/[a-z\-]+)\.json$'
$DeletablePattern = '^4\.1/[A-Za-z0-9_.\-]+/mod/db/patches/[A-Za-z0-9_.\-]+\.json$'

# 브라우저 밖의 웹사이트가 이 서버에 몰래 요청을 보내지 못하게 하는 1회용 암호.
$Token = [Guid]::NewGuid().ToString('N')

# ----------------------------------------------------------------------------
#  설정 (SPT 설치 경로)
# ----------------------------------------------------------------------------
function Get-Settings {
    $s = @{ sptRoot = 'E:\SPT 4.1'; applyOnSave = $true }
    if (Test-Path $SettingsPath) {
        try {
            $j = [System.IO.File]::ReadAllText($SettingsPath, $Utf8NoBom) | ConvertFrom-Json
            if ($j.sptRoot) { $s.sptRoot = [string]$j.sptRoot }
            if ($null -ne $j.applyOnSave) { $s.applyOnSave = [bool]$j.applyOnSave }
        } catch { }
    }
    return $s
}

function Save-Settings($s) {
    $json = (New-Object PSObject -Property $s) | ConvertTo-Json
    [System.IO.File]::WriteAllText($SettingsPath, $json, $Utf8NoBom)
}

# Join-Path 는 없는 드라이브(예: E: 가 없는 PC)에서 오류를 내므로 SPT 경로는 [IO.Path]::Combine 으로 붙인다.
function Get-ModsDir($s) { return [System.IO.Path]::Combine($s.sptRoot, 'SPT_Runtime', 'user', 'mods') }

# SPT 원본 아이템 이름표(kr.json). 설치 위치가 버전마다 조금 달라서 후보를 차례로 본다.
function Find-GameLocale($s, [string]$lang) {
    $candidates = @(
        [System.IO.Path]::Combine($s.sptRoot, "SPT_Runtime\SPT_Data\database\locales\global\$lang.json"),
        [System.IO.Path]::Combine($s.sptRoot, "SPT_Data\database\locales\global\$lang.json"),
        [System.IO.Path]::Combine($s.sptRoot, "SPT_Runtime\SPT_Data\Server\database\locales\global\$lang.json"),
        [System.IO.Path]::Combine($s.sptRoot, "SPT_Data\Server\database\locales\global\$lang.json")
    )
    foreach ($c in $candidates) { if (Test-Path -LiteralPath $c) { return $c } }
    return $null
}

# ----------------------------------------------------------------------------
#  아주 작은 HTTP 서버 (TcpListener) — 관리자 권한/포트 예약 없이 127.0.0.1 에만 열린다.
# ----------------------------------------------------------------------------
function Read-Request($client) {
    $stream = $client.GetStream()
    $stream.ReadTimeout = 15000
    $buf = New-Object byte[] 65536
    $ms = New-Object System.IO.MemoryStream
    $headerEnd = -1
    while ($headerEnd -lt 0) {
        $n = $stream.Read($buf, 0, $buf.Length)
        if ($n -le 0) { return $null }
        $ms.Write($buf, 0, $n)
        $all = $ms.ToArray()
        for ($i = 3; $i -lt $all.Length; $i++) {
            if ($all[$i-3] -eq 13 -and $all[$i-2] -eq 10 -and $all[$i-1] -eq 13 -and $all[$i] -eq 10) { $headerEnd = $i + 1; break }
        }
        if ($ms.Length -gt 1MB -and $headerEnd -lt 0) { return $null }
    }
    $all = $ms.ToArray()
    $headText = [System.Text.Encoding]::ASCII.GetString($all, 0, $headerEnd)
    $lines = $headText -split "`r`n"
    $first = $lines[0] -split ' '
    $headers = @{}
    foreach ($l in $lines[1..($lines.Length - 1)]) {
        $idx = $l.IndexOf(':')
        if ($idx -gt 0) { $headers[$l.Substring(0, $idx).Trim().ToLowerInvariant()] = $l.Substring($idx + 1).Trim() }
    }
    $len = 0
    if ($headers.ContainsKey('content-length')) { $len = [int]$headers['content-length'] }
    $body = New-Object System.IO.MemoryStream
    $already = $all.Length - $headerEnd
    if ($already -gt 0) { $body.Write($all, $headerEnd, $already) }
    while ($body.Length -lt $len) {
        $n = $stream.Read($buf, 0, [Math]::Min($buf.Length, $len - $body.Length))
        if ($n -le 0) { break }
        $body.Write($buf, 0, $n)
    }
    $target = $first[1]
    $path = $target; $query = @{}
    $q = $target.IndexOf('?')
    if ($q -ge 0) {
        $path = $target.Substring(0, $q)
        foreach ($pair in $target.Substring($q + 1) -split '&') {
            $kv = $pair -split '=', 2
            if ($kv.Length -eq 2) { $query[[Uri]::UnescapeDataString($kv[0])] = [Uri]::UnescapeDataString($kv[1].Replace('+', ' ')) }
        }
    }
    return @{
        Method  = $first[0]
        Path    = $path
        Query   = $query
        Headers = $headers
        Body    = $Utf8NoBom.GetString($body.ToArray())
        Stream  = $stream
    }
}

function Send-Response($req, [int]$status, [string]$contentType, $bodyBytes) {
    $reason = @{ 200 = 'OK'; 400 = 'Bad Request'; 403 = 'Forbidden'; 404 = 'Not Found'; 500 = 'Internal Server Error' }[$status]
    $head = "HTTP/1.1 $status $reason`r`nContent-Type: $contentType`r`nContent-Length: $($bodyBytes.Length)`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n"
    $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
    $req.Stream.Write($hb, 0, $hb.Length)
    if ($bodyBytes.Length -gt 0) { $req.Stream.Write($bodyBytes, 0, $bodyBytes.Length) }
    $req.Stream.Flush()
}

function Send-Text($req, [int]$status, [string]$contentType, [string]$text) {
    Send-Response $req $status $contentType ($Utf8NoBom.GetBytes($text))
}

function Send-Json($req, $obj, [int]$status = 200) {
    $json = $obj | ConvertTo-Json -Depth 6 -Compress
    Send-Text $req $status 'application/json; charset=utf-8' $json
}

# 저장소 기준 상대 경로를 검사해서 실제 경로로 바꾼다. 허용 목록 밖이면 $null.
function Resolve-RepoFile([string]$rel, [string]$pattern) {
    if (-not $rel) { return $null }
    $rel = $rel.Replace('\', '/')
    if ($rel.Contains('..')) { return $null }
    if ($rel -notmatch $pattern) { return $null }
    return (Join-Path $RepoRoot ($rel.Replace('/', '\')))
}

# 4.1/<모드>/mod/<나머지>  →  <SPT>\SPT_Runtime\user\mods\<모드>\<나머지>
function Get-DeployedPath($s, [string]$rel) {
    $m = [regex]::Match($rel, '^4\.1/([^/]+)/mod/(.+)$')
    if (-not $m.Success) { return $null }
    $modDir = [System.IO.Path]::Combine((Get-ModsDir $s), $m.Groups[1].Value)
    if (-not (Test-Path -LiteralPath $modDir)) { return $null }
    return [System.IO.Path]::Combine($modDir, $m.Groups[2].Value.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
}

# 문법 검사는 편집 화면(브라우저)이 저장 전에 한다. 여기서는 빈 내용/엉뚱한 내용만 막는다.
# (PowerShell 5.1 의 ConvertFrom-Json 은 대소문자만 다른 키가 있으면 멀쩡한 JSON 도 거부해서 쓰지 않는다)
function Test-JsonShape([string]$text) {
    $t = $text.Trim()
    if ($t.Length -lt 2) { return $false }
    return (($t[0] -eq '{' -and $t[-1] -eq '}') -or ($t[0] -eq '[' -and $t[-1] -eq ']'))
}

# 백업: .editor-backup\<날짜-시간>\<원래 경로>
function Backup-RepoFile([string]$rel, [string]$full) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $bak = Join-Path (Join-Path $BackupRoot $stamp) ($rel.Replace('/', '\'))
    New-Item -ItemType Directory -Force -Path (Split-Path $bak) | Out-Null
    Copy-Item -LiteralPath $full -Destination $bak -Force
    return $bak
}

# 저장소 파일을 쓰고, 설정이 켜져 있으면 설치된 SPT 모드 폴더의 같은 파일도 쓴다.
function Write-RepoFile($s, [string]$rel, [string]$full, [string]$body, $bak) {
    [System.IO.File]::WriteAllText($full, $body, $Utf8NoBom)
    $applied = $null; $applyError = $null
    if ($s.applyOnSave) {
        $dst = Get-DeployedPath $s $rel
        if ($dst) {
            try {
                New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
                [System.IO.File]::WriteAllText($dst, $body, $Utf8NoBom)
                $applied = $dst
            } catch { $applyError = $_.Exception.Message }
        }
    }
    Write-Host ("[저장] {0}" -f $rel) -ForegroundColor Green
    if ($applied) { Write-Host ("       → SPT 에도 적용: {0}" -f $applied) -ForegroundColor DarkGreen }
    return @{ ok = $true; backup = $bak; applied = $applied; applyError = $applyError }
}

function Get-FileList {
    $list = New-Object System.Collections.ArrayList
    $base = Join-Path $RepoRoot '4.1'
    foreach ($proj in Get-ChildItem -LiteralPath $base -Directory) {
        $mod = Join-Path $proj.FullName 'mod'
        if (-not (Test-Path -LiteralPath $mod)) { continue }
        $files = @()
        $files += Get-ChildItem -LiteralPath $mod -Filter 'config.json' -File -ErrorAction SilentlyContinue
        $db = Join-Path $mod 'db'
        if (Test-Path -LiteralPath $db) {
            foreach ($n in 'values.json', 'packs.json', 'ammo.json') {
                $files += Get-ChildItem -LiteralPath $db -Filter $n -File -ErrorAction SilentlyContinue
            }
            $p = Join-Path $db 'patches'
            if (Test-Path -LiteralPath $p) { $files += Get-ChildItem -LiteralPath $p -Filter '*.json' -File | Sort-Object Name }
            $loc = Join-Path $db 'locales\global'
            if (Test-Path -LiteralPath $loc) { $files += Get-ChildItem -LiteralPath $loc -Filter '*.json' -File }
        }
        foreach ($f in $files) {
            $rel = $f.FullName.Substring($RepoRoot.Length + 1).Replace('\', '/')
            [void]$list.Add(@{ mod = $proj.Name; path = $rel })
        }
    }
    return , $list.ToArray()
}

# ----------------------------------------------------------------------------
#  빌드 (편집 화면의 [빌드 + 배포] 버튼)
# ----------------------------------------------------------------------------
function Invoke-Build($s) {
    $dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
    if (-not $dotnet) {
        return @{ ok = $false; log = ".NET SDK 가 설치돼 있지 않습니다. 먼저 'HANA-VI 빌드.bat' 을 한 번 실행해서 설치하세요." }
    }
    $prop = '-p:SptRoot=' + $s.sptRoot.TrimEnd('\')
    $out = & dotnet build $Solution -c Release -nologo -v:minimal $prop 2>&1 | Out-String
    $code = $LASTEXITCODE
    $hint = ''
    if ($code -ne 0 -and $out -match 'MSB3021|MSB3026|MSB3027|being used by another process|다른 프로세스') {
        $hint = "SPT 서버가 켜져 있어서 DLL 을 덮어쓰지 못했습니다. 서버를 끈 뒤 다시 빌드하세요."
    }
    return @{ ok = ($code -eq 0); log = $out; hint = $hint }
}

# ----------------------------------------------------------------------------
#  요청 처리
# ----------------------------------------------------------------------------
function Handle-Request($req) {
    # 다른 웹사이트가 주소를 바꿔치기해서 들어오는 것(DNS 리바인딩) 차단
    $hostHeader = $req.Headers['host']
    if ($hostHeader -ne "127.0.0.1:$Port" -and $hostHeader -ne "localhost:$Port") {
        Send-Text $req 403 'text/plain; charset=utf-8' 'forbidden host'; return $true
    }

    if ($req.Method -eq 'GET' -and ($req.Path -eq '/' -or $req.Path -eq '/index.html')) {
        $html = [System.IO.File]::ReadAllText((Join-Path $EditorDir 'index.html'), $Utf8NoBom)
        $html = $html.Replace('__EDITOR_TOKEN__', $Token)
        Send-Text $req 200 'text/html; charset=utf-8' $html
        return $true
    }

    if (-not $req.Path.StartsWith('/api/')) { Send-Text $req 404 'text/plain' 'not found'; return $true }

    # API 는 전부 토큰이 있어야 한다 (사용자 정의 헤더라 다른 사이트의 몰래 요청은 브라우저가 막는다).
    if ($req.Headers['x-editor-token'] -ne $Token) { Send-Text $req 403 'text/plain' 'bad token'; return $true }

    $s = Get-Settings
    switch ("$($req.Method) $($req.Path)") {
        'GET /api/info' {
            $modsDir = Get-ModsDir $s
            $deployed = @{}
            foreach ($f in (Get-ChildItem -LiteralPath (Join-Path $RepoRoot '4.1') -Directory)) {
                if (Test-Path -LiteralPath (Join-Path $f.FullName 'mod')) {
                    $deployed[$f.Name] = (Test-Path -LiteralPath ([System.IO.Path]::Combine($modsDir, $f.Name)))
                }
            }
            Send-Json $req @{
                repoRoot     = $RepoRoot
                sptRoot      = $s.sptRoot
                applyOnSave  = $s.applyOnSave
                modsDirFound = (Test-Path -LiteralPath $modsDir)
                deployed     = $deployed
                gameLocale   = [bool](Find-GameLocale $s 'kr')
                dotnet       = [bool](Get-Command dotnet -ErrorAction SilentlyContinue)
            }
        }
        'GET /api/files' { Send-Json $req @{ files = (Get-FileList) } }
        'GET /api/file' {
            $full = Resolve-RepoFile $req.Query['path'] $WritablePattern
            if (-not $full -or -not (Test-Path -LiteralPath $full)) { Send-Json $req @{ error = '허용되지 않았거나 없는 파일' } 404; break }
            Send-Text $req 200 'text/plain; charset=utf-8' ([System.IO.File]::ReadAllText($full, $Utf8NoBom))
        }
        'GET /api/gamelocale' {
            $lang = $req.Query['lang']; if ($lang -notmatch '^[a-z\-]{2,6}$') { $lang = 'kr' }
            $p = Find-GameLocale $s $lang
            if (-not $p) { Send-Text $req 404 'text/plain' ''; break }
            Send-Response $req 200 'application/json; charset=utf-8' ([System.IO.File]::ReadAllBytes($p))
        }
        'POST /api/file' {
            $rel = $req.Query['path']
            $full = Resolve-RepoFile $rel $WritablePattern
            if (-not $full -or -not (Test-Path -LiteralPath $full)) { Send-Json $req @{ ok = $false; error = '허용되지 않은 파일입니다' } 400; break }
            if (-not (Test-JsonShape $req.Body)) {
                Send-Json $req @{ ok = $false; error = '내용이 JSON 이 아니라서 저장하지 않았습니다' } 400; break
            }
            $bak = Backup-RepoFile $rel $full
            Send-Json $req (Write-RepoFile $s $rel $full $req.Body $bak)
        }
        'POST /api/newfile' {
            $rel = $req.Query['path']
            $full = Resolve-RepoFile $rel $CreatablePattern
            if (-not $full) { Send-Json $req @{ ok = $false; error = '여기에는 새 파일을 만들 수 없습니다' } 400; break }
            if (Test-Path -LiteralPath $full) { Send-Json $req @{ ok = $false; error = '같은 이름의 파일이 이미 있습니다' } 400; break }
            if (-not (Test-JsonShape $req.Body)) { Send-Json $req @{ ok = $false; error = '내용이 JSON 이 아니라서 만들지 않았습니다' } 400; break }
            New-Item -ItemType Directory -Force -Path (Split-Path $full) | Out-Null
            Send-Json $req (Write-RepoFile $s $rel $full $req.Body $null)
        }
        'POST /api/deletefile' {
            $rel = $req.Query['path']
            $full = Resolve-RepoFile $rel $DeletablePattern
            if (-not $full -or -not (Test-Path -LiteralPath $full)) { Send-Json $req @{ ok = $false; error = '삭제할 수 없는 파일입니다' } 400; break }
            # 지우지 않고 백업 폴더로 옮긴다. 설치된 SPT 쪽 사본도 같이 옮겨야 서버가 더 이상 읽지 않는다.
            $bak = Backup-RepoFile $rel $full
            Remove-Item -LiteralPath $full -Force
            $removedDeployed = $null
            $dst = Get-DeployedPath $s $rel
            if ($dst -and (Test-Path -LiteralPath $dst)) {
                $dbak = $bak + '.spt-installed'
                Move-Item -LiteralPath $dst -Destination $dbak -Force
                $removedDeployed = $dst
            }
            Write-Host ("[삭제] {0} (백업: {1})" -f $rel, $bak) -ForegroundColor Yellow
            Send-Json $req @{ ok = $true; backup = $bak; removedDeployed = $removedDeployed }
        }
        'POST /api/settings' {
            try { $j = $req.Body | ConvertFrom-Json } catch { Send-Json $req @{ ok = $false } 400; break }
            if ($j.sptRoot) { $s.sptRoot = ([string]$j.sptRoot).Trim().Trim('"').TrimEnd('\') }
            if ($null -ne $j.applyOnSave) { $s.applyOnSave = [bool]$j.applyOnSave }
            Save-Settings $s
            Send-Json $req @{ ok = $true }
        }
        'POST /api/build' {
            Write-Host '[빌드] 시작합니다… (1~3분)' -ForegroundColor Cyan
            $r = Invoke-Build $s
            if ($r.ok) { Write-Host '[빌드] 성공' -ForegroundColor Green } else { Write-Host '[빌드] 실패 — 편집 화면에서 로그를 확인하세요' -ForegroundColor Red }
            Send-Json $req $r
        }
        'POST /api/shutdown' {
            Send-Json $req @{ ok = $true }
            return $false
        }
        default { Send-Json $req @{ error = 'unknown api' } 404 }
    }
    return $true
}

# ----------------------------------------------------------------------------
#  시작
# ----------------------------------------------------------------------------
$listener = $null
for ($p = $Port; $p -lt $Port + 20; $p++) {
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $p)
        $listener.Start()
        $Port = $p
        break
    } catch { $listener = $null }
}
if (-not $listener) {
    Write-Host "빈 포트를 찾지 못했습니다 ($Port ~ $($Port + 19))." -ForegroundColor Red
    exit 1
}

$url = "http://127.0.0.1:$Port/"
Write-Host ''
Write-Host '  HANA-VI 설정 편집기가 켜졌습니다.' -ForegroundColor Cyan
Write-Host "  주소: $url   (이 컴퓨터에서만 열립니다)"
Write-Host '  다 쓰셨으면 편집 화면의 [편집기 끄기] 를 누르거나 이 창을 닫으세요.'
Write-Host ''
if (-not $NoBrowser) { Start-Process $url }

$running = $true
try {
    while ($running) {
        if (-not $listener.Pending()) { Start-Sleep -Milliseconds 40; continue }
        $client = $listener.AcceptTcpClient()
        try {
            $req = Read-Request $client
            if ($req) { $running = Handle-Request $req }
        } catch {
            Write-Host ("[오류] {0}" -f $_.Exception.Message) -ForegroundColor Red
            try { if ($req) { Send-Json $req @{ ok = $false; error = $_.Exception.Message } 500 } } catch { }
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
    Write-Host '편집기를 종료했습니다.'
}
