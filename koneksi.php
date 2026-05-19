<?php
$host = "localhost";
$user = "root"; // Sesuaikan dengan username mysql Anda
$pass = "";     // Sesuaikan dengan password mysql Anda
$db   = "fintrack_db";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
?>
