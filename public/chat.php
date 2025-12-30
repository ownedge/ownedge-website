<?php
/**
 * Simple PHP Chat Backend
 * Stores history in chat-log.json
 */

$log_file = 'chat-log.json';

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Ensure log file exists
if (!file_exists($log_file)) {
    file_put_contents($log_file, json_encode([]));
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $content = file_get_contents($log_file);
    header('Content-Type: application/json');
    echo $content ?: '[]';
    exit;
}

if ($method === 'POST') {
    $json = file_get_contents('php://input');
    $newMessage = json_decode($json, true);
    
    if ($newMessage) {
        $messages = json_decode(file_get_contents($log_file), true);
        if (!$messages) $messages = [];
        
        // Add consistent ID and timestamp
        $newMessage['id'] = microtime(true) . rand();
        if (!isset($newMessage['timestamp'])) {
            $newMessage['timestamp'] = date('c');
        }
        
        $messages[] = $newMessage;
        
        // Limit history to 100 messages
        $messages = array_slice($messages, -100);
        
        file_put_contents($log_file, json_encode($messages));
        
        header('Content-Type: application/json', true, 201);
        echo json_encode($newMessage);
        exit;
    } else {
        http_response_code(400);
        echo "Invalid JSON";
        exit;
    }
}

http_response_code(404);
echo "Not Found";
?>
