# =========================================================
# MoldCutterSearch SMART UPDATE SCRIPT
# Autor: AntiGravity
# Script này được tối ưu để CHỈ CẬP NHẬT MÃ NGUỒN 
# giữ nguyên cấu trúc dữ liệu Data và Lịch sử Git
# =========================================================
$ErrorActionPreference = "Stop"

$workspace = "F:\AntiGravity\MoldCutterSearch"
$timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$deployRepo = "F:\AntiGravity\Releases\MoldCutterSearch_SmartUpdate_$timestamp"
$indexFile = "$workspace\index.html"

Write-Host ">>> [1/4] KẾT NỐI VÀ SAO CHÉP MÃ NGUỒN GITHUB HIỆN TẠI..." -ForegroundColor Cyan

New-Item -ItemType Directory -Path $deployRepo | Out-Null
Set-Location $deployRepo
git clone https://github.com/toanysd/MoldCutterSearch.git . | Out-Null

Write-Host ">>> [2/4] QUÉT VÀ CẬP NHẬT MÃ NGUỒN TỪ WORKSPACE..." -ForegroundColor Cyan

$content = Get-Content $indexFile -Raw
$filesToCopy = @("index.html")

# Quét file
$scriptMatches = [regex]::Matches($content, 'src="([^"]+\.js(?:\?v=[^"]+)?)"')
foreach ($m in $scriptMatches) {
    $r = $m.Groups[1].Value -replace '\?.*$', ''
    if (-not $r.StartsWith("http")) { $filesToCopy += $r }
}
$linkMatches = [regex]::Matches($content, 'href="([^"]+\.(?:css|png|ico)(?:\?v=[^"]+)?)"')
foreach ($m in $linkMatches) {
    $r = $m.Groups[1].Value -replace '\?.*$', ''
    if (-not $r.StartsWith("http")) { $filesToCopy += $r }
}
$metaMatches = [regex]::Matches($content, '<meta\s+name="deploy-include"\s+content="([^"]+)"')
foreach ($m in $metaMatches) {
    $raw = $m.Groups[1].Value -replace '/$', ''
    $filesToCopy += $raw
}
$filesToCopy = $filesToCopy | Select-Object -Unique

foreach ($file in $filesToCopy) {
    $srcPath = Join-Path $workspace $file
    $dstPath = Join-Path $deployRepo $file

    if (Test-Path $srcPath) {
        if ((Get-Item $srcPath) -is [System.IO.DirectoryInfo]) {
            $dstParent = Split-Path $dstPath -Parent
            if (-not (Test-Path $dstParent)) { New-Item -ItemType Directory -Path $dstParent -Force | Out-Null }
            Copy-Item -Path $srcPath -Destination $dstParent -Recurse -Force | Out-Null
            if (Test-Path "$dstPath\node_modules") { Remove-Item "$dstPath\node_modules" -Recurse -Force }
            if (Test-Path "$dstPath\.env") { Remove-Item "$dstPath\.env" -Force }
            Write-Host "  [+] Đã mang theo Thư mục: $file"
        } else {
            $parent = Split-Path $dstPath -Parent
            if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
            Copy-Item -Path $srcPath -Destination $dstPath -Force | Out-Null
            Write-Host "  [+] Copy file: $file"
        }
    } else {
        Write-Host "  [-] Bỏ qua (không tồn tại): $file" -ForegroundColor Yellow
    }
}

Write-Host ">>> [3/4] KIỂM TRA VÀ GHI NHẬN THAY ĐỔI (COMMIT)..." -ForegroundColor Cyan
Set-Location $deployRepo
git add -A

# Kiểm tra xem có thay đổi nào không trước khi commit
$status = git status --porcelain
if ($status) {
    git commit -m "Auto Update: Cập nhật sửa lỗi giao diện và bảo mật từ máy chủ"
    
    Write-Host ">>> [4/4] ĐẨY CHUNG LÊN GITHUB (KHÔNG ẢNH HƯỞNG DATA)..." -ForegroundColor Cyan
    git push origin main
    
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host "CẬP NHẬT MÃ NGUỒN THÀNH CÔNG! KHÔNG ẢNH HƯỞNG DATA" -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Green
} else {
    Write-Host "=========================================================" -ForegroundColor Yellow
    Write-Host "KHÔNG PHÁT HIỆN THAY ĐỔI NÀO ĐỂ CẬP NHẬT LÊN GITHUB." -ForegroundColor Yellow
    Write-Host "=========================================================" -ForegroundColor Yellow
}
