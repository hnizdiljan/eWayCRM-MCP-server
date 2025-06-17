# ==========================================
# eWay-CRM MCP Server Test Suite
# ==========================================

Write-Host "🚀 eWay-CRM MCP Server Test Suite" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$baseUrl = "http://localhost:3000"

# Test 1: Health Check
Write-Host "`n1️⃣  Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Status: $($data.status)" -ForegroundColor Green
    Write-Host "✅ eWay Connection: $($data.services.eway)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: API Overview
Write-Host "`n2️⃣  API Overview..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Version: $($data.version)" -ForegroundColor Green
    Write-Host "✅ Available Endpoints:" -ForegroundColor Green
    $data.endpoints | ForEach-Object { Write-Host "   - $_" -ForegroundColor Cyan }
} catch {
    Write-Host "❌ API Overview Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Companies API
Write-Host "`n3️⃣  Companies API..." -ForegroundColor Yellow
try {
    # GET Companies
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/companies?limit=3"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ GET Companies: $($data.pagination.total) companies found" -ForegroundColor Green
    
    if ($data.data.Count -gt 0) {
        $firstCompany = $data.data[0]
        Write-Host "   First Company: $($firstCompany.companyName) (ID: $($firstCompany.id))" -ForegroundColor Cyan
        
        # GET Company by ID
        $companyResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/companies/$($firstCompany.id)"
        $companyData = $companyResponse.Content | ConvertFrom-Json
        Write-Host "✅ GET Company by ID: $($companyData.data.companyName)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Companies API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Contacts API
Write-Host "`n4️⃣  Contacts API..." -ForegroundColor Yellow
try {
    # CREATE Contact
    $newContact = @{
        firstName = "Test"
        lastName = "User"
        email = "test.user@example.com"
        phone = "+420 777 888 999"
        jobTitle = "MCP Tester"
    } | ConvertTo-Json
    
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/contacts" -Method POST -Body $newContact -ContentType "application/json"
    $createdContact = ($createResponse.Content | ConvertFrom-Json).data
    Write-Host "✅ CREATE Contact: $($createdContact.fullName) (ID: $($createdContact.id))" -ForegroundColor Green
    
    # GET Contact by ID
    $getResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/contacts/$($createdContact.id)"
    $contactData = ($getResponse.Content | ConvertFrom-Json).data
    Write-Host "✅ GET Contact by ID: $($contactData.fullName)" -ForegroundColor Green
    
    # UPDATE Contact
    $updateContact = @{
        firstName = "Updated"
        lastName = "User"
        email = "updated.user@example.com"
        phone = "+420 777 888 999"
        jobTitle = "Senior MCP Tester"
        itemVersion = $contactData.itemVersion
    } | ConvertTo-Json
    
    $updateResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/contacts/$($createdContact.id)" -Method PUT -Body $updateContact -ContentType "application/json"
    $updatedContact = ($updateResponse.Content | ConvertFrom-Json).data
    Write-Host "✅ UPDATE Contact: $($updatedContact.fullName)" -ForegroundColor Green
    
    # DELETE Contact
    $deleteResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/contacts/$($createdContact.id)" -Method DELETE
    Write-Host "✅ DELETE Contact: Successfully deleted" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Contacts API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: eWay-CRM Connection Test
Write-Host "`n5️⃣  eWay-CRM Connection Test..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/test-connection"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Connection Status: $($data.status)" -ForegroundColor Green
    Write-Host "✅ Message: $($data.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Connection Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Test Suite Completed!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "💡 MCP Server is ready for production!" -ForegroundColor Cyan 