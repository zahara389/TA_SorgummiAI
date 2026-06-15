<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $role = $_SESSION['role'] ?? 'user';
        $query = "SELECT * FROM notifications WHERE target_role = 'all' OR target_role = :role ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute([':role' => $role]);
        sendResponse("success", "Notifications retrieved", $stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') sendResponse("error", "Unauthorized");
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("INSERT INTO notifications (title, message, target_role) VALUES (:t, :m, :r)");
        $stmt->execute([':t' => $data->title, ':m' => $data->message, ':r' => $data->target_role ?? 'all']);
        sendResponse("success", "Notification created");
        break;

    case 'DELETE':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') sendResponse("error", "Unauthorized");
        $stmt = $conn->prepare("DELETE FROM notifications WHERE id = :id");
        $stmt->execute([':id' => $_GET['id']]);
        sendResponse("success", "Notification deleted");
        break;
}
?>
