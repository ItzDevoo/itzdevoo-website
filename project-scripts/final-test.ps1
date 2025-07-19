#!/usr/bin/env pwsh

# Final Integration Testing and Optimization Script
param(
    [switch]$SkipPerformanceTests = $false,
    [switch]$SkipSecurityTests = $false,
    [switch]$SkipAccessibilityTests = $false,
    [switch]$SkipIntegrationTests = $false,
    [switch]$GenerateReport = $true,
    [switch]$Verbose = $false,
    [string]$OutputPath = "test-results"
)

if ($Verbose) {
    $VerbosePreference = "Continue"
}

$ErrorActionPreference = "Continue"  # Continue on errors to collect all test results

# Test results collection
$TestResults = @{
    StartTime = Get-Date
    EndTime = $null
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
    SkippedTests = 0
    Categories = @{
        Performance = @{ Tests = @(); Passed = 0; Failed = 0; Skipped = 0 }
        Security = @{ Tests = @(); Passed = 0; Failed = 0; Skipped = 0 }
        Accessibility = @{ Tests = @(); Passed = 0; Failed = 0; Skipped = 0 }
        Integration = @{ Tests = @(); Passed = 0; Failed = 0; Skipped = 0 }
        Infrastructure = @{ Tests = @(); Passed = 0; Failed = 0; Skipped = 0 }
    }
    Recommendations = @()
    CriticalIssues = @()
}

Write-Host "🧪 Final Integration Testing and Optimization" -ForegroundColor Green
Write-Host "Test Session: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

# Helper function to add test result
function Add-TestResult {
    param(
        [string]$Category,
        [string]$TestName,
        [string]$Status,  # "Passed", "Failed", "Skipped"
        [string]$Details = "",
        [string]$Recommendation = "",
        [bool]$Critical = $false
    )
    
    $test = @{
        Name = $TestName
        Status = $Status
        Details = $Details
        Timestamp = Get-Date -Format 'HH:mm:ss'
    }
    
    $TestResults.Categories[$Category].Tests += $test
    $TestResults.TotalTests++
    
    switch ($Status) {
        "Passed" { 
            $TestResults.PassedTests++
            $TestResults.Categories[$Category].Passed++
            Write-Host "  ✅ $TestName" -ForegroundColor Green
        }
        "Failed" { 
            $TestResults.FailedTests++
            $TestResults.Categories[$Category].Failed++
            Write-Host "  ❌ $TestName" -ForegroundColor Red
            if ($Details) { Write-Host "     $Details" -ForegroundColor Gray }
            if ($Critical) { $TestResults.CriticalIssues += "$TestName: $Details" }
        }
        "Skipped" { 
            $TestResults.SkippedTests++
            $TestResults.Categories[$Category].Skipped++
            Write-Host "  ⏭️ $TestName (Skipped)" -ForegroundColor Yellow
        }
    }
    
    if ($Recommendation) {
        $TestResults.Recommendations += "$TestName: $Recommendation"
    }
    
    Write-Verbose "Test recorded: $Category/$TestName = $Status"
}

try {
    # Create output directory
    if ($GenerateReport) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
        Write-Verbose "Created output directory: $OutputPath"
    }
    
    # Infrastructure Tests
    Write-Host "`n🏗️ Infrastructure Tests" -ForegroundColor Yellow
    
    # Docker tests
    try {
        docker --version | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Add-TestResult -Category "Infrastructure" -TestName "Docker Available" -Status "Passed"
        } else {
            Add-TestResult -Category "Infrastructure" -TestName "Docker Available" -Status "Failed" -Details "Docker not found" -Critical $true
        }
    } catch {
        Add-TestResult -Category "Infrastructure" -TestName "Docker Available" -Status "Failed" -Details $_.Exception.Message -Critical $true
    }
    
    # Container health test
    try {
        $containerHealth = docker inspect --format='{{.State.Health.Status}}' itzdevoo-website 2>$null
        if ($containerHealth -eq "healthy") {
            Add-TestResult -Category "Infrastructure" -TestName "Container Health" -Status "Passed"
        } else {
            Add-TestResult -Category "Infrastructure" -TestName "Container Health" -Status "Failed" -Details "Container status: $containerHealth" -Critical $true
        }
    } catch {
        Add-TestResult -Category "Infrastructure" -TestName "Container Health" -Status "Failed" -Details "Container not found or not running" -Critical $true
    }
    
    # File structure test
    $requiredFiles = @(
        "index.html", "styles/main.css", "scripts/main.js", 
        "Dockerfile", "docker-compose.yml", "nginx.conf",
        "sw.js", "site.webmanifest", "robots.txt"
    )
    
    $missingFiles = @()
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -eq 0) {
        Add-TestResult -Category "Infrastructure" -TestName "Required Files Present" -Status "Passed"
    } else {
        Add-TestResult -Category "Infrastructure" -TestName "Required Files Present" -Status "Failed" -Details "Missing: $($missingFiles -join ', ')" -Critical $true
    }
    
    # Performance Tests
    if (-not $SkipPerformanceTests) {
        Write-Host "`n⚡ Performance Tests" -ForegroundColor Yellow
        
        # Local connectivity test
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 10 -ErrorAction Stop
            $responseTime = (Measure-Command { Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 10 }).TotalMilliseconds
            
            if ($response.StatusCode -eq 200) {
                Add-TestResult -Category "Performance" -TestName "Local Connectivity" -Status "Passed" -Details "Response time: ${responseTime}ms"
                
                # Response time test
                if ($responseTime -lt 1000) {
                    Add-TestResult -Category "Performance" -TestName "Response Time" -Status "Passed" -Details "${responseTime}ms"
                } else {
                    Add-TestResult -Category "Performance" -TestName "Response Time" -Status "Failed" -Details "${responseTime}ms (>1000ms)" -Recommendation "Optimize server response time"
                }
            } else {
                Add-TestResult -Category "Performance" -TestName "Local Connectivity" -Status "Failed" -Details "Status: $($response.StatusCode)" -Critical $true
            }
        } catch {
            Add-TestResult -Category "Performance" -TestName "Local Connectivity" -Status "Failed" -Details $_.Exception.Message -Critical $true
        }
        
        # Health endpoint test
        try {
            $healthResponse = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 5 -ErrorAction Stop
            if ($healthResponse.StatusCode -eq 200) {
                Add-TestResult -Category "Performance" -TestName "Health Endpoint" -Status "Passed"
            } else {
                Add-TestResult -Category "Performance" -TestName "Health Endpoint" -Status "Failed" -Details "Status: $($healthResponse.StatusCode)"
            }
        } catch {
            Add-TestResult -Category "Performance" -TestName "Health Endpoint" -Status "Failed" -Details $_.Exception.Message
        }
        
        # Asset loading test
        $assets = @("/styles/main.css", "/scripts/main.js", "/sw.js", "/site.webmanifest")
        $assetLoadTimes = @()
        
        foreach ($asset in $assets) {
            try {
                $assetTime = (Measure-Command { 
                    Invoke-WebRequest -Uri "http://localhost:8080$asset" -TimeoutSec 5 -ErrorAction Stop 
                }).TotalMilliseconds
                $assetLoadTimes += $assetTime
                
                if ($assetTime -lt 500) {
                    Add-TestResult -Category "Performance" -TestName "Asset Load Time ($asset)" -Status "Passed" -Details "${assetTime}ms"
                } else {
                    Add-TestResult -Category "Performance" -TestName "Asset Load Time ($asset)" -Status "Failed" -Details "${assetTime}ms (>500ms)" -Recommendation "Optimize asset delivery"
                }
            } catch {
                Add-TestResult -Category "Performance" -TestName "Asset Load Time ($asset)" -Status "Failed" -Details $_.Exception.Message
            }
        }
        
        # Average asset load time
        if ($assetLoadTimes.Count -gt 0) {
            $avgLoadTime = ($assetLoadTimes | Measure-Object -Average).Average
            if ($avgLoadTime -lt 300) {
                Add-TestResult -Category "Performance" -TestName "Average Asset Load Time" -Status "Passed" -Details "${avgLoadTime:F0}ms"
            } else {
                Add-TestResult -Category "Performance" -TestName "Average Asset Load Time" -Status "Failed" -Details "${avgLoadTime:F0}ms (>300ms)" -Recommendation "Implement asset optimization"
            }
        }
        
    } else {
        Add-TestResult -Category "Performance" -TestName "Performance Tests" -Status "Skipped"
    }
    
    # Security Tests
    if (-not $SkipSecurityTests) {
        Write-Host "`n🔒 Security Tests" -ForegroundColor Yellow
        
        # Security headers test
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 10 -ErrorAction Stop
            $headers = $response.Headers
            
            $securityHeaders = @(
                "X-Frame-Options",
                "X-Content-Type-Options", 
                "X-XSS-Protection",
                "Content-Security-Policy",
                "Referrer-Policy"
            )
            
            $missingHeaders = @()
            foreach ($header in $securityHeaders) {
                if (-not $headers.ContainsKey($header)) {
                    $missingHeaders += $header
                }
            }
            
            if ($missingHeaders.Count -eq 0) {
                Add-TestResult -Category "Security" -TestName "Security Headers Present" -Status "Passed"
            } else {
                Add-TestResult -Category "Security" -TestName "Security Headers Present" -Status "Failed" -Details "Missing: $($missingHeaders -join ', ')" -Recommendation "Configure missing security headers"
            }
            
            # HTTPS redirect test (if applicable)
            if ($headers.ContainsKey("Strict-Transport-Security")) {
                Add-TestResult -Category "Security" -TestName "HSTS Header" -Status "Passed"
            } else {
                Add-TestResult -Category "Security" -TestName "HSTS Header" -Status "Failed" -Details "HSTS header missing" -Recommendation "Enable HSTS for production"
            }
            
        } catch {
            Add-TestResult -Category "Security" -TestName "Security Headers Test" -Status "Failed" -Details $_.Exception.Message
        }
        
        # Content Security Policy test
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 10 -ErrorAction Stop
            $cspHeader = $response.Headers["Content-Security-Policy"]
            
            if ($cspHeader) {
                if ($cspHeader -like "*default-src*" -and $cspHeader -like "*script-src*") {
                    Add-TestResult -Category "Security" -TestName "CSP Configuration" -Status "Passed"
                } else {
                    Add-TestResult -Category "Security" -TestName "CSP Configuration" -Status "Failed" -Details "CSP appears incomplete" -Recommendation "Review CSP directives"
                }
            } else {
                Add-TestResult -Category "Security" -TestName "CSP Configuration" -Status "Failed" -Details "CSP header missing" -Critical $true
            }
        } catch {
            Add-TestResult -Category "Security" -TestName "CSP Configuration" -Status "Failed" -Details $_.Exception.Message
        }
        
    } else {
        Add-TestResult -Category "Security" -TestName "Security Tests" -Status "Skipped"
    }
    
    # Accessibility Tests
    if (-not $SkipAccessibilityTests) {
        Write-Host "`n♿ Accessibility Tests" -ForegroundColor Yellow
        
        # HTML structure test
        try {
            $htmlContent = Get-Content "index.html" -Raw
            
            # DOCTYPE test
            if ($htmlContent -match "<!DOCTYPE html>") {
                Add-TestResult -Category "Accessibility" -TestName "HTML5 DOCTYPE" -Status "Passed"
            } else {
                Add-TestResult -Category "Accessibility" -TestName "HTML5 DOCTYPE" -Status "Failed" -Details "Missing or incorrect DOCTYPE" -Critical $true
            }
            
            # Language attribute test
            if ($htmlContent -match '<html[^>]*lang=') {
                Add-TestResult -Category "Accessibility" -TestName "Language Attribute" -Status "Passed"
            } else {
                Add-TestResult -Category "Accessibility" -TestName "Language Attribute" -Status "Failed" -Details "Missing lang attribute on html element" -Recommendation "Add lang='en' to html element"
            }
            
            # Meta viewport test
            if ($htmlContent -match '<meta[^>]*name="viewport"') {
                Add-TestResult -Category "Accessibility" -TestName "Viewport Meta Tag" -Status "Passed"
            } else {
                Add-TestResult -Category "Accessibility" -TestName "Viewport Meta Tag" -Status "Failed" -Details "Missing viewport meta tag" -Critical $true
            }
            
            # Skip link test
            if ($htmlContent -match 'Skip to main content') {
                Add-TestResult -Category "Accessibility" -TestName "Skip Navigation Link" -Status "Passed"
            } else {
                Add-TestResult -Category "Accessibility" -TestName "Skip Navigation Link" -Status "Failed" -Details "Missing skip navigation link" -Recommendation "Add skip to main content link"
            }
            
            # Heading hierarchy test
            $headings = [regex]::Matches($htmlContent, '<h([1-6])[^>]*>')
            $headingLevels = $headings | ForEach-Object { [int]$_.Groups[1].Value }
            
            if ($headingLevels.Count -gt 0) {
                $hierarchyValid = $true
                $lastLevel = 0
                
                foreach ($level in $headingLevels) {
                    if ($level -gt $lastLevel + 1) {
                        $hierarchyValid = $false
                        break
                    }
                    $lastLevel = $level
                }
                
                if ($hierarchyValid) {
                    Add-TestResult -Category "Accessibility" -TestName "Heading Hierarchy" -Status "Passed"
                } else {
                    Add-TestResult -Category "Accessibility" -TestName "Heading Hierarchy" -Status "Failed" -Details "Heading levels skip numbers" -Recommendation "Fix heading hierarchy"
                }
            } else {
                Add-TestResult -Category "Accessibility" -TestName "Heading Hierarchy" -Status "Failed" -Details "No headings found" -Critical $true
            }
            
        } catch {
            Add-TestResult -Category "Accessibility" -TestName "HTML Structure Tests" -Status "Failed" -Details $_.Exception.Message
        }
        
    } else {
        Add-TestResult -Category "Accessibility" -TestName "Accessibility Tests" -Status "Skipped"
    }
    
    # Integration Tests
    if (-not $SkipIntegrationTests) {
        Write-Host "`n🔗 Integration Tests" -ForegroundColor Yellow
        
        # Service Worker test
        try {
            $swResponse = Invoke-WebRequest -Uri "http://localhost:8080/sw.js" -TimeoutSec 5 -ErrorAction Stop
            if ($swResponse.StatusCode -eq 200) {
                Add-TestResult -Category "Integration" -TestName "Service Worker Available" -Status "Passed"
                
                # Check SW cache headers
                $cacheControl = $swResponse.Headers["Cache-Control"]
                if ($cacheControl -and $cacheControl -like "*no-cache*") {
                    Add-TestResult -Category "Integration" -TestName "Service Worker Cache Headers" -Status "Passed"
                } else {
                    Add-TestResult -Category "Integration" -TestName "Service Worker Cache Headers" -Status "Failed" -Details "SW should not be cached" -Recommendation "Set no-cache headers for service worker"
                }
            } else {
                Add-TestResult -Category "Integration" -TestName "Service Worker Available" -Status "Failed" -Details "Status: $($swResponse.StatusCode)"
            }
        } catch {
            Add-TestResult -Category "Integration" -TestName "Service Worker Available" -Status "Failed" -Details $_.Exception.Message
        }
        
        # Web App Manifest test
        try {
            $manifestResponse = Invoke-WebRequest -Uri "http://localhost:8080/site.webmanifest" -TimeoutSec 5 -ErrorAction Stop
            if ($manifestResponse.StatusCode -eq 200) {
                $manifest = $manifestResponse.Content | ConvertFrom-Json
                
                if ($manifest.name -and $manifest.start_url -and $manifest.display) {
                    Add-TestResult -Category "Integration" -TestName "Web App Manifest Valid" -Status "Passed"
                } else {
                    Add-TestResult -Category "Integration" -TestName "Web App Manifest Valid" -Status "Failed" -Details "Missing required manifest properties" -Recommendation "Complete manifest configuration"
                }
            } else {
                Add-TestResult -Category "Integration" -TestName "Web App Manifest Available" -Status "Failed" -Details "Status: $($manifestResponse.StatusCode)"
            }
        } catch {
            Add-TestResult -Category "Integration" -TestName "Web App Manifest" -Status "Failed" -Details $_.Exception.Message
        }
        
        # Robots.txt test
        try {
            $robotsResponse = Invoke-WebRequest -Uri "http://localhost:8080/robots.txt" -TimeoutSec 5 -ErrorAction Stop
            if ($robotsResponse.StatusCode -eq 200 -and $robotsResponse.Content -like "*User-agent:*") {
                Add-TestResult -Category "Integration" -TestName "Robots.txt Valid" -Status "Passed"
            } else {
                Add-TestResult -Category "Integration" -TestName "Robots.txt Valid" -Status "Failed" -Details "Invalid robots.txt content"
            }
        } catch {
            Add-TestResult -Category "Integration" -TestName "Robots.txt Available" -Status "Failed" -Details $_.Exception.Message
        }
        
        # Favicon test
        try {
            $faviconResponse = Invoke-WebRequest -Uri "http://localhost:8080/favicon.ico" -TimeoutSec 5 -ErrorAction Stop
            if ($faviconResponse.StatusCode -eq 200) {
                Add-TestResult -Category "Integration" -TestName "Favicon Available" -Status "Passed"
            } else {
                Add-TestResult -Category "Integration" -TestName "Favicon Available" -Status "Failed" -Details "Status: $($faviconResponse.StatusCode)"
            }
        } catch {
            Add-TestResult -Category "Integration" -TestName "Favicon Available" -Status "Failed" -Details $_.Exception.Message -Recommendation "Add favicon.ico file"
        }
        
    } else {
        Add-TestResult -Category "Integration" -TestName "Integration Tests" -Status "Skipped"
    }
    
    # Finalize results
    $TestResults.EndTime = Get-Date
    $TestResults.Duration = $TestResults.EndTime - $TestResults.StartTime
    
    # Display summary
    Write-Host "`n📊 Test Summary" -ForegroundColor Cyan
    Write-Host "Duration: $($TestResults.Duration.TotalSeconds.ToString('F1')) seconds" -ForegroundColor White
    Write-Host "Total Tests: $($TestResults.TotalTests)" -ForegroundColor White
    Write-Host "✅ Passed: $($TestResults.PassedTests)" -ForegroundColor Green
    Write-Host "❌ Failed: $($TestResults.FailedTests)" -ForegroundColor Red
    Write-Host "⏭️ Skipped: $($TestResults.SkippedTests)" -ForegroundColor Yellow
    
    # Category breakdown
    Write-Host "`n📋 Category Breakdown:" -ForegroundColor Cyan
    foreach ($category in $TestResults.Categories.Keys) {
        $cat = $TestResults.Categories[$category]
        $total = $cat.Passed + $cat.Failed + $cat.Skipped
        if ($total -gt 0) {
            Write-Host "  $category`: $($cat.Passed)✅ $($cat.Failed)❌ $($cat.Skipped)⏭️" -ForegroundColor White
        }
    }
    
    # Critical issues
    if ($TestResults.CriticalIssues.Count -gt 0) {
        Write-Host "`n🚨 Critical Issues:" -ForegroundColor Red
        foreach ($issue in $TestResults.CriticalIssues) {
            Write-Host "  • $issue" -ForegroundColor White
        }
    }
    
    # Recommendations
    if ($TestResults.Recommendations.Count -gt 0) {
        Write-Host "`n💡 Recommendations:" -ForegroundColor Yellow
        foreach ($rec in $TestResults.Recommendations) {
            Write-Host "  • $rec" -ForegroundColor White
        }
    }
    
    # Overall status
    $overallStatus = if ($TestResults.CriticalIssues.Count -eq 0 -and $TestResults.FailedTests -eq 0) {
        "PASSED"
    } elseif ($TestResults.CriticalIssues.Count -eq 0) {
        "PASSED_WITH_WARNINGS"
    } else {
        "FAILED"
    }
    
    Write-Host "`n🎯 Overall Status: $overallStatus" -ForegroundColor $(
        switch ($overallStatus) {
            "PASSED" { "Green" }
            "PASSED_WITH_WARNINGS" { "Yellow" }
            "FAILED" { "Red" }
        }
    )
    
    # Generate report
    if ($GenerateReport) {
        Write-Host "`n📄 Generating test report..." -ForegroundColor Yellow
        
        # JSON report
        $jsonReport = $TestResults | ConvertTo-Json -Depth 10
        $jsonPath = Join-Path $OutputPath "test-results.json"
        Set-Content -Path $jsonPath -Value $jsonReport
        
        # HTML report
        $htmlReport = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ItzDevoo website - Test Results</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; }
        .header { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .category { margin-bottom: 2rem; }
        .category h3 { color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 0.5rem; }
        .test { padding: 0.5rem; margin: 0.25rem 0; border-radius: 4px; }
        .test.passed { background: #d4edda; }
        .test.failed { background: #f8d7da; }
        .test.skipped { background: #fff3cd; }
        .critical { background: #f5c6cb; border-left: 4px solid #dc3545; }
        .recommendations { background: #d1ecf1; padding: 1rem; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ItzDevoo website - Test Results</h1>
        <p>Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
        <p>Duration: $($TestResults.Duration.TotalSeconds.ToString('F1')) seconds</p>
        <p>Overall Status: <strong>$overallStatus</strong></p>
    </div>
    
    <div class="summary">
        <div class="stat">
            <h3>Total Tests</h3>
            <div style="font-size: 2rem; font-weight: bold;">$($TestResults.TotalTests)</div>
        </div>
        <div class="stat passed">
            <h3>Passed</h3>
            <div style="font-size: 2rem; font-weight: bold;">$($TestResults.PassedTests)</div>
        </div>
        <div class="stat failed">
            <h3>Failed</h3>
            <div style="font-size: 2rem; font-weight: bold;">$($TestResults.FailedTests)</div>
        </div>
        <div class="stat skipped">
            <h3>Skipped</h3>
            <div style="font-size: 2rem; font-weight: bold;">$($TestResults.SkippedTests)</div>
        </div>
    </div>
"@
        
        # Add category details
        foreach ($categoryName in $TestResults.Categories.Keys) {
            $category = $TestResults.Categories[$categoryName]
            if ($category.Tests.Count -gt 0) {
                $htmlReport += @"
    <div class="category">
        <h3>$categoryName Tests</h3>
"@
                foreach ($test in $category.Tests) {
                    $cssClass = $test.Status.ToLower()
                    $htmlReport += @"
        <div class="test $cssClass">
            <strong>$($test.Name)</strong> - $($test.Status)
            $(if ($test.Details) { "<br><small>$($test.Details)</small>" })
        </div>
"@
                }
                $htmlReport += "    </div>`n"
            }
        }
        
        # Add critical issues and recommendations
        if ($TestResults.CriticalIssues.Count -gt 0) {
            $htmlReport += @"
    <div class="critical">
        <h3>Critical Issues</h3>
        <ul>
"@
            foreach ($issue in $TestResults.CriticalIssues) {
                $htmlReport += "            <li>$issue</li>`n"
            }
            $htmlReport += "        </ul>`n    </div>`n"
        }
        
        if ($TestResults.Recommendations.Count -gt 0) {
            $htmlReport += @"
    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
"@
            foreach ($rec in $TestResults.Recommendations) {
                $htmlReport += "            <li>$rec</li>`n"
            }
            $htmlReport += "        </ul>`n    </div>`n"
        }
        
        $htmlReport += @"
</body>
</html>
"@
        
        $htmlPath = Join-Path $OutputPath "test-results.html"
        Set-Content -Path $htmlPath -Value $htmlReport
        
        Write-Host "✅ Reports generated:" -ForegroundColor Green
        Write-Host "  • JSON: $jsonPath" -ForegroundColor White
        Write-Host "  • HTML: $htmlPath" -ForegroundColor White
    }
    
    # Exit with appropriate code
    if ($overallStatus -eq "FAILED") {
        exit 1
    } else {
        exit 0
    }
    
} catch {
    Write-Host "`n❌ Test execution failed: $_" -ForegroundColor Red
    Write-Verbose "Full error: $($_.Exception | Format-List -Force | Out-String)"
    exit 1
}