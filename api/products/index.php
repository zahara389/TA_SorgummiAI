<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $query = "SELECT * FROM products WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $_GET['id']);
            $stmt->execute();
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($product) {
                // Get steps
                $step_query = "SELECT step_id as id, title, content FROM product_steps WHERE product_id = :id";
                $step_stmt = $conn->prepare($step_query);
                $step_stmt->bindParam(':id', $_GET['id']);
                $step_stmt->execute();
                $product['steps'] = $step_stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            sendResponse("success", "Data retrieved", $product);
        } else {
            $query = "SELECT * FROM products ORDER BY created_at DESC";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendResponse("success", "Data retrieved", $data);
        }
        break;

    case 'POST':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse("error", "Unauthorized access");
        }

        $data = json_decode(file_get_contents("php://input"));
        $conn->beginTransaction();

        try {
            $query = "INSERT INTO products (title, category, description, image, thumbnail, status, author, readTime, level, toc_title, tips) 
                      VALUES (:title, :category, :description, :image, :thumbnail, :status, :author, :readTime, :level, :toc_title, :tips)";
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':title', $data->title);
            $stmt->bindValue(':category', $data->category);
            $stmt->bindValue(':description', $data->description);
            $stmt->bindValue(':image', $data->image ?? null);
            $stmt->bindValue(':thumbnail', $data->thumbnail ?? null);
            $stmt->bindValue(':status', $data->status ?? 'Draft');
            $stmt->bindValue(':author', $data->author ?? null);
            $stmt->bindValue(':readTime', $data->readTime ?? null);
            $stmt->bindValue(':level', $data->level ?? null);
            $stmt->bindValue(':toc_title', $data->tocTitle ?? null);
            $stmt->bindValue(':tips', $data->tips ?? null);
            $stmt->execute();

            $product_id = $conn->lastInsertId();

            // Insert steps
            if (!empty($data->steps)) {
                $step_insert = "INSERT INTO product_steps (product_id, step_id, title, content) VALUES (:pid, :sid, :title, :content)";
                $step_stmt = $conn->prepare($step_insert);
                foreach ($data->steps as $step) {
                    $step_stmt->bindValue(':pid', $product_id);
                    $step_stmt->bindValue(':sid', $step->id);
                    $step_stmt->bindValue(':title', $step->title);
                    $step_stmt->bindValue(':content', $step->content);
                    $step_stmt->execute();
                }
            }

            $conn->commit();
            sendResponse("success", "Product created", ["id" => $product_id]);
        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse("error", "Failed to create product: " . $e->getMessage());
        }
        break;

    case 'PUT':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse("error", "Unauthorized access");
        }

        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->id)) sendResponse("error", "ID required");

        $conn->beginTransaction();
        try {
            $query = "UPDATE products SET 
                        title = :title, 
                        category = :category, 
                        description = :description, 
                        image = :image, 
                        thumbnail = :thumbnail, 
                        status = :status, 
                        author = :author, 
                        readTime = :readTime, 
                        level = :level, 
                        toc_title = :toc_title, 
                        tips = :tips
                      WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':id', $data->id);
            $stmt->bindValue(':title', $data->title);
            $stmt->bindValue(':category', $data->category);
            $stmt->bindValue(':description', $data->description);
            $stmt->bindValue(':image', $data->image ?? null);
            $stmt->bindValue(':thumbnail', $data->thumbnail ?? null);
            $stmt->bindValue(':status', $data->status);
            $stmt->bindValue(':author', $data->author ?? null);
            $stmt->bindValue(':readTime', $data->readTime ?? null);
            $stmt->bindValue(':level', $data->level ?? null);
            $stmt->bindValue(':toc_title', $data->tocTitle ?? null);
            $stmt->bindValue(':tips', $data->tips ?? null);
            $stmt->execute();

            // Refresh steps: delete old and insert new
            $conn->prepare("DELETE FROM product_steps WHERE product_id = :pid")->execute([':pid' => $data->id]);
            
            if (!empty($data->steps)) {
                $step_insert = "INSERT INTO product_steps (product_id, step_id, title, content) VALUES (:pid, :sid, :title, :content)";
                $step_stmt = $conn->prepare($step_insert);
                foreach ($data->steps as $step) {
                    $step_stmt->bindValue(':pid', $data->id);
                    $step_stmt->bindValue(':sid', $step->id);
                    $step_stmt->bindValue(':title', $step->title);
                    $step_stmt->bindValue(':content', $step->content);
                    $step_stmt->execute();
                }
            }

            $conn->commit();
            sendResponse("success", "Product updated");
        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse("error", "Failed update: " . $e->getMessage());
        }
        break;

    case 'DELETE':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse("error", "Unauthorized access");
        }

        if (isset($_GET['id'])) {
            $query = "DELETE FROM products WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $_GET['id']);
            if ($stmt->execute()) {
                sendResponse("success", "Product deleted");
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
