<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $query = "SELECT * FROM faq ORDER BY id ASC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        sendResponse("success", "FAQ retrieved", $stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') sendResponse("error", "Unauthorized");
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("INSERT INTO faq (question, answer) VALUES (:q, :a)");
        $stmt->execute([':q' => $data->question, ':a' => $data->answer]);
        sendResponse("success", "FAQ created", ["id" => $conn->lastInsertId()]);
        break;

    case 'PUT':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') sendResponse("error", "Unauthorized");
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("UPDATE faq SET question = :q, answer = :a WHERE id = :id");
        $stmt->execute([':q' => $data->question, ':a' => $data->answer, ':id' => $data->id]);
        sendResponse("success", "FAQ updated");
        break;

    case 'DELETE':
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') sendResponse("error", "Unauthorized");
        $stmt = $conn->prepare("DELETE FROM faq WHERE id = :id");
        $stmt->execute([':id' => $_GET['id']]);
        sendResponse("success", "FAQ deleted");
        break;
}
?>
