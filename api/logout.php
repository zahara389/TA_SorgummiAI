<?php
require_once 'config.php';

session_destroy();
sendResponse("success", "Logout berhasil");
?>
