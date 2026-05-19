<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Mengambil semua transaksi
        $sql = "SELECT * FROM transactions ORDER BY date DESC";
        $result = $conn->query($sql);
        $transactions = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                // Menyamakan format field JS (id, desc, amount, type, category, date)
                $transactions[] = [
                    "id" => (int)$row['id'],
                    "desc" => $row['description'],
                    "amount" => (float)$row['amount'],
                    "type" => $row['type'],
                    "category" => $row['category'],
                    "date" => $row['date']
                ];
            }
        }
        echo json_encode($transactions);
        break;

    case 'POST':
        // Menambah transaksi baru
        $data = json_decode(file_get_contents("php://input"), true);
        if ($data) {
            $desc = $conn->real_escape_string($data['desc']);
            $amount = (float)$data['amount'];
            $type = $conn->real_escape_string($data['type']);
            $category = $conn->real_escape_string($data['category']);
            $date = date('Y-m-d H:i:s'); // Tanggal sekarang

            $sql = "INSERT INTO transactions (description, amount, type, category, date) VALUES ('$desc', $amount, '$type', '$category', '$date')";
            
            if ($conn->query($sql) === TRUE) {
                echo json_encode(["status" => "success", "message" => "Transaksi berhasil ditambahkan"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Error: " . $conn->error]);
            }
        }
        break;

    case 'DELETE':
        // Menghapus transaksi
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id > 0) {
            $sql = "DELETE FROM transactions WHERE id = $id";
            if ($conn->query($sql) === TRUE) {
                echo json_encode(["status" => "success", "message" => "Transaksi berhasil dihapus"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Error: " . $conn->error]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "ID tidak valid"]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Method tidak didukung"]);
        break;
}

$conn->close();
?>
