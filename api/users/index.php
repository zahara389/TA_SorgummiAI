<?php
require_once '../config.php';

// Check Admin
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendResponse("error", "Unauthorized access");
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT id, name, email, role, photo, created_at FROM users ORDER BY created_at DESC");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse("success", "Data retrieved", $data);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->id)) sendResponse("error", "ID required");

        $query = "UPDATE users SET name = :name, email = :email, role = :role WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':id' => $data->id,
            ':name' => $data->name,
            ':email' => $data->email,
            ':role' => $data->role
        ]);
        sendResponse("success", "User updated");
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute([':id' => $_GET['id']]);
            sendResponse("success", "User deleted");
        }
        break;

    default:
        sendResponse("error", "Method not allowed");
        break;
}
?>
