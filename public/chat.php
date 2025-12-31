<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * Robust PHP Chat Backend
 */

$log_file = 'chat-log.json';
$users_file = 'chat-users.json';

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

// Ensure files exist
if (!file_exists($log_file)) save_data($log_file, []);
if (!file_exists($users_file)) save_data($users_file, []);

// --- PRE-PROCESS: Atomic Presence Cleanup ---
$lock_file = '.cleanup.lock';
$lock_fp = fopen($lock_file, 'c+');

if ($lock_fp && flock($lock_fp, LOCK_EX | LOCK_NB)) { // Non-blocking lock
    $users = fetch_data($users_file);
    $now = time();
    $changed = false;
    $active_users = [];
    $timed_out_nicks = [];

    foreach ($users as $nick => $lastSeen) {
        if ($now - $lastSeen > 45) { // 45 second timeout
            $timed_out_nicks[] = $nick;
            $changed = true;
        } else {
            $active_users[$nick] = $lastSeen;
        }
    }

    if ($changed) {
        $messages = fetch_data($log_file);
        foreach ($timed_out_nicks as $nick) {
            $messages[] = [
                'id' => microtime(true) . rand(),
                'type' => 'system',
                'text' => "*** $nick has left (timeout)",
                'timestamp' => date('c')
            ];
        }
        save_data($log_file, array_slice($messages, -100));
        save_data($users_file, $active_users);
    }
    
    flock($lock_fp, LOCK_UN);
    fclose($lock_fp);
} else {
    // If we couldn't get the lock, another process is already cleaning up.
    // Just close and move on.
    if ($lock_fp) fclose($lock_fp);
}

// Refresh $users for the rest of the request
$users = fetch_data($users_file);

// --- ROUTING ---
$action = isset($_GET['action']) ? $_GET['action'] : 'messages';
if ($action === 'chat.php') $action = 'messages';

header('Content-Type: application/json');

if ($action === 'messages') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(fetch_data($log_file));
        exit;
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $json = file_get_contents('php://input');
        $newMessage = json_decode($json, true);
        if ($newMessage) {
            $messages = fetch_data($log_file);
            $newMessage['id'] = microtime(true) . rand();
            if (!isset($newMessage['timestamp'])) $newMessage['timestamp'] = date('c');
            $messages[] = $newMessage;
            save_data($log_file, array_slice($messages, -100));
            
            // Update presence on message
            if (isset($newMessage['user'])) {
                $users[$newMessage['user']] = time();
                save_data($users_file, $users);
            }
            
            http_response_code(201);
            echo json_encode($newMessage);
            exit;
        }
    }
}

if ($action === 'presence' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if (isset($data['nickname'])) {
        $nick = $data['nickname'];
        
        // Log Join Message if user is new to the active list
        if (!isset($users[$nick])) {
            $messages = fetch_data($log_file);
            $messages[] = [
                'id' => microtime(true) . rand(),
                'type' => 'system',
                'text' => "*** $nick has joined the cluster",
                'timestamp' => date('c')
            ];
            save_data($log_file, array_slice($messages, -100));
        }

        $users[$nick] = time();
        save_data($users_file, $users);
        echo json_encode(["status" => "ok"]);
        exit;
    }
}

if ($action === 'leave' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if (isset($data['nickname'])) {
        $nick = $data['nickname'];
        unset($users[$nick]);
        save_data($users_file, $users);
        
        $messages = fetch_data($log_file);
        $messages[] = [
            'id' => microtime(true) . rand(),
            'type' => 'system',
            'text' => "*** $nick has left (disconnected)",
            'timestamp' => date('c')
        ];
        save_data($log_file, array_slice($messages, -100));
        
        echo json_encode(["status" => "ok"]);
        exit;
    }
}

if ($action === 'users') {
    echo json_encode(array_values(array_keys($users)));
    exit;
}

http_response_code(404);
echo json_encode(["error" => "Action $action Not Found"]);
