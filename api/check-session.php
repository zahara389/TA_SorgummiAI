<?php
require_once 'config.php';

if (isset($_SESSION['user_id'])) {
    $query = "SELECT id, name, email, role, photo FROM users WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $_SESSION['user_id']);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        sendResponse("success", "Session aktif", $user);
    } else {
        session_destroy();
        sendResponse("error", "User tidak ditemukan");
    }
} else {
    // Return 401 for unauthorized? User said JSON response.
    echo json_encode([
        "status" => "error",
        "message" => "Session tidak ada",
        "data" => null
    ]);
    exit;
}
?>
