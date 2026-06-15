<?php
require_once '../config.php';

if (!isset($_SESSION['user_id'])) {
    sendResponse("error", "Login required");
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT * FROM saved_articles WHERE user_id = :uid ORDER BY saved_at DESC");
        $stmt->execute([':uid' => $user_id]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse("success", "Data retrieved", $data);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $article = $data->article;
        $is_saved = $data->is_saved;

        if ($is_saved) {
            // Delete
            $stmt = $conn->prepare("DELETE FROM saved_articles WHERE user_id = :uid AND article_id = :aid");
            $stmt->execute([':uid' => $user_id, ':aid' => $article->id]);
            sendResponse("success", "Article unsaved");
        } else {
            // Insert
            $stmt = $conn->prepare("INSERT INTO saved_articles (user_id, article_id, title, category, image) VALUES (:uid, :aid, :title, :cat, :img)");
            $stmt->execute([
                ':uid' => $user_id,
                ':aid' => $article->id,
                ':title' => $article->title,
                ':cat' => $article->category,
                ':img' => $article->image ?? $article->thumbnail ?? ''
            ]);
            sendResponse("success", "Article saved");
        }
        break;

    default:
        sendResponse("error", "Method not allowed");
        break;
}
?>
