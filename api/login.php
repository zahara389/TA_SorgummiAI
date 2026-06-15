<?php
require_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    // Special check for hardcoded admin if database is empty or for this specific user
    if ($data->email === 'admin123@gmail.com' && $data->password === 'admin123') {
        // Find if this admin exists in DB, if not create it
        $query = "SELECT * FROM users WHERE email = :email";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':email', $data->email);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            $insert = "INSERT INTO users (name, email, password, role) VALUES ('Administrator', 'admin123@gmail.com', :pw, 'admin')";
            $ins_stmt = $conn->prepare($insert);
            $ins_stmt->bindValue(':pw', password_hash('admin123', PASSWORD_BCRYPT));
            $ins_stmt->execute();
        }
    }

    $query = "SELECT * FROM users WHERE email = :email";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($data->password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $user['role'];
            
            // Remove sensitive password from response
            unset($user['password']);
            
            sendResponse("success", "Login berhasil", $user);
        } else {
            sendResponse("error", "Email atau kata sandi salah");
        }
    } else {
        sendResponse("error", "Email atau kata sandi salah");
    }
} else {
    sendResponse("error", "Email dan password harus diisi");
}
?>
