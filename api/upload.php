<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    sendResponse("error", "Unauthorized");
}

if ($_FILES['file']) {
    $target_dir = "../uploads/";
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0777, true);
    }

    $file_extension = pathinfo($_FILES["file"]["name"], PATHINFO_EXTENSION);
    $new_filename = uniqid() . '.' . $file_extension;
    $target_file = $target_dir . $new_filename;

    if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
        // Return full path or relative path
        $url = "/uploads/" . $new_filename;
        sendResponse("success", "File uploaded", ["url" => $url]);
    } else {
        sendResponse("error", "Sorry, there was an error uploading your file.");
    }
} else {
    sendResponse("error", "No file uploaded");
}
?>
