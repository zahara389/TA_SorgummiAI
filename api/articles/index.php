<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $query = "SELECT * FROM articles WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $_GET['id']);
            $stmt->execute();
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $query = "SELECT * FROM articles ORDER BY created_at DESC";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        sendResponse("success", "Data retrieved", $data);
        break;

    case 'POST':
        $action = $_GET['action'] ?? '';
        
        if ($action === 'increment_views' && isset($_GET['id'])) {
            $stmt = $conn->prepare("UPDATE articles SET views = views + 1 WHERE id = :id");
            $stmt->execute([':id' => $_GET['id']]);
            sendResponse("success", "Views incremented");
        }

        if ($action === 'record_feedback') {
            $data = json_decode(file_get_contents("php://input"));
            $article_id = $data->article_id;
            $is_helpful = $data->is_helpful ? 1 : 0;
            $user_id = $_SESSION['user_id'] ?? null;
            $user_email = $data->user_email ?? '';

            // Check if already exists
            $stmt = $conn->prepare("SELECT id FROM article_feedback WHERE article_id = :aid AND user_id = :uid");
            $stmt->execute([':aid' => $article_id, ':uid' => $user_id]);
            if ($stmt->fetch()) {
                sendResponse("error", "Feedback already submitted");
            }

            $stmt = $conn->prepare("INSERT INTO article_feedback (article_id, user_id, is_helpful, user_email) VALUES (:aid, :uid, :helpful, :email)");
            $stmt->execute([
                ':aid' => $article_id, 
                ':uid' => $user_id, 
                ':helpful' => $is_helpful, 
                ':email' => $user_email
            ]);

            // Update counts in articles table
            if ($is_helpful) {
                $conn->prepare("UPDATE articles SET helpful = helpful + 1 WHERE id = :id")->execute([':id' => $article_id]);
            } else {
                $conn->prepare("UPDATE articles SET notHelpful = notHelpful + 1 WHERE id = :id")->execute([':id' => $article_id]);
            }

            sendResponse("success", "Feedback recorded");
        }

        // Check Admin for creation
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse("error", "Unauthorized access");
        }

        $data = json_decode(file_get_contents("php://input"));
        $query = "INSERT INTO articles (title, category, status, content, description, duration, totalMateri, image, thumbnail, author, readTime) 
                  VALUES (:title, :category, :status, :content, :description, :duration, :totalMateri, :image, :thumbnail, :author, :readTime)";
        $stmt = $conn->prepare($query);
        
        $stmt->bindValue(':title', $data->title);
        $stmt->bindValue(':category', $data->category);
        $stmt->bindValue(':status', $data->status ?? 'Published');
        $stmt->bindValue(':content', $data->content);
        $stmt->bindValue(':description', $data->description ?? null);
        $stmt->bindValue(':duration', $data->duration ?? null);
        $stmt->bindValue(':totalMateri', $data->totalMateri ?? 0);
        $stmt->bindValue(':image', $data->image ?? null);
        $stmt->bindValue(':thumbnail', $data->thumbnail ?? null);
        $stmt->bindValue(':author', $data->author ?? null);
        $stmt->bindValue(':readTime', $data->readTime ?? null);

        if ($stmt->execute()) {
            sendResponse("success", "Article created", ["id" => $conn->lastInsertId()]);
        } else {
            sendResponse("error", "Failed to create article");
        }
        break;

    case 'PUT':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse("error", "Unauthorized access");
        }

        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->id)) sendResponse("error", "ID required");

        $query = "UPDATE articles SET 
                    title = :title, 
                    category = :category, 
                    status = :status, 
                    content = :content,
                    description = :description,
                    duration = :duration,
                    totalMateri = :totalMateri,
                    image = :image,
                    thumbnail = :thumbnail,
                    author = :author,
                    readTime = :readTime
                  WHERE id = :id";
        $stmt = $conn->prepare($query);
        
        $stmt->bindValue(':id', $data->id);
        $stmt->bindValue(':title', $data->title);
        $stmt->bindValue(':category', $data->category);
        $stmt->bindValue(':status', $data->status);
        $stmt->bindValue(':content', $data->content);
        $stmt->bindValue(':description', $data->description ?? null);
        $stmt->bindValue(':duration', $data->duration ?? null);
        $stmt->bindValue(':totalMateri', $data->totalMateri ?? 0);
        $stmt->bindValue(':image', $data->image ?? null);
        $stmt->bindValue(':thumbnail', $data->thumbnail ?? null);
        $stmt->bindValue(':author', $data->author ?? null);
        $stmt->bindValue(':readTime', $data->readTime ?? null);

        if ($stmt->execute()) {
            sendResponse("success", "Article updated");
        } else {
            sendResponse("error", "Failed to update article");
        }
        break;

    case 'DELETE':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse("error", "Unauthorized access");
        }

        if (isset($_GET['id'])) {
            $query = "DELETE FROM articles WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $_GET['id']);
            if ($stmt->execute()) {
                sendResponse("success", "Article deleted");
            } else {
                sendResponse("error", "Failed delete");
            }
        }
        break;

    default:
        sendResponse("error", "Method not allowed");
        break;
}
?>
