# Nome do arquivo final sem acentos para evitar erro de encoding
$output = "RESUMO_PARA_GEMINI.txt"
"=== REVISAO DE CODIGO: PROJETO DOC-AI ===" | Out-File -FilePath $output -Encoding utf8

# Pastas a ignorar
$exclude = @("node_modules", ".git", "venv", "dist")

# Busca arquivos relevantes
$arquivos = Get-ChildItem -Recurse -Include "*.js", ".env", "*.py" | Where-Object { 
    $path = $_.FullName
    $keep = $true
    foreach ($dir in $exclude) { if ($path -like "*\$dir\*") { $keep = $false } }
    $keep
}

foreach ($file in $arquivos) {
    "`n`n--- INICIO ARQUIVO: $($file.Name) ---" | Out-File -FilePath $output -Append -Encoding utf8
    "Caminho: $($file.FullName)" | Out-File -FilePath $output -Append -Encoding utf8
    "---------------------------------------" | Out-File -FilePath $output -Append -Encoding utf8
    Get-Content $file.FullName | Out-File -FilePath $output -Append -Encoding utf8
}

Write-Host "Pronto! O arquivo '$output' foi gerado com sucesso." -ForegroundColor Green
Write-Host "Agora e so abrir esse arquivo, copiar o conteudo e colar aqui." -ForegroundColor Yellow