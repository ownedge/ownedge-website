<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * Guestbook Backend
 */

$entries_file = 'guestbook-entries.json';

// CORS Implementation
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Helpers
function fetch_data($file) {
    if (!file_exists($file)) return [];
    $content = @file_get_contents($file);
    if ($content === false) return [];
    return json_decode($content, true) ?: [];
}

function save_data($file, $data) {
    return file_put_contents($file, json_encode($data), LOCK_EX);
}

// Ensure file exists
if (!file_exists($entries_file)) save_data($entries_file, []);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(fetch_data($entries_file));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $newEntry = json_decode($json, true);
    
    if ($newEntry && isset($newEntry['message']) && isset($newEntry['rating'])) {
        // Validation
        $message = trim(substr($newEntry['message'], 0, 256));
        $rating = max(0, min(5, (int)$newEntry['rating']));
        $name = trim(substr($newEntry['name'] ?? 'ANONYMOUS', 0, 32));

        $entries = fetch_data($entries_file);
        
        $entry = [
            'id' => microtime(true) . rand(),
            'name' => $name,
            'message' => $message,
            'rating' => $rating,
            'timestamp' => date('c')
        ];
        
        $entries[] = $entry;
        // Keep last 200 entries
        save_data($entries_file, array_slice($entries, -200));
        
        http_response_code(201);
        echo json_encode($entry);
        exit;
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid entry data"]);
        exit;
    }
}

http_response_code(404);
echo json_encode(["error" => "Method Not Found"]);
