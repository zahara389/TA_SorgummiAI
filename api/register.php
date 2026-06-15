<?php
require_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->email) && !empty($data->password)) {
    // Check if email unique
    $check_query = "SELECT id FROM users WHERE email = :email";
    $stmt = $conn->prepare($check_query);
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        sendResponse("error", "Email sudah terdaftar. Silakan gunakan email lain.");
    }

    if (strlen($data->password) < 6) {
        sendResponse("error", "Password minimal 6 karakter.");
    }

    $query = "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, 'user')";
    $stmt = $conn->prepare($query);

    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

    $stmt->bindParam(':name', $data->name);
    $stmt->bindParam(':email', $data->email);
    $stmt->bindParam(':password', $password_hash);

    if ($stmt->execute()) {
        $last_id = $conn->lastInsertId();
        
        $_SESSION['user_id'] = $last_id;
        $_SESSION['role'] = 'user';
        
        sendResponse("success", "Registrasi berhasil", [
            "id" => $last_id,
            "name" => $data->name,
            "email" => $data->email,
            "role" => "user"
        ]);
    } else {
        sendResponse("error", "Gagal mendaftarkan user");
    }
} else {
    sendResponse("error", "Data tidak lengkap");
}
?>
