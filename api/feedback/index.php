<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') sendResponse("error", "Unauthorized");
        $query = "SELECT f.*, u.name as user_name, u.email as user_email 
                  FROM feedback f 
                  LEFT JOIN users u ON f.user_id = u.id 
                  ORDER BY f.created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        sendResponse("success", "Feedback retrieved", $stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $query = "INSERT INTO feedback (user_id, type, message, status) VALUES (:user_id, :type, :message, 'BARU')";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':user_id' => $_SESSION['user_id'] ?? null,
            ':type' => $data->type ?? 'general',
            ':message' => $data->message,
        ]);
        sendResponse("success", "Feedback submitted");
        break;

    case 'PUT':
        // Status update
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') sendResponse("error", "Unauthorized");
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("UPDATE feedback SET status = :status WHERE id = :id");
        $stmt->execute([':status' => $data->status, ':id' => $data->id]);
        sendResponse("success", "Feedback status updated");
        break;

    case 'DELETE':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') sendResponse("error", "Unauthorized");
        $stmt = $conn->prepare("DELETE FROM feedback WHERE id = :id");
        $stmt->execute([':id' => $_GET['id']]);
        sendResponse("success", "Feedback deleted");
        break;
}
?>
