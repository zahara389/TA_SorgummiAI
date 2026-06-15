<?php
require_once '../config.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendResponse("error", "Unauthorized access");
}

$article_id = $_GET['article_id'] ?? null;
if (!$article_id) sendResponse("error", "Article ID required");

$stmt = $conn->prepare("SELECT * FROM article_feedback WHERE article_id = :aid ORDER BY created_at DESC");
$stmt->execute([':aid' => $article_id]);
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse("success", "Article feedback retrieved", $data);
?>
