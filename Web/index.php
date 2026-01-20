<?php
/**
 * ZeroTadpole - Main Entry Point
 * Simply serves the static HTML interface
 */

// Get the HTML file path
$htmlFile = __DIR__ . '/index.html';

// Check if file exists and serve it
if (file_exists($htmlFile)) {
    readfile($htmlFile);
} else {
    http_response_code(404);
    echo '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>ZeroTadpole - Erreur</title>
    <style>
        body { 
            font-family: sans-serif; 
            background: #0a1628; 
            color: #fff; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0;
            text-align: center;
        }
        h1 { color: #8ce6de; }
    </style>
</head>
<body>
    <div>
        <h1>🐸 ZeroTadpole</h1>
        <p>Erreur: Le fichier index.html est introuvable.</p>
        <p>Vérifiez que le fichier existe dans le dossier Web/</p>
    </div>
</body>
</html>';
}
