# Image Resize Script for Shireen Bakers
# This script resizes all product images to optimal size for web performance

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Shireen Bakers Image Optimizer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Add .NET assembly for image processing
Add-Type -AssemblyName System.Drawing

$imagesPath = "c:\Users\SVC\Desktop\Shireen_Bakers\images"
$backupPath = "c:\Users\SVC\Desktop\Shireen_Bakers\images_backup_original"

# Target sizes
$productSize = 400      # For product images (works great for both mobile 3-col and desktop 4-col)
$categorySize = 400     # For category images
$promoSize = 800        # For promo banners
$logoSize = 200         # For logo

Write-Host "Target sizes:" -ForegroundColor Yellow
Write-Host "  - Product images: ${productSize}x${productSize}px"
Write-Host "  - Category images: ${categorySize}x${categorySize}px"
Write-Host "  - Promo banners: ${promoSize}x${promoSize}px"
Write-Host "  - Logo: ${logoSize}x${logoSize}px"
Write-Host ""

# Create backup directory
if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath | Out-Null
    Write-Host "✓ Created backup directory" -ForegroundColor Green
}

# Get all WebP images
$images = Get-ChildItem -Path $imagesPath -Filter "*.webp" -File

Write-Host "Found $($images.Count) WebP images to process" -ForegroundColor Cyan
Write-Host ""

$resized = 0
$skipped = 0
$errors = 0

foreach ($image in $images) {
    try {
        # Skip if already backed up
        $backupFile = Join-Path $backupPath $image.Name
        if (-not (Test-Path $backupFile)) {
            Copy-Item $image.FullName $backupFile -Force
        }

        # Determine target size based on filename
        $targetSize = $productSize  # Default to product size
        
        if ($image.Name -like "*promo*" -or $image.Name -like "*gift*") {
            $targetSize = $promoSize
        }
        elseif ($image.Name -like "*logo*") {
            $targetSize = $logoSize
        }
        elseif ($image.Name -like "*slideshow*" -or $image.Name -like "*hero*") {
            $targetSize = 1200  # Larger for hero images
        }

        # Load the image
        $img = [System.Drawing.Image]::FromFile($image.FullName)
        
        # Check if resize is needed
        if ($img.Width -le $targetSize -and $img.Height -le $targetSize) {
            Write-Host "  ⊘ $($image.Name) - Already optimal size" -ForegroundColor Gray
            $img.Dispose()
            $skipped++
            continue
        }

        # Calculate new dimensions (maintain aspect ratio)
        $ratio = [Math]::Min($targetSize / $img.Width, $targetSize / $img.Height)
        $newWidth = [int]($img.Width * $ratio)
        $newHeight = [int]($img.Height * $ratio)

        # Create new bitmap
        $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $graphics = [System.Drawing.Graphics]::FromImage($newImg)
        
        # Set high quality rendering
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        
        # Draw resized image
        $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
        
        # Save (note: saving as PNG, you'll need to convert to WebP separately)
        $tempPng = $image.FullName -replace '\.webp$', '_resized.png'
        $newImg.Save($tempPng, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Cleanup
        $graphics.Dispose()
        $newImg.Dispose()
        $img.Dispose()
        
        # Replace original with resized (as PNG for now)
        $originalSize = (Get-Item $image.FullName).Length / 1KB
        Move-Item $tempPng $image.FullName -Force
        $newSize = (Get-Item $image.FullName).Length / 1KB
        $savings = [int](($originalSize - $newSize) / $originalSize * 100)
        
        Write-Host "  ✓ $($image.Name) - ${newWidth}x${newHeight}px (saved ${savings}%)" -ForegroundColor Green
        $resized++
    }
    catch {
        Write-Host "  ✗ $($image.Name) - Error: $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Resized: $resized images" -ForegroundColor Green
Write-Host "  Skipped: $skipped images (already optimal)" -ForegroundColor Gray
Write-Host "  Errors: $errors images" -ForegroundColor Red
Write-Host ""
Write-Host "✓ Original images backed up to: $backupPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Images are now PNG format." -ForegroundColor Yellow
Write-Host "For best performance, convert them to WebP using:" -ForegroundColor Yellow
Write-Host "  - Online: cloudconvert.com/png-to-webp" -ForegroundColor White
Write-Host "  - Tool: cwebp (Google's WebP converter)" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
