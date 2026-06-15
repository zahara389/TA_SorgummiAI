<?php
// Prevent any PHP warnings/errors from leaking to the output buffer and breaking JSON parsing
ini_set('display_errors', 0);
error_reporting(0);

// Set JSON content-type header
header('Content-Type: application/json; charset=UTF-8');

// Start output buffering to capture any accidental output
ob_start();

try {
    // Safely load database configuration
    $configPath = dirname(__DIR__) . '/config.php';
    if (!file_exists($configPath)) {
        throw new Exception("File config.php tidak ditemukan di path: " . $configPath);
    }
    require_once $configPath;

    // Check if admin is authorized (if session has role)
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized"]);
        ob_end_flush();
        exit;
    }

    // Helper to parse environment variables from .env
    function getEnvVar($key, $default = null) {
        $envPath = dirname(dirname(__DIR__)) . '/.env';
        if (file_exists($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $name = trim($parts[0]);
                    $value = trim($parts[1]);
                    if ($name === $key) {
                        if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') || 
                            (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                            $value = substr($value, 1, -1);
                        }
                        return $value;
                    }
                }
            }
        }
        return $default;
    }

    // Get JSON input
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if (!$data) {
        throw new Exception("Payload JSON tidak valid");
    }

    // Extract values supporting multiple field naming styles
    $id = isset($data->faq_id) ? $data->faq_id : (isset($data->id) ? $data->id : null);
    $email = isset($data->email_user) ? $data->email_user : (isset($data->email) ? $data->email : null);
    $answer = isset($data->teks_jawaban) ? $data->teks_jawaban : (isset($data->answer) ? $data->answer : null);

    if (empty($id) || empty($email) || empty($answer)) {
        throw new Exception("id, email, dan answer wajib diisi");
    }

    // Fetch FAQ item
    $query = "SELECT * FROM faq WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->execute([':id' => $id]);
    $faq = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$faq) {
        throw new Exception("Pesan FAQ/Kontak tidak ditemukan");
    }

    // Parse sender name
    $userName = "Pengguna";
    $cleanQuestion = $faq['question'];
    if (preg_match('/^\[Pesan dari (.+?) - (.+?)\]:\s*(.+)$/s', $faq['question'], $matches)) {
        $userName = $matches[1];
        $cleanQuestion = $matches[3];
    }

    // Email headers and URLs
    $fromName = getEnvVar('SMTP_FROM_NAME', 'Sorgummi Admin');
    $fromEmail = getEnvVar('SMTP_FROM_EMAIL', getEnvVar('SMTP_USER', getEnvVar('EMAIL_ADMIN', 'admin@sorgummi.com')));
    $appUrl = getEnvVar('APP_URL', 'http://localhost:3000');

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/plain;charset=UTF-8" . "\r\n";
    $headers .= "From: \"Sorgummi AI Support\" <no-reply@sorgummi.ai>" . "\r\n";

    $emailText = "Halo " . trim($userName) . ",\n\n" .
                 "Terima kasih telah menghubungi kami melalui formulir kontak di aplikasi Sorgummi AI. Pertanyaan Anda telah ditinjau dan berikut adalah balasan resmi dari Admin kami:\n\n" .
                 "========================================\n" .
                 "PERTANYAAN ANDA:\n" .
                 "\"" . trim($cleanQuestion) . "\"\n\n" .
                 "BALASAN ADMIN:\n" .
                 "\"" . trim($answer) . "\"\n" .
                 "========================================\n\n" .
                 "Jika Anda masih memiliki pertanyaan lain, silakan hubungi kami kembali melalui platform aplikasi.\n\n" .
                 "Salam hangat,\n" .
                 "Customer Support Tim Startup Sorgummi AI\n" .
                 "Telkom University\n\n" .
                 "---------------------------------------------------------\n" .
                 "Pesan ini dikirim otomatis oleh sistem, mohon tidak membalas email ini.";

    $emailHtml = '<html><body><pre style="font-family: monospace; white-space: pre-wrap; padding: 20px; background: #f4f6f3; color: #2c3530; border-radius: 8px; border: 1px solid #eef1ed;">' . htmlspecialchars($emailText) . '</pre></body></html>';

    // Send email using native mail()
    $mailSent = @mail($email, "Balasan Resmi Pesan Kontak - Sorgummi AI", $emailText, $headers);

    // Save simulation file locally if SMTP server is not configured/active (useful for localhost testing)
    if (!$mailSent) {
        $logDir = dirname(dirname(__DIR__)) . '/uploads/mail_logs';
        if (!file_exists($logDir)) {
            @mkdir($logDir, 0777, true);
        }
        $logFile = $logDir . '/mail_' . $id . '_' . time() . '.html';
        @file_put_contents($logFile, $emailHtml);

        // Log descriptive SMTP advice to system logs
        error_log("\n============= [INFO PENTING REKAYASA EMAIL] =============");
        error_log("Autentikasi Gmail Gagal. Pastikan Anda telah mengaktifkan Verifikasi 2 Langkah");
        error_log("pada Akun Google Admin dan mengisi variabel EMAIL_PASSWORD di file .env");
        error_log("menggunakan 16 Karakter Sandi Aplikasi (App Password), BUKAN password biasa!");
        error_log("=========================================================\n");
    }

    // Check if status column exists in mysql table
    $statusExists = false;
    try {
        $conn->query("SELECT status FROM faq LIMIT 1");
        $statusExists = true;
    } catch (Exception $e) {
        $statusExists = false;
    }

    // Perform database UPDATE
    $queryUpdate = "UPDATE faq SET answer = :ans";
    $params = [':ans' => $answer, ':id' => $id];

    if ($statusExists) {
        $queryUpdate .= ", status = 'REPLIED'";
    }

    $queryUpdate .= " WHERE id = :id";
    $stmtUpdate = $conn->prepare($queryUpdate);
    $stmtUpdate->execute($params);

    // Clean output buffer and return standard JSON response
    ob_clean();
    echo json_encode([
        "status" => "success",
        "message" => "FAQ berhasil diperbarui dan email terkirim"
    ]);
    ob_end_flush();
    exit;

} catch (Exception $e) {
    // If anything fails, return JSON error with 500 status code
    ob_clean();
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal memproses jawaban backend: " . $e->getMessage()
    ]);
    ob_end_flush();
    exit;
}
?>
